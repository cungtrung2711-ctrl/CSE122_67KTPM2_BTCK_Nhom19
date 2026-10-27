/**
 * @owner SV1
 * @spec §10.1, §10.2 Seed 52 Invoices across all statuses & aging buckets
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  const CATALOG = [
    { desc: 'Gói dịch vụ nền tảng quản trị hóa đơn điện tử Enterprise', unit: 'Gói', price: 18000000, vat: 10 },
    { desc: 'Phí tích hợp cổng đối chiếu ngân hàng tự động API', unit: 'Hợp đồng', price: 24000000, vat: 10 },
    { desc: 'Bản quyền phân hệ dự báo dòng tiền & cảnh báo công nợ', unit: 'Năm', price: 15000000, vat: 8 },
    { desc: 'Dịch vụ chuẩn hóa & chuyển đổi dữ liệu kế toán lịch sử', unit: 'Lô', price: 12000000, vat: 8 },
    { desc: 'Đào tạo vận hành quy trình thu hồi công nợ B2B chuyên sâu', unit: 'Khóa', price: 8500000, vat: 10 },
    { desc: 'Gói lưu trữ chứng từ số hóa chuẩn kiểm toán (50.000 chứng từ)', unit: 'Gói', price: 9500000, vat: 10 },
    { desc: 'Dịch vụ bảo trì và hỗ trợ kỹ thuật ưu tiên 24/7 theo quý', unit: 'Quý', price: 11000000, vat: 8 },
    { desc: 'Thiết bị ký số HSM tốc độ cao tích hợp máy chủ kế toán', unit: 'Bộ', price: 16500000, vat: 10 }
  ];

  function buildItems(invIdx, specs) {
    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    const items = specs.map(function (sp, idx) {
      const cat = CATALOG[(invIdx + idx) % CATALOG.length];
      const qty = sp.qty || 1;
      const price = sp.price || cat.price;
      const discPct = sp.disc || 0;
      const vatRate = sp.vat !== undefined ? sp.vat : cat.vat;
      const gross = Math.round(qty * price);
      const discAmt = Math.round((gross * discPct) / 100);
      const afterDisc = gross - discAmt;
      const vatAmt = Math.round((afterDisc * vatRate) / 100);
      const lineTotal = afterDisc + vatAmt;
      subtotal += gross;
      discountTotal += discAmt;
      vatTotal += vatAmt;
      return {
        id: 'itm_' + String(invIdx).padStart(3, '0') + '_' + (idx + 1),
        description: sp.desc || cat.desc,
        quantity: qty,
        unit: cat.unit,
        unitPrice: price,
        discountPercent: discPct,
        vatRate: vatRate,
        lineTotal: lineTotal
      };
    });
    return {
      items: items,
      subtotal: subtotal,
      discountTotal: discountTotal,
      vatTotal: vatTotal,
      total: subtotal - discountTotal + vatTotal
    };
  }

  IP.Seed.register('invoices', {
    order: 40,
    run: function (state, h) {
      // Blueprint of 52 invoices covering all buckets:
      // Overdue 90+, 61-90, 31-60, 1-30, Due in 7d, Due in 8-30d, Paid, Partial, Draft, Voided, Archived
      const defs = [
        // Overdue > 90 days (4 invoices)
        { n: 1, cus: 'cus_12', iss: -140, due: -105, sent: true, specs: [{ qty: 3, price: 24000000, vat: 10 }, { qty: 2, price: 15000000, vat: 8 }] },
        { n: 2, cus: 'cus_04', iss: -135, due: -95, sent: true, specs: [{ qty: 4, price: 18000000, vat: 10 }] },
        { n: 3, cus: 'cus_02', iss: -130, due: -100, sent: true, specs: [{ qty: 2, price: 22000000, vat: 10 }] },
        { n: 4, cus: 'cus_12', iss: -125, due: -92, sent: true, specs: [{ qty: 2, price: 16500000, vat: 10 }] },

        // Overdue 61–90 days (5 invoices)
        { n: 5, cus: 'cus_02', iss: -105, due: -75, sent: true, specs: [{ qty: 3, price: 18000000, vat: 10 }, { qty: 1, price: 9500000, vat: 10 }] },
        { n: 6, cus: 'cus_04', iss: -110, due: -68, sent: true, specs: [{ qty: 2, price: 24000000, vat: 10 }] },
        { n: 7, cus: 'cus_01', iss: -98, due: -65, sent: true, specs: [{ qty: 3, price: 15000000, vat: 8 }] },
        { n: 8, cus: 'cus_10', iss: -95, due: -63, sent: true, specs: [{ qty: 2, price: 19000000, vat: 10 }] },
        { n: 9, cus: 'cus_06', iss: -92, due: -61, sent: true, specs: [{ qty: 2, price: 14000000, vat: 8 }] },

        // Overdue 31–60 days (6 invoices, some partial)
        { n: 10, cus: 'cus_10', iss: -75, due: -45, sent: true, specs: [{ qty: 3, price: 16500000, vat: 10 }] },
        { n: 11, cus: 'cus_01', iss: -70, due: -40, sent: true, specs: [{ qty: 4, price: 15000000, vat: 10 }] },
        { n: 12, cus: 'cus_08', iss: -68, due: -38, sent: true, specs: [{ qty: 2, price: 21000000, vat: 10 }] },
        { n: 13, cus: 'cus_06', iss: -65, due: -35, sent: true, specs: [{ qty: 2, price: 18000000, vat: 8 }] },
        { n: 14, cus: 'cus_03', iss: -78, due: -33, sent: true, specs: [{ qty: 3, price: 12000000, vat: 8 }] },
        { n: 15, cus: 'cus_09', iss: -62, due: -32, sent: true, specs: [{ qty: 2, price: 24000000, vat: 10 }] },

        // Overdue 1–30 days (7 invoices)
        { n: 16, cus: 'cus_01', iss: -48, due: -18, sent: true, specs: [{ qty: 2, price: 18000000, vat: 10 }, { qty: 1, price: 11000000, vat: 8 }] },
        { n: 17, cus: 'cus_03', iss: -55, due: -14, sent: true, specs: [{ qty: 2, price: 19500000, vat: 10 }] },
        { n: 18, cus: 'cus_08', iss: -42, due: -12, sent: true, specs: [{ qty: 3, price: 12000000, vat: 10 }] },
        { n: 19, cus: 'cus_13', iss: -25, due: -10, sent: true, specs: [{ qty: 2, price: 15000000, vat: 8 }] },
        { n: 20, cus: 'cus_09', iss: -38, due: -8, sent: true, specs: [{ qty: 2, price: 16500000, vat: 10 }] },
        { n: 21, cus: 'cus_04', iss: -50, due: -5, sent: true, specs: [{ qty: 3, price: 22000000, vat: 10 }] },
        { n: 22, cus: 'cus_11', iss: -33, due: -3, sent: true, specs: [{ qty: 1, price: 24000000, vat: 10 }] },

        // Due within 7 days (6 invoices — Sent & Partial)
        { n: 23, cus: 'cus_05', iss: -12, due: 2, sent: true, specs: [{ qty: 2, price: 18000000, vat: 10 }] },
        { n: 24, cus: 'cus_07', iss: -11, due: 4, sent: true, specs: [{ qty: 3, price: 14000000, vat: 8 }] },
        { n: 25, cus: 'cus_14', iss: -25, due: 5, sent: true, specs: [{ qty: 2, price: 16000000, vat: 10 }] },
        { n: 26, cus: 'cus_15', iss: -9, due: 6, sent: true, specs: [{ qty: 2, price: 15000000, vat: 10 }] },
        { n: 27, cus: 'cus_16', iss: -8, due: 7, sent: true, specs: [{ qty: 3, price: 12000000, vat: 8 }] },
        { n: 28, cus: 'cus_01', iss: -24, due: 3, sent: true, specs: [{ qty: 1, price: 28000000, vat: 10 }] },

        // Due in 8–30 days (8 invoices — Sent & Partial)
        { n: 29, cus: 'cus_03', iss: -20, due: 12, sent: true, specs: [{ qty: 2, price: 21000000, vat: 10 }] },
        { n: 30, cus: 'cus_05', iss: -2, due: 14, sent: true, specs: [{ qty: 2, price: 13500000, vat: 8 }] },
        { n: 31, cus: 'cus_06', iss: -14, due: 16, sent: true, specs: [{ qty: 3, price: 14500000, vat: 10 }] },
        { n: 32, cus: 'cus_07', iss: -1, due: 15, sent: true, specs: [{ qty: 2, price: 19000000, vat: 10 }] },
        { n: 33, cus: 'cus_11', iss: -10, due: 20, sent: true, specs: [{ qty: 2, price: 17500000, vat: 8 }] },
        { n: 34, cus: 'cus_13', iss: -3, due: 22, sent: true, specs: [{ qty: 1, price: 26000000, vat: 10 }] },
        { n: 35, cus: 'cus_14', iss: -5, due: 25, sent: true, specs: [{ qty: 2, price: 15500000, vat: 10 }] },
        { n: 36, cus: 'cus_16', iss: -2, due: 28, sent: true, specs: [{ qty: 2, price: 20000000, vat: 10 }] },

        // Paid invoices (10 invoices across current month and past months)
        { n: 37, cus: 'cus_05', iss: -25, due: -10, sent: true, specs: [{ qty: 2, price: 18000000, vat: 10 }] },
        { n: 38, cus: 'cus_07', iss: -22, due: -7, sent: true, specs: [{ qty: 2, price: 22000000, vat: 10 }] },
        { n: 39, cus: 'cus_14', iss: -28, due: -5, sent: true, specs: [{ qty: 3, price: 12000000, vat: 8 }] },
        { n: 40, cus: 'cus_17', iss: -35, due: -12, sent: true, specs: [{ qty: 2, price: 15000000, vat: 10 }] },
        { n: 41, cus: 'cus_03', iss: -45, due: -15, sent: true, specs: [{ qty: 2, price: 19000000, vat: 10 }] },
        { n: 42, cus: 'cus_09', iss: -52, due: -22, sent: true, specs: [{ qty: 3, price: 14000000, vat: 8 }] },
        { n: 43, cus: 'cus_11', iss: -60, due: -30, sent: true, specs: [{ qty: 2, price: 16500000, vat: 10 }] },
        { n: 44, cus: 'cus_13', iss: -68, due: -48, sent: true, specs: [{ qty: 2, price: 17000000, vat: 10 }] },
        { n: 45, cus: 'cus_01', iss: -80, due: -50, sent: true, specs: [{ qty: 3, price: 18000000, vat: 10 }] },
        { n: 46, cus: 'cus_15', iss: -16, due: -2, sent: true, specs: [{ qty: 1, price: 24000000, vat: 10 }] },

        // Draft invoices (3 invoices: sent = false)
        { n: 47, cus: 'cus_05', iss: 0, due: 15, sent: false, specs: [{ qty: 2, price: 15000000, vat: 10 }] },
        { n: 48, cus: 'cus_07', iss: -1, due: 14, sent: false, specs: [{ qty: 1, price: 24000000, vat: 8 }] },
        { n: 49, cus: 'cus_11', iss: 0, due: 30, sent: false, specs: [{ qty: 3, price: 11000000, vat: 10 }] },

        // Voided invoice (1 invoice)
        { n: 50, cus: 'cus_08', iss: -30, due: 0, sent: true, voided: true, voidReason: 'Khách hàng đề nghị tách thành 2 hóa đơn theo từng đợt giao hàng', specs: [{ qty: 2, price: 14000000, vat: 10 }] },

        // Archived invoices (2 invoices with no payment)
        { n: 51, cus: 'cus_18', iss: -190, due: -160, sent: false, archived: true, specs: [{ qty: 1, price: 9500000, vat: 10 }] },
        { n: 52, cus: 'cus_17', iss: -120, due: -90, sent: false, archived: true, specs: [{ qty: 1, price: 12000000, vat: 8 }] }
      ];

      state.invoices = defs.map(function (d) {
        const calc = buildItems(d.n, d.specs);
        const id = 'inv_' + String(d.n).padStart(3, '0');
        const number = 'IP-2026-' + String(d.n).padStart(4, '0');
        const issueDate = h.addDays(d.iss);
        const dueDate = h.addDays(d.due);
        return {
          id: id,
          number: number,
          customerId: d.cus,
          issueDate: issueDate,
          dueDate: dueDate,
          paymentTermDays: Math.max(0, d.due - d.iss),
          poNumber: 'PO-26-' + String(100 + d.n),
          items: calc.items,
          subtotal: calc.subtotal,
          discountTotal: calc.discountTotal,
          vatTotal: calc.vatTotal,
          total: calc.total,
          paidAmount: 0, // Sẽ được tính tự động từ seed-payments
          sentAt: d.sent ? issueDate + 'T09:30:00.000Z' : null,
          archived: Boolean(d.archived),
          voided: Boolean(d.voided),
          voidReason: d.voidReason || '',
          notes: 'Thanh toán chuyển khoản về tài khoản Vietcombank của Công ty.',
          internalNote: d.due < 0 ? 'Cần phối hợp bộ phận Kinh doanh nhắc lịch thanh toán.' : 'Hóa đơn phát hành đúng tiến độ nghiệm thu.',
          followUp: {
            assignedTo: 'usr_sal',
            status: 'watching',
            notes: []
          },
          createdBy: 'usr_acc',
          createdAt: issueDate + 'T08:30:00.000Z',
          updatedAt: issueDate + 'T09:30:00.000Z'
        };
      });
    }
  });
})(window);
