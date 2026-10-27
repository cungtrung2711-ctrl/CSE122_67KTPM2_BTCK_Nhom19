/**
 * @owner SV1
 * @spec §8.1, §10.1, §10.3, §10.4 Invoices Domain Data API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  function formatInvoiceNumber(defaults) {
    const d = defaults || { prefix: 'IP', format: 'IP-{YYYY}-{0000}', nextNumber: 53 };
    const year = new Date().getFullYear();
    const padded = String(d.nextNumber || 1).padStart(4, '0');
    const prefix = String(d.prefix || 'IP').trim().toUpperCase();
    return prefix + '-' + year + '-' + padded;
  }

  function sanitizeAndComputeItems(rawItems) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { ok: false, error: { code: 'VALIDATION', message: 'Hóa đơn phải có ít nhất 1 dòng hàng hóa/dịch vụ.', field: 'items' } };
    }
    let subtotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    const items = [];

    for (let i = 0; i < rawItems.length; i++) {
      const r = rawItems[i] || {};
      const desc = String(r.description || '').trim();
      const qty = Number(r.quantity);
      const price = Number(r.unitPrice);
      const disc = Number(r.discountPercent || 0);
      const vat = Number(r.vatRate !== undefined ? r.vatRate : 10);

      if (!desc) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Dòng hàng thứ ' + (i + 1) + ' thiếu mô tả hàng hóa/dịch vụ.', field: 'items' } };
      }
      if (isNaN(qty) || qty <= 0) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Số lượng ở dòng thứ ' + (i + 1) + ' phải lớn hơn 0.', field: 'items' } };
      }
      if (isNaN(price) || price < 0) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Đơn giá ở dòng thứ ' + (i + 1) + ' không hợp lệ.', field: 'items' } };
      }
      if (isNaN(disc) || disc < 0 || disc > 100) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Chiết khấu (%) ở dòng thứ ' + (i + 1) + ' phải từ 0 đến 100%.', field: 'items' } };
      }
      if (![0, 5, 8, 10].includes(vat)) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Thuế GTGT ở dòng thứ ' + (i + 1) + ' phải thuộc mức 0%, 5%, 8% hoặc 10%.', field: 'items' } };
      }

      const gross = Math.round(qty * price);
      const discAmt = Math.round((gross * disc) / 100);
      const afterDisc = gross - discAmt;
      const vatAmt = Math.round((afterDisc * vat) / 100);
      const lineTotal = afterDisc + vatAmt;

      subtotal += gross;
      discountTotal += discAmt;
      vatTotal += vatAmt;

      items.push({
        id: r.id || IP.Utils.uid('itm'),
        description: desc,
        quantity: qty,
        unit: String(r.unit || 'Gói').trim(),
        unitPrice: Math.round(price),
        discountPercent: disc,
        vatRate: vat,
        lineTotal: lineTotal
      });
    }

    return {
      ok: true,
      subtotal: subtotal,
      discountTotal: discountTotal,
      vatTotal: vatTotal,
      total: subtotal - discountTotal + vatTotal,
      items: items
    };
  }

  DB.extend('invoices', {
    nextInvoiceNumberPreview: function (overrideDefaults) {
      const st = DB._rawState();
      const def = Object.assign({}, st.settings.invoiceDefaults, overrideDefaults || {});
      return formatInvoiceNumber(def);
    },

    recomputePaid: function (invoiceId) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === invoiceId; });
      if (!inv) return 0;
      const sum = st.payments
        .filter(function (p) { return p.invoiceId === invoiceId && p.status === 'confirmed'; })
        .reduce(function (acc, p) { return acc + Number(p.allocatedAmount || p.amount || 0); }, 0);
      inv.paidAmount = Math.min(inv.total, Math.max(0, Math.round(sum)));
      inv.updatedAt = new Date().toISOString();
      return inv.paidAmount;
    },

    listInvoices: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.invoices.slice();

      if (!f.includeArchived && f.status !== 'archived' && f.status !== 'all_with_archived') {
        if (!f.status || f.status === 'all') {
          list = list.filter(function (inv) { return !inv.archived; });
        }
      }

      if (f.customerId && f.customerId !== 'all') {
        list = list.filter(function (inv) { return inv.customerId === f.customerId; });
      }

      if (f.status && f.status !== 'all' && f.status !== 'all_with_archived') {
        list = list.filter(function (inv) {
          const eff = IP.Calc ? IP.Calc.effectiveStatus(inv) : 'sent';
          return eff === f.status;
        });
      }

      if (f.due === '7d') {
        list = list.filter(function (inv) {
          const eff = IP.Calc ? IP.Calc.effectiveStatus(inv) : 'sent';
          if (['paid', 'voided', 'archived', 'draft'].includes(eff)) return false;
          const d = IP.Calc ? IP.Calc.daysUntilDue(inv) : 99;
          return d >= 0 && d <= 7;
        });
      }

      if (f.period && f.period !== 'all') {
        const today = IP.Seed.todayISO();
        let minDate = null;
        if (f.period === 'month' || f.period === '30d') minDate = IP.Seed.addDays(-30, today);
        if (f.period === 'quarter' || f.period === '90d') minDate = IP.Seed.addDays(-90, today);
        if (f.period === 'year') minDate = IP.Seed.addDays(-365, today);
        if (minDate) {
          list = list.filter(function (inv) { return inv.issueDate >= minDate; });
        }
      }

      if (f.q) {
        const q = String(f.q).trim().toLowerCase();
        list = list.filter(function (inv) {
          const cus = st.customers.find(function (c) { return c.id === inv.customerId; });
          const cusName = cus ? cus.name.toLowerCase() : '';
          const cusCode = cus ? cus.code.toLowerCase() : '';
          return (inv.number && inv.number.toLowerCase().includes(q)) ||
            (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
            cusName.includes(q) ||
            cusCode.includes(q);
        });
      }

      return list;
    },

    getInvoice: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.invoices.find(function (x) { return x.id === id || x.number === id; }) || null;
    },

    createInvoice: function (data) {
      const st = DB._rawState();
      const d = data || {};
      const cus = st.customers.find(function (c) { return c.id === d.customerId; });
      if (!cus) {
        return DB.err('VALIDATION', 'Vui lòng chọn khách hàng hợp lệ cho hóa đơn.', 'customerId');
      }
      if (cus.status === 'archived') {
        return DB.err('VALIDATION', 'Khách hàng này đã lưu trữ, không thể phát hành hóa đơn mới.', 'customerId');
      }

      const number = String(d.number || formatInvoiceNumber(st.settings.invoiceDefaults)).trim();
      if (!number) {
        return DB.err('VALIDATION', 'Số hóa đơn không được để trống.', 'number');
      }
      const dup = st.invoices.some(function (inv) {
        return inv.number.trim().toLowerCase() === number.toLowerCase();
      });
      if (dup) {
        return DB.err('DUPLICATE_NUMBER', 'Số hóa đơn "' + number.toUpperCase() + '" đã tồn tại trong hệ thống.', 'number');
      }

      const issueDate = String(d.issueDate || IP.Seed.todayISO()).slice(0, 10);
      const dueDate = String(d.dueDate || IP.Seed.addDays(st.settings.invoiceDefaults.defaultTermDays || 30, issueDate)).slice(0, 10);
      if (dueDate < issueDate) {
        return DB.err('VALIDATION', 'Hạn thanh toán không được nhỏ hơn ngày phát hành hóa đơn.', 'dueDate');
      }

      const itemCheck = sanitizeAndComputeItems(d.items);
      if (!itemCheck.ok) return itemCheck;
      if (itemCheck.total <= 0) {
        return DB.err('VALIDATION', 'Tổng giá trị thanh toán của hóa đơn phải lớn hơn 0 ₫.', 'items');
      }

      const sendNow = Boolean(d.sendNow || d.status === 'sent');
      const nowIso = new Date().toISOString();
      const inv = {
        id: IP.Utils.uid('inv'),
        number: number.toUpperCase(),
        customerId: cus.id,
        issueDate: issueDate,
        dueDate: dueDate,
        paymentTermDays: Number(d.paymentTermDays || cus.paymentTermDays || st.settings.invoiceDefaults.defaultTermDays || 30),
        poNumber: String(d.poNumber || '').trim(),
        items: itemCheck.items,
        subtotal: itemCheck.subtotal,
        discountTotal: itemCheck.discountTotal,
        vatTotal: itemCheck.vatTotal,
        total: itemCheck.total,
        paidAmount: 0,
        sentAt: sendNow ? nowIso : null,
        archived: false,
        voided: false,
        voidReason: '',
        notes: String(d.notes !== undefined ? d.notes : (st.settings.invoiceDefaults.defaultTerms || '')).trim(),
        internalNote: String(d.internalNote || '').trim(),
        followUp: {
          assignedTo: cus.ownerId || 'usr_sal',
          status: 'watching',
          notes: []
        },
        createdBy: DB.currentActorId(),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      st.invoices.unshift(inv);
      st.settings.invoiceDefaults.nextNumber = Number(st.settings.invoiceDefaults.nextNumber || 53) + 1;

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: sendNow ? 'send' : 'draft',
          message: (sendNow ? 'Đã phát hành & gửi hóa đơn ' : 'Đã lưu hóa đơn nháp ') + inv.number + ' cho ' + cus.name + ' (' + IP.Fmt.currency(inv.total) + ').'
        });
      }
      if (sendNow && DB.addNotification) {
        DB.addNotification({
          role: 'all',
          type: 'invoice',
          title: 'Hóa đơn mới phát hành: ' + inv.number,
          message: cus.name + ' · Giá trị ' + IP.Fmt.currency(inv.total) + ' · Hạn ' + IP.Fmt.date(inv.dueDate),
          targetRouteKey: 'invoice.view',
          targetParams: { id: inv.id }
        });
      }

      DB._commit();
      return DB.ok(inv);
    },

    updateInvoice: function (id, patch) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === id; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn cần cập nhật.');
      if (inv.voided) return DB.err('INVOICE_VOIDED', 'Hóa đơn đã hủy không thể chỉnh sửa.');

      const p = patch || {};
      if (p.number !== undefined) {
        const cleanNum = String(p.number).trim();
        if (!cleanNum) return DB.err('VALIDATION', 'Số hóa đơn không được để trống.', 'number');
        const isDup = st.invoices.some(function (other) {
          return other.id !== id && other.number.trim().toLowerCase() === cleanNum.toLowerCase();
        });
        if (isDup) return DB.err('DUPLICATE_NUMBER', 'Số hóa đơn "' + cleanNum.toUpperCase() + '" đã tồn tại.', 'number');
        inv.number = cleanNum.toUpperCase();
      }

      if (p.customerId !== undefined && p.customerId !== inv.customerId) {
        if (inv.paidAmount > 0) {
          return DB.err('INVOICE_HAS_PAYMENTS', 'Không thể đổi khách hàng khi hóa đơn đã có giao dịch thanh toán.', 'customerId');
        }
        const cus = st.customers.find(function (c) { return c.id === p.customerId; });
        if (!cus || cus.status === 'archived') {
          return DB.err('VALIDATION', 'Khách hàng được chọn không hợp lệ hoặc đã lưu trữ.', 'customerId');
        }
        inv.customerId = cus.id;
      }

      const nextIssue = p.issueDate !== undefined ? String(p.issueDate).slice(0, 10) : inv.issueDate;
      const nextDue = p.dueDate !== undefined ? String(p.dueDate).slice(0, 10) : inv.dueDate;
      if (nextDue < nextIssue) {
        return DB.err('VALIDATION', 'Hạn thanh toán không được trước ngày phát hành hóa đơn.', 'dueDate');
      }

      if (p.items !== undefined) {
        const itemCheck = sanitizeAndComputeItems(p.items);
        if (!itemCheck.ok) return itemCheck;
        if (itemCheck.total < inv.paidAmount) {
          return DB.err(
            'INVOICE_HAS_PAYMENTS',
            'Không thể giảm tổng tiền hóa đơn (' + IP.Fmt.currency(itemCheck.total) + ') xuống thấp hơn số tiền đã thu (' + IP.Fmt.currency(inv.paidAmount) + ').',
            'items'
          );
        }
        inv.items = itemCheck.items;
        inv.subtotal = itemCheck.subtotal;
        inv.discountTotal = itemCheck.discountTotal;
        inv.vatTotal = itemCheck.vatTotal;
        inv.total = itemCheck.total;
      }

      inv.issueDate = nextIssue;
      inv.dueDate = nextDue;
      if (p.poNumber !== undefined) inv.poNumber = String(p.poNumber).trim();
      if (p.notes !== undefined) inv.notes = String(p.notes).trim();
      if (p.internalNote !== undefined) inv.internalNote = String(p.internalNote).trim();
      if (p.sendNow && !inv.sentAt) {
        inv.sentAt = new Date().toISOString();
      }
      inv.updatedAt = new Date().toISOString();

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'update',
          message: p.dueChangeReason
            ? ('Đã cập nhật hạn thanh toán hóa đơn ' + inv.number + ' thành ' + IP.Fmt.date(inv.dueDate) + '. Lý do: ' + p.dueChangeReason)
            : ('Đã cập nhật thông tin hóa đơn ' + inv.number + '.')
        });
      }
      DB._commit();
      return DB.ok(inv);
    },

    markInvoiceSent: function (id) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === id; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      inv.sentAt = inv.sentAt || new Date().toISOString();
      inv.updatedAt = new Date().toISOString();
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'send',
          message: 'Đã chuyển hóa đơn ' + inv.number + ' sang trạng thái Đã gửi.'
        });
      }
      DB._commit();
      return DB.ok(inv);
    },

    duplicateInvoice: function (id) {
      const st = DB._rawState();
      const src = st.invoices.find(function (x) { return x.id === id; });
      if (!src) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn gốc để nhân bản.');
      const today = IP.Seed.todayISO();
      const due = IP.Seed.addDays(src.paymentTermDays || 30, today);
      return DB.createInvoice({
        customerId: src.customerId,
        issueDate: today,
        dueDate: due,
        paymentTermDays: src.paymentTermDays,
        poNumber: src.poNumber ? (src.poNumber + '-COPY') : '',
        items: IP.Utils.clone(src.items),
        notes: src.notes,
        internalNote: 'Nhân bản từ hóa đơn ' + src.number,
        sendNow: false
      });
    },

    archiveInvoice: function (id) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === id; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      const hasPayments = st.payments.some(function (p) { return p.invoiceId === id && p.status === 'confirmed'; });
      if (inv.paidAmount > 0 || hasPayments) {
        return DB.err('INVOICE_HAS_PAYMENTS', 'Không thể lưu trữ hóa đơn "' + inv.number + '" vì đã phát sinh giao dịch thanh toán được xác nhận.');
      }
      inv.archived = true;
      inv.updatedAt = new Date().toISOString();
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'archive',
          message: 'Đã lưu trữ hóa đơn ' + inv.number + '.'
        });
      }
      DB._commit();
      return DB.ok(inv);
    },

    voidInvoice: function (id, reason) {
      const st = DB._rawState();
      const inv = st.invoices.find(function (x) { return x.id === id; });
      if (!inv) return DB.err('NOT_FOUND', 'Không tìm thấy hóa đơn.');
      if (inv.paidAmount > 0) {
        return DB.err('INVOICE_HAS_PAYMENTS', 'Không thể hủy hóa đơn "' + inv.number + '" vì đã thu tiền (' + IP.Fmt.currency(inv.paidAmount) + ').');
      }
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) {
        return DB.err('VALIDATION', 'Vui lòng nhập lý do hủy hóa đơn.', 'reason');
      }
      inv.voided = true;
      inv.voidReason = cleanReason;
      inv.updatedAt = new Date().toISOString();
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'invoice',
          entityId: inv.id,
          type: 'void',
          message: 'Đã hủy hóa đơn ' + inv.number + '. Lý do: ' + cleanReason
        });
      }
      DB._commit();
      return DB.ok(inv);
    }
  });
})(window);
