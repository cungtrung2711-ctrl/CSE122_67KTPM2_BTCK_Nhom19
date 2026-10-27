/**
 * @owner CORE
 * @spec §5 Role Navigation Configuration (IP.Nav)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  const ROLE_NAV = {
    accountant: [
      {
        key: 'invoice.list',
        pageId: 'accountant-invoice-list',
        label: 'Hóa đơn',
        icon: 'bi-receipt',
        href: 'accountant-invoice-list.html'
      },
      {
        key: 'invoice.form',
        pageId: 'accountant-invoice-form',
        label: 'Tạo hóa đơn',
        icon: 'bi-file-earmark-plus',
        href: 'accountant-invoice-form.html'
      },
      {
        key: 'reconciliation',
        pageId: 'accountant-reconciliation',
        label: 'Đối chiếu thanh toán',
        icon: 'bi-arrow-left-right',
        href: 'accountant-reconciliation.html'
      }
    ],
    sales: [
      {
        key: 'sales.balance',
        pageId: 'sales-customer-balance',
        label: 'Công nợ khách hàng',
        icon: 'bi-building-check',
        href: 'sales-customer-balance.html'
      },
      {
        key: 'sales.reminders',
        pageId: 'sales-payment-reminders',
        label: 'Nhắc thanh toán',
        icon: 'bi-envelope-paper',
        href: 'sales-payment-reminders.html'
      },
      {
        key: 'sales.invoice',
        pageId: 'sales-invoice-detail',
        label: 'Hóa đơn',
        icon: 'bi-file-text',
        href: 'sales-invoice-detail.html'
      }
    ],
    manager: [
      {
        key: 'manager.dashboard',
        pageId: 'manager-receivable-dashboard',
        label: 'Tổng quan công nợ',
        icon: 'bi-bar-chart-line',
        href: 'manager-receivable-dashboard.html'
      },
      {
        key: 'manager.overdue',
        pageId: 'manager-overdue-invoices',
        label: 'Hóa đơn quá hạn',
        icon: 'bi-exclamation-octagon',
        href: 'manager-overdue-invoices.html'
      },
      {
        key: 'manager.forecast',
        pageId: 'manager-cashflow-forecast',
        label: 'Dự báo dòng tiền',
        icon: 'bi-graph-up-arrow',
        href: 'manager-cashflow-forecast.html'
      }
    ],
    admin: [
      {
        key: 'admin.customers',
        pageId: 'admin-customer-management',
        label: 'Khách hàng',
        icon: 'bi-buildings',
        href: 'admin-customer-management.html'
      },
      {
        key: 'admin.users',
        pageId: 'admin-user-management',
        label: 'Người dùng',
        icon: 'bi-people',
        href: 'admin-user-management.html'
      },
      {
        key: 'admin.settings',
        pageId: 'admin-invoice-settings',
        label: 'Cấu hình hóa đơn',
        icon: 'bi-sliders',
        href: 'admin-invoice-settings.html'
      }
    ]
  };

  const COMMON_NAV = [
    {
      key: 'notifications',
      pageId: 'notifications',
      label: 'Thông báo',
      icon: 'bi-bell',
      href: 'notifications.html'
    },
    {
      key: 'profile',
      pageId: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: 'bi-person-badge',
      href: 'profile.html'
    }
  ];

  IP.Nav = {
    ROLE_NAV: ROLE_NAV,
    COMMON_NAV: COMMON_NAV,
    getMenuForRole: function (role) {
      return {
        primary: ROLE_NAV[role] || ROLE_NAV.accountant,
        secondary: COMMON_NAV
      };
    }
  };
})(window);
