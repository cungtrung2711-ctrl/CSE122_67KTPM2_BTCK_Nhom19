/**
 * @owner SV2
 * @spec §7.5, §10.1, §10.4 Notifications & Activity Timeline Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  function notificationOwnerRole(n) {
    const route = String(n.targetRouteKey || '');
    const title = String(n.title || '').toLowerCase();
    if (route.indexOf('reconciliation') >= 0) return 'accountant';
    if (route.indexOf('sales.') === 0 || n.type === 'reminder') return 'sales';
    if (route.indexOf('manager.') === 0 || /quá hạn|rủi ro|dòng tiền|điều hành/.test(title)) return 'manager';
    if (route.indexOf('admin.') === 0 || n.type === 'system') return 'admin';
    if (n.type === 'payment') return 'accountant';
    if (/sắp đến hạn|khách hàng|phát hành/.test(title)) return 'sales';
    return 'accountant';
  }

  function notificationBelongsToRole(n, role) {
    return n.role === role || (n.role === 'all' && notificationOwnerRole(n) === role);
  }

  DB.extend('notifications', {
    listNotifications: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.notifications.slice();

      if (f.role && f.role !== 'all') {
        list = list.filter(function (n) { return notificationBelongsToRole(n, f.role); });
      }

      if (f.type && f.type !== 'all' && f.type !== 'unread') {
        list = list.filter(function (n) { return n.type === f.type; });
      }
      if (f.type === 'unread' || f.unreadOnly) {
        list = list.filter(function (n) { return !n.read; });
      }
      if (f.readState === 'read') {
        list = list.filter(function (n) { return Boolean(n.read); });
      } else if (f.readState === 'unread') {
        list = list.filter(function (n) { return !n.read; });
      }
      return list;
    },

    addNotification: function (ntf) {
      const st = DB._rawState();
      const n = ntf || {};
      const type = ['invoice', 'payment', 'reminder', 'system'].includes(n.type) ? n.type : 'system';
      const baseTitle = String(n.title || 'Thông báo hệ thống').trim();
      const baseMessage = String(n.message || '').trim();
      const baseRoute = n.targetRouteKey || 'invoice.list';
      const baseParams = n.targetParams || {};
      let targets = [];

      if (!n.role || n.role === 'all') {
        if (type === 'invoice') {
          targets = [
            { role: 'accountant', prefix: 'Kế toán · ', suffix: 'Việc cần làm: kiểm tra thông tin hóa đơn, hạn thanh toán và số dư còn lại.', route: baseRoute, params: baseParams },
            { role: 'sales', prefix: 'Kinh doanh · ', suffix: 'Việc cần làm: theo dõi khách hàng, cập nhật cam kết thanh toán và lịch chăm sóc.', route: 'sales.balance', params: {} },
            { role: 'manager', prefix: 'Quản lý · ', suffix: 'Góc nhìn quản trị: xem tác động đến tổng phải thu, tuổi nợ và kế hoạch dòng tiền.', route: 'manager.dashboard', params: {} }
          ];
        } else if (type === 'payment') {
          targets = [
            { role: 'accountant', prefix: 'Kế toán · ', suffix: 'Việc cần làm: kiểm tra chứng từ và đối chiếu số tiền trước khi chốt sổ.', route: 'reconciliation', params: {} },
            { role: 'sales', prefix: 'Kinh doanh · ', suffix: 'Việc cần làm: cập nhật trạng thái thu tiền và trao đổi với khách hàng nếu còn chênh lệch.', route: 'sales.balance', params: {} },
            { role: 'manager', prefix: 'Quản lý · ', suffix: 'Góc nhìn quản trị: cập nhật tiến độ thu hồi và theo dõi biến động công nợ.', route: 'manager.dashboard', params: {} }
          ];
        } else if (type === 'reminder') {
          targets = [
            { role: 'sales', prefix: 'Kinh doanh · ', suffix: 'Việc cần làm: theo dõi kết quả gửi, lịch nhắc tiếp theo và phản hồi của khách hàng.', route: 'sales.reminders', params: baseParams },
            { role: 'manager', prefix: 'Quản lý · ', suffix: 'Góc nhìn quản trị: theo dõi các khoản cần can thiệp và trường hợp nhắc thu hồi chưa thành công.', route: 'manager.overdue', params: {} }
          ];
        } else {
          const managerEvent = String(baseRoute).indexOf('manager.') === 0;
          const owner = managerEvent ? 'manager' : 'admin';
          targets = [{ role: owner, prefix: (managerEvent ? 'Quản lý · ' : 'Quản trị · '), suffix: managerEvent ? 'Thông tin phục vụ theo dõi rủi ro và quyết định điều hành.' : 'Việc cần làm: kiểm tra tài khoản, phân quyền và cấu hình hệ thống liên quan.', route: baseRoute, params: baseParams }];
        }
      } else {
        targets = [{ role: n.role, prefix: '', suffix: '', route: baseRoute, params: baseParams }];
      }

      const created = targets.map(function (target) {
        const record = {
          id: IP.Utils.uid('ntf'),
          role: target.role,
          type: type,
          title: target.prefix + baseTitle,
          message: [baseMessage, target.suffix].filter(Boolean).join(' '),
          link: n.link || null,
          targetRouteKey: target.route || baseRoute,
          targetParams: target.params || baseParams,
          read: false,
          createdAt: new Date().toISOString()
        };
        st.notifications.unshift(record);
        return record;
      });
      DB._commit();
      return DB.ok(created[0]);
    },

    markNotificationRead: function (id) {
      const st = DB._rawState();
      const n = st.notifications.find(function (x) { return x.id === id; });
      if (!n) return DB.err('NOT_FOUND', 'Không tìm thấy thông báo.');
      n.read = true;
      DB._commit();
      return DB.ok(n);
    },

    markAllRead: function (role) {
      const st = DB._rawState();
      let count = 0;
      st.notifications.forEach(function (n) {
        const belongs = !role || notificationBelongsToRole(n, role);
        if (belongs && !n.read) { n.read = true; count += 1; }
      });
      DB._commit();
      return DB.ok({ count: count });
    },

    deleteReadNotifications: function (role) {
      const st = DB._rawState();
      const before = st.notifications.length;
      st.notifications = st.notifications.filter(function (n) {
        return n.read && (!role || notificationBelongsToRole(n, role)) ? false : true;
      });
      const removed = before - st.notifications.length;
      DB._commit();
      return DB.ok({ removed: removed });
    },

    addActivity: function (act) {
      const st = DB._rawState();
      const a = act || {};
      const record = {
        id: IP.Utils.uid('act'),
        entityType: a.entityType || 'invoice',
        entityId: a.entityId || '',
        type: a.type || 'info',
        message: String(a.message || '').trim(),
        actorId: a.actorId || DB.currentActorId(),
        at: new Date().toISOString()
      };
      st.activities.unshift(record);
      return record;
    },

    listActivities: function (entityType, entityId) {
      const st = DB._rawState();
      let list = st.activities.slice();
      if (entityType) {
        list = list.filter(function (a) { return a.entityType === entityType; });
      }
      if (entityId) {
        list = list.filter(function (a) { return a.entityId === entityId; });
      }
      return list;
    }
  });
})(window);
