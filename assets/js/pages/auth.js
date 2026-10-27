/**
 * @owner SV1
 * @spec §7.2, §7.3 Login & Forgot Password Page Scripts (auth.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('login', {
    roles: ['public'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const prefillRole = params.role || '';
      const redirectParam = params.redirect || '';
      const existingSession = IP.Auth.getSession();

      const prefillAcc = IP.Auth.ROLE_ACCOUNTS.find(function (a) { return a.role === prefillRole; }) || IP.Auth.ROLE_ACCOUNTS[0];
      const skipChecked = IP.Auth.getSkipRoleLanding() ? 'checked' : '';

      const roleCardsHtml = IP.Auth.ROLE_ACCOUNTS.map(function (acc) {
        const isSel = prefillAcc && prefillAcc.role === acc.role ? 'active' : '';
        return (
          '<button type="button" class="auth-role-btn ' + isSel + '" data-action="fill-role-acc" data-role="' + acc.role + '" data-email="' + IP.Utils.escapeHtml(acc.email) + '" data-pass="' + IP.Utils.escapeHtml(acc.password) + '">' +
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
              '<span class="fw-bold small text-body">' + IP.Utils.escapeHtml(acc.label) + '</span>' +
              '<span class="badge ' + acc.badgeClass + '">' + IP.Utils.escapeHtml(acc.name) + '</span>' +
            '</div>' +
            '<div class="small font-monospace text-primary" style="font-size:0.75rem">TK: ' + IP.Utils.escapeHtml(acc.email) + '</div>' +
            '<div class="small font-monospace text-muted" style="font-size:0.74rem">MK: ' + IP.Utils.escapeHtml(acc.password) + '</div>' +
          '</button>'
        );
      }).join('');

      const sessionBannerHtml = existingSession
        ? '<div class="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4" role="status">' +
            '<div class="small">' +
              'Bạn đang đăng nhập với vai trò <strong>' + IP.Utils.escapeHtml(IP.Fmt.roleLabel(existingSession.role)) + '</strong> (' + IP.Utils.escapeHtml(existingSession.name) + ').' +
            '</div>' +
            '<div class="d-flex gap-2">' +
              '<a class="btn btn-primary btn-sm" href="' + IP.Routes.homeForRole(existingSession.role) + '">Tiếp tục làm việc</a>' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="logout-current">Đăng xuất</button>' +
            '</div>' +
          '</div>'
        : '';

      root.innerHTML =
        '<div class="auth-shell">' +
          '<aside class="auth-brand-panel">' +
            '<div>' +
              '<a href="index.html" class="auth-brand-logo mb-4">' +
                IP.Layout.LOGO_SVG +
                '<span>InvoicePilot</span>' +
              '</a>' +
              '<div class="badge bg-warning-subtle text-warning-emphasis mb-3">Hệ thống Quản trị Hóa đơn & Công nợ B2B</div>' +
              '<h1 class="text-white fs-2 fw-bold mb-3">Hóa đơn đúng hạn. Dòng tiền chủ động.</h1>' +
              '<p class="opacity-75 mb-4">Quản trị thống nhất hóa đơn điện tử GTGT (1C26TAA), đối chiếu sao kê ngân hàng, nhắc thanh toán và dự báo dòng tiền cho 4 phân hệ nghiệp vụ.</p>' +
              '<ul class="auth-benefit-list">' +
                '<li><i class="bi bi-check2-circle"></i><span>Xác thực phân quyền theo 4 vai trò: Kế toán, Kinh doanh, Quản lý, Quản trị viên</span></li>' +
                '<li><i class="bi bi-check2-circle"></i><span>Chỉ Quản trị viên (Admin) mới được phép tạo, sửa hoặc xóa tài khoản các nghiệp vụ khác</span></li>' +
                '<li><i class="bi bi-check2-circle"></i><span>Tùy chọn xem hoặc bỏ qua Trang giới thiệu của từng nghiệp vụ ngay khi đăng nhập</span></li>' +
              '</ul>' +
            '</div>' +
            '<div class="small opacity-75 border-top border-secondary pt-3">' +
              'Công ty Cổ phần Giải pháp Số hóa Hòa Bình · Chuẩn Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC.' +
            '</div>' +
          '</aside>' +
          '<section class="auth-form-panel">' +
            '<div class="auth-card">' +
              sessionBannerHtml +
              '<div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">' +
                '<div>' +
                  '<h2 class="fs-4 fw-bold mb-1">Đăng nhập hệ thống</h2>' +
                  '<p class="text-muted small mb-0">Chọn nhanh tài khoản của từng nghiệp vụ bên dưới hoặc mở Pop-up đăng nhập.</p>' +
                '</div>' +
                '<button type="button" class="btn btn-outline-primary btn-sm" data-action="open-popup-login"><i class="bi bi-window-stack"></i> Mở Pop-up</button>' +
              '</div>' +
              '<div id="login-alert" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
              '<form id="login-form" novalidate>' +
                '<div class="mb-3">' +
                  '<label class="form-label" for="login-email">Email công việc <span class="text-danger">*</span></label>' +
                  '<input type="email" id="login-email" class="form-control" value="' + IP.Utils.escapeHtml(prefillAcc.email) + '" placeholder="ten@hoabinhdigital.vn" required>' +
                  '<div class="invalid-feedback">Vui lòng nhập địa chỉ email hợp lệ.</div>' +
                '</div>' +
                '<div class="mb-3">' +
                  '<div class="d-flex justify-content-between align-items-center">' +
                    '<label class="form-label" for="login-password">Mật khẩu <span class="text-danger">*</span></label>' +
                    '<a href="forgot-password.html" class="small text-decoration-none">Quên mật khẩu?</a>' +
                  '</div>' +
                  '<div class="input-group">' +
                    '<input type="password" id="login-password" class="form-control" value="' + IP.Utils.escapeHtml(prefillAcc.password) + '" placeholder="Nhập mật khẩu" required>' +
                    '<button type="button" class="btn btn-outline-secondary" id="toggle-pass-btn" aria-label="Hiện hoặc ẩn mật khẩu"><i class="bi bi-eye"></i></button>' +
                  '</div>' +
                '</div>' +
                '<div class="form-check mb-2">' +
                  '<input class="form-check-input" type="checkbox" id="login-remember" checked>' +
                  '<label class="form-check-label small" for="login-remember">Ghi nhớ đăng nhập trên trình duyệt này</label>' +
                '</div>' +
                '<div class="form-check p-2 rounded border bg-warning-subtle mb-3">' +
                  '<input class="form-check-input ms-0 me-2" type="checkbox" id="login-skip-role-landing" ' + skipChecked + '>' +
                  '<label class="form-check-label small fw-semibold text-dark" for="login-skip-role-landing">Bỏ qua trang giới thiệu (Landing Page) của mỗi nghiệp vụ khi đăng nhập</label>' +
                '</div>' +
                '<button type="submit" class="btn btn-primary w-100 py-2 mb-3" id="login-submit-btn">' +
                  '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập vào hệ thống' +
                '</button>' +
              '</form>' +
              '<div class="border-top pt-3 mt-2">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                  '<span class="ip-label-sm">Tài khoản 4 Nghiệp vụ được cấp sẵn</span>' +
                  '<span class="small text-muted">Bấm để điền nhanh</span>' +
                '</div>' +
                '<div class="auth-role-grid mb-3">' + roleCardsHtml + '</div>' +
                '<div class="small text-muted text-center border-top pt-3">' +
                  '<div>Chỉ Quản trị viên (<code>admin@hoabinhdigital.vn</code>) mới được phép tạo, sửa hoặc xóa tài khoản các nghiệp vụ khác.</div>' +
                  '<div class="mt-2"><a href="index.html" class="text-decoration-none"><i class="bi bi-arrow-left"></i> Về trang Landing Page tổng quan</a></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>';

      const emailInput = root.querySelector('#login-email');
      const passInput = root.querySelector('#login-password');
      const skipInput = root.querySelector('#login-skip-role-landing');
      const alertBox = root.querySelector('#login-alert');
      const form = root.querySelector('#login-form');
      const submitBtn = root.querySelector('#login-submit-btn');
      const togglePassBtn = root.querySelector('#toggle-pass-btn');

      togglePassBtn.addEventListener('click', function () {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = '<i class="bi ' + (isPass ? 'bi-eye-slash' : 'bi-eye') + '"></i>';
      });

      function doLogin(email, pass, remember) {
        alertBox.classList.add('d-none');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang xác thực...';

        const skipRoleIntro = Boolean(skipInput && skipInput.checked);
        IP.Auth.setSkipRoleLanding(skipRoleIntro);

        setTimeout(function () {
          const res = IP.Auth.login(email, pass, remember);
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Đăng nhập vào hệ thống';

          if (!res.ok) {
            alertBox.textContent = res.error.message;
            alertBox.classList.remove('d-none');
            if (res.error.field === 'email') emailInput.focus();
            else passInput.focus();
            return;
          }

          const role = res.data.role;
          IP.Auth.setRoleLandingDismissed(role, skipRoleIntro, skipRoleIntro);

          if (redirectParam && IP.Auth.isRedirectPermitted(redirectParam, role)) {
            window.IP_CanvasNav(redirectParam);
          } else {
            window.IP_CanvasNav(IP.Routes.homeForRole(role));
          }
        }, 280);
      }

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const email = emailInput.value.trim();
        const pass = passInput.value;
        const remember = root.querySelector('#login-remember').checked;

        if (!email || !IP.Utils.isValidEmail(email)) {
          emailInput.classList.add('is-invalid');
          emailInput.focus();
          return;
        }
        emailInput.classList.remove('is-invalid');

        if (!pass) {
          passInput.classList.add('is-invalid');
          passInput.focus();
          return;
        }
        passInput.classList.remove('is-invalid');

        doLogin(email, pass, remember);
      });

      root.addEventListener('click', function (ev) {
        const fillBtn = ev.target.closest('[data-action="fill-role-acc"]');
        if (fillBtn) {
          root.querySelectorAll('.auth-role-btn').forEach(function (b) { b.classList.remove('active'); });
          fillBtn.classList.add('active');
          emailInput.value = fillBtn.getAttribute('data-email');
          passInput.value = fillBtn.getAttribute('data-pass');
          emailInput.classList.remove('is-invalid');
          passInput.classList.remove('is-invalid');
          alertBox.classList.add('d-none');
        }
        const popBtn = ev.target.closest('[data-action="open-popup-login"]');
        if (popBtn) {
          IP.Auth.openLoginModal({ mandatory: !IP.Auth.getSession() });
        }
        const logoutBtn = ev.target.closest('[data-action="logout-current"]');
        if (logoutBtn) {
          IP.Auth.logout('login.html');
        }
      });
    }
  });

  IP.Pages.register('forgot-password', {
    roles: ['public'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      let state = 'form';
      let lastEmail = '';

      function render() {
        let contentHtml = '';
        if (state === 'form') {
          contentHtml =
            '<h1 class="fs-4 fw-bold mb-1">Yêu cầu cấp lại mật khẩu</h1>' +
            '<p class="text-muted small mb-3">Nhập địa chỉ email công việc của bạn. Yêu cầu đặt lại mật khẩu sẽ được chuyển tới Quản trị viên hệ thống để phê duyệt.</p>' +
            '<form id="forgot-form" novalidate>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="forgot-email">Email công việc <span class="text-danger">*</span></label>' +
                '<input type="email" id="forgot-email" class="form-control" value="' + IP.Utils.escapeHtml(lastEmail || 'ketoan@hoabinhdigital.vn') + '" placeholder="ten@hoabinhdigital.vn" required>' +
                '<div class="invalid-feedback">Vui lòng nhập địa chỉ email đúng định dạng.</div>' +
              '</div>' +
              '<div class="d-grid gap-2 mb-3">' +
                '<button type="submit" class="btn btn-primary" id="forgot-submit-btn"><i class="bi bi-send"></i> Gửi yêu cầu đặt lại mật khẩu</button>' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="test-error">Kiểm thử trạng thái gián đoạn kết nối</button>' +
              '</div>' +
            '</form>';
        } else if (state === 'success') {
          contentHtml =
            '<div class="text-center py-3" role="status">' +
              '<div class="mb-3 text-success fs-1"><i class="bi bi-check-circle-fill"></i></div>' +
              '<h1 class="fs-4 fw-bold mb-2">Đã ghi nhận yêu cầu</h1>' +
              '<p class="text-muted small mb-3">Nếu email <strong>' + IP.Utils.escapeHtml(lastEmail) + '</strong> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được ghi nhận cho Quản trị viên.</p>' +
              '<div class="alert alert-info small text-start">' +
                '<strong>Thông tin hỗ trợ:</strong> Quản trị viên hệ thống (<code>admin@hoabinhdigital.vn</code>) có quyền cấp mật khẩu khởi tạo mới tại màn hình Quản lý người dùng.' +
              '</div>' +
              '<a href="login.html" class="btn btn-primary w-100"><i class="bi bi-arrow-left"></i> Quay lại trang Đăng nhập</a>' +
            '</div>';
        } else if (state === 'error') {
          contentHtml =
            '<div class="text-center py-3" role="alert">' +
              '<div class="mb-3 text-danger fs-1"><i class="bi bi-exclamation-octagon-fill"></i></div>' +
              '<h1 class="fs-4 fw-bold mb-2">Không thể gửi yêu cầu lúc này</h1>' +
              '<p class="text-muted small mb-3">Kết nối tới máy chủ xác thực tạm thời gián đoạn. Vui lòng thử lại.</p>' +
              '<div class="d-flex gap-2 justify-content-center">' +
                '<button type="button" class="btn btn-primary" data-action="retry-form"><i class="bi bi-arrow-clockwise"></i> Thử lại</button>' +
                '<a href="login.html" class="btn btn-outline-secondary">Về trang Đăng nhập</a>' +
              '</div>' +
            '</div>';
        }

        root.innerHTML =
          '<div class="sys-error-shell">' +
            '<div class="auth-card text-start">' +
              '<div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">' +
                '<a href="index.html" class="text-decoration-none fw-bold text-body d-inline-flex align-items-center gap-2">' +
                  '<span style="width:24px;height:24px;display:inline-block">' + IP.Layout.LOGO_SVG + '</span>' +
                  '<span>InvoicePilot</span>' +
                '</a>' +
                '<a href="login.html" class="small text-decoration-none">Đăng nhập</a>' +
              '</div>' +
              contentHtml +
            '</div>' +
          '</div>';

        const form = root.querySelector('#forgot-form');
        if (form) {
          form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const emailEl = root.querySelector('#forgot-email');
            const val = emailEl.value.trim();
            if (!val || !IP.Utils.isValidEmail(val)) {
              emailEl.classList.add('is-invalid');
              emailEl.focus();
              return;
            }
            lastEmail = val;
            const btn = root.querySelector('#forgot-submit-btn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
            setTimeout(function () {
              state = 'success';
              render();
            }, 350);
          });
        }
      }

      render();

      root.addEventListener('click', function (ev) {
        const act = ev.target.closest('[data-action]');
        if (!act) return;
        const name = act.getAttribute('data-action');
        if (name === 'test-error') {
          const emailEl = root.querySelector('#forgot-email');
          if (emailEl) lastEmail = emailEl.value.trim();
          state = 'error';
          render();
        } else if (name === 'retry-form') {
          state = 'form';
          render();
        }
      });
    }
  });
})(window);
