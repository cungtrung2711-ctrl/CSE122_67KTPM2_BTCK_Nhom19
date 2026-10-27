/**
 * @owner SV2
 * @spec §8.2, §10.1, §10.3, §10.4 Payment Reminders Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  DB.extend('reminders', {
    listReminders: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.reminders.slice();

      if (f.customerId && f.customerId !== 'all') {
        list = list.filter(function (r) { return r.customerId === f.customerId; });
      }
      if (f.invoiceId) {
        list = list.filter(function (r) { return Array.isArray(r.invoiceIds) && r.invoiceIds.includes(f.invoiceId); });
      }
      if (f.status && f.status !== 'all') {
        list = list.filter(function (r) { return r.status === f.status; });
      }
      if (f.channel && f.channel !== 'all') {
        list = list.filter(function (r) { return r.channel === f.channel; });
      }
      if (f.q) {
        const q = String(f.q).trim().toLowerCase();
        list = list.filter(function (r) {
          const cus = st.customers.find(function (c) { return c.id === r.customerId; });
          const cusName = cus ? cus.name.toLowerCase() : '';
          return cusName.includes(q) ||
            (r.subject && r.subject.toLowerCase().includes(q)) ||
            (r.body && r.body.toLowerCase().includes(q));
        });
      }
      return list;
    },

    getReminder: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.reminders.find(function (r) { return r.id === id; }) || null;
    },

    createReminder: function (data) {
      const st = DB._rawState();
      const d = data || {};
      const cus = st.customers.find(function (c) { return c.id === d.customerId; });
      if (!cus) return DB.err('VALIDATION', 'Vui lòng chọn khách hàng nhận thông báo nhắc.', 'customerId');

      const invoiceIds = Array.isArray(d.invoiceIds) ? d.invoiceIds.filter(Boolean) : [];
      if (invoiceIds.length === 0) {
        return DB.err('VALIDATION', 'Vui lòng chọn ít nhất 1 hóa đơn chưa tất toán để nhắc thanh toán.', 'invoiceIds');
      }

      const unpaidInvoices = invoiceIds
        .map(function (id) { return st.invoices.find(function (inv) { return inv.id === id; }); })
        .filter(function (inv) { return inv && !inv.voided && !inv.archived && (inv.total - inv.paidAmount) > 0; });

      if (unpaidInvoices.length === 0) {
        return DB.err('VALIDATION', 'Các hóa đơn đã chọn đều đã thanh toán đủ hoặc không còn dư nợ cần nhắc.', 'invoiceIds');
      }

      const channel = d.channel === 'sms' ? 'sms' : 'email';
      if (channel === 'email' && (!cus.email || !IP.Utils.isValidEmail(cus.email))) {
        return DB.err('VALIDATION', 'Khách hàng chưa có địa chỉ Email hợp lệ để gửi qua kênh Email.', 'channel');
      }

      const subject = String(d.subject || ('Nhắc thanh toán hóa đơn - ' + cus.name)).trim();
      if (subject.length > 120) {
        return DB.err('VALIDATION', 'Tiêu đề thông báo nhắc không được vượt quá 120 ký tự.', 'subject');
      }
      const body = String(d.body || '').trim();
      if (!body) {
        return DB.err('VALIDATION', 'Nội dung thông báo nhắc không được để trống.', 'body');
      }
      if (body.length > 2000) {
        return DB.err('VALIDATION', 'Nội dung thông báo nhắc không được vượt quá 2.000 ký tự.', 'body');
      }

      const mode = d.mode || d.status || 'draft';
      let scheduledAt = d.scheduledAt || null;
      let sentAt = null;
      let finalStatus = 'draft';

      if (mode === 'scheduled') {
        if (!scheduledAt) {
          return DB.err('VALIDATION', 'Vui lòng chọn thời gian hẹn gửi.', 'scheduledAt');
        }
        const schedDate = new Date(scheduledAt);
        if (isNaN(schedDate.getTime()) || schedDate.getTime() <= Date.now()) {
          return DB.err('VALIDATION', 'Thời gian hẹn gửi phải nằm ở tương lai.', 'scheduledAt');
        }
        finalStatus = 'scheduled';
        scheduledAt = schedDate.toISOString();
      } else if (mode === 'sent') {
        finalStatus = 'sent';
        sentAt = new Date().toISOString();
        scheduledAt = sentAt;
      }

      const nowIso = new Date().toISOString();
      const rem = {
        id: IP.Utils.uid('rem'),
        customerId: cus.id,
        invoiceIds: unpaidInvoices.map(function (i) { return i.id; }),
        channel: channel,
        tone: ['friendly', 'formal', 'firm'].includes(d.tone) ? d.tone : 'friendly',
        subject: subject,
        body: body,
        scheduledAt: scheduledAt,
        sentAt: sentAt,
        status: finalStatus,
        failReason: null,
        aiGenerated: Boolean(d.aiGenerated),
        createdBy: DB.currentActorId(),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      st.reminders.unshift(rem);

      if (finalStatus === 'sent') {
        if (DB.addActivity) {
          rem.invoiceIds.forEach(function (invId) {
            DB.addActivity({
              entityType: 'invoice',
              entityId: invId,
              type: 'reminder',
              message: 'Đã gửi nhắc thanh toán (' + IP.Fmt.channelLabel(rem.channel) + ') tới ' + cus.name + '.'
            });
          });
        }
        if (DB.addNotification) {
          DB.addNotification({
            role: 'all',
            type: 'reminder',
            title: 'Đã gửi nhắc thanh toán cho ' + cus.name,
            message: rem.subject + ' (' + IP.Fmt.channelLabel(rem.channel) + ')',
            targetRouteKey: 'sales.reminders',
            targetParams: { open: rem.id }
          });
        }
      }

      DB._commit();
      return DB.ok(rem);
    },

    updateReminder: function (id, patch) {
      const st = DB._rawState();
      const rem = st.reminders.find(function (r) { return r.id === id; });
      if (!rem) return DB.err('NOT_FOUND', 'Không tìm thấy bản nhắc thanh toán.');
      const p = patch || {};

      if (p.subject !== undefined) {
        const sub = String(p.subject).trim();
        if (sub.length > 120) return DB.err('VALIDATION', 'Tiêu đề không được vượt quá 120 ký tự.', 'subject');
        rem.subject = sub;
      }
      if (p.body !== undefined) {
        const b = String(p.body).trim();
        if (!b || b.length > 2000) return DB.err('VALIDATION', 'Nội dung phải từ 1 đến 2.000 ký tự.', 'body');
        rem.body = b;
      }
      if (p.channel) rem.channel = p.channel;
      if (p.tone) rem.tone = p.tone;
      if (Array.isArray(p.invoiceIds) && p.invoiceIds.length > 0) rem.invoiceIds = p.invoiceIds;
      if (p.scheduledAt !== undefined) rem.scheduledAt = p.scheduledAt;
      if (p.status) rem.status = p.status;
      rem.updatedAt = new Date().toISOString();

      DB._commit();
      return DB.ok(rem);
    },

    sendReminder: function (id, forceFail) {
      const st = DB._rawState();
      const rem = st.reminders.find(function (r) { return r.id === id; });
      if (!rem) return DB.err('NOT_FOUND', 'Không tìm thấy bản nhắc cần gửi.');
      const cus = st.customers.find(function (c) { return c.id === rem.customerId; });

      const stillUnpaid = (rem.invoiceIds || []).some(function (invId) {
        const inv = st.invoices.find(function (x) { return x.id === invId; });
        return inv && !inv.voided && !inv.archived && (inv.total - inv.paidAmount) > 0;
      });
      if (!stillUnpaid) {
        return DB.err('VALIDATION', 'Tất cả hóa đơn trong bản nhắc này đã được thanh toán đủ, không cần gửi nhắc.');
      }

      if (forceFail) {
        rem.status = 'failed';
        rem.failReason = 'Cổng gửi tin doanh nghiệp báo gián đoạn kết nối tạm thời (Vui lòng bấm Gửi lại)';
        rem.updatedAt = new Date().toISOString();
        DB._commit();
        return DB.err('SEND_FAILED', rem.failReason);
      }

      rem.status = 'sent';
      rem.sentAt = new Date().toISOString();
      rem.failReason = null;
      rem.updatedAt = rem.sentAt;

      if (DB.addActivity) {
        (rem.invoiceIds || []).forEach(function (invId) {
          DB.addActivity({
            entityType: 'invoice',
            entityId: invId,
            type: 'reminder',
            message: 'Đã gửi thông báo nhắc thanh toán (' + IP.Fmt.channelLabel(rem.channel) + ') tới ' + (cus ? cus.name : rem.customerId) + '.'
          });
        });
      }
      if (DB.addNotification) {
        DB.addNotification({
          role: 'all',
          type: 'reminder',
          title: 'Đã gửi nhắc thanh toán · ' + (cus ? cus.name : ''),
          message: rem.subject,
          targetRouteKey: 'sales.reminders',
          targetParams: { open: rem.id }
        });
      }

      DB._commit();
      return DB.ok(rem);
    },

    cancelReminder: function (id) {
      const st = DB._rawState();
      const rem = st.reminders.find(function (r) { return r.id === id; });
      if (!rem) return DB.err('NOT_FOUND', 'Không tìm thấy bản nhắc.');
      rem.status = 'cancelled';
      rem.updatedAt = new Date().toISOString();
      DB._commit();
      return DB.ok(rem);
    },

    deleteReminder: function (id) {
      const st = DB._rawState();
      const idx = st.reminders.findIndex(function (r) { return r.id === id; });
      if (idx < 0) return DB.err('NOT_FOUND', 'Không tìm thấy bản nhắc.');
      st.reminders.splice(idx, 1);
      DB._commit();
      return DB.ok({ deletedId: id });
    }
  });
})(window);
