/**
 * @owner SV3
 * @spec §8.3, §9.4 Manager Receivables Overview Dashboard & AI-3 Integration (dashboard.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('manager-receivable-dashboard', {
    roles: ['manager'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentPeriod = ['30d', '90d', 'year', 'all'].includes(params.period) ? params.period : '90d';
      let chartInstances = [];

      function destroyCharts() {
        chartInstances.forEach(function (c) {
          try { c.destroy(); } catch (e) {}
        });
        chartInstances = [];
      }

      function render() {
        destroyCharts();
        const periodDaysMap = { '30d': 30, '90d': 90, 'year': 365, 'all': 180 };
        const pDays = periodDaysMap[currentPeriod] || 90;

        const invoices = IP.DB.listInvoices({ period: currentPeriod, includeArchived: false });
        const ag = IP.Calc.aging(invoices);
        const dsoObj = IP.Calc.dso(pDays);
        const fc = IP.Calc.forecastCashflow({ horizonDays: 90, scenario: 'base' });

        const expected30 = invoices
          .filter(function (inv) {
            const eff = IP.Calc.effectiveStatus(inv);
            if (!['sent', 'partial'].includes(eff)) return false;
            const d = IP.Calc.daysUntilDue(inv);
            return d >= 0 && d <= 30;
          })
          .reduce(function (s, inv) { return s + IP.Calc.remaining(inv); }, 0);

        // Top 5 customers by balance
        const cusBalances = IP.DB.listCustomers({ status: 'active' })
          .map(function (c) {
            return { customer: c, balance: IP.Calc.customerBalance(c.id).totalReceivable };
          })
          .filter(function (x) { return x.balance > 0; })
          .sort(function (a, b) { return b.balance - a.balance; })
          .slice(0, 5);

        // Attention overdue invoices (top 6)
        const attentionOverdue = invoices
          .filter(function (inv) { return IP.Calc.effectiveStatus(inv) === 'overdue'; })
          .sort(function (a, b) { return IP.Calc.overdueDays(b) - IP.Calc.overdueDays(a); })
          .slice(0, 6);

        const savedReports = IP.DB.listAIReports({});

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Tổng quan công nợ</h1>' +
              '<p class="ip-page-subtitle">Theo dõi sức khỏe dòng tiền, phân tích tuổi nợ, chỉ số DSO và tóm tắt điều hành bằng AI-3.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<div class="btn-group" role="group" aria-label="Chọn kỳ phân tích">' +
                '<button type="button" class="btn btn-sm ' + (currentPeriod === '30d' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-period" data-period="30d">Tháng này (30 ngày)</button>' +
                '<button type="button" class="btn btn-sm ' + (currentPeriod === '90d' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-period" data-period="90d">Quý này (90 ngày)</button>' +
                '<button type="button" class="btn btn-sm ' + (currentPeriod === 'year' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-period" data-period="year">Năm nay</button>' +
                '<button type="button" class="btn btn-sm ' + (currentPeriod === 'all' ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-period" data-period="all">Toàn bộ</button>' +
              '</div>' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="refresh-dash"><i class="bi bi-arrow-clockwise"></i> Làm mới</button>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid">' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Tổng phải thu trong kỳ</span><span class="ip-kpi-icon"><i class="bi bi-bar-chart-line"></i></span></div>' +
              '<div class="ip-kpi-value">' + IP.Fmt.currency(ag.totalReceivable, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đầy đủ: ' + IP.Fmt.currency(ag.totalReceivable) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card" data-action="go-overdue">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Tổng quá hạn</span><span class="ip-kpi-icon text-danger"><i class="bi bi-exclamation-octagon"></i></span></div>' +
              '<div class="ip-kpi-value text-danger">' + IP.Fmt.currency(ag.totalOverdue, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">' + IP.Fmt.currency(ag.totalOverdue) + ' · Bấm để xử lý</div>' +
            '</div>' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">Dự kiến thu 30 ngày</span><span class="ip-kpi-icon text-success"><i class="bi bi-graph-up-arrow"></i></span></div>' +
              '<div class="ip-kpi-value text-success">' + IP.Fmt.currency(expected30, true) + '</div>' +
              '<div class="ip-kpi-sub ip-num">Đầy đủ: ' + IP.Fmt.currency(expected30) + '</div>' +
            '</div>' +
            '<div class="ip-kpi-card" title="' + IP.Utils.escapeHtml(dsoObj.formulaText) + '">' +
              '<div class="ip-kpi-top"><span class="ip-kpi-label">DSO (Số ngày thu tiền BQ) <i class="bi bi-info-circle"></i></span><span class="ip-kpi-icon text-warning"><i class="bi bi-stopwatch"></i></span></div>' +
              '<div class="ip-kpi-value">' + dsoObj.days + ' ngày</div>' +
              '<div class="ip-kpi-sub">So với kỳ trước: <strong class="text-success">' + dsoObj.delta + ' ngày</strong> (' + dsoObj.previousDays + ' ngày)</div>' +
            '</div>' +
          '</section>' +

          '<div class="mgr-dashboard-grid">' +
            '<div>' +
              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">1. Cơ cấu tuổi nợ (Aging Buckets)</h2>' +
                  '<span class="small text-muted">Đơn vị: VND</span>' +
                '</div>' +
                '<div class="ip-card-body">' +
                  '<div class="mgr-chart-box"><canvas id="mgr-aging-chart" aria-label="Biểu đồ cơ cấu tuổi nợ"></canvas></div>' +
                  '<div class="small text-muted mt-2">Tóm tắt văn bản: Trong hạn ' + IP.Fmt.currency(ag.current) + '; Quá hạn 1–30 ngày ' + IP.Fmt.currency(ag.b1_30) + '; 31–60 ngày ' + IP.Fmt.currency(ag.b31_60) + '; 61–90 ngày ' + IP.Fmt.currency(ag.b61_90) + '; Trên 90 ngày ' + IP.Fmt.currency(ag.b90plus) + '.</div>' +
                '</div>' +
              '</div>' +

              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">2. Dự kiến dòng tiền thu về 90 ngày tới</h2>' +
                  '<a href="manager-cashflow-forecast.html" class="small text-decoration-none">Mở trang Dự báo chi tiết &rarr;</a>' +
                '</div>' +
                '<div class="ip-card-body">' +
                  '<div class="mgr-chart-box"><canvas id="mgr-cashflow-chart" aria-label="Biểu đồ dòng tiền dự kiến 90 ngày"></canvas></div>' +
                  '<div class="small text-muted mt-2">Tóm tắt văn bản: Tổng dự kiến thu 90 ngày theo kịch bản cơ sở đạt ' + IP.Fmt.currency(fc.totals.cumulative) + '.</div>' +
                '</div>' +
              '</div>' +

              '<div class="ip-card">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">3. Top 5 khách hàng có dư nợ cao nhất</h2>' +
                '</div>' +
                '<div class="ip-card-body">' +
                  '<div class="mgr-chart-box"><canvas id="mgr-topcus-chart" aria-label="Biểu đồ top 5 khách hàng dư nợ cao nhất"></canvas></div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div>' +
              '<div class="mb-4" id="mgr-ai-cashflow-slot"></div>' +

              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">Báo cáo AI đã lưu gần đây (' + savedReports.length + ')</h2>' +
                '</div>' +
                '<div class="ip-card-body p-0">' +
                  (savedReports.length
                    ? '<ul class="list-group list-group-flush small">' +
                        savedReports.map(function (r) {
                          return (
                            '<li class="list-group-item py-2 px-3">' +
                              '<div class="d-flex justify-content-between align-items-center mb-1">' +
                                '<span class="fw-bold">' + (r.type === 'forecast' ? 'Dự báo kịch bản' : 'Tổng quan công nợ') + ' (' + IP.Utils.escapeHtml(r.period) + ')</span>' +
                                '<div class="d-flex gap-1">' +
                                  '<button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" data-action="view-report" data-id="' + r.id + '">Xem</button>' +
                                  '<button type="button" class="btn btn-sm btn-link p-0 text-danger text-decoration-none ms-2" data-action="delete-report" data-id="' + r.id + '">Xóa</button>' +
                                '</div>' +
                              '</div>' +
                              '<div class="text-muted text-truncate">' + IP.Utils.escapeHtml(r.summary) + '</div>' +
                              '<div class="text-muted mt-1" style="font-size:0.72rem">' + IP.Fmt.dateTime(r.createdAt) + ' · Độ tin cậy: ' + IP.Fmt.statusLabel(r.confidence) + '</div>' +
                            '</li>'
                          );
                        }).join('') +
                      '</ul>'
                    : '<div class="p-3 small text-muted text-center">Chưa có báo cáo AI nào được lưu.</div>') +
                '</div>' +
              '</div>' +

              '<div class="ip-card">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">Hóa đơn quá hạn cần chú ý</h2>' +
                  '<a href="manager-overdue-invoices.html" class="small text-decoration-none">Xem tất cả</a>' +
                '</div>' +
                '<div class="table-responsive">' +
                  '<table class="table table-sm align-middle mb-0 small">' +
                    '<thead><tr><th>Mã HĐ & Khách hàng</th><th>Quá hạn</th><th class="text-end">Còn lại</th><th>Rủi ro</th></tr></thead>' +
                    '<tbody>' +
                      attentionOverdue.map(function (inv) {
                        const cus = IP.DB.getCustomer(inv.customerId);
                        const ov = IP.Calc.overdueDays(inv);
                        const risk = IP.Calc.riskOf(inv, cus);
                        return (
                          '<tr>' +
                            '<td>' +
                              '<a href="manager-overdue-invoices.html?open=' + inv.id + '" class="fw-bold text-decoration-none">' + IP.Utils.escapeHtml(inv.number) + '</a>' +
                              '<div class="text-muted text-truncate" style="max-width:160px;">' + IP.Utils.escapeHtml(cus ? cus.name : '') + '</div>' +
                            '</td>' +
                            '<td class="text-danger fw-semibold">' + ov + ' ngày</td>' +
                            '<td class="text-end ip-num fw-bold">' + IP.Fmt.currency(IP.Calc.remaining(inv)) + '</td>' +
                            '<td>' + IP.UI.riskBadge(risk) + '</td>' +
                          '</tr>'
                        );
                      }).join('') +
                    '</tbody>' +
                  '</table>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        const aiSlot = root.querySelector('#mgr-ai-cashflow-slot');
        IP.AI.mountPanel(aiSlot, {
          id: 'cashflow',
          manualActionLabel: 'Xem số liệu thủ công',
          getContext: function () {
            return { mode: 'dashboard', period: currentPeriod, horizonDays: pDays, scenario: 'base' };
          },
          onAction: function (cmd, result) {
            if (cmd === 'save-report' && result && result.reportPayload) {
              const saved = IP.DB.saveAIReport(result.reportPayload);
              if (saved.ok) {
                IP.UI.toast({ title: 'Đã lưu báo cáo AI-3', message: 'Bản chụp báo cáo đã xuất hiện trong mục Báo cáo đã lưu gần đây.', type: 'success' });
                render();
              }
            } else if (cmd === 'change-assumptions') {
              window.location.href = 'manager-cashflow-forecast.html#assumptions';
            }
          }
        });

        drawCharts(ag, fc, cusBalances);
      }

      function drawCharts(ag, fc, cusBalances) {
        if (!window.Chart) {
          // Fallback summary tables if Chart.js fails to load (§8.3)
          ['mgr-aging-chart', 'mgr-cashflow-chart', 'mgr-topcus-chart'].forEach(function (cid) {
            const cEl = document.getElementById(cid);
            if (cEl && cEl.parentNode) {
              cEl.parentNode.innerHTML = '<div class="p-3 small text-muted border rounded">Bảng tóm tắt thay thế biểu đồ: Tổng phải thu ' + IP.Fmt.currency(ag.totalReceivable) + ', Quá hạn ' + IP.Fmt.currency(ag.totalOverdue) + '.</div>';
            }
          });
          return;
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#EAF2EF' : '#152521';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

        const ctx1 = document.getElementById('mgr-aging-chart');
        if (ctx1) {
          chartInstances.push(new window.Chart(ctx1, {
            type: 'bar',
            data: {
              labels: ['Trong hạn', '1–30 ngày', '31–60 ngày', '61–90 ngày', 'Trên 90 ngày'],
              datasets: [{
                label: 'Dư nợ (VND)',
                data: [ag.current, ag.b1_30, ag.b31_60, ag.b61_90, ag.b90plus],
                backgroundColor: ['#0E7A68', '#E8B44A', '#FDB022', '#E2765C', '#B42318'],
                borderRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              }
            }
          }));
        }

        const ctx2 = document.getElementById('mgr-cashflow-chart');
        if (ctx2) {
          chartInstances.push(new window.Chart(ctx2, {
            type: 'line',
            data: {
              labels: fc.periods.map(function (p) { return p.label; }),
              datasets: [
                {
                  label: 'Tổng dự kiến thu (VND)',
                  data: fc.periods.map(function (p) { return p.totalExpected; }),
                  borderColor: '#0E7A68',
                  backgroundColor: 'rgba(14, 122, 104, 0.14)',
                  fill: true,
                  tension: 0.3
                },
                {
                  label: 'Thu từ hóa đơn trong hạn',
                  data: fc.periods.map(function (p) { return p.dueExpected; }),
                  borderColor: '#E8B44A',
                  borderDash: [5, 5],
                  tension: 0.3
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              }
            }
          }));
        }

        const ctx3 = document.getElementById('mgr-topcus-chart');
        if (ctx3) {
          chartInstances.push(new window.Chart(ctx3, {
            type: 'bar',
            data: {
              labels: cusBalances.map(function (x) { return x.customer.name.replace('Công ty ', ''); }),
              datasets: [{
                label: 'Dư nợ (VND)',
                data: cusBalances.map(function (x) { return x.balance; }),
                backgroundColor: '#0E7A68',
                borderRadius: 6
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { display: false } }
              }
            }
          }));
        }
      }

      window.addEventListener('ip:themechange', function () {
        render();
      });

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'set-period') {
          currentPeriod = btn.getAttribute('data-period');
          IP.Utils.setQueryParams({ period: currentPeriod });
          render();
        } else if (action === 'refresh-dash') {
          IP.UI.toast({ title: 'Đã cập nhật số liệu', message: 'Biểu đồ và chỉ số đã được tính toán lại từ DB.', type: 'info' });
          render();
        } else if (action === 'go-overdue') {
          window.location.href = 'manager-overdue-invoices.html';
        } else if (action === 'view-report') {
          const r = IP.DB.getAIReport(id);
          if (!r) return;
          IP.UI.confirmModal({
            title: 'Báo cáo AI đã lưu (' + r.period + ')',
            message: r.summary,
            confirmText: 'Đóng',
            cancelText: 'Thoát'
          });
        } else if (action === 'delete-report') {
          IP.UI.confirmModal({
            title: 'Xóa báo cáo AI đã lưu?',
            message: 'Bản chụp báo cáo này sẽ bị xóa khỏi danh sách đã lưu.',
            confirmText: 'Xóa báo cáo',
            variant: 'danger',
            onConfirm: function () {
              IP.DB.deleteAIReport(id);
              IP.UI.toast({ title: 'Đã xóa báo cáo', message: 'Danh sách báo cáo đã được cập nhật.', type: 'success' });
              render();
            }
          });
        }
      });
    }
  });
})(window);
