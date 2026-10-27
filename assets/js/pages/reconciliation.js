/**
 * @owner SV1
 * @spec §8.1 Accountant Payment Reconciliation Page Script (reconciliation.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('accountant-reconciliation', {
    roles: ['accountant'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentTab = ['pending', 'confirmed', 'discrepancy'].includes(params.tab) ? params.tab : 'pending';
      let searchQuery = '';
      let customerFilter = 'all';
      let selectedPayId = params.open || '';
      let selectedInvoiceId = '';

      function render() {
        const allPayments = IP.DB.listPayments({});
        const pendingList = allPayments.filter(function (p) { return p.status === 'pending' && !p.discrepancy; });
        const confirmedList = allPayments.filter(function (p) { return p.status === 'confirmed'; });
        const discrepancyList = allPayments.filter(function (p) { return p.discrepancy || p.status === 'rejected'; });

        const pendingSum = pendingList.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
        const confirmedSum = confirmedList.reduce(function (s, p) { return s + Number(p.allocatedAmount || p.amount || 0); }, 0);

        const filteredTx = IP.DB.listPayments({
          tab: currentTab,
          q: searchQuery,
          customerId: customerFilter
        });

        if (!selectedPayId || !filteredTx.some(function (x) { return x.id === selectedPayId; })) {
          selectedPayId = filteredTx.length > 0 ? filteredTx[0].id : '';
          selectedInvoiceId = '';
        }

        const activeTx = selectedPayId ? IP.DB.getPayment(selectedPayId) : null;
        const suggestions = activeTx ? IP.Calc.reconciliationSuggestions(activeTx) : [];
        if (activeTx && !selectedInvoiceId) {
          selectedInvoiceId = activeTx.invoiceId || (suggestions[0] ? suggestions[0].invoice.id : '');
        }
        const chosenInvoice = selectedInvoiceId ? IP.DB.getInvoice(selectedInvoiceId) : null;
        const chosenRem = chosenInvoice ? IP.Calc.remaining(chosenInvoice) : 0;
        const defaultAlloc = activeTx && chosenInvoice ? Math.min(activeTx.amount, chosenRem || activeTx.amount) : (activeTx ? activeTx.amount : 0);

        const customers = IP.DB.listCustomers({ includeArchived: false });

        const txListHtml = filteredTx.length
          ? filteredTx.map(function (tx) {
              const cus = IP.DB.getCustomer(tx.customerId || tx.suggestedCustomerId);
              const isSel = tx.id === selectedPayId ? 'active' : '';
              return (
                '<div class="acc-tx-item ' + isSel + '" data-action="select-tx" data-id="' + tx.id + '" role="button" tabindex="0">' +
                  '<div class="d-flex justify-content-between align-items-center mb-1">' +
                    '<span class="fw-bold font-monospace small">' + IP.Utils.escapeHtml(tx.reference) + '</span>' +
                    '<span class="fw-bold ip-num text-primary">' + IP.Fmt.currency(tx.amount, false, tx.paidAt) + '</span>' +
                  '</div>' +
                  '<div class="small fw-semibold">' + IP.Utils.escapeHtml(cus ? cus.name : 'Khách hàng chưa xác định') + '</div>' +
                  '<div class="small text-muted text-truncate">' + IP.Utils.escapeHtml(tx.transferContent || tx.note) + '</div>' +
                  '<div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top small text-muted">' +
                    '<span>Ngày GD: ' + IP.Fmt.date(tx.paidAt) + '</span>' +
                    (tx.discrepancy && tx.status === 'pending' ? '<span class="ip-badge ip-badge-partial">Sai lệch chờ xử lý</span>' : IP.UI.statusBadge(tx.status)) +
                  '</div>' +
                '</div>'
              );
            }).join('')
          : IP.UI.renderEmptyState({
              title: 'Không có giao dịch trong tab này',
              description: 'Chọn tab khác hoặc xóa từ khóa tìm kiếm để xem các giao dịch ngân hàng.'
            });

        let detailPanelHtml = '';
        if (!activeTx) {
          detailPanelHtml = '<div class="ip-card"><div class="ip-card-body">' +
            IP.UI.renderEmptyState({ title: 'Chọn một giao dịch bên trái', description: 'Chọn giao dịch ngân hàng để xem gợi ý khớp hóa đơn và xác nhận đối chiếu.' }) +
          '</div></div>';
        } else if (activeTx.status === 'confirmed') {
          const matchedInv = activeTx.invoiceId ? IP.DB.getInvoice(activeTx.invoiceId) : null;
          const matchedCus = IP.DB.getCustomer(activeTx.customerId);
          detailPanelHtml =
            '<div class="ip-card">' +
              '<div class="ip-card-header">' +
                '<div>' +
                  '<h2 class="ip-h2 mb-0">Giao dịch đã đối chiếu · ' + IP.Utils.escapeHtml(activeTx.reference) + '</h2>' +
                  '<div class="small text-muted">Thời điểm xác nhận: ' + IP.Fmt.dateTime(activeTx.reconciledAt) + '</div>' +
                '</div>' +
                IP.UI.statusBadge('confirmed') +
              '</div>' +
              '<div class="ip-card-body">' +
                '<div class="row g-3 mb-3 small bg-body-tertiary p-3 rounded border">' +
                  '<div class="col-sm-6">Khách hàng: <strong>' + IP.Utils.escapeHtml(matchedCus ? matchedCus.name : '—') + '</strong></div>' +
                  '<div class="col-sm-6">Hóa đơn đã khớp: <strong>' + (matchedInv ? '<a href="accountant-invoice-list.html?open=' + matchedInv.id + '">' + IP.Utils.escapeHtml(matchedInv.number) + '</a>' : '—') + '</strong></div>' +
                  '<div class="col-sm-6">Số tiền giao dịch: <strong class="ip-num">' + IP.Fmt.currency(activeTx.amount, false, activeTx.paidAt) + '</strong></div>' +
                  '<div class="col-sm-6">Số tiền phân bổ: <strong class="ip-num text-success">' + IP.Fmt.currency(activeTx.allocatedAmount || activeTx.amount, false, activeTx.paidAt) + '</strong></div>' +
                  '<div class="col-12">Nội dung CK: <code>' + IP.Utils.escapeHtml(activeTx.transferContent || activeTx.note) + '</code></div>' +
                  '<div class="col-12">Ghi chú đối chiếu: ' + IP.Utils.escapeHtml(activeTx.note || '—') + '</div>' +
                '</div>' +
                '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
                  '<span class="small text-muted">Hoàn tác đối chiếu sẽ trừ lại số tiền đã thu trên hóa đơn và đưa giao dịch về trạng thái Chờ đối chiếu.</span>' +
                  '<button type="button" class="btn btn-outline-danger btn-sm" data-action="undo-reconcile" data-id="' + activeTx.id + '">' +
                    '<i class="bi bi-arrow-counterclockwise"></i> Hoàn tác đối chiếu' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        } else {
          const allOpenInvs = IP.DB.listInvoices({ includeArchived: false }).filter(function (i) {
            return !i.voided && IP.Calc.remaining(i) > 0;
          });

          const suggestionsHtml = suggestions.length
            ? suggestions.map(function (s) {
                const isSel = s.invoice.id === selectedInvoiceId ? 'selected' : '';
                return (
                  '<div class="acc-match-card ' + isSel + '" data-action="pick-suggestion" data-inv-id="' + s.invoice.id + '">' +
                    '<div class="d-flex justify-content-between align-items-center mb-1">' +
                      '<span class="fw-bold">' + IP.Utils.escapeHtml(s.invoice.number) + ' · ' + IP.Utils.escapeHtml(s.customer ? s.customer.name : '') + '</span>' +
                      '<span class="badge bg-success-subtle text-success-emphasis">Điểm khớp luật: ' + s.score + '/100</span>' +
                    '</div>' +
                    '<div class="d-flex justify-content-between small text-muted mb-1">' +
                      '<span>Hạn TT: ' + IP.Fmt.date(s.invoice.dueDate) + '</span>' +
                      '<span class="ip-num">Còn phải thu: <strong class="text-body">' + IP.Fmt.currency(s.remaining) + '</strong></span>' +
                    '</div>' +
                    '<div class="small text-primary"><i class="bi bi-check2-all me-1"></i>Lý do khớp (Quy tắc luật): ' + IP.Utils.escapeHtml(s.reasons.join(' + ')) + '</div>' +
                  '</div>'
                );
              }).join('')
            : '<div class="alert alert-secondary small py-2">Không có gợi ý tự động điểm cao. Bạn có thể chọn hóa đơn thủ công ở danh sách bên dưới.</div>';

          detailPanelHtml =
            '<div class="ip-card">' +
              '<div class="ip-card-header">' +
                '<div>' +
                  '<h2 class="ip-h2 mb-0">Bàn đối chiếu giao dịch · ' + IP.Utils.escapeHtml(activeTx.reference) + '</h2>' +
                  '<div class="small text-muted">Thuật toán gợi ý dựa trên quy tắc nghiệp vụ (cùng khách hàng, khớp số tiền, gần ngày đáo hạn).</div>' +
                '</div>' +
                '<span class="fw-bold fs-5 text-primary ip-num">' + IP.Fmt.currency(activeTx.amount, false, activeTx.paidAt) + '</span>' +
              '</div>' +
              '<div class="ip-card-body">' +
                '<div class="p-3 rounded border bg-body-tertiary mb-3 small">' +
                  '<div class="mb-1"><strong>Nội dung chuyển khoản:</strong> <code>' + IP.Utils.escapeHtml(activeTx.transferContent || '—') + '</code></div>' +
                  '<div><strong>Ngày giao dịch:</strong> ' + IP.Fmt.date(activeTx.paidAt) + ' · <strong>Phương thức:</strong> ' + IP.Fmt.methodLabel(activeTx.method) + '</div>' +
                  (activeTx.discrepancyNote ? '<div class="text-danger mt-1"><strong>Ghi chú sai lệch:</strong> ' + IP.Utils.escapeHtml(activeTx.discrepancyNote) + '</div>' : '') +
                '</div>' +

                '<h3 class="fs-6 fw-bold mb-2">Hóa đơn gợi ý khớp theo quy tắc</h3>' +
                '<div class="mb-3">' + suggestionsHtml + '</div>' +

                '<div id="recon-err-box" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                '<div class="row g-3 mb-3">' +
                  '<div class="col-md-6">' +
                    '<label class="form-label" for="recon-invoice-select">Hóa đơn nhận phân bổ <span class="text-danger">*</span></label>' +
                    '<select id="recon-invoice-select" class="form-select">' +
                      '<option value="">-- Chọn hóa đơn cần khớp --</option>' +
                      allOpenInvs.map(function (inv) {
                        const c = IP.DB.getCustomer(inv.customerId);
                        return '<option value="' + inv.id + '" ' + (inv.id === selectedInvoiceId ? 'selected' : '') + '>' +
                          IP.Utils.escapeHtml(inv.number) + ' - ' + IP.Utils.escapeHtml(c ? c.name : '') + ' (Còn: ' + IP.Fmt.currency(IP.Calc.remaining(inv)) + ')' +
                        '</option>';
                      }).join('') +
                    '</select>' +
                  '</div>' +
                  '<div class="col-md-6">' +
                    '<label class="form-label" for="recon-alloc-amount">Số tiền phân bổ (VND) <span class="text-danger">*</span></label>' +
                    '<input type="number" id="recon-alloc-amount" class="form-control ip-num" value="' + defaultAlloc + '" min="1" max="' + activeTx.amount + '">' +
                    '<div class="form-text">Hỗ trợ thanh toán một phần hoặc toàn bộ.</div>' +
                  '</div>' +
                  '<div class="col-12">' +
                    '<label class="form-label" for="recon-note">Ghi chú đối chiếu / Giải trình chênh lệch</label>' +
                    '<input type="text" id="recon-note" class="form-control" value="' + IP.Utils.escapeHtml(activeTx.discrepancyNote || '') + '" placeholder="Bắt buộc nhập nếu số tiền phân bổ khác số tiền sao kê ngân hàng...">' +
                  '</div>' +
                '</div>' +

                '<div class="d-flex flex-wrap justify-content-between gap-2 pt-2 border-top">' +
                  '<div class="d-flex gap-2">' +
                    '<button type="button" class="btn btn-primary" data-action="confirm-reconcile" data-id="' + activeTx.id + '"><i class="bi bi-check2-circle"></i> Xác nhận đối chiếu</button>' +
                    '<button type="button" class="btn btn-outline-warning" data-action="mark-discrepancy" data-id="' + activeTx.id + '"><i class="bi bi-exclamation-diamond"></i> Đánh dấu Sai lệch</button>' +
                  '</div>' +
                  '<button type="button" class="btn btn-outline-danger" data-action="reject-tx" data-id="' + activeTx.id + '"><i class="bi bi-x-circle"></i> Từ chối giao dịch</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Đối chiếu thanh toán</h1>' +
              '<p class="ip-page-subtitle">Khớp giao dịch sao kê ngân hàng với hóa đơn mở, xử lý chênh lệch và hoàn tác đối chiếu khi cần.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="refresh-recon"><i class="bi bi-arrow-clockwise"></i> Làm mới sao kê</button>' +
              '<a href="accountant-invoice-list.html" class="btn btn-outline-secondary"><i class="bi bi-receipt"></i> Danh sách hóa đơn</a>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid" style="grid-template-columns: repeat(3, 1fr);">' +
            '<div class="ip-kpi-card ' + (currentTab === 'pending' ? 'active' : '') + '" data-action="switch-tab" data-tab="pending">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Chờ đối chiếu (' + pendingList.length + ' GD)</span><span class="ip-kpi-icon text-warning"><i class="bi bi-hourglass-split"></i></span></div>' +
              '<div class="ip-kpi-value">' + IP.Fmt.currency(pendingSum, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Tổng chờ khớp: ' + IP.Fmt.currency(pendingSum) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card ' + (currentTab === 'confirmed' ? 'active' : '') + '" data-action="switch-tab" data-tab="confirmed">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Đã đối chiếu (' + confirmedList.length + ' GD)</span><span class="ip-kpi-icon text-success"><i class="bi bi-check2-circle"></i></span></div>' +
              '<div class="ip-kpi-value text-success">' + IP.Fmt.currency(confirmedSum, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đã cộng vào số đã thu hóa đơn</div>' +
            '</div>' +
            '<div class="ip-kpi-card ' + (currentTab === 'discrepancy' ? 'active' : '') + '" data-action="switch-tab" data-tab="discrepancy">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Sai lệch / Từ chối</span><span class="ip-kpi-icon text-danger"><i class="bi bi-exclamation-octagon"></i></span></div>' +
              '<div class="ip-kpi-value text-danger">' + discrepancyList.length + ' giao dịch</div>' +
              '<div class="ip-kpi-sub">Cần kiểm tra mã tham chiếu hoặc số tiền</div>' +
            '</div>' +
          '</section>' +

          '<div class="ip-filter-bar mb-3">' +
            '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 border-bottom pb-2">' +
              '<div class="btn-group" role="tablist">' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="pending">Chờ đối chiếu (' + pendingList.length + ')</button>' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'confirmed' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="confirmed">Đã đối chiếu (' + confirmedList.length + ')</button>' +
                '<button type="button" class="btn btn-sm ' + (currentTab === 'discrepancy' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="discrepancy">Sai lệch (' + discrepancyList.length + ')</button>' +
              '</div>' +
              '<div class="d-flex gap-2 flex-wrap">' +
                '<input type="search" id="recon-q" class="form-control form-control-sm" style="width:220px;" value="' + IP.Utils.escapeHtml(searchQuery) + '" placeholder="Tìm mã GD, nội dung CK...">' +
                '<select id="recon-cus" class="form-select form-select-sm" style="width:220px;">' +
                  '<option value="all">Tất cả khách hàng</option>' +
                  customers.map(function (c) {
                    return '<option value="' + c.id + '" ' + (customerFilter === c.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(c.name) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
            '</div>' +

            '<div class="acc-recon-grid">' +
              '<div id="recon-tx-list">' + txListHtml + '</div>' +
              '<div id="recon-detail-panel">' + detailPanelHtml + '</div>' +
            '</div>' +
          '</div>';

        const qEl = root.querySelector('#recon-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            searchQuery = qEl.value;
            render();
          }, 200));
        }
        const cusEl = root.querySelector('#recon-cus');
        if (cusEl) {
          cusEl.addEventListener('change', function () {
            customerFilter = cusEl.value;
            render();
          });
        }
        const invSel = root.querySelector('#recon-invoice-select');
        if (invSel) {
          invSel.addEventListener('change', function () {
            selectedInvoiceId = invSel.value;
            render();
          });
        }
      }

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'switch-tab') {
          currentTab = btn.getAttribute('data-tab');
          selectedPayId = '';
          selectedInvoiceId = '';
          render();
        } else if (action === 'select-tx') {
          selectedPayId = id;
          selectedInvoiceId = '';
          render();
        } else if (action === 'pick-suggestion') {
          selectedInvoiceId = btn.getAttribute('data-inv-id');
          render();
        } else if (action === 'refresh-recon') {
          IP.UI.toast({ title: 'Đã đồng bộ sao kê', message: 'Danh sách giao dịch ngân hàng đã được làm mới.', type: 'info' });
          render();
        } else if (action === 'confirm-reconcile') {
          const invSel = root.querySelector('#recon-invoice-select');
          const allocEl = root.querySelector('#recon-alloc-amount');
          const noteEl = root.querySelector('#recon-note');
          const errBox = root.querySelector('#recon-err-box');
          if (errBox) errBox.classList.add('d-none');

          const res = IP.DB.reconcilePayment(
            id,
            invSel ? invSel.value : selectedInvoiceId,
            allocEl ? Number(allocEl.value) : undefined,
            noteEl ? noteEl.value : ''
          );
          if (!res.ok) {
            if (errBox) {
              errBox.textContent = res.error.message;
              errBox.classList.remove('d-none');
            }
            if (res.error.field === 'note' && noteEl) noteEl.focus();
            return;
          }
          IP.UI.toast({
            title: 'Đã xác nhận đối chiếu',
            message: 'Giao dịch đã được khớp với hóa đơn ' + res.data.invoice.number + '.',
            type: 'success'
          });
          selectedPayId = '';
          render();
        } else if (action === 'mark-discrepancy') {
          const noteEl = root.querySelector('#recon-note');
          const noteVal = noteEl ? noteEl.value.trim() : '';
          if (!noteVal) {
            const errBox = root.querySelector('#recon-err-box');
            if (errBox) {
              errBox.textContent = 'Vui lòng nhập ghi chú mô tả sai lệch trước khi đánh dấu Sai lệch.';
              errBox.classList.remove('d-none');
            }
            if (noteEl) noteEl.focus();
            return;
          }
          const res = IP.DB.markPaymentDiscrepancy(id, noteVal);
          if (res.ok) {
            IP.UI.toast({ title: 'Đã chuyển sang tab Sai lệch', message: 'Giao dịch đã được ghi nhận sai lệch cần xử lý.', type: 'warning' });
            currentTab = 'discrepancy';
            render();
          }
        } else if (action === 'reject-tx') {
          IP.UI.confirmModal({
            title: 'Từ chối giao dịch ngân hàng này?',
            message: 'Giao dịch sẽ được chuyển sang trạng thái Đã từ chối và không cộng vào công nợ hóa đơn.',
            requireReason: true,
            reasonLabel: 'Lý do từ chối giao dịch (bắt buộc)',
            confirmText: 'Từ chối giao dịch',
            variant: 'danger',
            onConfirm: function (reason) {
              const res = IP.DB.rejectPayment(id, reason);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã từ chối giao dịch', message: 'Đã lưu lý do từ chối.', type: 'info' });
                currentTab = 'discrepancy';
                render();
              }
            }
          });
        } else if (action === 'undo-reconcile') {
          IP.UI.confirmModal({
            title: 'Hoàn tác đối chiếu giao dịch này?',
            message: 'Số tiền đã phân bổ sẽ được trừ khỏi hóa đơn liên quan và giao dịch sẽ quay về trạng thái Chờ đối chiếu.',
            confirmText: 'Hoàn tác đối chiếu',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.unreconcilePayment(id);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã hoàn tác đối chiếu', message: 'Giao dịch ' + res.data.reference + ' đã trở về Chờ đối chiếu.', type: 'warning' });
                currentTab = 'pending';
                selectedPayId = res.data.id;
                render();
              }
            }
          });
        }
      });
    }
  });
})(window);
