/**
 * @owner SV4
 * @spec §8.4, §10.3, §10.4 Settings & Reminder Templates Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  DB.extend('settings', {
    getSettings: function () {
      const st = DB._rawState();
      return IP.Utils.clone(st.settings);
    },

    saveSettings: function (patch) {
      const st = DB._rawState();
      const cur = st.settings;
      const p = patch || {};

      if (p.company) {
        const c = p.company;
        if (!c.name || !String(c.name).trim()) {
          return DB.err('VALIDATION', 'Tên đơn vị phát hành hóa đơn không được để trống.', 'company.name');
        }
        if (c.taxCode && !IP.Utils.isValidTaxCode(c.taxCode)) {
          return DB.err('VALIDATION', 'Mã số thuế công ty phải gồm 10 hoặc 13 chữ số.', 'company.taxCode');
        }
        if (c.email && !IP.Utils.isValidEmail(c.email)) {
          return DB.err('VALIDATION', 'Email liên hệ công ty không đúng định dạng.', 'company.email');
        }
        Object.assign(cur.company, c);
      }

      if (p.invoiceDefaults) {
        const d = p.invoiceDefaults;
        const prefix = String(d.prefix !== undefined ? d.prefix : cur.invoiceDefaults.prefix).trim().toUpperCase();
        if (!/^[A-Z0-9-]{2,6}$/.test(prefix)) {
          return DB.err('VALIDATION', 'Tiền tố hóa đơn phải dài 2–6 ký tự (chữ cái, số hoặc dấu gạch ngang).', 'invoiceDefaults.prefix');
        }
        const nextNum = Number(d.nextNumber !== undefined ? d.nextNumber : cur.invoiceDefaults.nextNumber);
        if (isNaN(nextNum) || nextNum < 1) {
          return DB.err('VALIDATION', 'Số thứ tự bắt đầu tiếp theo phải lớn hơn 0.', 'invoiceDefaults.nextNumber');
        }
        const termDays = Number(d.defaultTermDays !== undefined ? d.defaultTermDays : cur.invoiceDefaults.defaultTermDays);
        if (isNaN(termDays) || termDays < 1 || termDays > 365) {
          return DB.err('VALIDATION', 'Số ngày hạn thanh toán mặc định phải từ 1 đến 365 ngày.', 'invoiceDefaults.defaultTermDays');
        }
        const defVat = Number(d.defaultVat !== undefined ? d.defaultVat : cur.invoiceDefaults.defaultVat);
        if (![0, 5, 8, 10].includes(defVat)) {
          return DB.err('VALIDATION', 'Thuế suất GTGT mặc định phải thuộc mức 0%, 5%, 8% hoặc 10%.', 'invoiceDefaults.defaultVat');
        }
        Object.assign(cur.invoiceDefaults, d, {
          prefix: prefix,
          nextNumber: Math.round(nextNum),
          defaultTermDays: Math.round(termDays),
          defaultVat: defVat
        });
      }

      if (p.ai) {
        const threshold = Number(p.ai.anomalyThreshold !== undefined ? p.ai.anomalyThreshold : cur.ai.anomalyThreshold);
        if (isNaN(threshold) || threshold < 120 || threshold > 1000) {
          return DB.err('VALIDATION', 'Ngưỡng cảnh báo hóa đơn bất thường phải từ 120% đến 1000%.', 'ai.anomalyThreshold');
        }
        Object.assign(cur.ai, p.ai, { anomalyThreshold: Math.round(threshold) });
      }

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'settings',
          entityId: 'settings',
          type: 'update',
          message: 'Đã lưu cập nhật Cấu hình hóa đơn & Trợ lý AI.'
        });
      }
      DB._commit();
      return DB.ok(IP.Utils.clone(cur));
    },

    createReminderTemplate: function (tpl) {
      const st = DB._rawState();
      const t = tpl || {};
      const name = String(t.name || '').trim();
      const channel = t.channel === 'sms' ? 'sms' : 'email';
      const tone = ['friendly', 'formal', 'firm'].includes(t.tone) ? t.tone : 'friendly';
      const subject = String(t.subject || '').trim();
      const body = String(t.body || '').trim();

      if (!name) return DB.err('VALIDATION', 'Vui lòng nhập tên mẫu nhắc thanh toán.', 'name');
      if (channel === 'email' && !subject) return DB.err('VALIDATION', 'Mẫu Email cần có tiêu đề.', 'subject');
      if (!body) return DB.err('VALIDATION', 'Nội dung mẫu nhắc không được để trống.', 'body');

      if (t.isDefault) {
        st.settings.reminderTemplates.forEach(function (item) {
          if (item.channel === channel) item.isDefault = false;
        });
      }

      const record = {
        id: IP.Utils.uid('tpl'),
        name: name,
        channel: channel,
        tone: tone,
        subject: subject || ('Nhắc thanh toán ' + name),
        body: body,
        isDefault: Boolean(t.isDefault)
      };

      st.settings.reminderTemplates.push(record);
      DB._commit();
      return DB.ok(record);
    },

    updateReminderTemplate: function (id, patch) {
      const st = DB._rawState();
      const list = st.settings.reminderTemplates;
      const item = list.find(function (x) { return x.id === id; });
      if (!item) return DB.err('NOT_FOUND', 'Không tìm thấy mẫu nhắc cần sửa.');

      const p = patch || {};
      const name = p.name !== undefined ? String(p.name).trim() : item.name;
      const channel = p.channel || item.channel;
      const subject = p.subject !== undefined ? String(p.subject).trim() : item.subject;
      const body = p.body !== undefined ? String(p.body).trim() : item.body;

      if (!name) return DB.err('VALIDATION', 'Tên mẫu nhắc không được để trống.', 'name');
      if (!body) return DB.err('VALIDATION', 'Nội dung mẫu nhắc không được để trống.', 'body');

      if (p.isDefault) {
        list.forEach(function (other) {
          if (other.channel === channel && other.id !== id) other.isDefault = false;
        });
      }

      Object.assign(item, p, {
        name: name,
        channel: channel,
        subject: subject,
        body: body
      });
      DB._commit();
      return DB.ok(item);
    },

    deleteReminderTemplate: function (id, replacementDefaultId) {
      const st = DB._rawState();
      const list = st.settings.reminderTemplates;
      const idx = list.findIndex(function (x) { return x.id === id; });
      if (idx < 0) return DB.err('NOT_FOUND', 'Không tìm thấy mẫu nhắc.');
      const target = list[idx];

      const sameChannel = list.filter(function (x) { return x.channel === target.channel && x.id !== id; });
      if (sameChannel.length === 0) {
        return DB.err('TEMPLATE_PROTECTED', 'Không thể xóa mẫu nhắc cuối cùng của kênh ' + IP.Fmt.channelLabel(target.channel) + '.');
      }

      if (target.isDefault) {
        if (!replacementDefaultId) {
          return DB.err('TEMPLATE_PROTECTED', 'Mẫu này đang là mặc định. Vui lòng chọn một mẫu mặc định thay thế trước khi xóa.');
        }
        const replacement = list.find(function (x) { return x.id === replacementDefaultId && x.id !== id; });
        if (!replacement) {
          return DB.err('TEMPLATE_PROTECTED', 'Mẫu thay thế không hợp lệ.');
        }
        replacement.isDefault = true;
      }

      list.splice(idx, 1);
      DB._commit();
      return DB.ok({ deletedId: id });
    }
  });
})(window);
