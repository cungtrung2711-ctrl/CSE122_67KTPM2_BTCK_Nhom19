/**
 * @owner CORE
 * @spec §3.5, §4.3, §5 Route Registry & Cross-Role URL Builder (IP.Routes)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  const ROLE_HOMES = {
    accountant: 'accountant-invoice-list.html',
    sales: 'sales-customer-balance.html',
    manager: 'manager-receivable-dashboard.html',
    admin: 'admin-customer-management.html'
  };

  const ROUTE_MAP = {
    'landing': 'index.html',
    'login': 'login.html',
    'forgot': 'forgot-password.html',
    'profile': 'profile.html',
    'notifications': 'notifications.html',
    '403': '403.html',
    '404': '404.html',
    'invoice.list': 'accountant-invoice-list.html',
    'invoice.form': 'accountant-invoice-form.html',
    'reconciliation': 'accountant-reconciliation.html',
    'sales.balance': 'sales-customer-balance.html',
    'sales.reminders': 'sales-payment-reminders.html',
    'sales.invoice': 'sales-invoice-detail.html',
    'manager.dashboard': 'manager-receivable-dashboard.html',
    'manager.overdue': 'manager-overdue-invoices.html',
    'manager.forecast': 'manager-cashflow-forecast.html',
    'admin.customers': 'admin-customer-management.html',
    'admin.users': 'admin-user-management.html',
    'admin.settings': 'admin-invoice-settings.html'
  };

  const PAGE_META = {
    'landing': { file: 'index.html', title: 'Giới thiệu sản phẩm', roles: ['public'], owner: 'SV4' },
    'login': { file: 'login.html', title: 'Đăng nhập', roles: ['public'], owner: 'SV1' },
    'forgot-password': { file: 'forgot-password.html', title: 'Quên mật khẩu', roles: ['public'], owner: 'SV1' },
    'profile': { file: 'profile.html', title: 'Hồ sơ cá nhân', roles: ['accountant', 'sales', 'manager', 'admin'], owner: 'SV3' },
    'notifications': { file: 'notifications.html', title: 'Trung tâm thông báo', roles: ['accountant', 'sales', 'manager', 'admin'], owner: 'SV2' },
    'error-403': { file: '403.html', title: 'Không có quyền truy cập', roles: ['public'], owner: 'SV2' },
    'error-404': { file: '404.html', title: 'Không tìm thấy trang', roles: ['public'], owner: 'SV2' },
    'accountant-invoice-list': { file: 'accountant-invoice-list.html', title: 'Danh sách hóa đơn', roles: ['accountant'], owner: 'SV1' },
    'accountant-invoice-form': { file: 'accountant-invoice-form.html', title: 'Tạo / Sửa hóa đơn', roles: ['accountant'], owner: 'SV1' },
    'accountant-reconciliation': { file: 'accountant-reconciliation.html', title: 'Đối chiếu thanh toán', roles: ['accountant'], owner: 'SV1' },
    'sales-customer-balance': { file: 'sales-customer-balance.html', title: 'Công nợ khách hàng', roles: ['sales'], owner: 'SV2' },
    'sales-payment-reminders': { file: 'sales-payment-reminders.html', title: 'Nhắc thanh toán', roles: ['sales'], owner: 'SV2' },
    'sales-invoice-detail': { file: 'sales-invoice-detail.html', title: 'Chi tiết hóa đơn', roles: ['sales'], owner: 'SV2' },
    'manager-receivable-dashboard': { file: 'manager-receivable-dashboard.html', title: 'Tổng quan công nợ', roles: ['manager'], owner: 'SV3' },
    'manager-overdue-invoices': { file: 'manager-overdue-invoices.html', title: 'Hóa đơn quá hạn', roles: ['manager'], owner: 'SV3' },
    'manager-cashflow-forecast': { file: 'manager-cashflow-forecast.html', title: 'Dự báo dòng tiền', roles: ['manager'], owner: 'SV3' },
    'admin-customer-management': { file: 'admin-customer-management.html', title: 'Quản lý khách hàng', roles: ['admin'], owner: 'SV4' },
    'admin-user-management': { file: 'admin-user-management.html', title: 'Quản lý người dùng', roles: ['admin'], owner: 'SV4' },
    'admin-invoice-settings': { file: 'admin-invoice-settings.html', title: 'Cấu hình hóa đơn', roles: ['admin'], owner: 'SV4' }
  };

  function currentRole(explicitRole) {
    if (explicitRole && ROLE_HOMES[explicitRole]) return explicitRole;
    if (IP.Auth && typeof IP.Auth.getSession === 'function') {
      const s = IP.Auth.getSession();
      if (s && s.role) return s.role;
    }
    return 'accountant';
  }

  function buildUrl(file, params, hash) {
    const p = params || {};
    const usp = new URLSearchParams();
    Object.keys(p).forEach(function (k) {
      if (p[k] !== null && p[k] !== undefined && p[k] !== '') {
        usp.set(k, String(p[k]));
      }
    });
    const qs = usp.toString();
    return file + (qs ? '?' + qs : '') + (hash ? '#' + hash : '');
  }

  IP.Routes = {
    ROLE_HOMES: ROLE_HOMES,
    ROUTE_MAP: ROUTE_MAP,
    PAGE_META: PAGE_META,

    homeForRole: function (role) {
      return ROLE_HOMES[role] || 'index.html';
    },

    url: function (key, params, roleOverride) {
      const p = Object.assign({}, params || {});
      const role = currentRole(roleOverride);

      if (key === 'invoice.view') {
        const invId = p.id || p.invoiceId || p.open || '';
        if (role === 'sales') return buildUrl('sales-invoice-detail.html', { id: invId });
        if (role === 'manager') return buildUrl('manager-overdue-invoices.html', { open: invId });
        if (role === 'admin') return buildUrl('admin-customer-management.html', {});
        return buildUrl('accountant-invoice-list.html', { open: invId });
      }

      if (key === 'customer.view') {
        const cusId = p.id || p.customerId || p.open || '';
        if (role === 'sales') return buildUrl('sales-customer-balance.html', { open: cusId });
        if (role === 'admin') return buildUrl('admin-customer-management.html', { open: cusId });
        if (role === 'accountant') return buildUrl('accountant-invoice-list.html', { customerId: cusId });
        return buildUrl('manager-overdue-invoices.html', {});
      }

      const targetFile = ROUTE_MAP[key] || key || 'index.html';
      return buildUrl(targetFile, p);
    },

    navigate: function (keyOrUrl, params, roleOverride) {
      const href = ROUTE_MAP[keyOrUrl] || keyOrUrl === 'invoice.view' || keyOrUrl === 'customer.view'
        ? IP.Routes.url(keyOrUrl, params, roleOverride)
        : buildUrl(keyOrUrl, params);
      window.location.href = href;
    }
  };
})(window);
