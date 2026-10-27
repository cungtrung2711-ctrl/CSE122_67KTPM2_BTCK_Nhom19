/**
 * @owner SV2
 * @spec §8.2 Sales Invoice Detail & Picker Page Script (invoice-detail.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('sales-invoice-detail', {
    roles: ['sales'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentId = params.id || '';
      let pickerQuery = '';

      function renderPickerState(invalidNotice) {
        const invoices = IP.DB.listInvoices({ q: pickerQuery, includeArchived: false })
          .filter(function (inv) { return Boolean(inv.sentAt); })
          .slice(0, 15);

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Tra cứu chi tiết hóa đơn</h1>' +
              '<p class="ip-page-subtitle">Chọn một hóa đơn bên dưới để xem chi tiết công nợ, lịch sử thu tiền, in hóa đơn hoặc gửi nhắc thanh toán.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<a href="sales-customer-balance.html" class="btn btn-outline-secondary"><i class="bi bi-building-check"></i> Công nợ khách hàng</a>' +
            '</div>' +
          '</div>' +
          (invalidNotice ? '<div class="alert alert-warning small mb-3" role="status"><i class="bi bi-info-circle me-1"></i>' + IP.Utils.escapeHtml(invalidNotice) + '</div>' : '') +
          '<div class="ip-filter-bar mb-3">' +
            '<label class="form-label" for="sal-pick-q">Tìm theo số hóa đơn hoặc tên khách hàng</label>' +
            '<input type="search" id="sal-pick-q" class="form-control" value="' + IP.Utils.escapeHtml(pickerQuery) + '" placeholder="Nhập mã IP-2026-0001 hoặc tên công ty...">' +
          '</div>' +
          '<div class="ip-table-wrap">' +
            '<div class="table-responsive">' +
              '<table class="table ip-table-responsive-cards align-middle">' +
                '<thead><tr><th>Số hóa đơn</th><th>Khách hàng</th><th>Hạn thanh toán</th><th class="text-end">Tổng tiền</th><th class="text-end">Còn phải thu</th><th>Trạng thái</th><th class="text-end">Mở</th></tr></thead>' +
                '<tbody>' +
                  invoices.map(function (inv) {
                    const cus = IP.DB.getCustomer(inv.customerId);
                    return '<tr>' +
                      '<td data-label="Số hóa đơn" class="fw-bold">' + IP.Utils.escapeHtml(inv.number) + '</td>' +
                      '<td data-label="Khách hàng">' + IP.Utils.escapeHtml(cus ? cus.name : inv.customerId) + '</td>' +
                      '<td data-label="Hạn thanh toán">' + IP.Fmt.date(inv.dueDate) + '</td>' +
                      '<td data-label="Tổng tiền" class="text-end ip-num">' + IP.Fmt.currency(inv.total, false, inv.issueDate) + '</td>' +
                      '<td data-label="Còn phải thu" class="text-end ip-num fw-bold">' + IP.Fmt.currency(IP.Calc.remaining(inv)) + '</td>' +
                      '<td data-label="Trạng thái">' + IP.UI.statusBadge(IP.Calc.effectiveStatus(inv)) + '</td>' +
                      '<td data-label="Mở" class="text-end"><button type="button" class="btn btn-sm btn-primary" data-action="pick-invoice" data-id="' + inv.id + '">Xem chi tiết</button></td>' +
                    '</tr>';
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>';

        const qEl = root.querySelector('#sal-pick-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            pickerQuery = qEl.value;
            renderPickerState(invalidNotice);
          }, 200));
        }
      }

      function renderDetail() {
        if (!currentId) {
          renderPickerState('');
          return;
        }
        const inv = IP.DB.getInvoice(currentId);
        if (!inv) {
          renderPickerState('Mã hóa đơn "' + currentId + '" không tồn tại. Vui lòng chọn một hóa đơn hợp lệ từ danh sách.');
          return;
        }

        const cus = IP.DB.getCustomer(inv.customerId) || {};
        const eff = IP.Calc.effectiveStatus(inv);
        const rem = IP.Calc.remaining(inv);
        const ov = IP.Calc.overdueDays(inv);
        const daysLeft = IP.Calc.daysUntilDue(inv);
        const payments = IP.DB.listPayments({ invoiceId: inv.id });
        const pendingBank = IP.DB.listPayments({ customerId: inv.customerId, status: 'pending' });
        const activities = IP.DB.listActivities('invoice', inv.id);
        const canArchive = inv.paidAmount === 0 && !inv.archived;
        const canVoid = inv.paidAmount === 0 && !inv.voided;

        root.innerHTML =
          '<div class="ip-no-print">' +
            '<div class="ip-page-header">' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                  '<h1 class="ip-h1 mb-0">' + IP.Utils.escapeHtml(inv.number) + '</h1>' +
                  IP.UI.statusBadge(eff) +
                  (ov > 0 ? '<span class="badge bg-danger">Quá hạn ' + ov + ' ngày</span>' : '') +
                '</div>' +
                '<p class="ip-page-subtitle">' + IP.Utils.escapeHtml(cus.name || '') + ' · Phát hành: ' + IP.Fmt.date(inv.issueDate) + ' · Hạn thanh toán: ' + IP.Fmt.date(inv.dueDate) + '</p>' +
              '</div>' +
              '<div class="ip-page-actions">' +
                '<button type="button" class="btn btn-outline-secondary" data-action="switch-picker"><i class="bi bi-search"></i> Đổi hóa đơn</button>' +
                '<button type="button" class="btn btn-outline-secondary" data-action="print-invoice"><i class="bi bi-printer"></i> In hóa đơn</button>' +
                '<a href="sales-payment-reminders.html?customerId=' + inv.customerId + '&invoiceId=' + inv.id + '" class="btn btn-outline-primary ' + (rem <= 0 || inv.voided ? 'disabled' : '') + '"><i class="bi bi-envelope-paper"></i> Tạo nhắc thanh toán (AI-2)</a>' +
                '<button type="button" class="btn btn-primary" data-action="record-payment" ' + (rem <= 0 || inv.voided ? 'disabled title="Hóa đơn đã thu đủ hoặc đã hủy"' : '') + '><i class="bi bi-cash-coin"></i> Ghi nhận thanh toán</button>' +
                '<div class="dropdown">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-toggle="dropdown" aria-label="Menu tác vụ phụ"><i class="bi bi-three-dots-vertical"></i></button>' +
                  '<ul class="dropdown-menu dropdown-menu-end shadow-sm">' +
                    '<li><button type="button" class="dropdown-item" data-action="update-due-date" ' + (inv.voided ? 'disabled' : '') + '><i class="bi bi-calendar-plus me-2"></i>Cập nhật hạn thanh toán</button></li>' +
                    '<li><hr class="dropdown-divider"></li>' +
                    '<li><button type="button" class="dropdown-item" data-action="archive-inv" ' + (!canArchive ? 'disabled title="Không thể lưu trữ hóa đơn đã có thanh toán"' : '') + '><i class="bi bi-archive me-2"></i>Lưu trữ hóa đơn' + (!canArchive ? ' (Đã có TT)' : '') + '</button></li>' +
                    '<li><button type="button" class="dropdown-item text-danger" data-action="void-inv" ' + (!canVoid ? 'disabled title="Không thể hủy hóa đơn đã có thanh toán"' : '') + '><i class="bi bi-x-octagon me-2"></i>Hủy hóa đơn' + (!canVoid ? ' (Đã có TT)' : '') + '</button></li>' +
                  '</ul>' +
                '</div>' +
              '</div>' +
            '</div>' +

            (pendingBank.length > 0 && rem > 0
              ? '<div class="alert alert-warning small mb-3"><i class="bi bi-hourglass-split me-1"></i>Khách hàng này đang có <strong>' + pendingBank.length + ' giao dịch ngân hàng Chờ đối chiếu</strong> (chưa giảm trừ vào số còn phải thu cho đến khi Kế toán xác nhận).</div>'
              : '') +

            '<section class="sal-summary-tiles">' +
              '<div class="ip-kpi-card"><div class="ip-kpi-label">Tổng giá trị hóa đơn</div><div class="ip-kpi-value mt-1">' + IP.Fmt.currency(inv.total, false, inv.issueDate) + '</div><div class="ip-kpi-sub">Trước thuế: ' + IP.Fmt.currency(inv.subtotal, false, inv.issueDate) + '</div></div>' +
              '<div class="ip-kpi-card"><div class="ip-kpi-label">Đã thu (Xác nhận)</div><div class="ip-kpi-value mt-1 text-success">' + IP.Fmt.currency(inv.paidAmount, false, inv.issueDate) + '</div><div class="ip-kpi-sub">' + payments.filter(function (p) { return p.status === 'confirmed'; }).length + ' đợt thanh toán</div></div>' +
              '<div class="ip-kpi-card"><div class="ip-kpi-label">Còn phải thu</div><div class="ip-kpi-value mt-1 text-danger">' + IP.Fmt.currency(rem, false, inv.issueDate) + '</div><div class="ip-kpi-sub">' + (rem > 0 ? 'Cần theo dõi thu hồi' : 'Đã hoàn tất') + '</div></div>' +
              '<div class="ip-kpi-card"><div class="ip-kpi-label">Hạn thanh toán</div><div class="ip-kpi-value mt-1">' + IP.Fmt.date(inv.dueDate) + '</div><div class="ip-kpi-sub">' + (ov > 0 ? ('Quá hạn ' + ov + ' ngày') : (daysLeft >= 0 ? ('Còn ' + daysLeft + ' ngày') : 'Đã tất toán')) + '</div></div>' +
            '</section>' +

            '<div class="row g-4">' +
              '<div class="col-lg-8">' +
                '<div class="ip-card mb-4">' +
                  '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Danh mục hàng hóa / dịch vụ</h2><span class="small text-muted">Vai trò Kinh doanh chỉ xem, không sửa dòng hàng</span></div>' +
                  '<div class="table-responsive">' +
                    '<table class="table align-middle mb-0">' +
                      '<thead><tr><th>#</th><th>Mô tả</th><th>ĐVT</th><th class="text-end">SL</th><th class="text-end">Đơn giá</th><th class="text-end">VAT</th><th class="text-end">Thành tiền</th></tr></thead>' +
                      '<tbody>' +
                        (inv.items || []).map(function (it, i) {
                          return '<tr><td>' + (i + 1) + '</td><td>' + IP.Utils.escapeHtml(it.description) + '</td><td>' + IP.Utils.escapeHtml(it.unit) + '</td><td class="text-end ip-num">' + it.quantity + '</td><td class="text-end ip-num">' + IP.Fmt.currency(it.unitPrice, false, inv.issueDate) + '</td><td class="text-end ip-num">' + it.vatRate + '%</td><td class="text-end ip-num fw-semibold">' + IP.Fmt.currency(it.lineTotal, false, inv.issueDate) + '</td></tr>';
                        }).join('') +
                      '</tbody>' +
                    '</table>' +
                  '</div>' +
                '</div>' +

                '<div class="ip-card mb-4">' +
                  '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Lịch sử thanh toán & Đối chiếu</h2></div>' +
                  '<div class="ip-card-body">' +
                    (payments.length
                      ? '<div class="table-responsive"><table class="table table-sm align-middle mb-0"><thead><tr><th>Mã tham chiếu</th><th>Ngày nhận</th><th>Phương thức</th><th class="text-end">Số tiền</th><th>Trạng thái</th></tr></thead><tbody>' +
                          payments.map(function (p) {
                            return '<tr><td class="font-monospace fw-semibold">' + IP.Utils.escapeHtml(p.reference) + '</td><td>' + IP.Fmt.date(p.paidAt) + '</td><td>' + IP.Fmt.methodLabel(p.method) + '</td><td class="text-end ip-num fw-bold">' + IP.Fmt.currency(p.allocatedAmount || p.amount, false, p.paidAt) + '</td><td>' + IP.UI.statusBadge(p.status) + '</td></tr>';
                          }).join('') +
                        '</tbody></table></div>'
                      : '<p class="small text-muted mb-0">Chưa có giao dịch thanh toán nào gắn với hóa đơn này.</p>') +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="col-lg-4">' +
                '<div class="ip-card mb-4">' +
                  '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Thông tin khách hàng</h2><a href="sales-customer-balance.html?open=' + cus.id + '" class="small text-decoration-none">Xem sổ công nợ</a></div>' +
                  '<div class="ip-card-body small">' +
                    '<div class="fw-bold mb-1">' + IP.Utils.escapeHtml(cus.name || '') + '</div>' +
                    '<div class="mb-1">Người liên hệ: <strong>' + IP.Utils.escapeHtml(cus.contactName || '—') + '</strong></div>' +
                    '<div class="mb-1">Email: <code>' + IP.Utils.escapeHtml(cus.email || '—') + '</code></div>' +
                    '<div class="mb-1">Điện thoại: ' + IP.Utils.escapeHtml(cus.phone || '—') + '</div>' +
                    '<div>Hạn mức tín dụng: <strong class="ip-num">' + IP.Fmt.currency(cus.creditLimit || 0) + '</strong></div>' +
                  '</div>' +
                '</div>' +

                '<div class="ip-card mb-4">' +
                  '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Ghi chú nội bộ</h2></div>' +
                  '<div class="ip-card-body">' +
                    '<label class="form-label visually-hidden" for="sal-internal-note">Ghi chú nội bộ</label>' +
                    '<textarea id="sal-internal-note" class="form-control form-control-sm mb-2" rows="3" placeholder="Nhập ghi chú trao đổi với khách hàng...">' + IP.Utils.escapeHtml(inv.internalNote || '') + '</textarea>' +
                    '<button type="button" class="btn btn-sm btn-outline-primary w-100" data-action="save-internal-note"><i class="bi bi-check2"></i> Lưu ghi chú nội bộ</button>' +
                  '</div>' +
                '</div>' +

                '<div class="ip-card">' +
                  '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Dòng thời gian hoạt động</h2></div>' +
                  '<div class="ip-card-body small">' +
                    (activities.length
                      ? '<ul class="list-unstyled mb-0 border-start ps-3">' +
                          activities.map(function (a) {
                            return '<li class="mb-2"><div>' + IP.Utils.escapeHtml(a.message) + '</div><div class="text-muted" style="font-size:0.74rem">' + IP.Fmt.relative(a.at) + '</div></li>';
                          }).join('') +
                        '</ul>'
                      : '<div class="text-muted">Phát hành ngày ' + IP.Fmt.date(inv.issueDate) + '.</div>') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="ip-print-only">' + IP.UI.renderInvoicePrint(inv) + '</div>';
      }

      function openUpdateDueDateModal() {
        const inv = IP.DB.getInvoice(currentId);
        if (!inv) return;
        const mId = 'sal-due-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();
        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<form id="sal-due-form" novalidate>' +
                '<div class="modal-header">' +
                  '<h2 class="modal-title fs-5 fw-bold">Cập nhật hạn thanh toán · ' + IP.Utils.escapeHtml(inv.number) + '</h2>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div id="sal-due-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="sal-new-due">Hạn thanh toán mới <span class="text-danger">*</span></label>' +
                    '<input type="date" id="sal-new-due" class="form-control" value="' + inv.dueDate + '" min="' + inv.issueDate + '" required>' +
                    '<div class="form-text">Không được sớm hơn ngày phát hành (' + IP.Fmt.date(inv.issueDate) + ').</div>' +
                  '</div>' +
                  '<div class="mb-1">' +
                    '<label class="form-label" for="sal-due-reason">Lý do điều chỉnh hạn (Bắt buộc) <span class="text-danger">*</span></label>' +
                    '<textarea id="sal-due-reason" class="form-control" rows="2" placeholder="VD: Gia hạn thêm 10 ngày theo phụ lục hợp đồng..." required></textarea>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="submit" class="btn btn-primary">Lưu hạn mới</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>';
        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#sal-due-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          const newDue = mEl.querySelector('#sal-new-due').value;
          const reason = mEl.querySelector('#sal-due-reason').value.trim();
          const errEl = mEl.querySelector('#sal-due-err');
          if (!reason) {
            errEl.textContent = 'Vui lòng nhập lý do cập nhật hạn thanh toán.';
            errEl.classList.remove('d-none');
            return;
          }
          IP.UI.confirmModal({
            title: 'Xác nhận lưu hạn thanh toán mới?',
            message: 'Bạn có chắc chắn muốn cập nhật hạn thanh toán mới (' + IP.Fmt.date(newDue) + ') cho hóa đơn ' + inv.number + ' không?',
            confirmText: 'Chắc chắn lưu & Thoát',
            cancelText: 'Kiểm tra lại',
            variant: 'primary',
            onConfirm: function () {
              const res = IP.DB.updateInvoice(inv.id, { dueDate: newDue, dueChangeReason: reason });
              if (!res.ok) {
                errEl.textContent = res.error.message;
                errEl.classList.remove('d-none');
                return;
              }
              if (IP.UI && IP.UI.closeModal) IP.UI.closeModal(mEl, bsModal);
              else if (bsModal) bsModal.hide();
              else mEl.remove();
              IP.UI.toast({ title: 'Đã cập nhật hạn thanh toán', message: 'Hạn mới: ' + IP.Fmt.date(newDue), type: 'success' });
              renderDetail();
            }
          });
        });
        if (bsModal) bsModal.show();
      }

      IP.UI.withLoading(root, renderDetail);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');

        if (action === 'pick-invoice') {
          currentId = btn.getAttribute('data-id');
          IP.Utils.setQueryParams({ id: currentId });
          renderDetail();
        } else if (action === 'switch-picker') {
          currentId = '';
          IP.Utils.setQueryParams({ id: null });
          renderDetail();
        } else if (action === 'record-payment') {
          IP.UI.openPaymentModal({
            invoiceId: currentId,
            onSaved: function () { renderDetail(); }
          });
        } else if (action === 'print-invoice') {
          window.print();
        } else if (action === 'update-due-date') {
          openUpdateDueDateModal();
        } else if (action === 'save-internal-note') {
          const noteEl = root.querySelector('#sal-internal-note');
          const noteVal = noteEl ? noteEl.value : '';
          IP.UI.confirmModal({
            title: 'Xác nhận lưu ghi chú nội bộ?',
            message: 'Bạn có chắc chắn muốn lưu ghi chú nội bộ này vào hồ sơ hóa đơn không?',
            confirmText: 'Chắc chắn lưu',
            cancelText: 'Hủy bỏ',
            variant: 'primary',
            onConfirm: function () {
              const res = IP.DB.updateInvoice(currentId, { internalNote: noteVal });
              if (res.ok) {
                IP.UI.toast({ title: 'Đã lưu ghi chú nội bộ', message: 'Ghi chú đã được cập nhật vào hồ sơ hóa đơn.', type: 'success' });
                renderDetail();
              }
            }
          });
        } else if (action === 'archive-inv') {
          IP.UI.confirmModal({
            title: 'Lưu trữ hóa đơn này?',
            message: 'Hóa đơn chưa có thanh toán sẽ được chuyển vào danh mục lưu trữ.',
            confirmText: 'Lưu trữ',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.archiveInvoice(currentId);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã lưu trữ hóa đơn', message: res.data.number, type: 'success' });
                renderDetail();
              } else {
                IP.UI.toast({ title: 'Không thể lưu trữ', message: res.error.message, type: 'danger' });
              }
            }
          });
        } else if (action === 'void-inv') {
          IP.UI.confirmModal({
            title: 'Hủy hóa đơn này?',
            message: 'Hóa đơn đã hủy sẽ không nhận thêm bất kỳ khoản thanh toán nào.',
            requireReason: true,
            reasonLabel: 'Lý do hủy hóa đơn (bắt buộc)',
            confirmText: 'Xác nhận hủy hóa đơn',
            variant: 'danger',
            onConfirm: function (reason) {
              const res = IP.DB.voidInvoice(currentId, reason);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã hủy hóa đơn', message: res.data.number, type: 'warning' });
                renderDetail();
              } else {
                IP.UI.toast({ title: 'Không thể hủy', message: res.error.message, type: 'danger' });
              }
            }
          });
        }
      });
    }
  });
})(window);
