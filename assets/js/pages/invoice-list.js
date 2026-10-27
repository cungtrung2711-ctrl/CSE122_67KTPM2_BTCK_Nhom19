/**
 * @owner SV1
 * @spec §8.1 Accountant Invoice List Page Script (invoice-list.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('accountant-invoice-list', {
    roles: ['accountant'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const filterState = {
        q: params.q || '',
        status: params.status || 'all',
        customerId: params.customerId || 'all',
        period: params.period || 'all',
        due: params.due || '',
        sortBy: params.sort || 'dueDate_asc',
        page: Number(params.page || 1),
        perPage: 10
      };
      const selectedIds = new Set();

      function computeKPIs() {
        const allInvs = IP.DB.listInvoices({ includeArchived: false });
        let totalAR = 0;
        let overdueAmt = 0;
        let overdueCount = 0;
        let due7Amt = 0;
        let due7Count = 0;

        allInvs.forEach(function (inv) {
          const eff = IP.Calc.effectiveStatus(inv);
          if (['draft', 'paid', 'voided', 'archived'].includes(eff)) return;
          const rem = IP.Calc.remaining(inv);
          totalAR += rem;
          if (eff === 'overdue') {
            overdueAmt += rem;
            overdueCount++;
          } else {
            const d = IP.Calc.daysUntilDue(inv);
            if (d >= 0 && d <= 7) {
              due7Amt += rem;
              due7Count++;
            }
          }
        });

        const monthStart = IP.Seed.addDays(-30);
        const collectedMonth = IP.DB.listPayments({ status: 'confirmed' })
          .filter(function (p) { return p.paidAt >= monthStart; })
          .reduce(function (s, p) { return s + Number(p.allocatedAmount || p.amount || 0); }, 0);

        return {
          totalAR: totalAR,
          overdueAmt: overdueAmt,
          overdueCount: overdueCount,
          due7Amt: due7Amt,
          due7Count: due7Count,
          collectedMonth: collectedMonth
        };
      }

      function sortInvoices(list) {
        const parts = filterState.sortBy.split('_');
        const col = parts[0];
        const dir = parts[1] === 'desc' ? -1 : 1;
        return list.slice().sort(function (a, b) {
          if (col === 'total') return (a.total - b.total) * dir;
          if (col === 'remaining') return (IP.Calc.remaining(a) - IP.Calc.remaining(b)) * dir;
          return String(a.dueDate).localeCompare(String(b.dueDate)) * dir;
        });
      }

      function renderPage() {
        const kpi = computeKPIs();
        const customers = IP.DB.listCustomers({ includeArchived: true });
        const rawList = IP.DB.listInvoices({
          q: filterState.q,
          status: filterState.status,
          customerId: filterState.customerId,
          period: filterState.period,
          due: filterState.due,
          includeArchived: filterState.status === 'archived'
        });
        const sorted = sortInvoices(rawList);
        const total = sorted.length;
        const totalPages = Math.max(1, Math.ceil(total / filterState.perPage));
        if (filterState.page > totalPages) filterState.page = 1;
        const pageItems = sorted.slice((filterState.page - 1) * filterState.perPage, filterState.page * filterState.perPage);

        // Active filter chips
        const chips = [];
        if (filterState.q) chips.push({ key: 'q', label: 'Từ khóa: ' + filterState.q });
        if (filterState.status !== 'all') chips.push({ key: 'status', label: 'Trạng thái: ' + IP.Fmt.statusLabel(filterState.status) });
        if (filterState.customerId !== 'all') {
          const cObj = IP.DB.getCustomer(filterState.customerId);
          chips.push({ key: 'customerId', label: 'Khách hàng: ' + (cObj ? cObj.name : filterState.customerId) });
        }
        if (filterState.due === '7d') chips.push({ key: 'due', label: 'Đến hạn trong 7 ngày' });
        if (filterState.period !== 'all') chips.push({ key: 'period', label: 'Kỳ phát hành: ' + filterState.period });

        const chipsHtml = chips.length
          ? '<div class="ip-filter-chips">' +
              chips.map(function (ch) {
                return '<span class="ip-chip">' + IP.Utils.escapeHtml(ch.label) +
                  '<button type="button" data-action="remove-chip" data-chip="' + ch.key + '" aria-label="Bỏ lọc">&times;</button></span>';
              }).join('') +
              '<button type="button" class="btn btn-link btn-sm text-decoration-none p-0 ms-2" data-action="clear-filters">Xóa tất cả bộ lọc</button>' +
            '</div>'
          : '';

        // Bulk bar check
        const selectedArr = Array.from(selectedIds).map(function (id) { return IP.DB.getInvoice(id); }).filter(Boolean);
        const anyHasPayment = selectedArr.some(function (inv) { return inv.paidAmount > 0; });
        const bulkBarHtml = selectedArr.length > 0
          ? '<div class="acc-bulk-bar">' +
              '<div class="small fw-semibold">Đã chọn <strong>' + selectedArr.length + '</strong> hóa đơn</div>' +
              '<div class="d-flex gap-2 flex-wrap">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="bulk-csv"><i class="bi bi-download"></i> Xuất CSV dòng chọn</button>' +
                '<button type="button" class="btn btn-sm btn-outline-danger" data-action="bulk-archive" ' +
                  (anyHasPayment ? 'disabled title="Không thể lưu trữ hàng loạt khi có hóa đơn đã phát sinh thanh toán"' : '') + '>' +
                  '<i class="bi bi-archive"></i> Lưu trữ dòng chọn' +
                '</button>' +
                (anyHasPayment ? '<span class="small text-danger align-self-center">(Bị khóa lưu trữ vì có hóa đơn đã thu tiền)</span>' : '') +
              '</div>' +
            '</div>'
          : '';

        const pendingByCus = {};
        IP.DB.listPayments({ status: 'pending' }).forEach(function (p) {
          if (p.customerId) pendingByCus[p.customerId] = true;
        });

        const rowsHtml = pageItems.map(function (inv) {
          const cus = IP.DB.getCustomer(inv.customerId);
          const eff = IP.Calc.effectiveStatus(inv);
          const rem = IP.Calc.remaining(inv);
          const ov = IP.Calc.overdueDays(inv);
          const daysLeft = IP.Calc.daysUntilDue(inv);
          const dueSub = eff === 'paid' ? 'Đã tất toán' : (ov > 0 ? ('Quá hạn ' + ov + ' ngày') : (daysLeft >= 0 ? ('Còn ' + daysLeft + ' ngày') : ''));
          const dueSubCls = ov > 0 ? 'text-danger fw-semibold' : 'text-muted';
          const hasPendingNote = pendingByCus[inv.customerId] && rem > 0;
          const canArchive = inv.paidAmount === 0 && !inv.archived;
          const checked = selectedIds.has(inv.id) ? 'checked' : '';

          return (
            '<tr>' +
              '<td data-label="Chọn">' +
                '<input type="checkbox" class="form-check-input" data-action="toggle-row" data-id="' + inv.id + '" ' + checked + ' aria-label="Chọn hóa đơn ' + IP.Utils.escapeHtml(inv.number) + '">' +
              '</td>' +
              '<td data-label="Số hóa đơn">' +
                '<a href="accountant-invoice-list.html?open=' + inv.id + '" class="fw-bold text-decoration-none" data-action="open-drawer" data-id="' + inv.id + '">' +
                  IP.Utils.escapeHtml(inv.number) +
                '</a>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(inv.poNumber || '—') + '</div>' +
              '</td>' +
              '<td data-label="Khách hàng">' +
                '<div class="fw-semibold">' + IP.Utils.escapeHtml(cus ? cus.name : inv.customerId) + '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus ? cus.code : '') + '</div>' +
              '</td>' +
              '<td data-label="Ngày phát hành">' + IP.Fmt.date(inv.issueDate) + '</td>' +
              '<td data-label="Hạn thanh toán">' +
                '<div>' + IP.Fmt.date(inv.dueDate) + '</div>' +
                '<div class="small ' + dueSubCls + '">' + IP.Utils.escapeHtml(dueSub) + '</div>' +
              '</td>' +
              '<td data-label="Tổng tiền" class="text-end ip-num fw-semibold">' + IP.Fmt.currency(inv.total, false, inv.issueDate) + '</td>' +
              '<td data-label="Đã thu" class="text-end ip-num">' +
                '<div>' + IP.Fmt.currency(inv.paidAmount, false, inv.issueDate) + '</div>' +
                (hasPendingNote ? '<span class="badge bg-warning-subtle text-warning-emphasis" style="font-size:0.68rem">Có GD chờ đối chiếu</span>' : '') +
              '</td>' +
              '<td data-label="Còn lại" class="text-end ip-num fw-bold ' + (rem > 0 ? 'text-body' : 'text-muted') + '">' + IP.Fmt.currency(rem, false, inv.issueDate) + '</td>' +
              '<td data-label="Trạng thái">' + IP.UI.statusBadge(eff) + '</td>' +
              '<td data-label="Thao tác" class="text-end">' +
                '<div class="dropdown">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown" aria-label="Menu thao tác hóa đơn ' + IP.Utils.escapeHtml(inv.number) + '">' +
                    '<i class="bi bi-three-dots"></i>' +
                  '</button>' +
                  '<ul class="dropdown-menu dropdown-menu-end shadow-sm">' +
                    '<li><button type="button" class="dropdown-item" data-action="open-drawer" data-id="' + inv.id + '"><i class="bi bi-eye me-2"></i>Xem chi tiết</button></li>' +
                    '<li><a class="dropdown-item" href="accountant-invoice-form.html?id=' + inv.id + '"><i class="bi bi-pencil me-2"></i>Chỉnh sửa hóa đơn</a></li>' +
                    '<li><button type="button" class="dropdown-item" data-action="record-payment" data-id="' + inv.id + '" ' + (rem <= 0 || inv.voided ? 'disabled' : '') + '><i class="bi bi-cash-coin me-2"></i>Ghi nhận thanh toán</button></li>' +
                    '<li><a class="dropdown-item" href="accountant-invoice-form.html?id=' + inv.id + '&ai=1"><i class="bi bi-stars me-2"></i>Kiểm tra bằng AI-1</a></li>' +
                    '<li><button type="button" class="dropdown-item" data-action="duplicate-invoice" data-id="' + inv.id + '"><i class="bi bi-files me-2"></i>Nhân bản thành nháp</button></li>' +
                    '<li><hr class="dropdown-divider"></li>' +
                    '<li><button type="button" class="dropdown-item text-danger" data-action="archive-invoice" data-id="' + inv.id + '" ' + (!canArchive ? 'disabled title="Không thể lưu trữ hóa đơn đã thu tiền"' : '') + '><i class="bi bi-archive me-2"></i>Lưu trữ' + (!canArchive ? ' (Đã có TT)' : '') + '</button></li>' +
                  '</ul>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        const tableContentHtml = pageItems.length
          ? '<div class="table-responsive">' +
              '<table class="table ip-table-responsive-cards align-middle">' +
                '<thead>' +
                  '<tr>' +
                    '<th style="width:40px;"><input type="checkbox" class="form-check-input" id="select-all-page" aria-label="Chọn tất cả trên trang"></th>' +
                    '<th>Số hóa đơn</th>' +
                    '<th>Khách hàng</th>' +
                    '<th>Ngày phát hành</th>' +
                    '<th><button type="button" class="ip-sort-btn" data-action="sort-col" data-col="dueDate">Hạn thanh toán <i class="bi bi-arrow-down-up"></i></button></th>' +
                    '<th class="text-end"><button type="button" class="ip-sort-btn ms-auto" data-action="sort-col" data-col="total">Tổng tiền <i class="bi bi-arrow-down-up"></i></button></th>' +
                    '<th class="text-end">Đã thu</th>' +
                    '<th class="text-end"><button type="button" class="ip-sort-btn ms-auto" data-action="sort-col" data-col="remaining">Còn lại <i class="bi bi-arrow-down-up"></i></button></th>' +
                    '<th>Trạng thái</th>' +
                    '<th class="text-end">Thao tác</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' + rowsHtml + '</tbody>' +
              '</table>' +
            '</div>' +
            IP.UI.renderPagination({ total: total, page: filterState.page, perPage: filterState.perPage })
          : IP.UI.renderEmptyState({
              title: 'Không có hóa đơn khớp bộ lọc',
              description: 'Hãy thử xóa bớt điều kiện lọc hoặc tạo hóa đơn mới.',
              actionText: 'Xóa bộ lọc',
              actionAttr: 'clear-filters'
            });

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Hóa đơn</h1>' +
              '<p class="ip-page-subtitle">Quản lý danh mục hóa đơn, theo dõi tiến độ thu tiền và đối chiếu công nợ khách hàng.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="export-all-csv"><i class="bi bi-file-earmark-spreadsheet"></i> Xuất CSV (' + total + ')</button>' +
              '<a href="accountant-reconciliation.html" class="btn btn-outline-secondary"><i class="bi bi-arrow-left-right"></i> Đối chiếu NH</a>' +
              '<a href="accountant-invoice-form.html" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Tạo hóa đơn</a>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid" aria-label="Chỉ số tổng quan hóa đơn">' +
            '<div class="ip-kpi-card" data-action="kpi-filter" data-filter="all">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Tổng phải thu</span><span class="ip-kpi-icon"><i class="bi bi-wallet2"></i></span></div>' +
              '<div class="ip-kpi-value">' + IP.Fmt.currency(kpi.totalAR, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đầy đủ: ' + IP.Fmt.currency(kpi.totalAR) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card ' + (filterState.status === 'overdue' ? 'active' : '') + '" data-action="kpi-filter" data-filter="overdue" role="button" tabindex="0">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Quá hạn (' + kpi.overdueCount + ' HĐ)</span><span class="ip-kpi-icon text-danger"><i class="bi bi-exclamation-triangle"></i></span></div>' +
              '<div class="ip-kpi-value text-danger">' + IP.Fmt.currency(kpi.overdueAmt, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Bấm để lọc ' + kpi.overdueCount + ' hóa đơn quá hạn</div>' +
            '</div>' +
            '<div class="ip-kpi-card ' + (filterState.due === '7d' ? 'active' : '') + '" data-action="kpi-filter" data-filter="due7d" role="button" tabindex="0">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Đến hạn trong 7 ngày</span><span class="ip-kpi-icon text-warning"><i class="bi bi-calendar-event"></i></span></div>' +
              '<div class="ip-kpi-value">' + IP.Fmt.currency(kpi.due7Amt, true) + '</div>' +
              '<div class="ip-kpi-sub">' + kpi.due7Count + ' hóa đơn cần nhắc sớm</div>' +
            '</div>' +
            '<div class="ip-kpi-card" data-action="kpi-filter" data-filter="paid" role="button" tabindex="0">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Đã thu 30 ngày qua</span><span class="ip-kpi-icon text-success"><i class="bi bi-check2-all"></i></span></div>' +
              '<div class="ip-kpi-value text-success">' + IP.Fmt.currency(kpi.collectedMonth, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Chỉ tính giao dịch đã xác nhận</div>' +
            '</div>' +
          '</section>' +

          '<section class="ip-filter-bar" aria-label="Bộ lọc hóa đơn">' +
            '<div class="row g-2 align-items-end">' +
              '<div class="col-md-4">' +
                '<label class="form-label" for="flt-q">Tìm kiếm nhanh</label>' +
                '<input type="search" id="flt-q" class="form-control" value="' + IP.Utils.escapeHtml(filterState.q) + '" placeholder="Số hóa đơn, mã PO, tên khách hàng...">' +
              '</div>' +
              '<div class="col-sm-6 col-md-3">' +
                '<label class="form-label" for="flt-status">Trạng thái</label>' +
                '<select id="flt-status" class="form-select">' +
                  '<option value="all" ' + (filterState.status === 'all' ? 'selected' : '') + '>Tất cả trạng thái</option>' +
                  '<option value="draft" ' + (filterState.status === 'draft' ? 'selected' : '') + '>Nháp</option>' +
                  '<option value="sent" ' + (filterState.status === 'sent' ? 'selected' : '') + '>Đã gửi</option>' +
                  '<option value="partial" ' + (filterState.status === 'partial' ? 'selected' : '') + '>Thanh toán một phần</option>' +
                  '<option value="overdue" ' + (filterState.status === 'overdue' ? 'selected' : '') + '>Quá hạn</option>' +
                  '<option value="paid" ' + (filterState.status === 'paid' ? 'selected' : '') + '>Đã thanh toán</option>' +
                  '<option value="voided" ' + (filterState.status === 'voided' ? 'selected' : '') + '>Đã hủy</option>' +
                  '<option value="archived" ' + (filterState.status === 'archived' ? 'selected' : '') + '>Đã lưu trữ</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-3">' +
                '<label class="form-label" for="flt-customer">Khách hàng</label>' +
                '<select id="flt-customer" class="form-select">' +
                  '<option value="all">Tất cả khách hàng</option>' +
                  customers.map(function (c) {
                    return '<option value="' + c.id + '" ' + (filterState.customerId === c.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(c.name) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="flt-period">Kỳ phát hành</label>' +
                '<select id="flt-period" class="form-select">' +
                  '<option value="all" ' + (filterState.period === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                  '<option value="30d" ' + (filterState.period === '30d' ? 'selected' : '') + '>30 ngày qua</option>' +
                  '<option value="90d" ' + (filterState.period === '90d' ? 'selected' : '') + '>Quý này (90 ngày)</option>' +
                  '<option value="year" ' + (filterState.period === 'year' ? 'selected' : '') + '>Năm nay</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            chipsHtml +
          '</section>' +

          bulkBarHtml +
          '<div class="ip-table-wrap" id="acc-invoice-table-box">' + tableContentHtml + '</div>' +
          '<div id="acc-invoice-drawer-host"></div>';

        // Bind filter inputs
        const qInput = root.querySelector('#flt-q');
        if (qInput) {
          qInput.addEventListener('input', IP.Utils.debounce(function () {
            filterState.q = qInput.value;
            filterState.page = 1;
            renderPage();
          }, 220));
        }
        const statusSel = root.querySelector('#flt-status');
        if (statusSel) {
          statusSel.addEventListener('change', function () {
            filterState.status = statusSel.value;
            filterState.due = '';
            filterState.page = 1;
            renderPage();
          });
        }
        const cusSel = root.querySelector('#flt-customer');
        if (cusSel) {
          cusSel.addEventListener('change', function () {
            filterState.customerId = cusSel.value;
            filterState.page = 1;
            renderPage();
          });
        }
        const perSel = root.querySelector('#flt-period');
        if (perSel) {
          perSel.addEventListener('change', function () {
            filterState.period = perSel.value;
            filterState.page = 1;
            renderPage();
          });
        }
        const selAll = root.querySelector('#select-all-page');
        if (selAll) {
          selAll.addEventListener('change', function () {
            pageItems.forEach(function (inv) {
              if (selAll.checked) selectedIds.add(inv.id);
              else selectedIds.delete(inv.id);
            });
            renderPage();
          });
        }
      }

      function openDetailDrawer(invoiceId) {
        const inv = IP.DB.getInvoice(invoiceId);
        if (!inv) {
          IP.UI.toast({ title: 'Không tìm thấy hóa đơn', message: 'Mã hóa đơn "' + invoiceId + '" không tồn tại.', type: 'warning' });
          return;
        }
        const cus = IP.DB.getCustomer(inv.customerId) || {};
        const eff = IP.Calc.effectiveStatus(inv);
        const rem = IP.Calc.remaining(inv);
        const payments = IP.DB.listPayments({ invoiceId: inv.id });
        const acts = IP.DB.listActivities('invoice', inv.id);

        const host = document.getElementById('acc-invoice-drawer-host') || document.body;
        host.innerHTML =
          '<div class="offcanvas offcanvas-end ip-drawer-wide show" tabindex="-1" id="acc-inv-drawer" style="visibility:visible;" aria-modal="true" role="dialog">' +
            '<div class="offcanvas-header border-bottom">' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<h2 class="offcanvas-title fs-5 fw-bold mb-0">' + IP.Utils.escapeHtml(inv.number) + '</h2>' +
                  IP.UI.statusBadge(eff) +
                '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus.name || '') + '</div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-action="close-drawer" aria-label="Đóng chi tiết"></button>' +
            '</div>' +
            '<div class="offcanvas-body">' +
              '<div class="row g-2 mb-3 small bg-body-tertiary p-3 rounded border">' +
                '<div class="col-6">Phát hành: <strong>' + IP.Fmt.date(inv.issueDate) + '</strong></div>' +
                '<div class="col-6">Đến hạn: <strong>' + IP.Fmt.date(inv.dueDate) + '</strong></div>' +
                '<div class="col-6">Tổng tiền: <strong class="ip-num">' + IP.Fmt.currency(inv.total, false, inv.issueDate) + '</strong></div>' +
                '<div class="col-6">Còn phải thu: <strong class="ip-num text-danger">' + IP.Fmt.currency(rem, false, inv.issueDate) + '</strong></div>' +
              '</div>' +
              '<h3 class="fs-6 fw-bold mb-2">Chi tiết hàng hóa / dịch vụ</h3>' +
              '<div class="table-responsive mb-3">' +
                '<table class="table table-sm border small">' +
                  '<thead><tr><th>Mô tả</th><th class="text-end">SL</th><th class="text-end">Thành tiền</th></tr></thead>' +
                  '<tbody>' +
                    (inv.items || []).map(function (it) {
                      return '<tr><td>' + IP.Utils.escapeHtml(it.description) + '</td><td class="text-end ip-num">' + it.quantity + '</td><td class="text-end ip-num">' + IP.Fmt.currency(it.lineTotal, false, inv.issueDate) + '</td></tr>';
                    }).join('') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
              '<h3 class="fs-6 fw-bold mb-2">Lịch sử thanh toán (' + payments.length + ')</h3>' +
              (payments.length
                ? '<ul class="list-group list-group-flush border rounded mb-3 small">' +
                    payments.map(function (p) {
                      return '<li class="list-group-item d-flex justify-content-between align-items-center">' +
                        '<div><div class="fw-semibold">' + IP.Utils.escapeHtml(p.reference) + ' (' + IP.Fmt.methodLabel(p.method) + ')</div><div class="text-muted">' + IP.Fmt.date(p.paidAt) + '</div></div>' +
                        '<div class="text-end"><div class="fw-bold ip-num">' + IP.Fmt.currency(p.allocatedAmount || p.amount, false, p.paidAt) + '</div>' + IP.UI.statusBadge(p.status) + '</div>' +
                      '</li>';
                    }).join('') +
                  '</ul>'
                : '<p class="small text-muted mb-3">Chưa có giao dịch thanh toán nào.</p>') +
              '<h3 class="fs-6 fw-bold mb-2">Dòng thời gian hoạt động</h3>' +
              (acts.length
                ? '<ul class="list-unstyled small border-start ps-3">' +
                    acts.map(function (a) {
                      return '<li class="mb-2"><div class="fw-medium">' + IP.Utils.escapeHtml(a.message) + '</div><div class="text-muted" style="font-size:0.75rem">' + IP.Fmt.relative(a.at) + '</div></li>';
                    }).join('') +
                  '</ul>'
                : '<p class="small text-muted">Hoạt động tạo hóa đơn ngày ' + IP.Fmt.date(inv.issueDate) + '.</p>') +
            '</div>' +
            '<div class="offcanvas-header border-top bg-body-tertiary d-flex gap-2 justify-content-end">' +
              '<a href="accountant-invoice-form.html?id=' + inv.id + '" class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil"></i> Sửa</a>' +
              '<button type="button" class="btn btn-primary btn-sm" data-action="record-payment" data-id="' + inv.id + '" ' + (rem <= 0 || inv.voided ? 'disabled' : '') + '><i class="bi bi-cash-coin"></i> Ghi nhận thanh toán</button>' +
            '</div>' +
          '</div>' +
          '<div class="offcanvas-backdrop fade show" data-action="close-drawer"></div>';
      }

      IP.UI.withLoading(root, function () {
        renderPage();
        if (params.open) {
          openDetailDrawer(params.open);
        }
      });

      root.addEventListener('click', function (ev) {
        const el = ev.target.closest('[data-action]');
        if (!el) return;
        const action = el.getAttribute('data-action');
        const id = el.getAttribute('data-id');

        if (action === 'open-drawer') {
          ev.preventDefault();
          openDetailDrawer(id);
        } else if (action === 'close-drawer') {
          const host = document.getElementById('acc-invoice-drawer-host');
          if (host) host.innerHTML = '';
          IP.Utils.setQueryParams({ open: null });
        } else if (action === 'kpi-filter') {
          const f = el.getAttribute('data-filter');
          if (f === 'overdue') { filterState.status = 'overdue'; filterState.due = ''; }
          else if (f === 'due7d') { filterState.status = 'all'; filterState.due = '7d'; }
          else if (f === 'paid') { filterState.status = 'paid'; filterState.due = ''; }
          else { filterState.status = 'all'; filterState.due = ''; }
          filterState.page = 1;
          renderPage();
        } else if (action === 'remove-chip') {
          const k = el.getAttribute('data-chip');
          if (k === 'q') filterState.q = '';
          if (k === 'status') filterState.status = 'all';
          if (k === 'customerId') filterState.customerId = 'all';
          if (k === 'due') filterState.due = '';
          if (k === 'period') filterState.period = 'all';
          filterState.page = 1;
          renderPage();
        } else if (action === 'clear-filters') {
          filterState.q = '';
          filterState.status = 'all';
          filterState.customerId = 'all';
          filterState.period = 'all';
          filterState.due = '';
          filterState.page = 1;
          IP.Utils.setQueryParams({ state: null, status: null, due: null, customerId: null, q: null });
          renderPage();
        } else if (action === 'sort-col') {
          const col = el.getAttribute('data-col');
          const cur = filterState.sortBy;
          filterState.sortBy = (cur === col + '_asc') ? (col + '_desc') : (col + '_asc');
          renderPage();
        } else if (action === 'page-change') {
          filterState.page = Number(el.getAttribute('data-page') || 1);
          renderPage();
        } else if (action === 'toggle-row') {
          if (el.checked) selectedIds.add(id);
          else selectedIds.delete(id);
          renderPage();
        } else if (action === 'record-payment') {
          IP.UI.openPaymentModal({
            invoiceId: id,
            onSaved: function () {
              renderPage();
            }
          });
        } else if (action === 'duplicate-invoice') {
          IP.UI.confirmModal({
            title: 'Nhân bản hóa đơn thành bản nháp?',
            message: 'Hệ thống sẽ tạo một hóa đơn nháp mới với cùng khách hàng và danh mục hàng hóa để bạn chỉnh sửa.',
            confirmText: 'Nhân bản ngay',
            onConfirm: function () {
              const res = IP.DB.duplicateInvoice(id);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã nhân bản hóa đơn', message: 'Đã tạo bản nháp ' + res.data.number + '.', type: 'success' });
                renderPage();
              }
            }
          });
        } else if (action === 'archive-invoice') {
          IP.UI.confirmModal({
            title: 'Lưu trữ hóa đơn này?',
            message: 'Hóa đơn sẽ được chuyển vào danh mục Đã lưu trữ và ẩn khỏi bảng công nợ mặc định.',
            confirmText: 'Lưu trữ hóa đơn',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.archiveInvoice(id);
              if (!res.ok) {
                IP.UI.toast({ title: 'Không thể lưu trữ', message: res.error.message, type: 'danger' });
                return;
              }
              IP.UI.toast({ title: 'Đã lưu trữ', message: 'Hóa đơn ' + res.data.number + ' đã được lưu trữ.', type: 'success' });
              renderPage();
            }
          });
        } else if (action === 'export-all-csv' || action === 'bulk-csv') {
          const targetList = action === 'bulk-csv'
            ? Array.from(selectedIds).map(function (x) { return IP.DB.getInvoice(x); }).filter(Boolean)
            : IP.DB.listInvoices({ q: filterState.q, status: filterState.status, customerId: filterState.customerId });
          const headers = ['Số hóa đơn', 'Khách hàng', 'Ngày phát hành', 'Hạn thanh toán', 'Tổng tiền (VND)', 'Đã thu (VND)', 'Còn phải thu (VND)', 'Trạng thái'];
          const rows = targetList.map(function (inv) {
            const cus = IP.DB.getCustomer(inv.customerId);
            return [
              inv.number,
              cus ? cus.name : inv.customerId,
              inv.issueDate,
              inv.dueDate,
              inv.total,
              inv.paidAmount,
              IP.Calc.remaining(inv),
              IP.Fmt.statusLabel(IP.Calc.effectiveStatus(inv))
            ];
          });
          IP.UI.downloadCSV('danh-sach-hoa-don', headers, rows);
        } else if (action === 'bulk-archive') {
          IP.UI.confirmModal({
            title: 'Lưu trữ ' + selectedIds.size + ' hóa đơn đã chọn?',
            message: 'Các hóa đơn chưa phát sinh thanh toán đã chọn sẽ được chuyển sang trạng thái Đã lưu trữ.',
            confirmText: 'Lưu trữ hàng loạt',
            variant: 'danger',
            onConfirm: function () {
              let count = 0;
              Array.from(selectedIds).forEach(function (invId) {
                const r = IP.DB.archiveInvoice(invId);
                if (r.ok) count++;
              });
              selectedIds.clear();
              IP.UI.toast({ title: 'Đã lưu trữ ' + count + ' hóa đơn', message: 'Danh sách đã được cập nhật.', type: 'success' });
              renderPage();
            }
          });
        }
      });
    }
  });
})(window);
