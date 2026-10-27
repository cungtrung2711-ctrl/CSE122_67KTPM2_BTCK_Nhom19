/**
 * @owner SV3
 * @spec §8.3, §10.1, §10.4 Overdue Follow-up & Owner Assignment Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  function ensureFollowUp(inv) {
    if (!inv.followUp) {
      inv.followUp = { assignedTo: 'usr_sal', status: 'watching', notes: [] };
    }
    if (!Array.isArray(inv.followUp.notes)) {
      inv.followUp.notes = [];
    }
    return inv.followUp;
  }

  DB.extend('followup', {
    assignFollowUp: function (invoiceId, ownerId, reason) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn cần giao phụ trách.');

      const user = st.users.find(function (u) { return u.id === ownerId; });
      if (!user || user.role !== 'sales' || user.status !== 'active') {
        return DB.err('VALIDATION', 'Chỉ được chọn nhân sự thuộc vai trò Kinh doanh đang hoạt động.', 'ownerId');
      }

      const fu = ensureFollowUp(inv);
      if (fu.assignedTo === ownerId && (!reason || !String(reason).trim())) {
        return DB.err('VALIDATION', 'Người phụ trách mới trùng với người hiện tại. Vui lòng chọn nhân sự khác hoặc nhập lý do ghi chú.', 'ownerId');
      }

      fu.assignedTo = ownerId;
      fu.updatedAt = new Date().toISOString();
      if (reason && String(reason).trim()) {
        fu.notes.unshift({
          id: IP.Utils.uid('fn'),
          text: 'Giao phụ trách cho ' + user.name + ': ' + String(reason).trim(),
          authorId: DB.currentActorId(),
          at: fu.updatedAt
        });
      }

      inv.updatedAt = fu.updatedAt;
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'assign',
          message: 'Đã phân công ' + user.name + ' phụ trách đôn đốc hóa đơn ' + inv.number + '.'
        });
      }
      if (DB.addNotification) {
        DB.addNotification({
          role: 'sales',
          type: 'invoice',
          title: 'Phân công theo dõi công nợ: ' + inv.number,
          message: user.name + ' được giao phụ trách thu hồi hóa đơn ' + inv.number + '.',
          targetRouteKey: 'invoice.view',
          targetParams: { id: inv.id }
        });
      }

      DB._commit();
      return DB.ok(inv);
    },

    bulkAssignFollowUp: function (invoiceIds, ownerId, reason) {
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return DB.err('VALIDATION', 'Vui lòng chọn ít nhất 1 hóa đơn quá hạn.');
      }
      const updated = [];
      for (let i = 0; i < invoiceIds.length; i++) {
        const res = DB.assignFollowUp(invoiceIds[i], ownerId, reason || 'Phân công hàng loạt từ Quản lý');
        if (res.ok) updated.push(res.data);
      }
      return DB.ok({ count: updated.length, invoices: updated });
    },

    addFollowUpNote: function (invoiceId, text) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      const clean = String(text || '').trim();
      if (!clean) return DB.err('VALIDATION', 'Vui lòng nhập nội dung ghi chú xử lý.', 'text');

      const fu = ensureFollowUp(inv);
      const note = {
        id: IP.Utils.uid('fn'),
        text: clean,
        authorId: DB.currentActorId(),
        at: new Date().toISOString()
      };
      fu.notes.unshift(note);
      fu.updatedAt = note.at;
      inv.updatedAt = note.at;

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'followup',
          message: 'Ghi chú xử lý quá hạn (' + inv.number + '): ' + clean
        });
      }
      DB._commit();
      return DB.ok(note);
    },

    closeFollowUp: function (invoiceId, reason) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      const clean = String(reason || '').trim();
      if (!clean) return DB.err('VALIDATION', 'Vui lòng nhập lý do đóng theo dõi quá hạn.', 'reason');

      const fu = ensureFollowUp(inv);
      fu.status = 'closed';
      fu.closeReason = clean;
      fu.updatedAt = new Date().toISOString();
      fu.notes.unshift({
        id: IP.Utils.uid('fn'),
        text: 'Đã đóng theo dõi. Lý do: ' + clean,
        authorId: DB.currentActorId(),
        at: fu.updatedAt
      });
      inv.updatedAt = fu.updatedAt;

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'followup',
          message: 'Đã đóng theo dõi quá hạn cho hóa đơn ' + inv.number + '. Lý do: ' + clean
        });
      }
      DB._commit();
      return DB.ok(inv);
    },

    reopenFollowUp: function (invoiceId) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      const fu = ensureFollowUp(inv);
      fu.status = 'watching';
      fu.closeReason = '';
      fu.updatedAt = new Date().toISOString();
      inv.updatedAt = fu.updatedAt;
      DB._commit();
      return DB.ok(inv);
    }
  });
})(window);
