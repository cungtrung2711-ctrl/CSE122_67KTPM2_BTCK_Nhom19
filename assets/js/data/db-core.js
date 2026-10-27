/**
 * @owner CORE
 * @spec §3.3, §4.2, §10.4 Core Database Layer & Self-Test
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});
  const STORAGE_KEY = 'invoicepilot.db.v2';

  let _state = null;
  let _recoveredFromCorrupt = false;
  const _subscribers = [];
  const _extensions = {};

  function loadFromStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.invoices) || !Array.isArray(parsed.customers)) {
        _recoveredFromCorrupt = true;
        return null;
      }
      return parsed;
    } catch (e) {
      _recoveredFromCorrupt = true;
      return null;
    }
  }

  function persistState() {
    if (!_state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {}
    notifySubscribers();
  }

  function notifySubscribers() {
    for (let i = 0; i < _subscribers.length; i++) {
      try {
        _subscribers[i](_state);
      } catch (e) {}
    }
  }

  function ensureInit() {
    if (_state) return _state;
    const loaded = loadFromStorage();
    if (loaded) {
      _state = loaded;
    } else {
      _state = IP.Seed.buildInitialState();
      persistState();
    }
    return _state;
  }

  window.addEventListener('storage', function (ev) {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && Array.isArray(parsed.invoices)) {
          _state = parsed;
          notifySubscribers();
        }
      } catch (e) {}
    }
  });

  function ok(data) {
    return { ok: true, data: data };
  }

  function err(code, message, field) {
    return {
      ok: false,
      error: {
        code: code || 'VALIDATION',
        message: message || 'Dữ liệu không hợp lệ.',
        field: field || null
      }
    };
  }

  function currentActorId() {
    if (IP.Auth && typeof IP.Auth.getSession === 'function') {
      const s = IP.Auth.getSession();
      if (s && s.userId) return s.userId;
    }
    return 'usr_adm';
  }

  const DB = {
    STORAGE_KEY: STORAGE_KEY,
    ok: ok,
    err: err,
    currentActorId: currentActorId,

    init: function () {
      const st = ensureInit();
      if (_recoveredFromCorrupt && IP.UI && typeof IP.UI.toast === 'function') {
        _recoveredFromCorrupt = false;
        setTimeout(function () {
          IP.UI.toast({
            title: 'Đã khôi phục bộ dữ liệu chuẩn',
            message: 'Dữ liệu cục bộ trước đó không hợp lệ nên hệ thống đã khởi tạo lại bộ dữ liệu chuẩn an toàn.',
            type: 'warning'
          });
        }, 400);
      }
      return st;
    },

    getState: function () {
      return ensureInit();
    },

    _rawState: function () {
      return ensureInit();
    },

    _commit: function () {
      persistState();
    },

    reset: function () {
      _state = IP.Seed.buildInitialState();
      persistState();
      return ok(_state);
    },

    exportJSON: function () {
      const st = ensureInit();
      return JSON.stringify(st, null, 2);
    },

    subscribe: function (cb) {
      if (typeof cb === 'function') {
        _subscribers.push(cb);
      }
      return function unsubscribe() {
        const idx = _subscribers.indexOf(cb);
        if (idx >= 0) _subscribers.splice(idx, 1);
      };
    },

    extend: function (namespace, apiObj) {
      if (!namespace || !apiObj || typeof apiObj !== 'object') {
        throw new Error('[IP.DB.extend] Tham số mở rộng không hợp lệ.');
      }
      if (_extensions[namespace]) {
        throw new Error('[IP.DB.extend] Đã đăng ký namespace miền: ' + namespace);
      }
      Object.keys(apiObj).forEach(function (methodName) {
        if (DB[methodName] !== undefined) {
          throw new Error('[IP.DB.extend] Trùng tên hàm trên IP.DB: ' + methodName);
        }
        DB[methodName] = apiObj[methodName];
      });
      _extensions[namespace] = Object.keys(apiObj);
    },

    listExtensions: function () {
      return Object.assign({}, _extensions);
    },

    selfTest: function () {
      ensureInit();
      const snapshot = JSON.stringify(_state);
      const results = [];

      function check(name, cond, detail) {
        results.push({ name: name, passed: Boolean(cond), detail: detail || '' });
      }

      try {
        check('seed_scale', _state.customers.length >= 18 && _state.invoices.length >= 48 && _state.users.length >= 8,
          'KH=' + _state.customers.length + ', HĐ=' + _state.invoices.length + ', Users=' + _state.users.length);

        const dupRes = DB.createInvoice({
          number: '  ip-2026-0001 ',
          customerId: 'cus_01',
          issueDate: IP.Seed.todayISO(),
          dueDate: IP.Seed.addDays(15),
          items: [{ description: 'Kiểm thử', quantity: 1, unit: 'Gói', unitPrice: 1000000, discountPercent: 0, vatRate: 10 }]
        });
        check('duplicate_invoice_blocked', !dupRes.ok && dupRes.error.code === 'DUPLICATE_NUMBER', dupRes.error ? dupRes.error.code : '');

        const openInv = _state.invoices.find(function (i) { return !i.voided && !i.archived && i.total > i.paidAmount && i.sentAt; });
        const overPay = DB.addPayment({
          invoiceId: openInv.id,
          amount: openInv.total * 3,
          method: 'transfer',
          paidAt: IP.Seed.todayISO()
        });
        check('payment_exceeds_remaining_blocked', !overPay.ok && overPay.error.code === 'PAYMENT_EXCEEDS_REMAINING', overPay.error ? overPay.error.code : '');

        const archCus = DB.archiveCustomer('cus_01');
        check('archive_customer_with_balance_blocked', !archCus.ok && archCus.error.code === 'CUSTOMER_HAS_BALANCE', archCus.error ? archCus.error.code : '');

        const lockAdmin = DB.setUserStatus('usr_adm', 'disabled', 'Kiểm thử bảo vệ Admin cuối cùng');
        check('last_admin_protected', !lockAdmin.ok, lockAdmin.error ? lockAdmin.error.code : '');
      } finally {
        _state = JSON.parse(snapshot);
        persistState();
      }

      const allPassed = results.every(function (r) { return r.passed; });
      return { ok: allPassed, results: results };
    }
  };

  IP.DB = DB;
})(window);
