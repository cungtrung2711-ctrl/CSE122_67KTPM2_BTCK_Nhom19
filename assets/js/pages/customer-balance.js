/**
 * @owner SV2
 * @spec §8.2 Sales Customer Balances Page Script (customer-balance.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('sales-customer-balance', {
    roles: ['sales'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const filterState = {
        q: params.q || '',
        bucket: params.bucket || 'all', // 'all' | '0-30' | '31-60' | '61-90' | '90+'
        owner: params.owner || 'all',
        status: params.status || 'active',
        sort: params.sort || 'balance_desc',
        page: Number(params.page || 1),
        perPage: 10
      };

      function buildCustomerRows() {
        const list = IP.DB.listCustomers({
          q: filterState.q,
          ownerId: filterState.owner,
          status: filterState.status,
          includeArchived: filterState.status === 'archived' || filterState.status === 'all'
        });

        let enriched = list.map(function (c) {
          const bal = IP.Calc.customerBalance(c.id);
          const owner = IP.DB.getUser(c.ownerId);
          const utilRatio = c.creditLimit > 0 ? (bal.totalReceivable / c.creditLimit) : 0;
          const isHighRisk = bal.maxOverdueDays > 45 || utilRatio >= 0.8 || c.latePaymentCount >= 3;
          return {
            customer: c,
            balance: bal,
            ownerName: owner ? owner.name : 'Trần Minh Quân',
            isHighRisk: isHighRisk
          };
        });

        if (filterState.bucket !== 'all') {
          enriched = enriched.filter(function (row) {
            const b = row.balance.buckets;
            if (filterState.bucket === '0-30') return b.current > 0 || b.b1_30 > 0;
            if (filterState.bucket === '31-60') return b.b31_60 > 0;
            if (filterState.bucket === '61-90') return b.b61_90 > 0;
            if (filterState.bucket === '90+') return b.b90plus > 0;
            return true;
          });
        }

        enriched.sort(function (a, b) {
          if (filterState.sort === 'overdue_desc') return b.balance.overdueAmount - a.balance.overdueAmount;
          if (filterState.sort === 'name_asc') return a.customer.name.localeCompare(b.customer.name, 'vi');
          return b.balance.totalReceivable - a.balance.totalReceivable;
        });

        return enriched;
      }

      function render() {
        const allActiveCus = IP.DB.listCustomers({ status: 'active' });
        let totalAR = 0;
        let totalOverdue = 0;
        let highRiskCount = 0;
        allActiveCus.forEach(function (c) {
          const b = IP.Calc.customerBalance(c.id);
          totalAR += b.totalReceivable;
          totalOverdue += b.overdueAmount;
          if (b.maxOverdueDays > 45 || (c.creditLimit > 0 && b.totalReceivable / c.creditLimit >= 0.8) || c.latePaymentCount >= 3) {
            highRiskCount++;
          }
        });

        const expected30d = IP.DB.listInvoices({ includeArchived: false })
          .filter(function (inv) {
            const eff = IP.Calc.effectiveStatus(inv);
            if (!['sent', 'partial'].includes(eff)) return false;
            const d = IP.Calc.daysUntilDue(inv);
            return d >= 0 && d <= 30;
          })
          .reduce(function (s, inv) { return s + IP.Calc.remaining(inv); }, 0);

        const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
        const rows = buildCustomerRows();
        const total = rows.length;
        const totalPages = Math.max(1, Math.ceil(total / filterState.perPage));
        if (filterState.page > totalPages) filterState.page = 1;
        const pageRows = rows.slice((filterState.page - 1) * filterState.perPage, filterState.page * filterState.perPage);

        const chips = [];
        if (filterState.q) chips.push({ key: 'q', label: 'Từ khóa: ' + filterState.q });
        if (filterState.bucket !== 'all') chips.push({ key: 'bucket', label: 'Nhóm tuổi nợ: ' + filterState.bucket + ' ngày' });
        if (filterState.owner !== 'all') {
          const u = IP.DB.getUser(filterState.owner);
          chips.push({ key: 'owner', label: 'Phụ trách: ' + (u ? u.name : filterState.owner) });
        }

        const chipsHtml = chips.length
          ? '<div class="ip-filter-chips">' +
              chips.map(function (c) {
                return '<span class="ip-chip">' + IP.Utils.escapeHtml(c.label) + '<button type="button" data-action="remove-chip" data-chip="' + c.key + '" aria-label="Xóa lọc">&times;</button></span>';
              }).join('') +
              '<button type="button" class="btn btn-link btn-sm p-0 ms-2 text-decoration-none" data-action="clear-filters">Xóa bộ lọc</button>' +
            '</div>'
          : '';

        const tableRowsHtml = pageRows.map(function (r) {
          const c = r.customer;
          const b = r.balance;
          const tot = Math.max(1, b.totalReceivable);
          const pCur = Math.round((b.buckets.current / tot) * 100);
          const p30 = Math.round((b.buckets.b1_30 / tot) * 100);
          const p60 = Math.round((b.buckets.b31_60 / tot) * 100);
          const p90 = Math.max(0, 100 - pCur - p30 - p60);

          return (
            '<tr data-action="open-cus-drawer" data-id="' + c.id + '" style="cursor:pointer;">' +
              '<td data-label="Khách hàng">' +
                '<div class="fw-bold text-primary">' + IP.Utils.escapeHtml(c.name) + '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(c.code) + ' · ' + IP.Utils.escapeHtml(c.industry) + ' · Phụ trách: ' + IP.Utils.escapeHtml(r.ownerName) + '</div>' +
              '</td>' +
              '<td data-label="Người liên hệ">' +
                '<div class="fw-semibold">' + IP.Utils.escapeHtml(c.contactName) + '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(c.email) + '</div>' +
              '</td>' +
              '<td data-label="Tổng dư nợ" class="text-end ip-num fw-bold">' + IP.Fmt.currency(b.totalReceivable) + '</td>' +
              '<td data-label="Trong đó quá hạn" class="text-end ip-num ' + (b.overdueAmount > 0 ? 'text-danger fw-semibold' : 'text-muted') + '">' +
                IP.Fmt.currency(b.overdueAmount) +
              '</td>' +
              '<td data-label="Phân bổ tuổi nợ" title="Trong hạn: ' + IP.Fmt.currency(b.buckets.current) + ' | 1-30 ngày: ' + IP.Fmt.currency(b.buckets.b1_30) + ' | 31-60 ngày: ' + IP.Fmt.currency(b.buckets.b31_60) + ' | >60 ngày: ' + IP.Fmt.currency(b.buckets.b61_90 + b.buckets.b90plus) + '">' +
                (b.totalReceivable > 0
                  ? '<div class="sal-aging-bar mb-1">' +
                      '<div class="sal-aging-seg-current" style="width:' + pCur + '%"></div>' +
                      '<div class="sal-aging-seg-30" style="width:' + p30 + '%"></div>' +
                      '<div class="sal-aging-seg-60" style="width:' + p60 + '%"></div>' +
                      '<div class="sal-aging-seg-90" style="width:' + p90 + '%"></div>' +
                    '</div>' +
                    '<div class="small text-muted">' + (b.maxOverdueDays > 0 ? ('Trễ nhất ' + b.maxOverdueDays + ' ngày') : '100% trong hạn') + '</div>'
                  : '<span class="small text-success">Không còn dư nợ</span>') +
              '</td>' +
              '<td data-label="Thanh toán gần nhất">' + (b.lastPaymentAt ? IP.Fmt.date(b.lastPaymentAt) : '<span class="text-muted">Chưa có</span>') + '</td>' +
              '<td data-label="Thao tác" class="text-end" data-stop-row="1">' +
                '<div class="btn-group">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="open-cus-drawer" data-id="' + c.id + '">Chi tiết</button>' +
                  '<a href="sales-payment-reminders.html?customerId=' + c.id + '" class="btn btn-sm btn-primary ' + (b.totalReceivable <= 0 ? 'disabled' : '') + '">Nhắc hạn</a>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Công nợ khách hàng</h1>' +
              '<p class="ip-page-subtitle">Theo dõi số dư phải thu, phân tích tuổi nợ từng khách hàng và chủ động gửi nhắc thanh toán.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="export-csv"><i class="bi bi-file-earmark-spreadsheet"></i> Xuất CSV</button>' +
              '<a href="sales-payment-reminders.html" class="btn btn-primary"><i class="bi bi-envelope-plus"></i> Tạo nhắc thanh toán</a>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid">' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Tổng công nợ phải thu</span><span class="ip-kpi-icon"><i class="bi bi-building-check"></i></span></div>' +
              '<div class="ip-kpi-value">' + IP.Fmt.currency(totalAR, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đầy đủ: ' + IP.Fmt.currency(totalAR) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Dư nợ quá hạn</span><span class="ip-kpi-icon text-danger"><i class="bi bi-exclamation-circle"></i></span></div>' +
              '<div class="ip-kpi-value text-danger">' + IP.Fmt.currency(totalOverdue, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đầy đủ: ' + IP.Fmt.currency(totalOverdue) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Khách hàng rủi ro cao</span><span class="ip-kpi-icon text-warning"><i class="bi bi-shield-exclamation"></i></span></div>' +
              '<div class="ip-kpi-value">' + highRiskCount + ' khách hàng</div>' +
              '<div class="ip-kpi-sub">Trễ > 45 ngày hoặc sát hạn mức</div>' +
            '</div>' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Dự kiến thu 30 ngày tới</span><span class="ip-kpi-icon text-success"><i class="bi bi-calendar-check"></i></span></div>' +
              '<div class="ip-kpi-value text-success">' + IP.Fmt.currency(expected30d, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Từ các hóa đơn sắp đáo hạn</div>' +
            '</div>' +
          '</section>' +

          '<section class="ip-filter-bar">' +
            '<div class="row g-2 align-items-end">' +
              '<div class="col-md-3">' +
                '<label class="form-label" for="sal-q">Tìm khách hàng</label>' +
                '<input type="search" id="sal-q" class="form-control" value="' + IP.Utils.escapeHtml(filterState.q) + '" placeholder="Tên công ty, mã KH, người liên hệ...">' +
              '</div>' +
              '<div class="col-sm-6 col-md-3">' +
                '<label class="form-label" for="sal-bucket" title="Tuổi nợ tính bằng số ngày quá hạn so với ngày đến hạn hóa đơn">Nhóm tuổi nợ <i class="bi bi-info-circle"></i></label>' +
                '<select id="sal-bucket" class="form-select">' +
                  '<option value="all" ' + (filterState.bucket === 'all' ? 'selected' : '') + '>Tất cả nhóm tuổi nợ</option>' +
                  '<option value="0-30" ' + (filterState.bucket === '0-30' ? 'selected' : '') + '>0–30 ngày</option>' +
                  '<option value="31-60" ' + (filterState.bucket === '31-60' ? 'selected' : '') + '>31–60 ngày</option>' +
                  '<option value="61-90" ' + (filterState.bucket === '61-90' ? 'selected' : '') + '>61–90 ngày</option>' +
                  '<option value="90+" ' + (filterState.bucket === '90+' ? 'selected' : '') + '>Trên 90 ngày</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="sal-owner">Chuyên viên phụ trách</label>' +
                '<select id="sal-owner" class="form-select">' +
                  '<option value="all">Tất cả phụ trách</option>' +
                  salesUsers.map(function (u) {
                    return '<option value="' + u.id + '" ' + (filterState.owner === u.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(u.name) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="sal-status">Trạng thái KH</label>' +
                '<select id="sal-status" class="form-select">' +
                  '<option value="active" ' + (filterState.status === 'active' ? 'selected' : '') + '>Đang hoạt động</option>' +
                  '<option value="archived" ' + (filterState.status === 'archived' ? 'selected' : '') + '>Đã lưu trữ</option>' +
                  '<option value="all" ' + (filterState.status === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="sal-sort">Sắp xếp theo</label>' +
                '<select id="sal-sort" class="form-select">' +
                  '<option value="balance_desc" ' + (filterState.sort === 'balance_desc' ? 'selected' : '') + '>Tổng dư nợ giảm dần</option>' +
                  '<option value="overdue_desc" ' + (filterState.sort === 'overdue_desc' ? 'selected' : '') + '>Quá hạn cao nhất</option>' +
                  '<option value="name_asc" ' + (filterState.sort === 'name_asc' ? 'selected' : '') + '>Tên khách hàng A–Z</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            chipsHtml +
          '</section>' +

          '<div class="ip-table-wrap">' +
            (pageRows.length
              ? '<div class="table-responsive">' +
                  '<table class="table ip-table-responsive-cards align-middle">' +
                    '<thead><tr><th>Khách hàng</th><th>Người liên hệ</th><th class="text-end">Tổng dư nợ</th><th class="text-end">Trong đó quá hạn</th><th>Phân bổ tuổi nợ</th><th>Thanh toán gần nhất</th><th class="text-end">Thao tác</th></tr></thead>' +
                    '<tbody>' + tableRowsHtml + '</tbody>' +
                  '</table>' +
                '</div>' +
                IP.UI.renderPagination({ total: total, page: filterState.page, perPage: filterState.perPage })
              : IP.UI.renderEmptyState({
                  title: 'Không có khách hàng khớp điều kiện lọc',
                  description: 'Thử xóa bộ lọc để xem toàn bộ danh sách công nợ khách hàng.',
                  actionText: 'Xóa bộ lọc',
                  actionAttr: 'clear-filters'
                })) +
          '</div>' +
          '<div id="sal-cus-drawer-host"></div>';

        const qEl = root.querySelector('#sal-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            filterState.q = qEl.value;
            filterState.page = 1;
            render();
          }, 200));
        }
        ['bucket', 'owner', 'status', 'sort'].forEach(function (field) {
          const sel = root.querySelector('#sal-' + field);
          if (sel) {
            sel.addEventListener('change', function () {
              filterState[field] = sel.value;
              filterState.page = 1;
              render();
            });
          }
        });
      }

      function openCustomerDrawer(customerId) {
        const cus = IP.DB.getCustomer(customerId);
        if (!cus) {
          IP.UI.toast({ title: 'Không tìm thấy khách hàng', message: 'Mã khách hàng không tồn tại.', type: 'warning' });
          return;
        }
        const bal = IP.Calc.customerBalance(cus.id);
        const openInvoices = IP.DB.listInvoices({ customerId: cus.id }).filter(function (inv) {
          return !inv.voided && !inv.archived && inv.sentAt && IP.Calc.remaining(inv) > 0;
        });
        const payments = IP.DB.listPayments({ customerId: cus.id, status: 'confirmed' }).slice(0, 5);
        const firstInvId = openInvoices.length > 0 ? openInvoices[0].id : '';

        const host = document.getElementById('sal-cus-drawer-host') || document.body;
        host.innerHTML =
          '<div class="offcanvas offcanvas-end ip-drawer-wide show" tabindex="-1" style="visibility:visible;" aria-modal="true" role="dialog">' +
            '<div class="offcanvas-header border-bottom">' +
              '<div>' +
                '<h2 class="offcanvas-title fs-5 fw-bold mb-0">' + IP.Utils.escapeHtml(cus.name) + '</h2>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus.code) + ' · MST: ' + IP.Utils.escapeHtml(cus.taxCode || '—') + '</div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-action="close-cus-drawer" aria-label="Đóng"></button>' +
            '</div>' +
            '<div class="offcanvas-body">' +
              '<div class="row g-2 mb-3 small bg-body-tertiary p-3 rounded border">' +
                '<div class="col-6">Liên hệ: <strong>' + IP.Utils.escapeHtml(cus.contactName) + '</strong></div>' +
                '<div class="col-6">Điện thoại: <strong>' + IP.Utils.escapeHtml(cus.phone) + '</strong></div>' +
                '<div class="col-12">Email: <strong>' + IP.Utils.escapeHtml(cus.email) + '</strong></div>' +
                '<div class="col-6">Tổng phải thu: <strong class="ip-num text-primary">' + IP.Fmt.currency(bal.totalReceivable) + '</strong></div>' +
                '<div class="col-6">Hạn mức TD: <strong class="ip-num">' + IP.Fmt.currency(cus.creditLimit) + '</strong></div>' +
              '</div>' +

              '<h3 class="fs-6 fw-bold mb-2">Hóa đơn đang mở (' + openInvoices.length + ')</h3>' +
              (openInvoices.length
                ? '<div class="table-responsive mb-3">' +
                    '<table class="table table-sm border small align-middle">' +
                      '<thead><tr><th>Mã HĐ</th><th>Hạn TT</th><th class="text-end">Còn lại</th><th>Trạng thái</th><th class="text-end">Mở</th></tr></thead>' +
                      '<tbody>' +
                        openInvoices.map(function (inv) {
                          return '<tr>' +
                            '<td class="fw-bold"><a href="sales-invoice-detail.html?id=' + inv.id + '">' + IP.Utils.escapeHtml(inv.number) + '</a></td>' +
                            '<td>' + IP.Fmt.date(inv.dueDate) + '</td>' +
                            '<td class="text-end ip-num fw-semibold">' + IP.Fmt.currency(IP.Calc.remaining(inv)) + '</td>' +
                            '<td>' + IP.UI.statusBadge(IP.Calc.effectiveStatus(inv)) + '</td>' +
                            '<td class="text-end"><a href="sales-invoice-detail.html?id=' + inv.id + '" class="btn btn-sm btn-link p-0">Xem</a></td>' +
                          '</tr>';
                        }).join('') +
                      '</tbody>' +
                    '</table>' +
                  '</div>'
                : '<p class="small text-muted mb-3">Khách hàng không có hóa đơn nợ nào.</p>') +

              '<h3 class="fs-6 fw-bold mb-2">Lịch sử thanh toán gần đây</h3>' +
              (payments.length
                ? '<ul class="list-group list-group-flush border rounded small">' +
                    payments.map(function (p) {
                      return '<li class="list-group-item d-flex justify-content-between">' +
                        '<span>' + IP.Utils.escapeHtml(p.reference) + ' (' + IP.Fmt.date(p.paidAt) + ')</span>' +
                        '<strong class="ip-num text-success">' + IP.Fmt.currency(p.allocatedAmount || p.amount) + '</strong>' +
                      '</li>';
                    }).join('') +
                  '</ul>'
                : '<p class="small text-muted">Chưa có lịch sử thanh toán.</p>') +
            '</div>' +
            '<div class="offcanvas-header border-top bg-body-tertiary d-flex justify-content-end gap-2">' +
              (firstInvId ? '<a href="sales-invoice-detail.html?id=' + firstInvId + '" class="btn btn-outline-secondary btn-sm"><i class="bi bi-file-text"></i> Xem hóa đơn</a>' : '') +
              '<a href="sales-payment-reminders.html?customerId=' + cus.id + (firstInvId ? ('&invoiceId=' + firstInvId) : '') + '" class="btn btn-primary btn-sm ' + (bal.totalReceivable <= 0 ? 'disabled' : '') + '"><i class="bi bi-envelope-paper"></i> Tạo nhắc thanh toán</a>' +
            '</div>' +
          '</div>' +
          '<div class="offcanvas-backdrop fade show" data-action="close-cus-drawer"></div>';
      }

      IP.UI.withLoading(root, function () {
        render();
        if (params.open) openCustomerDrawer(params.open);
      });

      root.addEventListener('click', function (ev) {
        const el = ev.target.closest('[data-action]');
        if (!el) return;
        const action = el.getAttribute('data-action');
        const id = el.getAttribute('data-id');

        if (action === 'open-cus-drawer') {
          if (ev.target.closest('a')) return;
          openCustomerDrawer(id);
        } else if (action === 'close-cus-drawer') {
          const host = document.getElementById('sal-cus-drawer-host');
          if (host) host.innerHTML = '';
          IP.Utils.setQueryParams({ open: null });
        } else if (action === 'remove-chip') {
          const k = el.getAttribute('data-chip');
          if (k === 'q') filterState.q = '';
          if (k === 'bucket') filterState.bucket = 'all';
          if (k === 'owner') filterState.owner = 'all';
          render();
        } else if (action === 'clear-filters') {
          filterState.q = '';
          filterState.bucket = 'all';
          filterState.owner = 'all';
          filterState.status = 'active';
          IP.Utils.setQueryParams({ state: null, q: null, bucket: null, owner: null });
          render();
        } else if (action === 'page-change') {
          filterState.page = Number(el.getAttribute('data-page') || 1);
          render();
        } else if (action === 'export-csv') {
          const rows = buildCustomerRows();
          const headers = ['Mã KH', 'Tên khách hàng', 'Người liên hệ', 'Email', 'Tổng dư nợ (VND)', 'Quá hạn (VND)', 'Trễ tối đa (ngày)'];
          const csvRows = rows.map(function (r) {
            return [r.customer.code, r.customer.name, r.customer.contactName, r.customer.email, r.balance.totalReceivable, r.balance.overdueAmount, r.balance.maxOverdueDays];
          });
          IP.UI.downloadCSV('cong-no-khach-hang', headers, csvRows);
        }
      });
    }
  });
})(window);
