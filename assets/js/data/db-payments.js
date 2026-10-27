/**
 * @owner SV1
 * @spec §8.1, §10.1, §10.3, §10.4 Payments & Bank Reconciliation Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  DB.extend('payments', {
    listPayments: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.payments.slice();

      if (f.invoiceId) {
        list = list.filter(function (p) { return p.invoiceId === f.invoiceId; });
      }
      if (f.customerId && f.customerId !== 'all') {
        list = list.filter(function (p) { return p.customerId === f.customerId || p.suggestedCustomerId === f.customerId; });
      }
      if (f.source && f.source !== 'all') {
        list = list.filter(function (p) { return p.source === f.source; });
      }
      if (f.status && f.status !== 'all') {
        list = list.filter(function (p) { return p.status === f.status; });
      }
      if (f.tab === 'pending') {
        list = list.filter(function (p) { return p.status === 'pending' && !p.discrepancy; });
      } else if (f.tab === 'confirmed') {
        list = list.filter(function (p) { return p.status === 'confirmed'; });
      } else if (f.tab === 'discrepancy') {
        list = list.filter(function (p) { return p.discrepancy || p.status === 'rejected'; });
      }
      if (f.q) {
        const q = String(f.q).trim().toLowerCase();
        list = list.filter(function (p) {
          return (p.reference && p.reference.toLowerCase().includes(q)) ||
            (p.transferContent && p.transferContent.toLowerCase().includes(q)) ||
            (p.note && p.note.toLowerCase().includes(q));
        });
      }
      return list;
    },

    getPayment: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.payments.find(function (p) { return p.id === id; }) || null;
    },

    addPayment: function (data) {
      const st = DB._rawState();
      const d = data || {};
      const inv = st.invoices.find(function (x) { return x.id === d.invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn cần ghi nhận thanh toán.', 'invoiceId');
      if (inv.voided) return DB.err('INVOICE_VOIDED', 'Hóa đơn đã hủy không nhận thêm thanh toán.', 'invoiceId');
      if (inv.archived) return DB.err('VALIDATION', 'Hóa đơn đã lưu trữ không thể ghi nhận thanh toán.', 'invoiceId');

      const remaining = Math.max(0, Number(inv.total || 0) - Number(inv.paidAmount || 0));
      const amount = Math.round(Number(d.amount || 0));
      if (isNaN(amount) || amount <= 0) {
        return DB.err('VALIDATION', 'Số tiền thanh toán phải lớn hơn 0 ₫.', 'amount');
      }
      if (amount > remaining) {
        return DB.err('PAYMENT_EXCEEDS_REMAINING', 'Số tiền thu (' + IP.Fmt.currency(amount) + ') không được vượt quá số còn phải thu (' + IP.Fmt.currency(remaining) + ').', 'amount');
      }

      const today = IP.Seed.todayISO();
      const paidAt = String(d.paidAt || today).slice(0, 10);
      if (paidAt > today) {
        return DB.err('PAYMENT_DATE_INVALID', 'Ngày nhận thanh toán không được ở tương lai.', 'paidAt');
      }
      if (paidAt < inv.issueDate) {
        return DB.err('PAYMENT_DATE_INVALID', 'Ngày nhận thanh toán không được trước ngày phát hành hóa đơn (' + IP.Fmt.date(inv.issueDate) + ').', 'paidAt');
      }

      if (!inv.sentAt) {
        inv.sentAt = new Date().toISOString();
      }

      const payment = {
        id: IP.Utils.uid('pay'),
        source: d.source || 'manual',
        invoiceId: inv.id,
        suggestedCustomerId: inv.customerId,
        customerId: inv.customerId,
        amount: amount,
        allocatedAmount: amount,
        method: ['transfer', 'cash', 'ewallet'].includes(d.method) ? d.method : 'transfer',
        reference: String(d.reference || ('PT-' + Date.now().toString().slice(-6))).trim(),
        transferContent: String(d.transferContent || ('Thanh toan HD ' + inv.number)).trim(),
        paidAt: paidAt,
        status: 'confirmed',
        discrepancy: false,
        discrepancyNote: '',
        note: String(d.note || '').trim(),
        reconciledAt: new Date().toISOString()
      };

      st.payments.unshift(payment);
      DB.recomputePaid(inv.id);

      const cus = DB.getCustomer(inv.customerId);
      const cusName = cus ? cus.name : inv.customerId;

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'payment',
          message: 'Đã ghi nhận thanh toán ' + IP.Fmt.currency(amount) + ' cho hóa đơn ' + inv.number + ' (' + IP.Fmt.methodLabel(payment.method) + ').'
        });
      }
      if (DB.addNotification) {
        DB.addNotification({
          role: 'all',
          type: 'payment',
          title: 'Đã thu ' + IP.Fmt.currency(amount) + ' · ' + inv.number,
          message: 'Khách hàng ' + cusName + ' đã thanh toán qua ' + IP.Fmt.methodLabel(payment.method) + '.',
          targetRouteKey: 'invoice.view',
          targetParams: { id: inv.id }
        });
      }

      DB._commit();
      return DB.ok({ payment: payment, invoice: inv });
    },

    reconcilePayment: function (id, invoiceId, allocatedAmount, note) {
      const st = DB._rawState();
      const pay = st.payments.find(function (p) { return p.id === id; });
      if (!pay) return DB.err('NOT_FOUND', 'Không tìm thấy giao dịch ngân hàng.');
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return DB.err('NOT_FOUND', 'Vui lòng chọn hóa đơn cần đối chiếu.', 'invoiceId');
      if (inv.voided || inv.archived) {
        return DB.err('VALIDATION', 'Không thể đối chiếu vào hóa đơn đã hủy hoặc đã lưu trữ.', 'invoiceId');
      }

      const remaining = Math.max(0, Number(inv.total || 0) - Number(inv.paidAmount || 0));
      const alloc = Math.round(Number(allocatedAmount !== undefined ? allocatedAmount : Math.min(pay.amount, remaining)));

      if (isNaN(alloc) || alloc <= 0) {
        return DB.err('VALIDATION', 'Số tiền phân bổ đối chiếu phải lớn hơn 0 ₫.', 'allocatedAmount');
      }
      if (alloc > remaining) {
        return DB.err('PAYMENT_EXCEEDS_REMAINING', 'Số tiền phân bổ (' + IP.Fmt.currency(alloc) + ') vượt quá số còn phải thu của hóa đơn (' + IP.Fmt.currency(remaining) + ').', 'allocatedAmount');
      }
      if (alloc > pay.amount) {
        return DB.err('VALIDATION', 'Số tiền phân bổ không được vượt quá giá trị giao dịch ngân hàng (' + IP.Fmt.currency(pay.amount) + ').', 'allocatedAmount');
      }

      const diff = Math.abs(pay.amount - alloc);
      if (diff > 0 && (!note || !String(note).trim())) {
        return DB.err('VALIDATION', 'Giao dịch có chênh lệch số tiền (' + IP.Fmt.currency(diff) + '), vui lòng nhập ghi chú giải trình trước khi xác nhận.', 'note');
      }

      if (!inv.sentAt) inv.sentAt = new Date().toISOString();

      pay.invoiceId = inv.id;
      pay.customerId = inv.customerId;
      pay.allocatedAmount = alloc;
      pay.status = 'confirmed';
      pay.discrepancy = false;
      pay.note = String(note || pay.note || 'Đã đối chiếu khớp với hóa đơn ' + inv.number).trim();
      pay.reconciledAt = new Date().toISOString();

      DB.recomputePaid(inv.id);

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'reconcile',
          message: 'Đã đối chiếu giao dịch ' + pay.reference + ' (' + IP.Fmt.currency(alloc) + ') vào hóa đơn ' + inv.number + '.'
        });
      }
      if (DB.addNotification) {
        DB.addNotification({
          role: 'all',
          type: 'payment',
          title: 'Đối chiếu thành công ' + pay.reference + ' → ' + inv.number,
          message: 'Đã khớp ' + IP.Fmt.currency(alloc) + ' vào hóa đơn ' + inv.number + '.',
          targetRouteKey: 'invoice.view',
          targetParams: { id: inv.id }
        });
      }

      DB._commit();
      return DB.ok({ payment: pay, invoice: inv });
    },

    unreconcilePayment: function (id) {
      const st = DB._rawState();
      const pay = st.payments.find(function (p) { return p.id === id; });
      if (!pay) return DB.err('NOT_FOUND', 'Không tìm thấy giao dịch cần hoàn tác.');
      if (pay.status !== 'confirmed') {
        return DB.err('VALIDATION', 'Chỉ có thể hoàn tác đối chiếu với giao dịch đã xác nhận.');
      }

      const oldInvoiceId = pay.invoiceId;
      pay.status = 'pending';
      pay.allocatedAmount = 0;
      pay.invoiceId = null;
      pay.reconciledAt = null;
      pay.note = 'Đã hoàn tác đối chiếu, chờ xử lý lại';

      if (oldInvoiceId) {
        DB.recomputePaid(oldInvoiceId);
      }

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: oldInvoiceId || pay.id,
          type: 'unreconcile',
          message: 'Đã hoàn tác đối chiếu giao dịch ' + pay.reference + ', trả giao dịch về trạng thái Chờ đối chiếu.'
        });
      }
      if (DB.addNotification && oldInvoiceId) {
        DB.addNotification({
          role: 'all',
          type: 'payment',
          title: 'Hoàn tác đối chiếu giao dịch ' + pay.reference,
          message: 'Số đã thu của hóa đơn liên quan đã được tính lại.',
          targetRouteKey: 'invoice.view',
          targetParams: { id: oldInvoiceId }
        });
      }

      DB._commit();
      return DB.ok(pay);
    },

    markPaymentDiscrepancy: function (id, note) {
      const st = DB._rawState();
      const pay = st.payments.find(function (p) { return p.id === id; });
      if (!pay) return DB.err('NOT_FOUND', 'Không tìm thấy giao dịch.');
      const cleanNote = String(note || '').trim();
      if (!cleanNote) return DB.err('VALIDATION', 'Vui lòng nhập ghi chú mô tả sai lệch.', 'note');

      const oldInvoiceId = pay.invoiceId;
      pay.discrepancy = true;
      pay.discrepancyNote = cleanNote;
      pay.status = 'pending';
      pay.allocatedAmount = 0;
      if (oldInvoiceId) {
        pay.invoiceId = null;
        DB.recomputePaid(oldInvoiceId);
      }

      DB._commit();
      return DB.ok(pay);
    },

    rejectPayment: function (id, reason) {
      const st = DB._rawState();
      const pay = st.payments.find(function (p) { return p.id === id; });
      if (!pay) return DB.err('NOT_FOUND', 'Không tìm thấy giao dịch.');
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) return DB.err('VALIDATION', 'Vui lòng nhập lý do từ chối giao dịch.', 'reason');

      const oldInvoiceId = pay.invoiceId;
      pay.status = 'rejected';
      pay.discrepancy = true;
      pay.discrepancyNote = cleanReason;
      pay.allocatedAmount = 0;
      pay.reconciledAt = new Date().toISOString();
      if (oldInvoiceId) {
        pay.invoiceId = null;
        DB.recomputePaid(oldInvoiceId);
      }

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'payment',
          entityId: pay.id,
          type: 'reject',
          message: 'Đã từ chối giao dịch ngân hàng ' + pay.reference + '. Lý do: ' + cleanReason
        });
      }
      DB._commit();
      return DB.ok(pay);
    }
  });
})(window);
