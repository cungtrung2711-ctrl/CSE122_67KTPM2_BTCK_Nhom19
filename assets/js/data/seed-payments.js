/**
 * @owner SV1
 * @spec §8.1, §10.1, §10.2 Seed 26 Payments (Confirmed full/partial, Pending bank transactions, Rejected discrepancy)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('payments', {
    order: 50,
    run: function (state, h) {
      function invById(id) {
        return state.invoices.find(function (x) { return x.id === id; });
      }

      const payments = [];
      let pCount = 1;

      function pushPayment(obj) {
        const id = 'pay_' + String(pCount++).padStart(3, '0');
        payments.push(Object.assign({
          id: id,
          source: 'manual',
          invoiceId: null,
          suggestedCustomerId: obj.customerId || null,
          customerId: null,
          amount: 0,
          allocatedAmount: 0,
          method: 'transfer',
          reference: 'VCB' + String(2026000 + pCount),
          transferContent: '',
          paidAt: h.addDays(-2),
          status: 'confirmed',
          discrepancy: false,
          discrepancyNote: '',
          note: '',
          reconciledAt: null
        }, obj));
      }

      // 1. 10 full confirmed payments for inv_037 .. inv_046 (Paid status)
      const paidInvIds = ['inv_037', 'inv_038', 'inv_039', 'inv_040', 'inv_041', 'inv_042', 'inv_043', 'inv_044', 'inv_045', 'inv_046'];
      paidInvIds.forEach(function (invId, idx) {
        const inv = invById(invId);
        if (!inv) return;
        const paidDate = h.addDays(-(idx * 4 + 2));
        pushPayment({
          source: idx % 2 === 0 ? 'bank' : 'manual',
          invoiceId: inv.id,
          customerId: inv.customerId,
          amount: inv.total,
          allocatedAmount: inv.total,
          method: idx % 3 === 0 ? 'ewallet' : 'transfer',
          reference: 'UNC-26' + String(idx + 101),
          transferContent: 'TT hoa don ' + inv.number,
          paidAt: paidDate < inv.issueDate ? inv.issueDate : paidDate,
          status: 'confirmed',
          note: 'Đã thu đủ 100% giá trị hóa đơn',
          reconciledAt: paidDate + 'T15:00:00.000Z'
        });
      });

      // 2. 8 partial confirmed payments (creates partial/overdue statuses with partial collection)
      const partialDefs = [
        { invId: 'inv_001', ratio: 0.4, daysAgo: 60 },
        { invId: 'inv_005', ratio: 0.35, daysAgo: 45 },
        { invId: 'inv_010', ratio: 0.5, daysAgo: 20 },
        { invId: 'inv_011', ratio: 0.3, daysAgo: 18 },
        { invId: 'inv_016', ratio: 0.4, daysAgo: 10 },
        { invId: 'inv_023', ratio: 0.5, daysAgo: 4 },
        { invId: 'inv_029', ratio: 0.4, daysAgo: 5 },
        { invId: 'inv_031', ratio: 0.3, daysAgo: 3 }
      ];
      partialDefs.forEach(function (pd, idx) {
        const inv = invById(pd.invId);
        if (!inv) return;
        const partAmt = Math.round((inv.total * pd.ratio) / 100000) * 100000;
        const pDate = h.addDays(-pd.daysAgo);
        pushPayment({
          source: idx % 2 === 0 ? 'manual' : 'bank',
          invoiceId: inv.id,
          customerId: inv.customerId,
          amount: partAmt,
          allocatedAmount: partAmt,
          method: 'transfer',
          reference: 'VCB-PT-' + String(idx + 201),
          transferContent: 'Thanh toan dot 1 HD ' + inv.number,
          paidAt: pDate < inv.issueDate ? inv.issueDate : pDate,
          status: 'confirmed',
          note: 'Thu một phần theo cam kết thanh toán',
          reconciledAt: pDate + 'T11:20:00.000Z'
        });
      });

      // 3. 6 pending bank transactions for Reconciliation screen (source='bank', status='pending')
      const pendingTargets = [
        { invId: 'inv_017', exact: true, daysAgo: 1, note: 'CK thanh toan HD IP-2026-0017 Noi that Go Viet' },
        { invId: 'inv_018', exact: true, daysAgo: 1, note: 'CTCP TM Minh Tam TT hoa don IP-2026-0018' },
        { invId: 'inv_024', exact: true, daysAgo: 0, note: 'Sao Khue Tech thanh toan IP-2026-0024' },
        { invId: 'inv_020', exact: false, diff: -2500000, daysAgo: 2, note: 'Nong san Dong Xanh tam ung HD IP-2026-0020' },
        { invId: 'inv_025', exact: true, daysAgo: 0, note: 'Det kim Ha Dong TT IP-2026-0025' },
        { invId: 'inv_012', exact: false, diff: -1800000, daysAgo: 3, disconnect: true, note: 'Minh Tam CK thanh toan cong no (chenh lech phi NH)' }
      ];
      pendingTargets.forEach(function (pt, idx) {
        const inv = invById(pt.invId);
        if (!inv) return;
        const amt = pt.exact ? inv.total : Math.max(1000000, inv.total + (pt.diff || 0));
        pushPayment({
          source: 'bank',
          invoiceId: null, // Chưa đối chiếu
          suggestedCustomerId: inv.customerId,
          customerId: inv.customerId,
          amount: amt,
          allocatedAmount: 0,
          method: 'transfer',
          reference: 'FT2629' + String(8100 + idx),
          transferContent: pt.note,
          paidAt: h.addDays(-pt.daysAgo),
          status: 'pending',
          discrepancy: Boolean(pt.disconnect),
          discrepancyNote: pt.disconnect ? 'Số tiền chuyển khoản thiếu 1.800.000 ₫ so với hóa đơn IP-2026-0012' : '',
          note: 'Giao dịch đồng bộ từ sao kê ngân hàng chờ kế toán đối chiếu',
          reconciledAt: null
        });
      });

      // 4. 2 Discrepancy / Rejected bank transactions to populate "Sai lệch" tab
      const invRej1 = invById('inv_006');
      pushPayment({
        source: 'bank',
        invoiceId: invRej1 ? invRej1.id : null,
        suggestedCustomerId: 'cus_04',
        customerId: 'cus_04',
        amount: 9500000,
        allocatedAmount: 0,
        method: 'transfer',
        reference: 'FT26289901',
        transferContent: 'Chuyen khoan nham ma hop dong XD09',
        paidAt: h.addDays(-6),
        status: 'rejected',
        discrepancy: true,
        discrepancyNote: 'Khách hàng chuyển nhầm khoản đặt cọc hợp đồng xây lắp khác, đã hoàn trả',
        note: 'Đã từ chối khớp công nợ do sai mã hợp đồng',
        reconciledAt: h.addDays(-5) + 'T16:10:00.000Z'
      });

      const invRej2 = invById('inv_008');
      pushPayment({
        source: 'bank',
        invoiceId: invRej2 ? invRej2.id : null,
        suggestedCustomerId: 'cus_10',
        customerId: 'cus_10',
        amount: 12500000,
        allocatedAmount: 0,
        method: 'transfer',
        reference: 'FT26289902',
        transferContent: 'Bao bi Phu My thanh toan dot 1 IP-2026-0008',
        paidAt: h.addDays(-4),
        status: 'pending',
        discrepancy: true,
        discrepancyNote: 'Chênh lệch lớn so với kỳ hạn cam kết, cần xác nhận lại với Kinh doanh trước khi khớp',
        note: 'Đang đánh dấu sai lệch chờ phản hồi khách hàng',
        reconciledAt: null
      });

      state.payments = payments;

      // Recompute paidAmount for all invoices from confirmed payments
      state.invoices.forEach(function (inv) {
        const confirmedSum = state.payments
          .filter(function (p) { return p.invoiceId === inv.id && p.status === 'confirmed'; })
          .reduce(function (acc, p) { return acc + Number(p.allocatedAmount || p.amount || 0); }, 0);
        inv.paidAmount = Math.min(inv.total, confirmedSum);
      });
    }
  });
})(window);
