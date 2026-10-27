/**
 * @owner SV3
 * @spec §8.3 Manager Overdue Invoices & Follow-up Handling Page Script (overdue.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('manager-overdue-invoices', {
    roles: ['manager'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const filterState = {
        q: params.q || '',
        bucket: params.bucket || 'all', // 'all' | '1-30' | '31-60' | '61-90' | '90+'
        owner: params.owner || 'all',
        risk: params.risk || 'all', // 'all' | 'high' | 'medium' | 'low'
        followUpStatus: 'all', // 'all' | 'watching' | 'closed'
        sort: 'overdue_desc'
      };
      const selectedIds = new Set();

      function getOverdueList() {
        const allInvs = IP.DB.listInvoices({ q: filterState.q, includeArchived: false })
          .filter(function (inv) { return IP.Calc.effectiveStatus(inv) === 'overdue'; });

        return allInvs
          .map(function (inv) {
            const cus = IP.DB.getCustomer(inv.customerId);
            const ov = IP.Calc.overdueDays(inv);
            const rem = IP.Calc.remaining(inv);
            const risk = IP.Calc.riskOf(inv, cus);
            const fu = inv.followUp || { assignedTo: (cus && cus.ownerId) || 'usr_sal', status: 'watching', notes: [] };
            const ownerUser = IP.DB.getUser(fu.assignedTo);
            const reminders = IP.DB.listReminders({ invoiceId: inv.id });
            const lastRem = reminders.find(function (r) { return r.status === 'sent'; }) || reminders[0] || null;
            return {
              invoice: inv,
              customer: cus,
              overdueDays: ov,
              remaining: rem,
              risk: risk,
              followUp: fu,
              ownerName: ownerUser ? ownerUser.name : 'Trần Minh Quân',
              lastReminder: lastRem
            };
          })
          .filter(function (item) {
            if (filterState.bucket === '1-30' && !(item.overdueDays >= 1 && item.overdueDays <= 30)) return false;
            if (filterState.bucket === '31-60' && !(item.overdueDays >= 31 && item.overdueDays <= 60)) return false;
            if (filterState.bucket === '61-90' && !(item.overdueDays >= 61 && item.overdueDays <= 90)) return false;
            if (filterState.bucket === '90+' && !(item.overdueDays > 90)) return false;
            if (filterState.owner !== 'all' && item.followUp.assignedTo !== filterState.owner) return false;
            if (filterState.risk !== 'all' && item.risk.level !== filterState.risk) return false;
            if (filterState.followUpStatus !== 'all' && item.followUp.status !== filterState.followUpStatus) return false;
            return true;
          })
          .sort(function (a, b) {
            if (filterState.sort === 'amount_desc') return b.remaining - a.remaining;
            return b.overdueDays - a.overdueDays;
          });
      }

      function render() {
        const allOverdue = IP.DB.listInvoices({ includeArchived: false })
          .filter(function (inv) { return IP.Calc.effectiveStatus(inv) === 'overdue'; });
        const totalOverdueAmt = allOverdue.reduce(function (s, inv) { return s + IP.Calc.remaining(inv); }, 0);
        const avgOverdue = allOverdue.length
          ? Math.round(allOverdue.reduce(function (s, inv) { return s + IP.Calc.overdueDays(inv); }, 0) / allOverdue.length)
          : 0;
        const highRiskCusIds = new Set();
        allOverdue.forEach(function (inv) {
          if (IP.Calc.riskOf(inv).level === 'high') highRiskCusIds.add(inv.customerId);
        });

        const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
        const list = getOverdueList();

        const rowsHtml = list.map(function (row) {
          const inv = row.invoice;
          const cus = row.customer;
          const isClosed = row.followUp.status === 'closed';
          const checked = selectedIds.has(inv.id) ? 'checked' : '';

          return (
            '<tr>' +
              '<td data-label="Chọn">' +
                '<input type="checkbox" class="form-check-input" data-action="toggle-row" data-id="' + inv.id + '" ' + checked + ' ' + (isClosed ? 'disabled title="Hóa đơn đã đóng theo dõi"' : '') + ' aria-label="Chọn ' + IP.Utils.escapeHtml(inv.number) + '">' +
              '</td>' +
              '<td data-label="Khách hàng & Hóa đơn">' +
                '<a href="manager-overdue-invoices.html?open=' + inv.id + '" class="fw-bold text-decoration-none" data-action="open-drawer" data-id="' + inv.id + '">' + IP.Utils.escapeHtml(inv.number) + '</a>' +
                '<div class="small fw-semibold">' + IP.Utils.escapeHtml(cus ? cus.name : '') + '</div>' +
              '</td>' +
              '<td data-label="Hạn thanh toán">' +
                '<div>' + IP.Fmt.date(inv.dueDate) + '</div>' +
                '<span class="text-danger small fw-bold">Quá hạn ' + row.overdueDays + ' ngày</span>' +
              '</td>' +
              '<td data-label="Còn phải thu" class="text-end ip-num fw-bold">' + IP.Fmt.currency(row.remaining, false, inv.issueDate) + '</td>' +
              '<td data-label="Phụ trách">' + IP.Utils.escapeHtml(row.ownerName) + '</td>' +
              '<td data-label="Mức rủi ro (Quy tắc)">' + IP.UI.riskBadge(row.risk) + '</td>' +
              '<td data-label="Nhắc gần nhất">' +
                (row.lastReminder
                  ? '<div class="small">' + IP.Fmt.date(row.lastReminder.sentAt || row.lastReminder.createdAt) + ' (' + IP.Fmt.channelLabel(row.lastReminder.channel) + ')</div>'
                  : '<span class="small text-muted">Chưa gửi nhắc</span>') +
              '</td>' +
              '<td data-label="Theo dõi">' + IP.UI.statusBadge(row.followUp.status) + '</td>' +
              '<td data-label="Thao tác" class="text-end">' +
                '<div class="btn-group">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="open-drawer" data-id="' + inv.id + '">Xử lý</button>' +
                  '<button type="button" class="btn btn-sm btn-outline-primary" data-action="assign-owner" data-id="' + inv.id + '" title="Giao phụ trách"><i class="bi bi-person-check"></i></button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Hóa đơn quá hạn</h1>' +
              '<p class="ip-page-subtitle">Đánh giá mức rủi ro theo công thức luật tường minh, giao phụ trách Kinh doanh và theo dõi ghi chú xử lý.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="export-csv"><i class="bi bi-file-earmark-spreadsheet"></i> Xuất CSV (' + list.length + ')</button>' +
              (selectedIds.size > 0
                ? '<button type="button" class="btn btn-primary" data-action="bulk-assign"><i class="bi bi-people"></i> Giao phụ trách (' + selectedIds.size + ' HĐ chọn)</button>'
                : '') +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid">' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Số hóa đơn quá hạn</div><div class="ip-kpi-value mt-1 text-danger">' + allOverdue.length + ' hóa đơn</div><div class="ip-kpi-sub">Đang cần thu hồi</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Tổng tiền quá hạn</div><div class="ip-kpi-value mt-1 text-danger">' + IP.Fmt.currency(totalOverdueAmt, true) + '</div><div class="ip-kpi-sub ip-num">' + IP.Fmt.currency(totalOverdueAmt) + '</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Số ngày quá hạn bình quân</div><div class="ip-kpi-value mt-1">' + avgOverdue + ' ngày</div><div class="ip-kpi-sub">Tính trên ' + allOverdue.length + ' hóa đơn</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Khách hàng rủi ro cao</div><div class="ip-kpi-value mt-1 text-warning">' + highRiskCusIds.size + ' khách hàng</div><div class="ip-kpi-sub">Điểm rủi ro luật >= 60</div></div>' +
          '</section>' +

          '<section class="ip-filter-bar">' +
            '<div class="row g-2 align-items-end">' +
              '<div class="col-md-3">' +
                '<label class="form-label" for="ov-q">Tìm hóa đơn / khách hàng</label>' +
                '<input type="search" id="ov-q" class="form-control" value="' + IP.Utils.escapeHtml(filterState.q) + '" placeholder="Mã HĐ, tên công ty...">' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="ov-bucket">Tuổi nợ quá hạn</label>' +
                '<select id="ov-bucket" class="form-select">' +
                  '<option value="all" ' + (filterState.bucket === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                  '<option value="1-30" ' + (filterState.bucket === '1-30' ? 'selected' : '') + '>1–30 ngày</option>' +
                  '<option value="31-60" ' + (filterState.bucket === '31-60' ? 'selected' : '') + '>31–60 ngày</option>' +
                  '<option value="61-90" ' + (filterState.bucket === '61-90' ? 'selected' : '') + '>61–90 ngày</option>' +
                  '<option value="90+" ' + (filterState.bucket === '90+' ? 'selected' : '') + '>Trên 90 ngày</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="ov-risk" title="Điểm rủi ro = Ngày quá hạn + Tỷ lệ Dư nợ/Hạn mức + Lịch sử trễ hạn">Mức rủi ro (Luật) <i class="bi bi-info-circle"></i></label>' +
                '<select id="ov-risk" class="form-select">' +
                  '<option value="all" ' + (filterState.risk === 'all' ? 'selected' : '') + '>Tất cả mức</option>' +
                  '<option value="high" ' + (filterState.risk === 'high' ? 'selected' : '') + '>Rủi ro Cao</option>' +
                  '<option value="medium" ' + (filterState.risk === 'medium' ? 'selected' : '') + '>Rủi ro Trung bình</option>' +
                  '<option value="low" ' + (filterState.risk === 'low' ? 'selected' : '') + '>Rủi ro Thấp</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-2">' +
                '<label class="form-label" for="ov-owner">Nhân sự Kinh doanh</label>' +
                '<select id="ov-owner" class="form-select">' +
                  '<option value="all">Tất cả phụ trách</option>' +
                  salesUsers.map(function (u) {
                    return '<option value="' + u.id + '" ' + (filterState.owner === u.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(u.name) + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-3">' +
                '<label class="form-label" for="ov-fu">Trạng thái theo dõi</label>' +
                '<select id="ov-fu" class="form-select">' +
                  '<option value="all" ' + (filterState.followUpStatus === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                  '<option value="watching" ' + (filterState.followUpStatus === 'watching' ? 'selected' : '') + '>Đang theo dõi</option>' +
                  '<option value="closed" ' + (filterState.followUpStatus === 'closed' ? 'selected' : '') + '>Đã đóng theo dõi</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<div class="ip-table-wrap">' +
            (list.length
              ? '<div class="table-responsive">' +
                  '<table class="table ip-table-responsive-cards align-middle">' +
                    '<thead><tr><th style="width:40px;"></th><th>Khách hàng & Hóa đơn</th><th>Hạn thanh toán</th><th class="text-end">Còn phải thu</th><th>Phụ trách</th><th>Mức rủi ro</th><th>Nhắc gần nhất</th><th>Theo dõi</th><th class="text-end">Thao tác</th></tr></thead>' +
                    '<tbody>' + rowsHtml + '</tbody>' +
                  '</table>' +
                '</div>'
              : IP.UI.renderEmptyState({
                  title: 'Không có hóa đơn quá hạn khớp bộ lọc',
                  description: 'Thử chọn lại điều kiện lọc để xem toàn bộ danh sách.',
                  actionText: 'Xóa bộ lọc',
                  actionAttr: 'clear-filters'
                })) +
          '</div>' +
          '<div id="mgr-overdue-drawer-host"></div>';

        const qEl = root.querySelector('#ov-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            filterState.q = qEl.value;
            render();
          }, 200));
        }
        [
          ['ov-bucket', 'bucket'],
          ['ov-risk', 'risk'],
          ['ov-owner', 'owner'],
          ['ov-fu', 'followUpStatus']
        ].forEach(function (pair) {
          const sel = root.querySelector('#' + pair[0]);
          if (sel) {
            sel.addEventListener('change', function () {
              filterState[pair[1]] = sel.value;
              render();
            });
          }
        });
      }

      function openOverdueDrawer(invoiceId) {
        const inv = IP.DB.getInvoice(invoiceId);
        if (!inv) {
          IP.UI.toast({ title: 'Không tìm thấy hóa đơn', message: 'Mã hóa đơn không tồn tại.', type: 'warning' });
          return;
        }
        const cus = IP.DB.getCustomer(inv.customerId) || {};
        const risk = IP.Calc.riskOf(inv, cus);
        const fu = inv.followUp || { assignedTo: 'usr_sal', status: 'watching', notes: [] };
        const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
        const reminders = IP.DB.listReminders({ invoiceId: inv.id });

        const host = document.getElementById('mgr-overdue-drawer-host') || document.body;
        host.innerHTML =
          '<div class="offcanvas offcanvas-end ip-drawer-wide show" tabindex="-1" style="visibility:visible;" aria-modal="true" role="dialog">' +
            '<div class="offcanvas-header border-bottom">' +
              '<div>' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<h2 class="offcanvas-title fs-5 fw-bold mb-0">Xử lý quá hạn · ' + IP.Utils.escapeHtml(inv.number) + '</h2>' +
                  IP.UI.riskBadge(risk) +
                '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus.name || '') + ' · Quá hạn ' + IP.Calc.overdueDays(inv) + ' ngày</div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-action="close-drawer" aria-label="Đóng"></button>' +
            '</div>' +
            '<div class="offcanvas-body">' +
              '<div class="p-3 rounded border bg-body-tertiary small mb-3">' +
                '<div class="fw-bold mb-1">Giải thích công thức tính rủi ro (Luật tường minh):</div>' +
                '<div class="text-muted mb-1">' + IP.Utils.escapeHtml(risk.formula) + '</div>' +
                '<div class="text-primary fw-semibold">Bằng chứng: ' + IP.Utils.escapeHtml(risk.reasons.join(' · ')) + ' (Điểm: ' + risk.score + ')</div>' +
              '</div>' +

              '<div class="ip-card mb-3">' +
                '<div class="ip-card-body">' +
                  '<h3 class="fs-6 fw-bold mb-2">1. Giao phụ trách thu hồi (Chỉ chọn Kinh doanh đang hoạt động)</h3>' +
                  '<div id="drw-assign-err" class="alert alert-danger py-1 small d-none" role="alert"></div>' +
                  '<div class="mb-2">' +
                    '<label class="form-label small" for="drw-owner">Nhân sự phụ trách</label>' +
                    '<select id="drw-owner" class="form-select form-select-sm">' +
                      salesUsers.map(function (u) {
                        return '<option value="' + u.id + '" ' + (fu.assignedTo === u.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(u.name) + ' (' + IP.Utils.escapeHtml(u.email) + ')</option>';
                      }).join('') +
                    '</select>' +
                  '</div>' +
                  '<div class="mb-2">' +
                    '<label class="form-label small" for="drw-assign-reason">Ghi chú / Lý do bàn giao</label>' +
                    '<input type="text" id="drw-assign-reason" class="form-control form-control-sm" placeholder="Nhập lý do phân công hoặc chỉ đạo...">' +
                  '</div>' +
                  '<button type="button" class="btn btn-sm btn-primary" data-action="save-assign" data-id="' + inv.id + '"><i class="bi bi-person-check"></i> Lưu phân công</button>' +
                '</div>' +
              '</div>' +

              '<div class="ip-card mb-3">' +
                '<div class="ip-card-body">' +
                  '<h3 class="fs-6 fw-bold mb-2">2. Nhật ký & Ghi chú xử lý (' + (fu.notes || []).length + ')</h3>' +
                  '<div class="input-group input-group-sm mb-3">' +
                    '<input type="text" id="drw-new-note" class="form-control" placeholder="Thêm ghi chú xử lý quá hạn...">' +
                    '<button type="button" class="btn btn-primary" data-action="add-fu-note" data-id="' + inv.id + '">Thêm ghi chú</button>' +
                  '</div>' +
                  ((fu.notes || []).length
                    ? '<ul class="list-group list-group-flush border rounded small">' +
                        fu.notes.map(function (n) {
                          return '<li class="list-group-item py-2"><div>' + IP.Utils.escapeHtml(n.text) + '</div><div class="text-muted" style="font-size:0.72rem">' + IP.Fmt.dateTime(n.at) + '</div></li>';
                        }).join('') +
                      '</ul>'
                    : '<p class="small text-muted mb-0">Chưa có ghi chú xử lý nào.</p>') +
                '</div>' +
              '</div>' +

              '<h3 class="fs-6 fw-bold mb-2">Lịch sử nhắc thanh toán (' + reminders.length + ')</h3>' +
              (reminders.length
                ? '<ul class="list-group list-group-flush border rounded small mb-3">' +
                    reminders.map(function (r) {
                      return '<li class="list-group-item d-flex justify-content-between align-items-center">' +
                        '<div><div class="fw-semibold">' + IP.Utils.escapeHtml(r.subject) + '</div><div class="text-muted">' + IP.Fmt.channelLabel(r.channel) + ' · ' + IP.Fmt.dateTime(r.sentAt || r.createdAt) + '</div></div>' +
                        IP.UI.statusBadge(r.status) +
                      '</li>';
                    }).join('') +
                  '</ul>'
                : '<p class="small text-muted mb-3">Chưa có lịch sử gửi nhắc cho hóa đơn này.</p>') +
            '</div>' +
            '<div class="offcanvas-header border-top bg-body-tertiary d-flex justify-content-between flex-wrap gap-2">' +
              (fu.status === 'watching'
                ? '<button type="button" class="btn btn-outline-danger btn-sm" data-action="close-followup" data-id="' + inv.id + '"><i class="bi bi-check-square"></i> Đóng theo dõi</button>'
                : '<button type="button" class="btn btn-outline-success btn-sm" data-action="reopen-followup" data-id="' + inv.id + '"><i class="bi bi-arrow-counterclockwise"></i> Mở lại theo dõi</button>') +
              '<button type="button" class="btn btn-primary btn-sm" data-action="handoff-reminder" data-cus="' + inv.customerId + '" data-inv="' + inv.id + '"><i class="bi bi-envelope-paper"></i> Chuyển sang trang Nhắc thanh toán</button>' +
            '</div>' +
          '</div>' +
          '<div class="offcanvas-backdrop fade show" data-action="close-drawer"></div>';
      }

      IP.UI.withLoading(root, function () {
        render();
        if (params.open) openOverdueDrawer(params.open);
      });

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'open-drawer' || action === 'assign-owner') {
          ev.preventDefault();
          openOverdueDrawer(id);
        } else if (action === 'close-drawer') {
          const host = document.getElementById('mgr-overdue-drawer-host');
          if (host) host.innerHTML = '';
          IP.Utils.setQueryParams({ open: null });
        } else if (action === 'save-assign') {
          const ownerEl = document.getElementById('drw-owner');
          const reasonEl = document.getElementById('drw-assign-reason');
          const errEl = document.getElementById('drw-assign-err');
          if (errEl) errEl.classList.add('d-none');

          const res = IP.DB.assignFollowUp(id, ownerEl.value, reasonEl.value);
          if (!res.ok) {
            if (errEl) {
              errEl.textContent = res.error.message;
              errEl.classList.remove('d-none');
            }
            return;
          }
          IP.UI.toast({ title: 'Đã giao phụ trách', message: 'Thông báo phân công đã được gửi tới nhân sự Kinh doanh.', type: 'success' });
          render();
          openOverdueDrawer(id);
        } else if (action === 'add-fu-note') {
          const inp = document.getElementById('drw-new-note');
          const res = IP.DB.addFollowUpNote(id, inp ? inp.value : '');
          if (!res.ok) {
            IP.UI.toast({ title: 'Thiếu nội dung', message: res.error.message, type: 'warning' });
            return;
          }
          IP.UI.toast({ title: 'Đã lưu ghi chú xử lý', message: 'Ghi chú đã được thêm vào hồ sơ quá hạn.', type: 'success' });
          render();
          openOverdueDrawer(id);
        } else if (action === 'close-followup') {
          IP.UI.confirmModal({
            title: 'Đóng theo dõi hóa đơn quá hạn này?',
            message: 'Vui lòng nhập lý do đóng theo dõi (ví dụ: Đã có biên bản giãn nợ). Bạn có thể mở lại bất cứ lúc nào.',
            requireReason: true,
            confirmText: 'Đóng theo dõi',
            variant: 'danger',
            onConfirm: function (reason) {
              const res = IP.DB.closeFollowUp(id, reason);
              if (res.ok) {
                IP.UI.toast({ title: 'Đã đóng theo dõi', message: 'Trạng thái theo dõi đã chuyển sang Đã đóng.', type: 'info' });
                render();
                openOverdueDrawer(id);
              }
            }
          });
        } else if (action === 'reopen-followup') {
          IP.DB.reopenFollowUp(id);
          IP.UI.toast({ title: 'Đã mở lại theo dõi', message: 'Hóa đơn đã quay lại trạng thái Đang theo dõi.', type: 'success' });
          render();
          openOverdueDrawer(id);
        } else if (action === 'handoff-reminder') {
          const cusId = btn.getAttribute('data-cus');
          const invId = btn.getAttribute('data-inv');
          IP.UI.confirmModal({
            title: 'Chuyển sang vai trò Kinh doanh để soạn nhắc?',
            message: 'Trang Nhắc thanh toán thuộc phân hệ Kinh doanh. Hệ thống sẽ chuyển nhanh sang vai trò Kinh doanh và mở sẵn bộ soạn thảo cho hóa đơn này.',
            confirmText: 'Chuyển & Mở trình soạn nhắc',
            onConfirm: function () {
              IP.Auth.switchRole('sales', false);
              window.location.href = 'sales-payment-reminders.html?customerId=' + cusId + '&invoiceId=' + invId;
            }
          });
        } else if (action === 'toggle-row') {
          if (btn.checked) selectedIds.add(id);
          else selectedIds.delete(id);
          render();
        } else if (action === 'bulk-assign') {
          const salesUsers = IP.DB.listUsers({ role: 'sales', status: 'active' });
          const defaultSales = salesUsers[0] ? salesUsers[0].id : 'usr_sal';
          IP.UI.confirmModal({
            title: 'Giao phụ trách hàng loạt (' + selectedIds.size + ' hóa đơn)',
            message: 'Hệ thống sẽ giao ' + selectedIds.size + ' hóa đơn đã chọn cho ' + (salesUsers[0] ? salesUsers[0].name : 'Trần Minh Quân') + '.',
            requireReason: true,
            reasonLabel: 'Ghi chú chỉ đạo chung (bắt buộc)',
            confirmText: 'Xác nhận phân công',
            onConfirm: function (reason) {
              IP.DB.bulkAssignFollowUp(Array.from(selectedIds), defaultSales, reason);
              selectedIds.clear();
              IP.UI.toast({ title: 'Đã phân công hàng loạt', message: 'Danh sách phụ trách đã được cập nhật.', type: 'success' });
              render();
            }
          });
        } else if (action === 'clear-filters') {
          filterState.q = '';
          filterState.bucket = 'all';
          filterState.owner = 'all';
          filterState.risk = 'all';
          filterState.followUpStatus = 'all';
          IP.Utils.setQueryParams({ state: null, bucket: null, risk: null, owner: null });
          render();
        } else if (action === 'export-csv') {
          const list = getOverdueList();
          const headers = ['Số hóa đơn', 'Khách hàng', 'Hạn thanh toán', 'Số ngày quá hạn', 'Còn phải thu (VND)', 'Phụ trách', 'Mức rủi ro', 'Trạng thái theo dõi'];
          const rows = list.map(function (r) {
            return [r.invoice.number, r.customer ? r.customer.name : '', r.invoice.dueDate, r.overdueDays, r.remaining, r.ownerName, r.risk.label, IP.Fmt.statusLabel(r.followUp.status)];
          });
          IP.UI.downloadCSV('hoa-don-qua-han', headers, rows);
        }
      });
    }
  });
})(window);
