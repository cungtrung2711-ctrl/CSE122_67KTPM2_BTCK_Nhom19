/**
 * @owner SV4
 * @spec §8.4 Admin Customer Management Page Script (admin-customers.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  const INDUSTRIES = ['Thực phẩm', 'Bao bì', 'Nội thất', 'Xây dựng', 'Vận tải', 'May mặc', 'Công nghệ', 'Thương mại'];

  IP.Pages.register('admin-customer-management', {
    roles: ['admin'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const filterState = {
        q: params.q || '',
        status: params.status || 'active',
        industry: 'all',
        ownerId: 'all',
        page: 1,
        perPage: 10
      };

      function render() {
        const allCustomers = IP.DB.listCustomers({ includeArchived: true, status: 'all' });
        const activeCount = allCustomers.filter(function (c) { return c.status === 'active'; }).length;
        const overdueCusCount = allCustomers.filter(function (c) {
          return c.status === 'active' && IP.Calc.customerBalance(c.id).overdueAmount > 0;
        }).length;
        const monthAgo = IP.Seed.addDays(-30);
        const newThisMonth = allCustomers.filter(function (c) { return c.createdAt >= monthAgo; }).length;

        const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
        const filtered = IP.DB.listCustomers({
          q: filterState.q,
          status: filterState.status,
          industry: filterState.industry,
          ownerId: filterState.ownerId,
          includeArchived: filterState.status === 'archived' || filterState.status === 'all'
        });

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / filterState.perPage));
        if (filterState.page > totalPages) filterState.page = 1;
        const pageItems = filtered.slice((filterState.page - 1) * filterState.perPage, filterState.page * filterState.perPage);

        const rowsHtml = pageItems.map(function (c) {
          const bal = IP.Calc.customerBalance(c.id);
          const owner = IP.DB.getUser(c.ownerId);
          const canArchive = bal.totalReceivable === 0 && c.status !== 'archived';

          return (
            '<tr>' +
              '<td data-label="Mã KH"><span class="font-monospace fw-bold">' + IP.Utils.escapeHtml(c.code) + '</span></td>' +
              '<td data-label="Tên doanh nghiệp">' +
                '<a href="admin-customer-management.html?open=' + c.id + '" class="fw-bold text-decoration-none" data-action="open-drawer" data-id="' + c.id + '">' + IP.Utils.escapeHtml(c.name) + '</a>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(c.industry) + ' · Hạn chuẩn: ' + c.paymentTermDays + ' ngày</div>' +
              '</td>' +
              '<td data-label="Mã số thuế"><span class="font-monospace small">' + IP.Utils.escapeHtml(c.taxCode || '—') + '</span></td>' +
              '<td data-label="Người liên hệ">' +
                '<div class="fw-semibold">' + IP.Utils.escapeHtml(c.contactName) + '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(c.email) + ' · ' + IP.Utils.escapeHtml(c.phone) + '</div>' +
              '</td>' +
              '<td data-label="Phụ trách KD">' + IP.Utils.escapeHtml(owner ? owner.name : '—') + '</td>' +
              '<td data-label="Dư nợ hiện tại" class="text-end ip-num fw-bold ' + (bal.totalReceivable > 0 ? 'text-body' : 'text-muted') + '">' + IP.Fmt.currency(bal.totalReceivable) + '</td>' +
              '<td data-label="Trạng thái">' + IP.UI.statusBadge(c.status) + '</td>' +
              '<td data-label="Thao tác" class="text-end">' +
                '<div class="btn-group">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="open-drawer" data-id="' + c.id + '" title="Xem chi tiết"><i class="bi bi-eye"></i></button>' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-customer" data-id="' + c.id + '" title="Chỉnh sửa"><i class="bi bi-pencil"></i></button>' +
                  (c.status === 'archived'
                    ? '<button type="button" class="btn btn-sm btn-outline-success" data-action="unarchive-customer" data-id="' + c.id + '" title="Khôi phục hoạt động"><i class="bi bi-arrow-counterclockwise"></i></button>'
                    : '<button type="button" class="btn btn-sm btn-outline-danger" data-action="archive-customer" data-id="' + c.id + '" ' +
                        (!canArchive ? 'disabled title="Không thể lưu trữ: Khách hàng đang còn dư nợ ' + IP.Fmt.currency(bal.totalReceivable) + '. Vui lòng tất toán trước."' : 'title="Lưu trữ khách hàng"') + '>' +
                        '<i class="bi bi-archive"></i>' +
                      '</button>') +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Quản lý khách hàng</h1>' +
              '<p class="ip-page-subtitle">Quản trị danh mục doanh nghiệp đối tác, hạn mức tín dụng, kỳ hạn chuẩn và phân công chuyên viên Kinh doanh.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-primary" data-action="create-customer"><i class="bi bi-plus-lg"></i> Thêm khách hàng</button>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid">' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Tổng số khách hàng</div><div class="ip-kpi-value mt-1">' + allCustomers.length + ' doanh nghiệp</div><div class="ip-kpi-sub">Trong toàn hệ thống</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Đang hoạt động</div><div class="ip-kpi-value mt-1 text-success">' + activeCount + ' khách hàng</div><div class="ip-kpi-sub">Đủ điều kiện phát hành HĐ</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Đang có nợ quá hạn</div><div class="ip-kpi-value mt-1 text-danger">' + overdueCusCount + ' khách hàng</div><div class="ip-kpi-sub">Cần phối hợp thu hồi</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Mới trong 30 ngày</div><div class="ip-kpi-value mt-1 text-primary">' + newThisMonth + ' khách hàng</div><div class="ip-kpi-sub">Mở mới kỳ này</div></div>' +
          '</section>' +

          '<section class="ip-filter-bar">' +
            '<div class="row g-2 align-items-end">' +
              '<div class="col-md-4">' +
                '<label class="form-label" for="adm-cus-q">Tìm kiếm khách hàng</label>' +
                '<input type="search" id="adm-cus-q" class="form-control" value="' + IP.Utils.escapeHtml(filterState.q) + '" placeholder="Tên công ty, mã KH, MST, email...">' +
              '</div>' +
              '<div class="col-sm-4 col-md-3">' +
                '<label class="form-label" for="adm-cus-ind">Ngành nghề</label>' +
                '<select id="adm-cus-ind" class="form-select">' +
                  '<option value="all">Tất cả ngành nghề</option>' +
                  INDUSTRIES.map(function (ind) {
                    return '<option value="' + ind + '" ' + (filterState.industry === ind ? 'selected' : '') + '>' + ind + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div class="col-sm-4 col-md-3">' +
                '<label class="form-label" for="adm-cus-owner">Chuyên viên Kinh doanh</label>' +
                '<select id="adm-cus-owner" class="form-select">' +
                  '<option value="all">Tất cả chuyên viên</option>' +
                  salesUsers.map(function (u) {
                    return '<option value="' + u.id + '" ' + (filterState.ownerId === u.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(u.name) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div class="col-sm-4 col-md-2">' +
                '<label class="form-label" for="adm-cus-status">Trạng thái</label>' +
                '<select id="adm-cus-status" class="form-select">' +
                  '<option value="active" ' + (filterState.status === 'active' ? 'selected' : '') + '>Đang hoạt động</option>' +
                  '<option value="archived" ' + (filterState.status === 'archived' ? 'selected' : '') + '>Đã lưu trữ</option>' +
                  '<option value="all" ' + (filterState.status === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<div class="ip-table-wrap">' +
            (pageItems.length
              ? '<div class="table-responsive">' +
                  '<table class="table ip-table-responsive-cards align-middle">' +
                    '<thead><tr><th>Mã KH</th><th>Tên doanh nghiệp</th><th>Mã số thuế</th><th>Người liên hệ</th><th>Phụ trách KD</th><th class="text-end">Dư nợ hiện tại</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr></thead>' +
                    '<tbody>' + rowsHtml + '</tbody>' +
                  '</table>' +
                '</div>' +
                IP.UI.renderPagination({ total: total, page: filterState.page, perPage: filterState.perPage })
              : IP.UI.renderEmptyState({
                  title: 'Không tìm thấy khách hàng phù hợp',
                  description: 'Hãy thử đổi điều kiện lọc hoặc thêm khách hàng mới.',
                  actionText: 'Xóa bộ lọc',
                  actionAttr: 'clear-filters'
                })) +
          '</div>' +
          '<div id="adm-cus-drawer-host"></div>';

        const qEl = root.querySelector('#adm-cus-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            filterState.q = qEl.value;
            filterState.page = 1;
            render();
          }, 200));
        }
        [
          ['adm-cus-ind', 'industry'],
          ['adm-cus-owner', 'ownerId'],
          ['adm-cus-status', 'status']
        ].forEach(function (pair) {
          const sel = root.querySelector('#' + pair[0]);
          if (sel) {
            sel.addEventListener('change', function () {
              filterState[pair[1]] = sel.value;
              filterState.page = 1;
              render();
            });
          }
        });
      }

      function openCustomerDetailDrawer(customerId) {
        const c = IP.DB.getCustomer(customerId);
        if (!c) return;
        const bal = IP.Calc.customerBalance(c.id);
        const owner = IP.DB.getUser(c.ownerId);
        const recentInvs = IP.DB.listInvoices({ customerId: c.id, includeArchived: true }).slice(0, 6);
        const canArchive = bal.totalReceivable === 0 && c.status !== 'archived';

        const host = document.getElementById('adm-cus-drawer-host') || document.body;
        host.innerHTML =
          '<div class="offcanvas offcanvas-end ip-drawer-wide show" tabindex="-1" style="visibility:visible;" aria-modal="true" role="dialog">' +
            '<div class="offcanvas-header border-bottom">' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<h2 class="offcanvas-title fs-5 fw-bold mb-0">' + IP.Utils.escapeHtml(c.name) + '</h2>' +
                  IP.UI.statusBadge(c.status) +
                '</div>' +
                '<div class="small text-muted">Mã: ' + IP.Utils.escapeHtml(c.code) + ' · MST: ' + IP.Utils.escapeHtml(c.taxCode || '—') + '</div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-action="close-drawer" aria-label="Đóng"></button>' +
            '</div>' +
            '<div class="offcanvas-body">' +
              '<div class="p-3 rounded border bg-body-tertiary small mb-3">' +
                '<div class="mb-1"><strong>Người liên hệ:</strong> ' + IP.Utils.escapeHtml(c.contactName) + ' (' + IP.Utils.escapeHtml(c.phone) + ')</div>' +
                '<div class="mb-1"><strong>Email:</strong> <code>' + IP.Utils.escapeHtml(c.email) + '</code></div>' +
                '<div class="mb-1"><strong>Địa chỉ:</strong> ' + IP.Utils.escapeHtml(c.address || '—') + '</div>' +
                '<div class="mb-1"><strong>Phụ trách Kinh doanh:</strong> ' + IP.Utils.escapeHtml(owner ? owner.name : '—') + '</div>' +
                '<div class="mb-1"><strong>Kỳ hạn chuẩn:</strong> ' + c.paymentTermDays + ' ngày · <strong>Hạn mức:</strong> <span class="ip-num">' + IP.Fmt.currency(c.creditLimit) + '</span></div>' +
                '<div><strong>Dư nợ hiện tại:</strong> <span class="ip-num fw-bold ' + (bal.totalReceivable > 0 ? 'text-danger' : 'text-success') + '">' + IP.Fmt.currency(bal.totalReceivable) + '</span></div>' +
              '</div>' +
              (!canArchive && c.status !== 'archived'
                ? '<div class="alert alert-warning py-2 small mb-3"><i class="bi bi-lock me-1"></i><strong>Chặn lưu trữ:</strong> Khách hàng đang còn dư nợ ' + IP.Fmt.currency(bal.totalReceivable) + '. Gợi ý: Tất toán hết các hóa đơn mở của khách hàng này ở phân hệ Kế toán trước khi lưu trữ.</div>'
                : '') +
              '<h3 class="fs-6 fw-bold mb-2">Hóa đơn gần đây (' + recentInvs.length + ')</h3>' +
              (recentInvs.length
                ? '<ul class="list-group list-group-flush border rounded small mb-3">' +
                    recentInvs.map(function (inv) {
                      return '<li class="list-group-item d-flex justify-content-between align-items-center">' +
                        '<div><div class="fw-bold">' + IP.Utils.escapeHtml(inv.number) + '</div><div class="text-muted">Hạn: ' + IP.Fmt.date(inv.dueDate) + '</div></div>' +
                        '<div class="text-end"><div class="ip-num fw-semibold">' + IP.Fmt.currency(IP.Calc.remaining(inv)) + '</div>' + IP.UI.statusBadge(IP.Calc.effectiveStatus(inv)) + '</div>' +
                      '</li>';
                    }).join('') +
                  '</ul>'
                : '<p class="small text-muted">Chưa có hóa đơn.</p>') +
              '<div class="small text-muted"><strong>Ghi chú:</strong> ' + IP.Utils.escapeHtml(c.notes || 'Không có ghi chú.') + '</div>' +
            '</div>' +
            '<div class="offcanvas-header border-top bg-body-tertiary d-flex justify-content-between">' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="edit-customer" data-id="' + c.id + '"><i class="bi bi-pencil"></i> Chỉnh sửa</button>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="archive-customer" data-id="' + c.id + '" ' + (!canArchive ? 'disabled title="Còn dư nợ chưa tất toán"' : '') + '>' +
                '<i class="bi bi-archive"></i> Lưu trữ khách hàng' + (!canArchive ? ' (Còn dư nợ)' : '') +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="offcanvas-backdrop fade show" data-action="close-drawer"></div>';
      }

      function openCustomerFormModal(editId) {
        const existing = editId ? IP.DB.getCustomer(editId) : null;
        const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
        const mId = 'adm-cus-form-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();

        const d = existing || {
          code: 'KH-' + String(IP.DB.listCustomers({ includeArchived: true, status: 'all' }).length + 1).padStart(3, '0'),
          name: '',
          taxCode: '',
          industry: 'Thương mại',
          contactName: '',
          email: '',
          phone: '0901234567',
          address: '',
          paymentTermDays: 30,
          creditLimit: 150000000,
          ownerId: salesUsers[0] ? salesUsers[0].id : 'usr_sal',
          notes: ''
        };

        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-lg modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<form id="adm-cus-form" novalidate>' +
                '<div class="modal-header">' +
                  '<h2 class="modal-title fs-5 fw-bold">' + (existing ? ('Chỉnh sửa khách hàng · ' + IP.Utils.escapeHtml(existing.code)) : 'Thêm khách hàng mới') + '</h2>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div id="adm-cus-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                  '<div class="row g-3">' +
                    '<div class="col-md-8">' +
                      '<label class="form-label" for="cf-name">Tên doanh nghiệp <span class="text-danger">*</span></label>' +
                      '<input type="text" id="cf-name" class="form-control" value="' + IP.Utils.escapeHtml(d.name) + '" required>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-code">Mã khách hàng (Duy nhất)</label>' +
                      '<input type="text" id="cf-code" class="form-control font-monospace" value="' + IP.Utils.escapeHtml(d.code) + '" required>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-tax">Mã số thuế (10–13 chữ số)</label>' +
                      '<input type="text" id="cf-tax" class="form-control font-monospace" value="' + IP.Utils.escapeHtml(d.taxCode) + '" placeholder="0108899123">' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-ind">Ngành nghề</label>' +
                      '<select id="cf-ind" class="form-select">' +
                        INDUSTRIES.map(function (ind) {
                          return '<option value="' + ind + '" ' + (d.industry === ind ? 'selected' : '') + '>' + ind + '</option>';
                        }).join('') +
                      '</select>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-owner">Chuyên viên Kinh doanh phụ trách <span class="text-danger">*</span></label>' +
                      '<select id="cf-owner" class="form-select">' +
                        salesUsers.map(function (u) {
                          return '<option value="' + u.id + '" ' + (d.ownerId === u.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(u.name) + '</option>';
                        }).join('') +
                      '</select>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-contact">Người liên hệ <span class="text-danger">*</span></label>' +
                      '<input type="text" id="cf-contact" class="form-control" value="' + IP.Utils.escapeHtml(d.contactName) + '" required>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-email">Email liên hệ <span class="text-danger">*</span></label>' +
                      '<input type="email" id="cf-email" class="form-control" value="' + IP.Utils.escapeHtml(d.email) + '" required>' +
                    '</div>' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="cf-phone">Số điện thoại (VN)</label>' +
                      '<input type="tel" id="cf-phone" class="form-control" value="' + IP.Utils.escapeHtml(d.phone) + '">' +
                    '</div>' +
                    '<div class="col-md-6">' +
                      '<label class="form-label" for="cf-term">Hạn thanh toán mặc định (0–90 ngày)</label>' +
                      '<input type="number" id="cf-term" class="form-control ip-num" value="' + d.paymentTermDays + '" min="0" max="90">' +
                    '</div>' +
                    '<div class="col-md-6">' +
                      '<label class="form-label" for="cf-limit">Hạn mức tín dụng (VND)</label>' +
                      '<input type="number" id="cf-limit" class="form-control ip-num" value="' + d.creditLimit + '" min="0" step="5000000">' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<label class="form-label" for="cf-address">Địa chỉ trụ sở</label>' +
                      '<input type="text" id="cf-address" class="form-control" value="' + IP.Utils.escapeHtml(d.address || '') + '">' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<label class="form-label" for="cf-notes">Ghi chú quản trị</label>' +
                      '<textarea id="cf-notes" class="form-control" rows="2">' + IP.Utils.escapeHtml(d.notes || '') + '</textarea>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="submit" class="btn btn-primary"><i class="bi bi-check2-circle"></i> Lưu khách hàng</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#adm-cus-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          const errEl = mEl.querySelector('#adm-cus-err');
          errEl.classList.add('d-none');
          const payload = {
            name: mEl.querySelector('#cf-name').value,
            code: mEl.querySelector('#cf-code').value,
            taxCode: mEl.querySelector('#cf-tax').value,
            industry: mEl.querySelector('#cf-ind').value,
            ownerId: mEl.querySelector('#cf-owner').value,
            contactName: mEl.querySelector('#cf-contact').value,
            email: mEl.querySelector('#cf-email').value,
            phone: mEl.querySelector('#cf-phone').value,
            paymentTermDays: Number(mEl.querySelector('#cf-term').value),
            creditLimit: Number(mEl.querySelector('#cf-limit').value),
            address: mEl.querySelector('#cf-address').value,
            notes: mEl.querySelector('#cf-notes').value
          };

          if (!payload.name || !payload.contactName || !payload.email) {
            errEl.textContent = 'Vui lòng nhập đầy đủ Tên doanh nghiệp, Người liên hệ và Email liên hệ.';
            errEl.classList.remove('d-none');
            return;
          }

          IP.UI.confirmModal({
            title: existing ? 'Xác nhận lưu cập nhật khách hàng?' : 'Xác nhận lưu khách hàng mới?',
            message: 'Bạn có chắc chắn muốn lưu hồ sơ khách hàng "' + payload.name + '" và đóng cửa sổ này không?',
            confirmText: 'Chắc chắn lưu & Thoát',
            cancelText: 'Kiểm tra lại',
            variant: 'primary',
            onConfirm: function () {
              const res = existing ? IP.DB.updateCustomer(existing.id, payload) : IP.DB.createCustomer(payload);
              if (!res.ok) {
                errEl.textContent = res.error.message;
                errEl.classList.remove('d-none');
                return;
              }
              if (IP.UI && IP.UI.closeModal) IP.UI.closeModal(mEl, bsModal);
              else if (bsModal) bsModal.hide();
              else mEl.remove();
              const host = document.getElementById('adm-cus-drawer-host');
              if (host) host.innerHTML = '';
              IP.Utils.setQueryParams({ open: null });
              IP.UI.toast({
                title: existing ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng mới',
                message: res.data.name + ' (' + res.data.code + ')',
                type: 'success'
              });
              render();
            }
          });
        });
        if (bsModal) bsModal.show();
      }

      IP.UI.withLoading(root, function () {
        render();
        if (params.open) openCustomerDetailDrawer(params.open);
      });

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'open-drawer') {
          ev.preventDefault();
          openCustomerDetailDrawer(id);
        } else if (action === 'close-drawer') {
          const host = document.getElementById('adm-cus-drawer-host');
          if (host) host.innerHTML = '';
          IP.Utils.setQueryParams({ open: null });
        } else if (action === 'create-customer') {
          openCustomerFormModal(null);
        } else if (action === 'edit-customer') {
          openCustomerFormModal(id);
        } else if (action === 'archive-customer') {
          IP.UI.confirmModal({
            title: 'Lưu trữ khách hàng này?',
            message: 'Khách hàng đã lưu trữ sẽ ẩn khỏi danh sách mặc định và không xuất hiện trong bộ chọn khi lập hóa đơn mới.',
            confirmText: 'Lưu trữ khách hàng',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.archiveCustomer(id);
              if (!res.ok) {
                IP.UI.toast({ title: 'Chặn lưu trữ', message: res.error.message, type: 'danger' });
                return;
              }
              IP.UI.toast({ title: 'Đã lưu trữ khách hàng', message: res.data.name, type: 'success' });
              render();
            }
          });
        } else if (action === 'unarchive-customer') {
          IP.DB.unarchiveCustomer(id);
          IP.UI.toast({ title: 'Đã khôi phục khách hàng', message: 'Khách hàng đã trở lại trạng thái Đang hoạt động.', type: 'success' });
          render();
        } else if (action === 'page-change') {
          filterState.page = Number(btn.getAttribute('data-page') || 1);
          render();
        } else if (action === 'clear-filters') {
          filterState.q = '';
          filterState.industry = 'all';
          filterState.ownerId = 'all';
          filterState.status = 'active';
          IP.Utils.setQueryParams({ state: null });
          render();
        }
      });
    }
  });
})(window);
