/**
 * @owner CORE
 * @spec §4, §7.2 Mandatory Pop-up Authentication, Role Credentials & Role Guard (IP.Auth)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});
  const SESSION_KEY = 'invoicepilot.session.v2';
  const SKIP_ROLE_LANDING_KEY = 'invoicepilot.skipRoleLanding.v2';
  const HIDE_ROLE_LANDING_MAP_KEY = 'invoicepilot.hideRoleLandingMap.v2';
  const DISMISSED_ROLE_LANDING_KEY = 'invoicepilot.dismissedRoleLanding.v2';

  const ROLE_ACCOUNTS = [
    {
      role: 'accountant',
      label: 'Kế toán',
      name: 'Nguyễn Thu Hà',
      email: 'ketoan@hoabinhdigital.vn',
      password: 'KeToan@2026',
      title: 'Kế toán trưởng công nợ (AR Chief Accountant)',
      home: 'accountant-invoice-list.html',
      badgeClass: 'bg-success-subtle text-success-emphasis',
      desc: 'Lập & phát hành hóa đơn GTGT (1C26TAA), kiểm tra bất thường AI-1, đối chiếu sao kê ngân hàng.',
      descEn: 'Issue tax-coded VAT e-invoices (1C26TAA), run AI-1 anomaly checks, and reconcile bank feeds.'
    },
    {
      role: 'sales',
      label: 'Kinh doanh',
      name: 'Trần Minh Quân',
      email: 'kinhdoanh@hoabinhdigital.vn',
      password: 'KinhDoanh@2026',
      title: 'Trưởng phòng Kinh doanh B2B',
      home: 'sales-customer-balance.html',
      badgeClass: 'bg-info-subtle text-info-emphasis',
      desc: 'Quản lý hạn mức & tuổi nợ khách hàng, soạn thư nhắc thanh toán AI-2, theo dõi thu hồi nợ.',
      descEn: 'Monitor customer credit limits & aging bars, draft polite reminders with AI-2, and track collections.'
    },
    {
      role: 'manager',
      label: 'Quản lý',
      name: 'Lê Hoàng Anh',
      email: 'quanly@hoabinhdigital.vn',
      password: 'QuanLy@2026',
      title: 'Giám đốc Tài chính & Vận hành (CFO)',
      home: 'manager-receivable-dashboard.html',
      badgeClass: 'bg-warning-subtle text-warning-emphasis',
      desc: 'Giám sát KPI phải thu, chỉ số DSO, phân công xử lý nợ quá hạn, dự báo dòng tiền AI-3.',
      descEn: 'Oversee AR KPIs, DSO metrics, overdue risk scoring, Sales assignments, and 3-scenario AI-3 cashflow forecasts.'
    },
    {
      role: 'admin',
      label: 'Quản trị viên',
      name: 'Phạm Gia Bảo',
      email: 'admin@hoabinhdigital.vn',
      password: 'Admin@2026',
      title: 'Quản trị viên Hệ thống (System Admin)',
      home: 'admin-customer-management.html',
      badgeClass: 'bg-danger-subtle text-danger-emphasis',
      desc: 'Toàn quyền tạo, xóa, điều chỉnh tài khoản các nghiệp vụ khác; quản lý danh mục KH & cấu hình.',
      descEn: 'Exclusive authority to create, edit, suspend, or delete user accounts across all roles; manage B2B clients & settings.'
    }
  ];

  function readSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.userId || !parsed.role) return null;
      if (IP.DB && typeof IP.DB.getUser === 'function') {
        const u = IP.DB.getUser(parsed.userId);
        if (!u || u.status === 'disabled') {
          window.localStorage.removeItem(SESSION_KEY);
          return null;
        }
        parsed.name = u.name;
        parsed.email = u.email;
        parsed.role = u.role;
        parsed.title = u.title;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeSession(sess) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    } catch (e) {}
  }

  function getSkipRoleLanding() {
    try {
      return window.localStorage.getItem(SKIP_ROLE_LANDING_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setSkipRoleLanding(val) {
    try {
      window.localStorage.setItem(SKIP_ROLE_LANDING_KEY, val ? 'true' : 'false');
    } catch (e) {}
  }

  function isRoleLandingHiddenForever(role) {
    if (getSkipRoleLanding()) return true;
    if (!role) return false;
    try {
      const raw = window.localStorage.getItem(HIDE_ROLE_LANDING_MAP_KEY);
      if (!raw) return false;
      const map = JSON.parse(raw);
      return Boolean(map && map[role]);
    } catch (e) {
      return false;
    }
  }

  function setRoleLandingHiddenForever(role, hidden) {
    if (!role) return;
    try {
      const raw = window.localStorage.getItem(HIDE_ROLE_LANDING_MAP_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[role] = Boolean(hidden);
      window.localStorage.setItem(HIDE_ROLE_LANDING_MAP_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function isRoleLandingDismissed(role) {
    if (isRoleLandingHiddenForever(role)) return true;
    try {
      const raw = window.sessionStorage.getItem(DISMISSED_ROLE_LANDING_KEY);
      if (!raw) return false;
      const map = JSON.parse(raw);
      return Boolean(map && map[role]);
    } catch (e) {
      return false;
    }
  }

  function setRoleLandingDismissed(role, dismissed, rememberForever) {
    if (rememberForever !== undefined) {
      setRoleLandingHiddenForever(role, Boolean(rememberForever));
      if (!rememberForever) {
        setSkipRoleLanding(false);
      }
    }
    try {
      const raw = window.sessionStorage.getItem(DISMISSED_ROLE_LANDING_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[role] = Boolean(dismissed);
      window.sessionStorage.setItem(DISMISSED_ROLE_LANDING_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function openLoginModal(opts) {
    IP.DB.init();
    const o = opts || {};
    const existingSession = readSession();
    const isMandatory = o.mandatory !== undefined ? Boolean(o.mandatory) : !existingSession;
    const prefillRole = o.role || '';
    const redirectUrl = o.redirectUrl || '';
    const isEn = IP.I18n && IP.I18n.getLang() === 'en';

    const modalId = 'ip-mandatory-login-modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    const activeUsers = IP.DB.listUsers({ status: 'active' });
    const roleAccounts = ROLE_ACCOUNTS.map(function (preset) {
      const dbUser = activeUsers.find(function (u) { return u.email.toLowerCase() === preset.email.toLowerCase(); }) ||
                     activeUsers.find(function (u) { return u.role === preset.role; });
      return {
        role: preset.role,
        label: IP.Fmt.roleLabel(preset.role),
        name: dbUser ? dbUser.name : preset.name,
        email: dbUser ? dbUser.email : preset.email,
        password: dbUser ? dbUser.password : preset.password,
        title: dbUser ? dbUser.title : preset.title,
        badgeClass: preset.badgeClass,
        desc: isEn ? preset.descEn : preset.desc
      };
    });

    const defaultAcc = roleAccounts.find(function (a) { return a.role === prefillRole; }) || roleAccounts[0];
    const skipLandingChecked = getSkipRoleLanding() ? 'checked' : '';

    const cardsHtml = roleAccounts.map(function (acc) {
      const isSelected = acc.role === defaultAcc.role ? 'active' : '';
      return (
        '<div class="auth-role-card ' + isSelected + '" data-role-card="' + acc.role + '" data-email="' + IP.Utils.escapeHtml(acc.email) + '" data-pass="' + IP.Utils.escapeHtml(acc.password) + '">' +
          '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<span class="badge ' + acc.badgeClass + ' fw-bold">' + IP.Utils.escapeHtml(acc.label) + '</span>' +
            '<span class="small text-muted fw-semibold">' + IP.Utils.escapeHtml(acc.name) + '</span>' +
          '</div>' +
          '<div class="small text-muted mb-2" style="font-size:0.76rem;line-height:1.35;">' + IP.Utils.escapeHtml(acc.desc) + '</div>' +
          '<div class="p-2 rounded bg-body-tertiary border small font-monospace mb-2" style="font-size:0.75rem;">' +
            '<div>Email: <strong class="text-primary">' + IP.Utils.escapeHtml(acc.email) + '</strong></div>' +
            '<div>' + (isEn ? 'Password: ' : 'Mật khẩu: ') + '<strong>' + IP.Utils.escapeHtml(acc.password) + '</strong></div>' +
          '</div>' +
          '<div class="d-flex gap-1">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary flex-grow-1 py-1" style="font-size:0.76rem;min-height:30px;" data-popup-action="fill-account" data-email="' + IP.Utils.escapeHtml(acc.email) + '" data-pass="' + IP.Utils.escapeHtml(acc.password) + '" data-role="' + acc.role + '">' +
              '<i class="bi bi-input-cursor-text"></i> ' + (isEn ? 'Fill Credentials' : 'Điền thông tin') +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-primary flex-grow-1 py-1" style="font-size:0.76rem;min-height:30px;" data-popup-action="instant-login" data-email="' + IP.Utils.escapeHtml(acc.email) + '" data-pass="' + IP.Utils.escapeHtml(acc.password) + '" data-role="' + acc.role + '">' +
              '<i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? 'Sign In Now' : 'Đăng nhập ngay') +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-labelledby', 'ip-mandatory-login-title');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('role', 'dialog');

    modalEl.innerHTML =
      '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content border-0 shadow-lg overflow-hidden" style="border-radius:18px;">' +
          '<div class="modal-header text-white py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style="background:var(--ip-sidebar);border-bottom:1px solid rgba(255,255,255,0.1);">' +
            '<div class="d-flex align-items-center gap-3">' +
              '<span style="width:34px;height:34px;display:inline-block">' + (IP.Layout ? IP.Layout.LOGO_SVG : '') + '</span>' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                  '<h2 class="modal-title fs-5 fw-bold mb-0 text-white" id="ip-mandatory-login-title">' +
                    (isEn ? 'Sign In to InvoicePilot B2B Receivables Suite' : 'Đăng nhập Hệ thống Quản trị Hóa đơn & Công nợ InvoicePilot') +
                  '</h2>' +
                  '<span class="badge bg-warning text-dark">' + (isEn ? 'Mandatory Authentication' : 'Yêu cầu xác thực bắt buộc') + '</span>' +
                '</div>' +
                '<div class="small text-white-50">' +
                  (isEn
                    ? 'Select a pre-issued role account below or enter credentials issued by the System Administrator.'
                    : 'Chọn tài khoản của từng nghiệp vụ bên dưới hoặc nhập thông tin tài khoản do Quản trị viên cấp.') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="d-flex align-items-center gap-2">' +
              '<button type="button" class="btn btn-sm btn-outline-light py-1 px-2" data-popup-action="toggle-lang">' +
                '<i class="bi bi-translate"></i> ' + (isEn ? 'EN · USD' : 'VI · VND') +
              '</button>' +
              (!isMandatory
                ? '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>'
                : '') +
            '</div>' +
          '</div>' +
          '<div class="modal-body p-4">' +
            '<div class="row g-4 align-items-stretch">' +
              '<div class="col-lg-7">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                  '<span class="ip-label-sm text-primary"><i class="bi bi-person-vcard me-1"></i>' + (isEn ? '4 Issued Business Role Accounts' : 'Tài khoản 4 Nghiệp vụ được cấp sẵn') + '</span>' +
                  '<span class="small text-muted">' + (isEn ? 'Click "Fill Credentials" or "Sign In Now"' : 'Bấm "Điền thông tin" hoặc "Đăng nhập ngay"') + '</span>' +
                '</div>' +
                '<div class="auth-role-grid mb-3">' + cardsHtml + '</div>' +
                '<div class="p-3 rounded border bg-body-tertiary small">' +
                  '<div class="fw-bold mb-1"><i class="bi bi-shield-lock text-primary me-1"></i>' + (isEn ? 'Strict Role Account Governance:' : 'Chính sách phân quyền tài khoản nghiêm ngặt:') + '</div>' +
                  '<ul class="mb-0 ps-3 text-muted">' +
                    '<li>' + (isEn
                      ? 'Only the <strong>System Administrator (Admin - admin@hoabinhdigital.vn)</strong> is permitted to <strong>create, edit, suspend, or delete accounts</strong> for other business roles.'
                      : 'Chỉ duy nhất <strong>Quản trị viên (Admin - admin@hoabinhdigital.vn)</strong> mới có quyền <strong>tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản</strong> của các nghiệp vụ khác.') + '</li>' +
                    '<li>' + (isEn
                      ? 'Accountant, Sales, and Manager accounts are restricted strictly to their assigned business modules.'
                      : 'Các vai trò Kế toán, Kinh doanh, Quản lý chỉ được phép truy cập đúng phân hệ nghiệp vụ được phân quyền.') + '</li>' +
                  '</ul>' +
                '</div>' +
              '</div>' +
              '<div class="col-lg-5">' +
                '<div class="p-3 p-md-4 rounded border bg-body h-100 d-flex flex-column justify-content-between">' +
                  '<div>' +
                    '<h3 class="fs-5 fw-bold mb-1">' + (isEn ? 'Authentication Credentials' : 'Thông tin xác thực') + '</h3>' +
                    '<p class="small text-muted mb-3">' + (isEn ? 'Sign in to access your role workspace.' : 'Đăng nhập để mở không gian làm việc theo vai trò nghiệp vụ.') + '</p>' +
                    '<div id="ip-popup-login-alert" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                    '<form id="ip-popup-login-form" novalidate>' +
                      '<div class="mb-3">' +
                        '<label class="form-label" for="ip-popup-email">' + (isEn ? 'Work Email' : 'Email công việc') + ' <span class="text-danger">*</span></label>' +
                        '<input type="email" id="ip-popup-email" class="form-control" value="' + IP.Utils.escapeHtml(defaultAcc.email) + '" placeholder="ten@hoabinhdigital.vn" required>' +
                      '</div>' +
                      '<div class="mb-3">' +
                        '<div class="d-flex justify-content-between align-items-center">' +
                          '<label class="form-label" for="ip-popup-password">' + (isEn ? 'Password' : 'Mật khẩu') + ' <span class="text-danger">*</span></label>' +
                          '<a href="forgot-password.html" class="small text-decoration-none">' + (isEn ? 'Forgot password?' : 'Quên mật khẩu?') + '</a>' +
                        '</div>' +
                        '<div class="input-group">' +
                          '<input type="password" id="ip-popup-password" class="form-control" value="' + IP.Utils.escapeHtml(defaultAcc.password) + '" required>' +
                          '<button type="button" class="btn btn-outline-secondary" id="ip-popup-toggle-pass" aria-label="Show/hide password"><i class="bi bi-eye"></i></button>' +
                        '</div>' +
                      '</div>' +
                      '<div class="form-check mb-2">' +
                        '<input class="form-check-input" type="checkbox" id="ip-popup-remember" checked>' +
                        '<label class="form-check-label small" for="ip-popup-remember">' + (isEn ? 'Remember session on this browser' : 'Ghi nhớ phiên đăng nhập trên trình duyệt này') + '</label>' +
                      '</div>' +
                      '<div class="form-check p-2 rounded border bg-warning-subtle mb-3">' +
                        '<input class="form-check-input ms-0 me-2" type="checkbox" id="ip-popup-skip-role-landing" ' + skipLandingChecked + '>' +
                        '<label class="form-check-label small fw-semibold text-dark" for="ip-popup-skip-role-landing">' +
                          (isEn
                            ? 'Do not show role intro landing page upon login (jump straight to task workspace)'
                            : 'Không hiển thị trang giới thiệu nghiệp vụ (Landing Page) khi đăng nhập, nhảy thẳng vào trang tác vụ') +
                        '</label>' +
                      '</div>' +
                      '<button type="submit" class="btn btn-primary w-100 py-2" id="ip-popup-submit-btn">' +
                        '<i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? 'Sign In to System' : 'Đăng nhập hệ thống') +
                      '</button>' +
                    '</form>' +
                  '</div>' +
                  '<div class="small text-muted border-top pt-3 mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">' +
                    '<span>' + (isEn ? 'Entity: <strong>Hoa Binh Digital Solutions JSC</strong>' : 'Đơn vị: <strong>CTCP Giải pháp Số hóa Hòa Bình</strong>') + '</span>' +
                    '<span class="badge bg-secondary-subtle text-body-secondary">NĐ 123 & TT 78</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modalEl);

    const bsModal = window.bootstrap && window.bootstrap.Modal
      ? new window.bootstrap.Modal(modalEl, {
          backdrop: isMandatory ? 'static' : true,
          keyboard: !isMandatory
        })
      : null;

    const emailInput = modalEl.querySelector('#ip-popup-email');
    const passInput = modalEl.querySelector('#ip-popup-password');
    const skipInput = modalEl.querySelector('#ip-popup-skip-role-landing');
    const rememberInput = modalEl.querySelector('#ip-popup-remember');
    const alertBox = modalEl.querySelector('#ip-popup-login-alert');
    const togglePassBtn = modalEl.querySelector('#ip-popup-toggle-pass');
    const form = modalEl.querySelector('#ip-popup-login-form');

    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', function () {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = '<i class="bi ' + (isPass ? 'bi-eye-slash' : 'bi-eye') + '"></i>';
      });
    }

    function executeLogin(emailVal, passVal) {
      alertBox.classList.add('d-none');
      const skipLanding = Boolean(skipInput && skipInput.checked);
      setSkipRoleLanding(skipLanding);

      const res = IP.Auth.login(emailVal, passVal, rememberInput ? rememberInput.checked : true);
      if (!res.ok) {
        alertBox.textContent = res.error.message;
        alertBox.classList.remove('d-none');
        return;
      }

      if (!skipLanding && !isRoleLandingHiddenForever(res.data.role)) {
        setRoleLandingDismissed(res.data.role, false);
      } else {
        setRoleLandingDismissed(res.data.role, true, skipLanding ? true : undefined);
      }

      if (bsModal) bsModal.hide();
      modalEl.remove();
      document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');

      const role = res.data.role;
      try {
        window.dispatchEvent(new CustomEvent('ip:role-changed', { detail: { role: role } }));
      } catch (e) {}

      if (typeof o.onSuccess === 'function') {
        o.onSuccess(res.data);
        return;
      }

      if (redirectUrl && IP.Auth.isRedirectPermitted(redirectUrl, role)) {
        if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(redirectUrl);
        else window.location.href = redirectUrl;
      } else {
        const targetHome = IP.Routes.homeForRole(role);
        if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(targetHome);
        else window.location.href = targetHome;
      }
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      executeLogin(emailInput.value.trim(), passInput.value);
    });

    modalEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-popup-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-popup-action');
      if (act === 'toggle-lang') {
        if (bsModal) bsModal.hide();
        modalEl.remove();
        document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
        if (IP.I18n) IP.I18n.toggleLang();
        setTimeout(function () {
          openLoginModal(o);
        }, 60);
        return;
      }
      const em = btn.getAttribute('data-email');
      const pw = btn.getAttribute('data-pass');
      const r = btn.getAttribute('data-role');

      modalEl.querySelectorAll('.auth-role-card').forEach(function (c) {
        c.classList.toggle('active', c.getAttribute('data-role-card') === r);
      });

      if (act === 'fill-account') {
        emailInput.value = em;
        passInput.value = pw;
        alertBox.classList.add('d-none');
        emailInput.focus();
      } else if (act === 'instant-login') {
        emailInput.value = em;
        passInput.value = pw;
        executeLogin(em, pw);
      }
    });

    if (bsModal) bsModal.show();
    else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
    }
  }

  IP.Auth = {
    SESSION_KEY: SESSION_KEY,
    ROLE_ACCOUNTS: ROLE_ACCOUNTS,

    getSession: function () {
      return readSession();
    },

    getSkipRoleLanding: getSkipRoleLanding,
    setSkipRoleLanding: setSkipRoleLanding,
    isRoleLandingHiddenForever: isRoleLandingHiddenForever,
    setRoleLandingHiddenForever: setRoleLandingHiddenForever,
    isRoleLandingDismissed: isRoleLandingDismissed,
    setRoleLandingDismissed: setRoleLandingDismissed,
    openLoginModal: openLoginModal,

    login: function (email, password, remember) {
      IP.DB.init();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPass = String(password || '');

      if (!cleanEmail || !IP.Utils.isValidEmail(cleanEmail)) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Vui lòng nhập địa chỉ email công việc hợp lệ.', field: 'email' } };
      }
      if (!cleanPass) {
        return { ok: false, error: { code: 'VALIDATION', message: 'Vui lòng nhập mật khẩu xác thực.', field: 'password' } };
      }

      const st = IP.DB.getState();
      const user = st.users.find(function (u) { return u.email.toLowerCase() === cleanEmail; });

      const genericAuthErr = {
        ok: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Email hoặc mật khẩu không chính xác, hoặc tài khoản đã bị Quản trị viên tạm khóa.'
        }
      };

      if (!user) return genericAuthErr;
      if (user.status === 'disabled') return genericAuthErr;
      if (String(user.password || '') !== cleanPass) return genericAuthErr;

      if (user.status === 'invited') {
        user.status = 'active';
      }
      user.lastLoginAt = new Date().toISOString();
      IP.DB._commit();

      const session = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title || IP.Fmt.roleLabel(user.role),
        remember: Boolean(remember),
        loggedInAt: user.lastLoginAt
      };
      writeSession(session);
      return { ok: true, data: session };
    },

    logout: function (redirectUrl) {
      try {
        window.localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      try {
        window.dispatchEvent(new CustomEvent('ip:role-changed', { detail: { role: 'public' } }));
      } catch (e) {}
      if (redirectUrl !== false) {
        const target = redirectUrl || 'index.html';
        if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(target);
        else window.location.href = target;
      }
    },

    switchRole: function (role, navigateImmediately) {
      IP.DB.init();
      const preset = ROLE_ACCOUNTS.find(function (d) { return d.role === role; }) || ROLE_ACCOUNTS[0];
      const st = IP.DB.getState();
      const user = st.users.find(function (u) { return u.email.toLowerCase() === preset.email.toLowerCase() && u.status !== 'disabled'; }) ||
        st.users.find(function (u) { return u.role === preset.role && u.status === 'active'; });

      const session = {
        userId: user ? user.id : ('usr_' + preset.role.slice(0, 3)),
        name: user ? user.name : preset.name,
        email: user ? user.email : preset.email,
        role: preset.role,
        title: user ? user.title : preset.label,
        remember: true,
        loggedInAt: new Date().toISOString()
      };
      writeSession(session);
      if (!isRoleLandingHiddenForever(preset.role)) {
        setRoleLandingDismissed(preset.role, false);
      }
      try { window.dispatchEvent(new CustomEvent('ip:role-changed', { detail: { role: preset.role } })); } catch (e) {}
      if (navigateImmediately !== false) {
        const dest = IP.Routes.homeForRole(preset.role);
        if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(dest);
        else window.location.href = dest;
      }
      return session;
    },

    isRedirectPermitted: function (redirectUrl, role) {
      if (!redirectUrl) return false;
      const cleanFile = String(redirectUrl).split('?')[0].split('#')[0].replace(/^\/+/, '');
      const entries = Object.values(IP.Routes.PAGE_META);
      const found = entries.find(function (m) { return m.file === cleanFile; });
      if (!found) return false;
      if (found.roles.includes('public')) return true;
      return found.roles.includes(role);
    },

    guard: function (allowedRolesAttr) {
      const session = readSession();
      if (!allowedRolesAttr || allowedRolesAttr === 'public') {
        return { allowed: true, session: session };
      }
      const allowed = String(allowedRolesAttr)
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);

      if (allowed.includes('public')) {
        return { allowed: true, session: session };
      }

      const currentFile = (window.__IP_VIRTUAL_PATH || window.location.pathname || '/index.html').split('/').pop() || 'index.html';

      if (!session) {
        return {
          allowed: false,
          reason: 'unauthenticated',
          redirectTarget: currentFile + (window.__IP_VIRTUAL_SEARCH || window.location.search || '')
        };
      }

      if (!allowed.includes(session.role)) {
        const errUrl = '403.html?from=' + encodeURIComponent(currentFile) + '&requiredRole=' + encodeURIComponent(allowed.join(','));
        if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(errUrl);
        else window.location.href = errUrl;
        return { allowed: false, reason: 'forbidden', session: session };
      }

      return { allowed: true, session: session };
    }
  };
})(window);
