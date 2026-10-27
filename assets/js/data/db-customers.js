/**
 * @owner SV4
 * @spec §8.4, §10.3, §10.4 Customer Domain Data API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  function computeCustomerOutstanding(state, customerId) {
    return state.invoices
      .filter(function (inv) {
        return inv.customerId === customerId && !inv.voided && !inv.archived && inv.sentAt;
      })
      .reduce(function (sum, inv) {
        return sum + Math.max(0, Number(inv.total || 0) - Number(inv.paidAmount || 0));
      }, 0);
  }

  DB.extend('customers', {
    listCustomers: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.customers.slice();

      if (!f.includeArchived && (!f.status || f.status === 'active')) {
        if (f.status === 'active') {
          list = list.filter(function (c) { return c.status === 'active'; });
        } else if (!f.status) {
          list = list.filter(function (c) { return c.status !== 'archived'; });
        }
      } else if (f.status && f.status !== 'all') {
        list = list.filter(function (c) { return c.status === f.status; });
      }

      if (f.industry && f.industry !== 'all') {
        list = list.filter(function (c) { return c.industry === f.industry; });
      }
      if (f.ownerId && f.ownerId !== 'all') {
        list = list.filter(function (c) { return c.ownerId === f.ownerId; });
      }
      if (f.q) {
        const q = String(f.q).trim().toLowerCase();
        list = list.filter(function (c) {
          return (c.name && c.name.toLowerCase().includes(q)) ||
            (c.code && c.code.toLowerCase().includes(q)) ||
            (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
            (c.contactName && c.contactName.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q));
        });
      }
      return list;
    },

    getCustomer: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.customers.find(function (c) { return c.id === id; }) || null;
    },

    createCustomer: function (data) {
      const st = DB._rawState();
      const d = data || {};
      const name = String(d.name || '').trim();
      const contactName = String(d.contactName || '').trim();
      const email = String(d.email || '').trim();
      const phone = String(d.phone || '').trim();
      const taxCode = String(d.taxCode || '').trim();
      const ownerId = String(d.ownerId || 'usr_sal').trim();

      if (!name) return DB.err('VALIDATION', 'Vui lòng nhập tên doanh nghiệp khách hàng.', 'name');
      if (!contactName) return DB.err('VALIDATION', 'Vui lòng nhập họ tên người liên hệ.', 'contactName');
      if (!email || !IP.Utils.isValidEmail(email)) {
        return DB.err('VALIDATION', 'Email liên hệ không đúng định dạng.', 'email');
      }
      if (phone && !IP.Utils.isValidPhone(phone)) {
        return DB.err('VALIDATION', 'Số điện thoại không đúng định dạng Việt Nam (10–11 số).', 'phone');
      }
      if (taxCode && !IP.Utils.isValidTaxCode(taxCode)) {
        return DB.err('VALIDATION', 'Mã số thuế phải gồm 10 hoặc 13 chữ số.', 'taxCode');
      }

      const nextIdx = st.customers.length + 1;
      const code = String(d.code || ('KH-' + String(nextIdx).padStart(3, '0'))).trim().toUpperCase();

      if (st.customers.some(function (c) { return c.code.toLowerCase() === code.toLowerCase(); })) {
        return DB.err('DUPLICATE_CODE', 'Mã khách hàng "' + code + '" đã tồn tại trong hệ thống.', 'code');
      }
      if (taxCode && st.customers.some(function (c) { return c.taxCode && c.taxCode === taxCode; })) {
        return DB.err('DUPLICATE_CODE', 'Mã số thuế "' + taxCode + '" đã được đăng ký cho khách hàng khác.', 'taxCode');
      }
      if (st.customers.some(function (c) { return c.email && c.email.toLowerCase() === email.toLowerCase(); })) {
        return DB.err('DUPLICATE_CODE', 'Địa chỉ email "' + email + '" đã tồn tại.', 'email');
      }

      const termDays = Number(d.paymentTermDays !== undefined ? d.paymentTermDays : 30);
      if (isNaN(termDays) || termDays < 0 || termDays > 90) {
        return DB.err('VALIDATION', 'Số ngày hạn thanh toán mặc định phải từ 0 đến 90 ngày.', 'paymentTermDays');
      }
      const creditLimit = Number(d.creditLimit !== undefined ? d.creditLimit : 100000000);
      if (isNaN(creditLimit) || creditLimit < 0) {
        return DB.err('VALIDATION', 'Hạn mức tín dụng phải lớn hơn hoặc bằng 0 ₫.', 'creditLimit');
      }

      const record = {
        id: 'cus_' + String(nextIdx).padStart(2, '0') + '_' + Math.random().toString(36).slice(2, 5),
        code: code,
        name: name,
        taxCode: taxCode,
        industry: d.industry || 'Thương mại',
        contactName: contactName,
        email: email,
        phone: phone || '0901234567',
        address: String(d.address || '').trim(),
        paymentTermDays: Math.round(termDays),
        creditLimit: Math.round(creditLimit),
        ownerId: ownerId,
        status: 'active',
        latePaymentCount: 0,
        notes: String(d.notes || '').trim(),
        createdAt: IP.Seed.todayISO(),
        updatedAt: new Date().toISOString()
      };

      st.customers.unshift(record);
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'customer',
          entityId: record.id,
          type: 'create',
          message: 'Đã thêm khách hàng mới: ' + record.name + ' (' + record.code + ').'
        });
      }
      DB._commit();
      return DB.ok(record);
    },

    updateCustomer: function (id, patch) {
      const st = DB._rawState();
      const idx = st.customers.findIndex(function (c) { return c.id === id; });
      if (idx < 0) return DB.err('NOT_FOUND', 'Không tìm thấy khách hàng cần cập nhật.');
      const cur = st.customers[idx];
      const p = patch || {};

      const name = p.name !== undefined ? String(p.name).trim() : cur.name;
      const contactName = p.contactName !== undefined ? String(p.contactName).trim() : cur.contactName;
      const email = p.email !== undefined ? String(p.email).trim() : cur.email;
      const phone = p.phone !== undefined ? String(p.phone).trim() : cur.phone;
      const taxCode = p.taxCode !== undefined ? String(p.taxCode).trim() : cur.taxCode;
      const code = p.code !== undefined ? String(p.code).trim().toUpperCase() : cur.code;

      if (!name) return DB.err('VALIDATION', 'Tên doanh nghiệp không được để trống.', 'name');
      if (!contactName) return DB.err('VALIDATION', 'Người liên hệ không được để trống.', 'contactName');
      if (!email || !IP.Utils.isValidEmail(email)) return DB.err('VALIDATION', 'Email không đúng định dạng.', 'email');
      if (phone && !IP.Utils.isValidPhone(phone)) return DB.err('VALIDATION', 'Số điện thoại không hợp lệ.', 'phone');
      if (taxCode && !IP.Utils.isValidTaxCode(taxCode)) return DB.err('VALIDATION', 'Mã số thuế phải gồm 10 hoặc 13 chữ số.', 'taxCode');

      if (st.customers.some(function (c) { return c.id !== id && c.code.toLowerCase() === code.toLowerCase(); })) {
        return DB.err('DUPLICATE_CODE', 'Mã khách hàng "' + code + '" đã được sử dụng.', 'code');
      }
      if (taxCode && st.customers.some(function (c) { return c.id !== id && c.taxCode === taxCode; })) {
        return DB.err('DUPLICATE_CODE', 'Mã số thuế "' + taxCode + '" đã tồn tại.', 'taxCode');
      }
      if (st.customers.some(function (c) { return c.id !== id && c.email.toLowerCase() === email.toLowerCase(); })) {
        return DB.err('DUPLICATE_CODE', 'Email "' + email + '" đã tồn tại.', 'email');
      }

      const termDays = p.paymentTermDays !== undefined ? Number(p.paymentTermDays) : cur.paymentTermDays;
      if (isNaN(termDays) || termDays < 0 || termDays > 90) {
        return DB.err('VALIDATION', 'Số ngày hạn thanh toán phải từ 0 đến 90 ngày.', 'paymentTermDays');
      }
      const creditLimit = p.creditLimit !== undefined ? Number(p.creditLimit) : cur.creditLimit;
      if (isNaN(creditLimit) || creditLimit < 0) {
        return DB.err('VALIDATION', 'Hạn mức tín dụng không hợp lệ.', 'creditLimit');
      }

      Object.assign(cur, p, {
        name: name,
        code: code,
        contactName: contactName,
        email: email,
        phone: phone,
        taxCode: taxCode,
        paymentTermDays: Math.round(termDays),
        creditLimit: Math.round(creditLimit),
        updatedAt: new Date().toISOString()
      });

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'customer',
          entityId: cur.id,
          type: 'update',
          message: 'Đã cập nhật thông tin khách hàng ' + cur.name + '.'
        });
      }
      DB._commit();
      return DB.ok(cur);
    },

    archiveCustomer: function (id) {
      const st = DB._rawState();
      const cus = st.customers.find(function (c) { return c.id === id; });
      if (!cus) return DB.err('NOT_FOUND', 'Không tìm thấy khách hàng.');

      const outstanding = computeCustomerOutstanding(st, id);
      if (outstanding > 0) {
        return DB.err(
          'CUSTOMER_HAS_BALANCE',
          'Không thể lưu trữ khách hàng "' + cus.name + '" vì đang còn dư nợ chưa thu ' + IP.Fmt.currency(outstanding) + '. Vui lòng tất toán các hóa đơn mở trước.'
        );
      }

      cus.status = 'archived';
      cus.updatedAt = new Date().toISOString();
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'customer',
          entityId: cus.id,
          type: 'archive',
          message: 'Đã lưu trữ khách hàng ' + cus.name + ' (' + cus.code + ').'
        });
      }
      DB._commit();
      return DB.ok(cus);
    },

    unarchiveCustomer: function (id) {
      const st = DB._rawState();
      const cus = st.customers.find(function (c) { return c.id === id; });
      if (!cus) return DB.err('NOT_FOUND', 'Không tìm thấy khách hàng.');
      cus.status = 'active';
      cus.updatedAt = new Date().toISOString();
      DB._commit();
      return DB.ok(cus);
    }
  });
})(window);
