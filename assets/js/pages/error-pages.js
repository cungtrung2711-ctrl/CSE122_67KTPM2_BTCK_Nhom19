/**
 * @owner SV2
 * @spec §7.6 403 Forbidden & 404 Not Found Page Scripts (error-pages.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('error-403', {
    roles: ['public'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const session = IP.Auth.getSession();
      const params = IP.Utils.getQueryParams();
      const fromPage = params.from || '';
      const requiredRole = params.requiredRole || '';
      const reqLabel = requiredRole ? IP.Fmt.roleLabel(requiredRole.split(',')[0]) : 'vai trò được phân quyền';

      const roleButtonsHtml = IP.Auth.ROLE_ACCOUNTS.map(function (acc) {
        return '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="quick-switch-role" data-role="' + acc.role + '">' +
          'Đăng nhập ' + IP.Utils.escapeHtml(acc.label) +
        '</button>';
      }).join('');

      root.innerHTML =
        '<div class="sys-error-shell">' +
          '<div class="sys-error-card">' +
            '<div class="mb-3">' +
              '<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<rect x="14" y="30" width="44" height="32" rx="8" stroke="var(--ip-danger)" stroke-width="3"/>' +
                '<path d="M24 30V22C24 15.3726 29.3726 10 36 10C42.6274 10 48 15.3726 48 22V30" stroke="var(--ip-danger)" stroke-width="3" stroke-linecap="round"/>' +
                '<circle cx="36" cy="46" r="4" fill="var(--ip-danger)"/>' +
              '</svg>' +
            '</div>' +
            '<div class="sys-error-code">403</div>' +
            '<h1 class="fs-4 fw-bold mb-2">Bạn không có quyền truy cập trang này</h1>' +
            '<p class="text-muted small mb-4">' +
              (session
                ? ('Tài khoản hiện tại của bạn đang thuộc vai trò <strong>' + IP.Utils.escapeHtml(IP.Fmt.roleLabel(session.role)) + '</strong>' +
                   (fromPage ? (', trong khi trang <code>' + IP.Utils.escapeHtml(fromPage) + '</code> yêu cầu quyền <strong>' + IP.Utils.escapeHtml(reqLabel) + '</strong>.') : '.'))
                : 'Bạn cần đăng nhập bằng tài khoản có vai trò phù hợp để mở màn hình nghiệp vụ này.') +
            '</p>' +
            '<div class="d-flex flex-wrap justify-content-center gap-2 mb-4">' +
              (session
                ? '<a href="' + IP.Routes.homeForRole(session.role) + '" class="btn btn-primary"><i class="bi bi-house-door"></i> Về trang phù hợp với vai trò</a>'
                : '<a href="login.html" class="btn btn-primary"><i class="bi bi-box-arrow-in-right"></i> Đăng nhập</a>') +
              '<a href="index.html" class="btn btn-outline-secondary">Về trang giới thiệu</a>' +
              (session ? '<a href="login.html" class="btn btn-outline-secondary">Đổi tài khoản đăng nhập</a>' : '') +
            '</div>' +
            '<div class="border-top pt-3">' +
              '<div class="ip-label-sm mb-2">Đăng nhập bằng tài khoản của nghiệp vụ được cấp quyền</div>' +
              '<div class="d-flex flex-wrap justify-content-center gap-2">' + roleButtonsHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action="quick-switch-role"]');
        if (!btn) return;
        const targetRole = btn.getAttribute('data-role');
        IP.Auth.openLoginModal({ mandatory: false, role: targetRole, redirectUrl: fromPage });
      });
    }
  });

  IP.Pages.register('error-404', {
    roles: ['public'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const session = IP.Auth.getSession();

      root.innerHTML =
        '<div class="sys-error-shell">' +
          '<div class="sys-error-card">' +
            '<div class="mb-3">' +
              '<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                '<circle cx="34" cy="34" r="20" stroke="var(--ip-primary)" stroke-width="3"/>' +
                '<path d="M49 49L62 62" stroke="var(--ip-primary)" stroke-width="3.5" stroke-linecap="round"/>' +
                '<path d="M28 34H40" stroke="var(--ip-accent)" stroke-width="3" stroke-linecap="round"/>' +
              '</svg>' +
            '</div>' +
            '<div class="sys-error-code">404</div>' +
            '<h1 class="fs-4 fw-bold mb-2">Không tìm thấy trang yêu cầu</h1>' +
            '<p class="text-muted small mb-4">Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi trong không gian làm việc InvoicePilot.</p>' +
            '<div class="d-flex flex-wrap justify-content-center gap-2">' +
              (session
                ? '<a href="' + IP.Routes.homeForRole(session.role) + '" class="btn btn-primary"><i class="bi bi-house-door"></i> Về trang phù hợp với vai trò (' + IP.Utils.escapeHtml(IP.Fmt.roleLabel(session.role)) + ')</a>'
                : '') +
              '<a href="index.html" class="btn ' + (session ? 'btn-outline-secondary' : 'btn-primary') + '">Về trang giới thiệu</a>' +
              '<a href="login.html" class="btn btn-outline-secondary">Đăng nhập</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  });
})(window);
