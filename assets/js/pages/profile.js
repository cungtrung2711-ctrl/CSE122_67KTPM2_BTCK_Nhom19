/**
 * @owner SV3
 * @spec §7.4 User Profile Page Script with Real-Time Theme Sync & Bilingual/Currency Controls (profile.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('profile', {
    roles: ['accountant', 'sales', 'manager', 'admin'],
    init: function (ctx) {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentTab = ['info', 'security', 'appearance'].includes(params.tab) ? params.tab : 'info';
      let isDirty = false;

      function getCurrentUser() {
        const s = IP.Auth.getSession() || ctx.session;
        return (s && s.userId && IP.DB.getUser(s.userId)) || IP.DB.listUsers({})[0];
      }

      function syncThemeCardsInDOM() {
        const choice = IP.UI.getThemeChoice();
        const effTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isEn = IP.I18n && IP.I18n.getLang() === 'en';

        // Update .prf-theme-option active cards in real time
        root.querySelectorAll('.prf-theme-option[data-theme-choice]').forEach(function (card) {
          const cardChoice = card.getAttribute('data-theme-choice');
          const isAct = (cardChoice === choice) || (choice !== 'system' && cardChoice === effTheme);
          card.classList.toggle('active', isAct);
          card.setAttribute('aria-pressed', isAct ? 'true' : 'false');
        });

        // Update quick theme status pills in profile header
        root.querySelectorAll('[data-prf-quick-theme]').forEach(function (btn) {
          const t = btn.getAttribute('data-prf-quick-theme');
          const isAct = (t === choice) || (choice !== 'system' && t === effTheme);
          btn.classList.toggle('btn-primary', isAct);
          btn.classList.toggle('btn-outline-secondary', !isAct);
        });

        const badgeEl = root.querySelector('#prf-live-theme-badge');
        if (badgeEl) {
          if (isEn) {
            badgeEl.innerHTML = '<i class="bi ' + (effTheme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill') + ' me-1"></i>' +
              (effTheme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active') +
              (choice === 'system' ? ' (System)' : '');
          } else {
            badgeEl.innerHTML = '<i class="bi ' + (effTheme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill') + ' me-1"></i>' +
              (effTheme === 'dark' ? 'Đang dùng: Giao diện Tối (Dark)' : 'Đang dùng: Giao diện Sáng (Light)') +
              (choice === 'system' ? ' · Theo thiết bị' : '');
          }
        }
      }

      function render() {
        const user = getCurrentUser();
        const themeChoice = IP.UI.getThemeChoice();
        const effTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isEn = IP.I18n && IP.I18n.getLang() === 'en';
        const fxDate = IP.I18n ? IP.I18n.getSelectedRateDate() : IP.Seed.todayISO();
        const fxRate = IP.I18n ? IP.I18n.getExchangeRateForDate(fxDate) : 25815;

        let tabBody = '';
        if (currentTab === 'info') {
          tabBody =
            '<form id="prf-info-form" novalidate>' +
              '<div id="prf-info-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
              '<div class="row g-3 mb-3">' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="prf-name">Họ và tên <span class="text-danger">*</span></label>' +
                  '<input type="text" id="prf-name" class="form-control" value="' + IP.Utils.escapeHtml(user.name) + '" required>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="prf-email">Địa chỉ Email (Chỉ đọc)</label>' +
                  '<input type="email" id="prf-email" class="form-control" value="' + IP.Utils.escapeHtml(user.email) + '" readonly>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="prf-phone">Số điện thoại liên hệ</label>' +
                  '<input type="tel" id="prf-phone" class="form-control" value="' + IP.Utils.escapeHtml(user.phone || '') + '" placeholder="0901234567">' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="prf-title">Chức danh / Ghi chú công việc</label>' +
                  '<input type="text" id="prf-title" class="form-control" value="' + IP.Utils.escapeHtml(user.title || '') + '">' +
                '</div>' +
              '</div>' +
              '<div class="d-flex justify-content-end gap-2">' +
                '<button type="submit" class="btn btn-primary" id="prf-save-info-btn" ' + (!isDirty ? 'disabled' : '') + '><i class="bi bi-check2-circle"></i> Lưu thông tin</button>' +
              '</div>' +
            '</form>';
        } else if (currentTab === 'security') {
          tabBody =
            '<form id="prf-sec-form" novalidate style="max-width:520px;">' +
              '<div class="alert alert-info small py-2">Mật khẩu mới sẽ được cập nhật cho tài khoản hiện tại của bạn trong hệ thống.</div>' +
              '<div id="prf-sec-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="prf-cur-pass">Mật khẩu hiện tại <span class="text-danger">*</span></label>' +
                '<div class="input-group">' +
                  '<input type="password" id="prf-cur-pass" class="form-control" required>' +
                  '<button type="button" class="btn btn-outline-secondary" data-toggle-pass="#prf-cur-pass" aria-label="Hiện mật khẩu hiện tại"><i class="bi bi-eye"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="prf-new-pass">Mật khẩu mới (Tối thiểu 6 ký tự) <span class="text-danger">*</span></label>' +
                '<div class="input-group">' +
                  '<input type="password" id="prf-new-pass" class="form-control" minlength="6" required>' +
                  '<button type="button" class="btn btn-outline-secondary" data-toggle-pass="#prf-new-pass" aria-label="Hiện mật khẩu mới"><i class="bi bi-eye"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="prf-cfm-pass">Xác nhận mật khẩu mới <span class="text-danger">*</span></label>' +
                '<div class="input-group">' +
                  '<input type="password" id="prf-cfm-pass" class="form-control" required>' +
                  '<button type="button" class="btn btn-outline-secondary" data-toggle-pass="#prf-cfm-pass" aria-label="Hiện xác nhận mật khẩu"><i class="bi bi-eye"></i></button>' +
                '</div>' +
              '</div>' +
              '<button type="submit" class="btn btn-primary"><i class="bi bi-shield-lock"></i> Cập nhật mật khẩu</button>' +
            '</form>';
        } else {
          tabBody =
            '<div class="mb-4">' +
              '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">' +
                '<h3 class="fs-6 fw-bold mb-0">Chế độ giao diện (Sáng / Tối)</h3>' +
                '<span class="small text-muted">Tự động đồng bộ hai chiều với nút Sáng/Tối ở thanh đầu trang</span>' +
              '</div>' +
              '<div class="row g-3">' +
                [
                  { id: 'light', icon: 'bi-sun', label: 'Giao diện Sáng (Light)', desc: 'Nền giấy ấm dịu mắt cho làm việc ban ngày' },
                  { id: 'dark', icon: 'bi-moon-stars', label: 'Giao diện Tối (Dark)', desc: 'Độ tương phản chuẩn cho môi trường thiếu sáng' },
                  { id: 'system', icon: 'bi-display', label: 'Theo thiết bị (System)', desc: 'Tự động đồng bộ theo hệ điều hành của bạn' }
                ].map(function (opt) {
                  const isAct = (themeChoice === opt.id) || (themeChoice !== 'system' && effTheme === opt.id);
                  return (
                    '<div class="col-md-4">' +
                      '<div class="prf-theme-option ' + (isAct ? 'active' : '') + '" data-action="select-theme" data-theme-choice="' + opt.id + '" role="button" tabindex="0" aria-pressed="' + (isAct ? 'true' : 'false') + '">' +
                        '<div class="d-flex justify-content-between align-items-center mb-1">' +
                          '<span class="fw-bold"><i class="bi ' + opt.icon + ' me-2"></i>' + opt.label + '</span>' +
                          (isAct ? '<i class="bi bi-check-circle-fill text-primary"></i>' : '') +
                        '</div>' +
                        '<div class="small text-muted">' + opt.desc + '</div>' +
                      '</div>' +
                    '</div>'
                  );
                }).join('') +
              '</div>' +
            '</div>' +

            '<div class="border-top pt-4 mb-4">' +
              '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">' +
                '<h3 class="fs-6 fw-bold mb-0">Ngôn ngữ & Đơn vị tiền tệ (VND / USD theo ngày)</h3>' +
                '<button type="button" class="btn btn-sm btn-outline-primary" data-action="open-fx-modal">' +
                  '<i class="bi bi-currency-exchange"></i> Bảng tỷ giá ngày: 1 USD = ' + fxRate.toLocaleString('en-US') + ' VND (' + IP.Fmt.date(fxDate) + ')' +
                '</button>' +
              '</div>' +
              '<div class="row g-3">' +
                '<div class="col-md-6">' +
                  '<div class="prf-theme-option ' + (!isEn ? 'active' : '') + '" data-action="select-lang" data-lang="vi" role="button" tabindex="0">' +
                    '<div class="fw-bold mb-1"><i class="bi bi-translate me-2"></i>Tiếng Việt (VI) — Tiền tệ VND (₫)</div>' +
                    '<div class="small text-muted">Hiển thị giao diện Tiếng Việt chuẩn kế toán và đơn vị Đồng Việt Nam (₫).</div>' +
                  '</div>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<div class="prf-theme-option ' + (isEn ? 'active' : '') + '" data-action="select-lang" data-lang="en" role="button" tabindex="0">' +
                    '<div class="fw-bold mb-1"><i class="bi bi-globe2 me-2"></i>English (EN) — Currency USD ($) by Daily Rate</div>' +
                    '<div class="small text-muted">Automatically translates all UI into English and converts VND to USD by daily exchange rate.</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="border-top pt-4">' +
              '<h3 class="fs-6 fw-bold mb-2">Sao lưu & Khôi phục Dữ liệu Hệ thống</h3>' +
              '<p class="small text-muted mb-3">Bạn có thể xuất toàn bộ dữ liệu hiện tại trong <code>localStorage</code> ra tệp JSON hoặc khôi phục dữ liệu mẫu ban đầu.</p>' +
              '<div class="d-flex flex-wrap gap-2">' +
                '<button type="button" class="btn btn-outline-secondary" data-action="export-json"><i class="bi bi-filetype-json"></i> Xuất sao lưu dữ liệu (.json)</button>' +
                '<button type="button" class="btn btn-outline-danger" data-action="reset-system-db"><i class="bi bi-arrow-counterclockwise"></i> Khôi phục dữ liệu chuẩn ban đầu</button>' +
              '</div>' +
            '</div>';
        }

        root.innerHTML =
          '<div class="prf-header-card">' +
            '<div class="d-flex align-items-center gap-3">' +
              '<span class="prf-avatar-lg">' + IP.Utils.escapeHtml(IP.Utils.initials(user.name)) + '</span>' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                  '<h1 class="fs-4 fw-bold mb-0">' + IP.Utils.escapeHtml(user.name) + '</h1>' +
                  IP.UI.roleBadge(user.role) +
                  (user.isCoreAccount ? '<span class="badge bg-secondary-subtle text-body-secondary">TK Nghiệp vụ chính</span>' : '') +
                  '<span class="badge bg-primary-subtle text-primary-emphasis" id="prf-live-theme-badge">' +
                    '<i class="bi ' + (effTheme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill') + ' me-1"></i>' +
                    (effTheme === 'dark' ? 'Đang dùng: Giao diện Tối (Dark)' : 'Đang dùng: Giao diện Sáng (Light)') +
                  '</span>' +
                '</div>' +
                '<div class="small text-muted mt-1">' + IP.Utils.escapeHtml(user.email) + ' · ' + IP.Utils.escapeHtml(user.title || '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="d-flex align-items-center gap-2 flex-wrap">' +
              '<div class="btn-group btn-group-sm" role="group" aria-label="Chuyển nhanh chế độ Sáng/Tối trong hồ sơ">' +
                '<button type="button" class="btn ' + (effTheme === 'light' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="select-theme" data-theme-choice="light" data-prf-quick-theme="light"><i class="bi bi-sun"></i> Sáng</button>' +
                '<button type="button" class="btn ' + (effTheme === 'dark' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="select-theme" data-theme-choice="dark" data-prf-quick-theme="dark"><i class="bi bi-moon-stars"></i> Tối</button>' +
              '</div>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="logout"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button>' +
            '</div>' +
          '</div>' +

          '<div class="ip-card">' +
            '<div class="ip-card-header">' +
              '<div class="btn-group" role="tablist">' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'info' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="info">Thông tin cá nhân</button>' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'security' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="security">Bảo mật</button>' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'appearance' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="appearance">Giao diện & Dữ liệu</button>' +
              '</div>' +
            '</div>' +
            '<div class="ip-card-body">' + tabBody + '</div>' +
          '</div>';

        const infoForm = root.querySelector('#prf-info-form');
        if (infoForm) {
          infoForm.addEventListener('input', function () {
            isDirty = true;
            const saveBtn = root.querySelector('#prf-save-info-btn');
            if (saveBtn) saveBtn.disabled = false;
          });
          infoForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const errEl = root.querySelector('#prf-info-err');
            errEl.classList.add('d-none');
            const res = IP.DB.updateUser(user.id, {
              name: root.querySelector('#prf-name').value,
              phone: root.querySelector('#prf-phone').value,
              title: root.querySelector('#prf-title').value
            });
            if (!res.ok) {
              errEl.textContent = res.error.message;
              errEl.classList.remove('d-none');
              return;
            }
            isDirty = false;
            IP.UI.toast({ title: 'Đã lưu hồ sơ cá nhân', message: 'Họ tên đã được đồng bộ trên thanh công cụ.', type: 'success' });
            render();
          });
        }

        const secForm = root.querySelector('#prf-sec-form');
        if (secForm) {
          secForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const errEl = root.querySelector('#prf-sec-err');
            errEl.classList.add('d-none');
            const curP = root.querySelector('#prf-cur-pass').value;
            const newP = root.querySelector('#prf-new-pass').value;
            const cfmP = root.querySelector('#prf-cfm-pass').value;
            if (newP !== cfmP) {
              errEl.textContent = 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
              errEl.classList.remove('d-none');
              return;
            }
            const res = IP.DB.changeOwnPassword(user.id, curP, newP);
            if (!res.ok) {
              errEl.textContent = res.error.message;
              errEl.classList.remove('d-none');
              return;
            }
            secForm.reset();
            IP.UI.toast({ title: 'Đã cập nhật mật khẩu', message: 'Mật khẩu mới đã được lưu trong trình duyệt này.', type: 'success' });
          });
        }

        if (IP.I18n && IP.I18n.getLang() === 'en') {
          IP.I18n.translateDOM(root);
        }
      }

      // Listen to global theme changes (e.g. clicking #ip-theme-toggle-btn in topbar)
      if (window.__ipProfileThemeHandler) {
        window.removeEventListener('ip:themechange', window.__ipProfileThemeHandler);
      }
      window.__ipProfileThemeHandler = function () {
        if (document.body.getAttribute('data-page') !== 'profile') return;
        if (currentTab === 'appearance' && !isDirty) {
          render();
        } else {
          syncThemeCardsInDOM();
        }
      };
      window.addEventListener('ip:themechange', window.__ipProfileThemeHandler);

      render();

      root.addEventListener('click', function (ev) {
        const togglePass = ev.target.closest('[data-toggle-pass]');
        if (togglePass) {
          const inp = root.querySelector(togglePass.getAttribute('data-toggle-pass'));
          if (inp) {
            inp.type = inp.type === 'password' ? 'text' : 'password';
          }
          return;
        }
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');

        if (action === 'switch-tab') {
          currentTab = btn.getAttribute('data-tab');
          isDirty = false;
          render();
        } else if (action === 'select-theme') {
          const ch = btn.getAttribute('data-theme-choice');
          IP.UI.applyTheme(ch);
          IP.UI.toast({
            title: IP.I18n && IP.I18n.getLang() === 'en' ? 'Theme Updated' : 'Đã đổi chế độ giao diện',
            message: IP.I18n && IP.I18n.getLang() === 'en'
              ? ('Switched to ' + ch + ' mode.')
              : ('Giao diện đã chuyển sang chế độ ' + ch + ' và đồng bộ với thanh công cụ.'),
            type: 'info'
          });
          render();
        } else if (action === 'select-lang') {
          const nextLang = btn.getAttribute('data-lang') || 'vi';
          if (IP.I18n) {
            IP.I18n.setLang(nextLang);
          }
          render();
        } else if (action === 'open-fx-modal') {
          if (IP.I18n) IP.I18n.openExchangeRateModal();
        } else if (action === 'export-json') {
          const jsonStr = IP.DB.exportJSON();
          const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'invoicepilot-backup-data-' + IP.Seed.todayISO() + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          IP.UI.toast({ title: 'Đã xuất JSON', message: 'Tệp sao lưu dữ liệu JSON đã được tải xuống.', type: 'success' });
        } else if (action === 'reset-system-db') {
          IP.UI.confirmModal({
            title: 'Khôi phục dữ liệu mẫu ban đầu?',
            message: 'Mọi hóa đơn mới tạo, giao dịch đối chiếu và báo cáo AI đã lưu sẽ được đặt lại về dữ liệu mẫu gốc và bạn sẽ được đưa về trang Đăng nhập.',
            confirmText: 'Khôi phục & Đăng xuất',
            variant: 'danger',
            onConfirm: function () {
              IP.DB.reset();
              IP.Auth.logout('login.html');
            }
          });
        } else if (action === 'logout') {
          IP.Auth.logout('login.html');
        }
      });
    }
  });
})(window);
