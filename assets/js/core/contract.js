/**
 * @owner CORE
 * @spec §3.3, §5.1 Page Registry & Contract Verification (IP.Pages, IP.Contract)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  const _pages = {};

  IP.Pages = {
    register: function (pageId, def) {
      if (!pageId || !def || typeof def.init !== 'function') {
        throw new Error('[IP.Pages] Đăng ký trang không hợp lệ: ' + pageId);
      }
      if (_pages[pageId]) {
        throw new Error('[IP.Pages] Trang đã được đăng ký: ' + pageId);
      }
      _pages[pageId] = {
        pageId: pageId,
        roles: def.roles || ['public'],
        init: def.init
      };
    },
    get: function (pageId) {
      return _pages[pageId] || null;
    },
    list: function () {
      return Object.keys(_pages);
    }
  };

  IP.Contract = {
    check: function () {
      const checks = [];
      function assert(name, ok, detail) {
        checks.push({ name: name, passed: Boolean(ok), detail: detail || '' });
      }

      const requiredDBMethods = [
        'init', 'getState', 'reset', 'exportJSON', 'subscribe', 'selfTest',
        'listCustomers', 'getCustomer', 'createCustomer', 'updateCustomer', 'archiveCustomer',
        'listInvoices', 'getInvoice', 'createInvoice', 'updateInvoice', 'markInvoiceSent', 'archiveInvoice', 'voidInvoice', 'recomputePaid',
        'listPayments', 'addPayment', 'reconcilePayment', 'unreconcilePayment', 'rejectPayment',
        'listReminders', 'createReminder', 'updateReminder', 'sendReminder', 'cancelReminder', 'deleteReminder',
        'assignFollowUp', 'addFollowUpNote', 'closeFollowUp', 'reopenFollowUp',
        'listUsers', 'inviteUser', 'updateUser', 'setUserStatus', 'resetUserPassword',
        'getSettings', 'saveSettings', 'createReminderTemplate', 'updateReminderTemplate', 'deleteReminderTemplate',
        'listNotifications', 'addNotification', 'markNotificationRead', 'markAllRead', 'deleteReadNotifications',
        'addActivity', 'listActivities',
        'saveAIReport', 'listAIReports', 'deleteAIReport'
      ];

      const missingDB = requiredDBMethods.filter(function (m) {
        return !IP.DB || typeof IP.DB[m] !== 'function';
      });
      assert('db_methods_complete', missingDB.length === 0, missingDB.length ? ('Thiếu: ' + missingDB.join(', ')) : 'Đủ ' + requiredDBMethods.length + ' hàm');

      const requiredCalc = ['effectiveStatus', 'remaining', 'computeTotals', 'customerBalance', 'aging', 'dso', 'riskOf', 'reconciliationSuggestions', 'forecastCashflow'];
      const missingCalc = requiredCalc.filter(function (m) {
        return !IP.Calc || typeof IP.Calc[m] !== 'function';
      });
      assert('calc_methods_complete', missingCalc.length === 0, missingCalc.length ? ('Thiếu: ' + missingCalc.join(', ')) : 'Đủ ' + requiredCalc.length + ' hàm');

      assert('routes_ready', Boolean(IP.Routes && typeof IP.Routes.url === 'function'), 'IP.Routes.url');
      assert('auth_ready', Boolean(IP.Auth && typeof IP.Auth.login === 'function' && typeof IP.Auth.switchRole === 'function'), 'IP.Auth');
      assert('ui_ready', Boolean(IP.UI && typeof IP.UI.openPaymentModal === 'function' && typeof IP.UI.downloadCSV === 'function'), 'IP.UI');
      assert('ai_ready', Boolean(IP.AI && typeof IP.AI.mountPanel === 'function'), 'IP.AI');

      const allPassed = checks.every(function (c) { return c.passed; });
      return {
        ok: allPassed,
        coreVersion: IP.CORE_VERSION,
        checks: checks
      };
    }
  };
})(window);
