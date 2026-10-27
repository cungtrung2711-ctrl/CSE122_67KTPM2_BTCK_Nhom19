/**
 * @owner CORE
 * @spec §3.3, §3.6, §10.2 Seed Registry & Date Relative Helpers
 */
(function (window) {
  'use strict';

  const IP = (window.IP = window.IP || {});
  IP.CORE_VERSION = '1.0.0';
  IP.Acc = IP.Acc || {};
  IP.Sal = IP.Sal || {};
  IP.Mgr = IP.Mgr || {};
  IP.Adm = IP.Adm || {};

  const _seeders = [];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function addDays(offsetDays, baseDateStr) {
    const base = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
    base.setHours(12, 0, 0, 0);
    base.setDate(base.getDate() + Number(offsetDays || 0));
    return toISODate(base);
  }

  function addHoursISO(offsetHours) {
    const d = new Date();
    d.setTime(d.getTime() + Number(offsetHours || 0) * 3600 * 1000);
    return d.toISOString();
  }

  IP.Seed = {
    todayISO: function () {
      return addDays(0);
    },
    addDays: addDays,
    addHoursISO: addHoursISO,
    register: function (name, def) {
      if (!name || !def || typeof def.run !== 'function') {
        throw new Error('[IP.Seed] Đăng ký seed không hợp lệ: ' + name);
      }
      if (_seeders.some(function (s) { return s.name === name; })) {
        throw new Error('[IP.Seed] Trùng tên seed: ' + name);
      }
      _seeders.push({
        name: name,
        order: Number(def.order || 100),
        run: def.run
      });
      _seeders.sort(function (a, b) { return a.order - b.order; });
    },
    buildInitialState: function () {
      const state = {
        meta: {
          version: '1.0.0',
          seededAt: new Date().toISOString(),
          todayRef: addDays(0)
        },
        settings: {},
        users: [],
        customers: [],
        invoices: [],
        payments: [],
        reminders: [],
        notifications: [],
        aiReports: [],
        activities: []
      };
      const helpers = {
        today: addDays(0),
        addDays: addDays,
        addHoursISO: addHoursISO
      };
      for (let i = 0; i < _seeders.length; i++) {
        _seeders[i].run(state, helpers);
      }
      return state;
    },
    listRegistered: function () {
      return _seeders.map(function (s) { return s.name; });
    }
  };
})(window);
