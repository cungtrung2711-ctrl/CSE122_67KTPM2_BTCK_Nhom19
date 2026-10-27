/**
 * @owner CORE
 * @spec §4.2, §8.1, §8.2, §11 Shared UI Components, Modals, CSV, Print & View States (IP.UI)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});
  const THEME_KEY = 'invoicepilot.theme.v1';

  function getThemeChoice() {
    try {
      return window.localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function resolveEffectiveTheme(choice) {
    if (choice === 'dark') return 'dark';
    if (choice === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function applyTheme(choice) {
    const c = choice || getThemeChoice();
    try {
      window.localStorage.setItem(THEME_KEY, c);
    } catch (e) {}
    const eff = resolveEffectiveTheme(c);
    document.documentElement.setAttribute('data-theme', eff);
    document.documentElement.setAttribute('data-bs-theme', eff);
    window.dispatchEvent(new CustomEvent('ip:themechange', { detail: { choice: c, theme: eff } }));
    return eff;
  }

  function ensureToastContainer() {
    let el = document.getElementById('ip-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ip-toast-container';
      el.className = 'ip-toast-container';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(opts) {
    const o = typeof opts === 'string' ? { message: opts } : (opts || {});
    const type = o.type || 'success';
    const iconMap = {
      success: 'bi-check-circle-fill text-success',
      danger: 'bi-exclamation-octagon-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-primary'
    };
    const container = ensureToastContainer();
    const item = document.createElement('div');
    item.className = 'ip-toast ip-toast-' + type;
    item.setAttribute('role', 'status');
    item.innerHTML =
      '<i class="bi ' + (iconMap[type] || iconMap.info) + ' fs-5 mt-1"></i>' +
      '<div class="flex-grow-1">' +
        (o.title ? '<div class="fw-bold small mb-1">' + IP.Utils.escapeHtml(o.title) + '</div>' : '') +
        '<div class="small">' + IP.Utils.escapeHtml(o.message || '') + '</div>' +
      '</div>' +
      '<button type="button" class="btn-close btn-sm" aria-label="Đóng thông báo"></button>';

    const closeBtn = item.querySelector('.btn-close');
    closeBtn.addEventListener('click', function () {
      item.remove();
    });
    container.appendChild(item);
    setTimeout(function () {
      if (item.parentNode) item.remove();
    }, o.duration || 3500);
  }

  function statusBadge(status, customLabel) {
    const s = status || 'draft';
    const label = customLabel || IP.Fmt.statusLabel(s);
    return '<span class="ip-badge ip-badge-' + IP.Utils.escapeHtml(s) + '">' +
      '<span class="ip-badge-dot" aria-hidden="true"></span>' +
      IP.Utils.escapeHtml(label) +
    '</span>';
  }

  function riskBadge(riskObj) {
    const r = typeof riskObj === 'string'
      ? { level: riskObj, label: IP.Fmt.statusLabel(riskObj), formula: '' }
      : (riskObj || { level: 'low', label: 'Thấp', formula: '' });
    const tip = r.reasons ? (r.reasons.join(' · ') + ' | ' + r.formula) : (r.formula || '');
    return '<span class="ip-badge ip-badge-' + IP.Utils.escapeHtml(r.level) + '" title="' + IP.Utils.escapeHtml(tip) + '">' +
      '<span class="ip-badge-dot" aria-hidden="true"></span>Rủi ro ' + IP.Utils.escapeHtml(r.label) +
    '</span>';
  }

  function roleBadge(role) {
    const label = IP.Fmt.roleLabel(role);
    return '<span class="ip-badge ip-badge-sent">' + IP.Utils.escapeHtml(label) + '</span>';
  }

  function closeModal(modalEl, bsModal) {
    if (!modalEl && !bsModal) {
      document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      return;
    }
    try {
      if (bsModal && typeof bsModal.hide === 'function') {
        bsModal.hide();
      } else if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        const inst = window.bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }
    } catch (e) {}
    try {
      if (bsModal && typeof bsModal.dispose === 'function') {
        bsModal.dispose();
      } else if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        const inst = window.bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.dispose();
      }
    } catch (e) {}
    if (modalEl) {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      if (modalEl.parentNode) modalEl.remove();
    }
    function cleanupRemainingBackdrops() {
      const anyOpenModal = document.querySelector('.modal.show');
      if (!anyOpenModal) {
        document.querySelectorAll('.modal-backdrop').forEach(function (b) { b.remove(); });
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }
    }
    cleanupRemainingBackdrops();
    setTimeout(cleanupRemainingBackdrops, 60);
    setTimeout(cleanupRemainingBackdrops, 350);
  }

  document.addEventListener('click', function (ev) {
    const dismissBtn = ev.target.closest('[data-bs-dismiss="modal"]');
    if (!dismissBtn) return;
    const modalEl = dismissBtn.closest('.modal');
    if (!modalEl) return;

    const noAskConfirmIds = ['ip-confirm-modal', 'ip-notif-detail-modal', 'acc-print-preview-modal', 'ip-customer-picker-modal', 'adm-temp-pass-modal', 'ip-fx-rate-modal', 'ip-mockapi-cloud-modal', 'ip-llm-config-modal'];
    if (noAskConfirmIds.includes(modalEl.id) || modalEl.getAttribute('data-no-cancel-confirm') === '1') {
      ev.preventDefault();
      ev.stopPropagation();
      closeModal(modalEl, null);
      return;
    }

    if (modalEl.querySelector('form')) {
      ev.preventDefault();
      ev.stopPropagation();
      confirmModal({
        title: 'Xác nhận hủy thao tác?',
        message: 'Bạn có chắc chắn muốn hủy bỏ và đóng cửa sổ này không? Dữ liệu đang nhập chưa lưu sẽ bị hủy.',
        confirmText: 'Chắc chắn hủy & Thoát',
        cancelText: 'Tiếp tục chỉnh sửa',
        variant: 'danger',
        onConfirm: function () {
          closeModal(modalEl, null);
        }
      });
    } else {
      ev.preventDefault();
      ev.stopPropagation();
      closeModal(modalEl, null);
    }
  }, true);

  function confirmModal(opts) {
    const o = opts || {};
    const modalId = 'ip-confirm-modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    const variant = o.variant || 'primary';
    const reqReason = Boolean(o.requireReason);

    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.style.zIndex = '1075';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="modal-dialog modal-dialog-centered">' +
        '<div class="modal-content shadow-lg border-primary">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title fs-5 fw-bold">' + IP.Utils.escapeHtml(o.title || 'Xác nhận thao tác') + '</h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p class="mb-2">' + IP.Utils.escapeHtml(o.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?') + '</p>' +
            (reqReason
              ? '<div class="mt-3">' +
                  '<label class="form-label" for="ip-confirm-reason">' + IP.Utils.escapeHtml(o.reasonLabel || 'Lý do thực hiện (bắt buộc)') + '</label>' +
                  '<textarea id="ip-confirm-reason" class="form-control" rows="2" placeholder="' + IP.Utils.escapeHtml(o.reasonPlaceholder || 'Nhập lý do cụ thể...') + '"></textarea>' +
                  '<div id="ip-confirm-reason-err" class="invalid-feedback d-none" role="alert">Vui lòng nhập lý do trước khi xác nhận.</div>' +
                '</div>'
              : '') +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">' + IP.Utils.escapeHtml(o.cancelText || 'Hủy bỏ') + '</button>' +
            '<button type="button" class="btn btn-' + IP.Utils.escapeHtml(variant) + '" id="ip-confirm-submit-btn">' + IP.Utils.escapeHtml(o.confirmText || 'Xác nhận') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modalEl);
    const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(modalEl) : null;
    const submitBtn = modalEl.querySelector('#ip-confirm-submit-btn');

    submitBtn.addEventListener('click', function () {
      let reasonVal = '';
      if (reqReason) {
        const input = modalEl.querySelector('#ip-confirm-reason');
        const errEl = modalEl.querySelector('#ip-confirm-reason-err');
        reasonVal = String(input.value || '').trim();
        if (!reasonVal) {
          input.classList.add('is-invalid');
          errEl.classList.remove('d-none');
          input.focus();
          return;
        }
      }
      closeModal(modalEl, bsModal);
      if (typeof o.onConfirm === 'function') {
        o.onConfirm(reasonVal);
      }
    });

    if (bsModal) bsModal.show();
    else modalEl.style.display = 'block';
  }

  function viewStateMode() {
    const params = IP.Utils.getQueryParams();
    const d = String(params.state || params.view || '').toLowerCase();
    if (['loading', 'empty', 'error'].includes(d)) return d;
    return null;
  }

  function renderEmptyState(opts) {
    const o = opts || {};
    return (
      '<div class="ip-state-box">' +
        '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="10" y="8" width="44" height="48" rx="8" stroke="currentColor" stroke-width="2.5"/>' +
          '<path d="M20 22H44M20 32H44M20 42H32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>' +
        '<h3 class="fs-5 fw-bold mb-2">' + IP.Utils.escapeHtml(o.title || 'Không có dữ liệu phù hợp') + '</h3>' +
        '<p class="text-muted small mb-3">' + IP.Utils.escapeHtml(o.description || 'Chưa có bản ghi nào khớp với điều kiện đang chọn.') + '</p>' +
        (o.actionText
          ? '<button type="button" class="btn btn-primary btn-sm" data-action="' + IP.Utils.escapeHtml(o.actionAttr || 'clear-filters') + '">' +
              IP.Utils.escapeHtml(o.actionText) +
            '</button>'
          : '') +
      '</div>'
    );
  }

  function renderErrorState(opts) {
    const o = opts || {};
    return (
      '<div class="ip-state-box" role="alert">' +
        '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="32" cy="32" r="24" stroke="var(--ip-danger)" stroke-width="2.5"/>' +
          '<path d="M32 20V35" stroke="var(--ip-danger)" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="32" cy="43" r="2" fill="var(--ip-danger)"/>' +
        '</svg>' +
        '<h3 class="fs-5 fw-bold mb-2">' + IP.Utils.escapeHtml(o.title || 'Không thể tải dữ liệu lúc này') + '</h3>' +
        '<p class="text-muted small mb-2">' + IP.Utils.escapeHtml(o.description || 'Đã xảy ra sự cố kết nối khi truy xuất dữ liệu. Bạn có thể bấm Thử lại để khôi phục hiển thị bình thường.') + '</p>' +
        '<div class="small text-muted mb-3">Mã trạng thái: <code>' + IP.Utils.escapeHtml(o.code || 'ERR_DATA_SYNC') + '</code></div>' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="' + IP.Utils.escapeHtml(o.retryAction || 'exit-view-state') + '">' +
          '<i class="bi bi-arrow-clockwise"></i> Thử lại ngay' +
        '</button>' +
      '</div>'
    );
  }

  function renderSkeletonBlock(rows) {
    const count = rows || 5;
    let html = '<div class="p-4" aria-busy="true" aria-label="Đang tải dữ liệu">';
    for (let i = 0; i < count; i++) {
      html += '<div class="ip-skeleton mb-3" style="height: 42px; width: 100%;"></div>';
    }
    html += '</div>';
    return html;
  }

  function withLoading(containerEl, renderFn) {
    if (!containerEl || typeof renderFn !== 'function') return;
    const mode = viewStateMode();
    if (mode === 'loading') {
      containerEl.innerHTML = renderSkeletonBlock(6);
      setTimeout(function () {
        renderFn();
      }, 1450);
      return;
    }
    if (mode === 'error') {
      containerEl.innerHTML = renderErrorState({
        title: 'Gián đoạn truy xuất dữ liệu',
        description: 'Đang hiển thị trạng thái kiểm thử lỗi kết nối. Nhấn Thử lại để khôi phục dữ liệu bình thường.',
        code: 'ERR_SYNC_TIMEOUT'
      });
      bindStateExit(containerEl, renderFn);
      return;
    }
    if (mode === 'empty') {
      containerEl.innerHTML = renderEmptyState({
        title: 'Danh sách trống',
        description: 'Đang hiển thị trạng thái danh sách rỗng. Dữ liệu sổ kế toán trong trình duyệt vẫn được bảo toàn.',
        actionText: 'Tải lại danh sách đầy đủ',
        actionAttr: 'exit-view-state'
      });
      bindStateExit(containerEl, renderFn);
      return;
    }
    renderFn();
  }

  function bindStateExit(containerEl, renderFn) {
    const btn = containerEl.querySelector('[data-action="exit-view-state"]');
    if (btn) {
      btn.addEventListener('click', function () {
        IP.Utils.setQueryParams({ state: null, view: null });
        renderFn();
      });
    }
  }

  function renderPagination(opts) {
    const total = Number(opts.total || 0);
    const page = Number(opts.page || 1);
    const perPage = Number(opts.perPage || 10);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (total === 0) return '';

    const startIdx = (page - 1) * perPage + 1;
    const endIdx = Math.min(total, page * perPage);

    let btns = '';
    btns += '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="page-change" data-page="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + ' aria-label="Trang trước"><i class="bi bi-chevron-left"></i></button>';
    for (let p = 1; p <= totalPages; p++) {
      btns += '<button type="button" class="btn btn-sm ' + (p === page ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="page-change" data-page="' + p + '">' + p + '</button>';
    }
    btns += '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="page-change" data-page="' + (page + 1) + '" ' + (page >= totalPages ? 'disabled' : '') + ' aria-label="Trang sau"><i class="bi bi-chevron-right"></i></button>';

    return (
      '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-3 border-top">' +
        '<div class="small text-muted">Hiển thị <strong>' + startIdx + '–' + endIdx + '</strong> trong <strong>' + total + '</strong> bản ghi</div>' +
        '<div class="d-flex align-items-center gap-1">' + btns + '</div>' +
      '</div>'
    );
  }

  function downloadCSV(filenamePrefix, headers, rows) {
    const today = IP.Seed ? IP.Seed.todayISO() : new Date().toISOString().slice(0, 10);
    const fname = (filenamePrefix || 'invoicepilot-export') + '-' + today + '.csv';
    const escapeCell = function (val) {
      const s = val === null || val === undefined ? '' : String(val);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const lines = [];
    if (Array.isArray(headers) && headers.length) {
      lines.push(headers.map(escapeCell).join(','));
    }
    (rows || []).forEach(function (r) {
      lines.push(r.map(escapeCell).join(','));
    });
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast({ title: 'Đã xuất tệp CSV', message: 'Tệp ' + fname + ' đã được tải xuống (UTF-8 BOM).', type: 'success' });
  }

  function openPaymentModal(opts) {
    const o = opts || {};
    const inv = IP.DB.getInvoice(o.invoiceId);
    if (!inv) {
      toast({ title: 'Không tìm thấy hóa đơn', message: 'Vui lòng chọn một hóa đơn hợp lệ.', type: 'danger' });
      return;
    }
    const rem = IP.Calc.remaining(inv);
    if (rem <= 0) {
      toast({ title: 'Hóa đơn đã thu đủ', message: 'Hóa đơn ' + inv.number + ' không còn số dư phải thu.', type: 'info' });
      return;
    }
    const cus = IP.DB.getCustomer(inv.customerId);
    const today = IP.Seed.todayISO();

    const modalId = 'ip-payment-modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML =
      '<div class="modal-dialog modal-dialog-centered">' +
        '<div class="modal-content">' +
          '<form id="ip-payment-form" novalidate>' +
            '<div class="modal-header">' +
              '<div>' +
                '<h2 class="modal-title fs-5 fw-bold">Ghi nhận thanh toán · ' + IP.Utils.escapeHtml(inv.number) + '</h2>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus ? cus.name : '') + ' · Còn phải thu: <strong class="ip-num">' + IP.Fmt.currency(rem) + '</strong></div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div id="ip-pay-err-box" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="ip-pay-amount">Số tiền nhận (VND) <span class="text-danger">*</span></label>' +
                '<input type="number" id="ip-pay-amount" class="form-control ip-num" value="' + rem + '" min="1" max="' + rem + '" required>' +
                '<div class="form-text">Tối đa bằng số còn phải thu: ' + IP.Fmt.currency(rem) + '</div>' +
              '</div>' +
              '<div class="row g-3 mb-3">' +
                '<div class="col-sm-6">' +
                  '<label class="form-label" for="ip-pay-method">Phương thức thanh toán</label>' +
                  '<select id="ip-pay-method" class="form-select">' +
                    '<option value="transfer">Chuyển khoản ngân hàng</option>' +
                    '<option value="cash">Tiền mặt</option>' +
                    '<option value="ewallet">Ví điện tử doanh nghiệp</option>' +
                  '</select>' +
                '</div>' +
                '<div class="col-sm-6">' +
                  '<label class="form-label" for="ip-pay-date">Ngày nhận tiền <span class="text-danger">*</span></label>' +
                  '<input type="date" id="ip-pay-date" class="form-control" value="' + today + '" min="' + inv.issueDate + '" max="' + today + '" required>' +
                '</div>' +
              '</div>' +
              '<div class="mb-3">' +
                '<label class="form-label" for="ip-pay-ref">Mã tham chiếu / Ủy nhiệm chi</label>' +
                '<input type="text" id="ip-pay-ref" class="form-control" value="UNC-' + inv.number.slice(-4) + '-' + String(Date.now()).slice(-3) + '" placeholder="VD: VCB20260988">' +
              '</div>' +
              '<div class="mb-1">' +
                '<label class="form-label" for="ip-pay-note">Ghi chú kế toán</label>' +
                '<textarea id="ip-pay-note" class="form-control" rows="2" placeholder="Nhập ghi chú đợt thu tiền..."></textarea>' +
              '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
              '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
              '<button type="submit" class="btn btn-primary" id="ip-pay-submit"><i class="bi bi-check2-circle"></i> Lưu thanh toán</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modalEl);
    const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(modalEl) : null;
    const form = modalEl.querySelector('#ip-payment-form');
    const errBox = modalEl.querySelector('#ip-pay-err-box');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.classList.add('d-none');
      const amount = Number(modalEl.querySelector('#ip-pay-amount').value);
      const method = modalEl.querySelector('#ip-pay-method').value;
      const paidAt = modalEl.querySelector('#ip-pay-date').value;
      const reference = modalEl.querySelector('#ip-pay-ref').value;
      const note = modalEl.querySelector('#ip-pay-note').value;

      const res = IP.DB.addPayment({
        invoiceId: inv.id,
        amount: amount,
        method: method,
        paidAt: paidAt,
        reference: reference,
        note: note
      });

      if (!res.ok) {
        errBox.textContent = res.error.message;
        errBox.classList.remove('d-none');
        if (res.error.field === 'amount') modalEl.querySelector('#ip-pay-amount').focus();
        if (res.error.field === 'paidAt') modalEl.querySelector('#ip-pay-date').focus();
        return;
      }

      if (bsModal) bsModal.hide();
      else modalEl.remove();
      toast({
        title: 'Đã ghi nhận thanh toán',
        message: 'Đã thu ' + IP.Fmt.currency(amount) + ' cho hóa đơn ' + inv.number + '.',
        type: 'success'
      });
      if (typeof o.onSaved === 'function') {
        o.onSaved(res.data);
      }
    });

    if (bsModal) bsModal.show();
    else modalEl.style.display = 'block';
  }

  function openCustomerPicker(opts) {
    const o = opts || {};
    const customers = IP.DB.listCustomers({ status: 'active' });
    const modalId = 'ip-customer-picker-modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML =
      '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title fs-5 fw-bold">Chọn khách hàng (Chỉ hiển thị doanh nghiệp đang hoạt động)</h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="mb-3">' +
              '<label class="form-label visually-hidden" for="ip-cus-picker-q">Tìm khách hàng</label>' +
              '<input type="search" id="ip-cus-picker-q" class="form-control" placeholder="Tìm theo tên công ty, mã KH, MST hoặc người liên hệ...">' +
            '</div>' +
            '<div id="ip-cus-picker-list" class="list-group"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modalEl);
    const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(modalEl) : null;
    const listEl = modalEl.querySelector('#ip-cus-picker-list');
    const searchInput = modalEl.querySelector('#ip-cus-picker-q');

    function renderList(q) {
      const term = String(q || '').trim().toLowerCase();
      const filtered = customers.filter(function (c) {
        if (!term) return true;
        return c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          (c.taxCode && c.taxCode.toLowerCase().includes(term)) ||
          (c.contactName && c.contactName.toLowerCase().includes(term));
      });
      if (!filtered.length) {
        listEl.innerHTML = '<div class="text-center text-muted py-4">Không tìm thấy khách hàng khớp từ khóa.</div>';
        return;
      }
      listEl.innerHTML = filtered.map(function (c) {
        const bal = IP.Calc.customerBalance(c.id);
        const activeCls = c.id === o.selectedId ? 'active' : '';
        return (
          '<button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ' + activeCls + '" data-cus-id="' + c.id + '">' +
            '<div>' +
              '<div class="fw-bold">' + IP.Utils.escapeHtml(c.name) + ' <span class="badge bg-secondary ms-1">' + IP.Utils.escapeHtml(c.code) + '</span></div>' +
              '<div class="small opacity-75">Liên hệ: ' + IP.Utils.escapeHtml(c.contactName) + ' · ' + IP.Utils.escapeHtml(c.email) + ' · Hạn chuẩn: ' + c.paymentTermDays + ' ngày</div>' +
            '</div>' +
            '<div class="text-end">' +
              '<div class="small fw-semibold ip-num">Dư nợ: ' + IP.Fmt.currency(bal.totalReceivable) + '</div>' +
              '<div class="small opacity-75 ip-num">Hạn mức: ' + IP.Fmt.currency(c.creditLimit) + '</div>' +
            '</div>' +
          '</button>'
        );
      }).join('');
    }

    renderList('');
    searchInput.addEventListener('input', function () {
      renderList(searchInput.value);
    });

    listEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-cus-id]');
      if (!btn) return;
      const chosen = IP.DB.getCustomer(btn.getAttribute('data-cus-id'));
      if (bsModal) bsModal.hide();
      else modalEl.remove();
      if (chosen && typeof o.onSelect === 'function') {
        o.onSelect(chosen);
      }
    });

    if (bsModal) bsModal.show();
    else modalEl.style.display = 'block';
  }

  function renderInvoicePrint(invoice) {
    if (!invoice) return '';
    const settings = IP.DB.getSettings();
    const comp = settings.company || {};
    const cus = IP.DB.getCustomer(invoice.customerId) || {};
    const rem = IP.Calc.remaining(invoice);
    const rowsHtml = (invoice.items || []).map(function (it, idx) {
      return (
        '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td>' + IP.Utils.escapeHtml(it.description) + '</td>' +
          '<td>' + IP.Utils.escapeHtml(it.unit || 'Gói') + '</td>' +
          '<td class="text-end ip-num">' + IP.Fmt.number(it.quantity) + '</td>' +
          '<td class="text-end ip-num">' + IP.Fmt.currency(it.unitPrice, false, invoice.issueDate) + '</td>' +
          '<td class="text-end ip-num">' + IP.Fmt.percent(it.discountPercent || 0) + '</td>' +
          '<td class="text-end ip-num">' + IP.Fmt.percent(it.vatRate || 0) + '</td>' +
          '<td class="text-end fw-semibold ip-num">' + IP.Fmt.currency(it.lineTotal, false, invoice.issueDate) + '</td>' +
        '</tr>'
      );
    }).join('');

    return (
      '<div class="p-4 border rounded bg-white text-dark">' +
        '<div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">' +
          '<div>' +
            '<div class="fw-bold fs-5">' + IP.Utils.escapeHtml(comp.name) + '</div>' +
            '<div class="small">MST: ' + IP.Utils.escapeHtml(comp.taxCode) + ' · ĐT: ' + IP.Utils.escapeHtml(comp.phone) + '</div>' +
            '<div class="small">Địa chỉ: ' + IP.Utils.escapeHtml(comp.address) + '</div>' +
          '</div>' +
          '<div class="text-end">' +
            '<div class="fw-bold fs-4 text-uppercase">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>' +
            '<div class="small">Mẫu số: <strong>' + IP.Utils.escapeHtml(comp.eInvoiceFormCode || '1') + '</strong> · Ký hiệu: <strong>' + IP.Utils.escapeHtml(comp.eInvoiceSymbol || '1C26TAA') + '</strong></div>' +
            '<div class="fw-semibold">Số: ' + IP.Utils.escapeHtml(invoice.number) + '</div>' +
            '<div class="small">Ngày phát hành: ' + IP.Fmt.date(invoice.issueDate) + ' · Hạn TT: ' + IP.Fmt.date(invoice.dueDate) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row g-3 mb-3 small">' +
          '<div class="col-sm-7">' +
            '<div class="fw-bold">Đơn vị mua hàng: ' + IP.Utils.escapeHtml(cus.name || '—') + '</div>' +
            '<div>Mã số thuế: ' + IP.Utils.escapeHtml(cus.taxCode || '—') + ' · Mã KH: ' + IP.Utils.escapeHtml(cus.code || '—') + '</div>' +
            '<div>Địa chỉ: ' + IP.Utils.escapeHtml(cus.address || '—') + '</div>' +
            '<div>Người liên hệ: ' + IP.Utils.escapeHtml(cus.contactName || '—') + ' (' + IP.Utils.escapeHtml(cus.email || '') + ')</div>' +
          '</div>' +
          '<div class="col-sm-5 text-sm-end">' +
            '<div class="fw-bold">Tài khoản thụ hưởng:</div>' +
            '<div>' + IP.Utils.escapeHtml(comp.bankName) + '</div>' +
            '<div>Số TK: <strong>' + IP.Utils.escapeHtml(comp.bankAccount) + '</strong> (' + IP.Utils.escapeHtml(comp.bankBranch) + ')</div>' +
          '</div>' +
        '</div>' +
        '<div class="table-responsive mb-3">' +
          '<table class="table table-sm table-bordered text-dark mb-0">' +
            '<thead>' +
              '<tr>' +
                '<th>#</th><th>Nội dung hàng hóa / dịch vụ</th><th>ĐVT</th><th class="text-end">SL</th>' +
                '<th class="text-end">Đơn giá</th><th class="text-end">CK</th><th class="text-end">VAT</th><th class="text-end">Thành tiền</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="row justify-content-end mb-3">' +
          '<div class="col-sm-5">' +
            '<div class="d-flex justify-content-between small py-1"><span>Cộng tiền hàng:</span><span class="ip-num">' + IP.Fmt.currency(invoice.subtotal, false, invoice.issueDate) + '</span></div>' +
            '<div class="d-flex justify-content-between small py-1"><span>Chiết khấu:</span><span class="ip-num">-' + IP.Fmt.currency(invoice.discountTotal, false, invoice.issueDate) + '</span></div>' +
            '<div class="d-flex justify-content-between small py-1"><span>Thuế GTGT:</span><span class="ip-num">' + IP.Fmt.currency(invoice.vatTotal, false, invoice.issueDate) + '</span></div>' +
            '<div class="d-flex justify-content-between fw-bold border-top pt-2 mt-1"><span>Tổng thanh toán:</span><span class="ip-num">' + IP.Fmt.currency(invoice.total, false, invoice.issueDate) + '</span></div>' +
            '<div class="d-flex justify-content-between small text-muted pt-1"><span>Đã thu xác nhận:</span><span class="ip-num">' + IP.Fmt.currency(invoice.paidAmount, false, invoice.issueDate) + '</span></div>' +
            '<div class="d-flex justify-content-between fw-semibold pt-1"><span>Còn phải thu:</span><span class="ip-num">' + IP.Fmt.currency(rem) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="small border-top pt-2 text-muted d-flex justify-content-between flex-wrap gap-2">' +
          '<span>Ghi chú: ' + IP.Utils.escapeHtml(invoice.notes || settings.invoiceDefaults.defaultTerms) + '</span>' +
          '<strong>Bản thể hiện của hóa đơn điện tử theo Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC</strong>' +
        '</div>' +
      '</div>'
    );
  }

  applyTheme(getThemeChoice());

  IP.UI = {
    getThemeChoice: getThemeChoice,
    applyTheme: applyTheme,
    toast: toast,
    statusBadge: statusBadge,
    riskBadge: riskBadge,
    roleBadge: roleBadge,
    closeModal: closeModal,
    confirmModal: confirmModal,
    viewStateMode: viewStateMode,
    withLoading: withLoading,
    renderEmptyState: renderEmptyState,
    renderErrorState: renderErrorState,
    renderSkeletonBlock: renderSkeletonBlock,
    renderPagination: renderPagination,
    downloadCSV: downloadCSV,
    openPaymentModal: openPaymentModal,
    openCustomerPicker: openCustomerPicker,
    renderInvoicePrint: renderInvoicePrint
  };
})(window);
