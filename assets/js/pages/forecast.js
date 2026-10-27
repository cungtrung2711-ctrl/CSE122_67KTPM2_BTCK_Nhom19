/**
 * @owner SV3
 * @spec §8.3, §9.4 Manager Cash-flow Forecast & AI-3 Scenario Page Script (forecast.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('manager-cashflow-forecast', {
    roles: ['manager'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const SCENARIO_PRESETS = {
        base: { label: 'Cơ sở', recoveryRate: 65, delayDays: 7, includePending: false },
        conservative: { label: 'Thận trọng', recoveryRate: 45, delayDays: 16, includePending: false },
        optimistic: { label: 'Lạc quan', recoveryRate: 85, delayDays: 2, includePending: true }
      };

      const params = IP.Utils.getQueryParams();
      let horizonDays = [30, 60, 90].includes(Number(params.horizon)) ? Number(params.horizon) : 60;
      let scenario = ['base', 'conservative', 'optimistic'].includes(params.scenario) ? params.scenario : 'base';
      let customAssumptions = Object.assign({}, SCENARIO_PRESETS[scenario]);
      let isCustomModified = false;
      let chartInstance = null;

      function render() {
        if (chartInstance) {
          try { chartInstance.destroy(); } catch (e) {}
          chartInstance = null;
        }

        const fc = IP.Calc.forecastCashflow({
          horizonDays: horizonDays,
          scenario: scenario,
          recoveryRate: customAssumptions.recoveryRate,
          delayDays: customAssumptions.delayDays,
          includePending: customAssumptions.includePending
        });

        const savedReports = IP.DB.listAIReports({ type: 'forecast' });

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<div class="d-flex align-items-center gap-2">' +
                '<h1 class="ip-h1 mb-0">Dự báo dòng tiền</h1>' +
                '<span class="badge bg-warning-subtle text-warning-emphasis">Dự báo quản trị nội bộ, phục vụ điều hành dòng tiền</span>' +
              '</div>' +
              '<p class="ip-page-subtitle">Dự báo dòng tiền thu về theo kỳ hạn 30/60/90 ngày và điều chỉnh trực tiếp các giả định thu hồi nợ.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<div class="btn-group" role="group" aria-label="Chọn kỳ hạn dự báo">' +
                [30, 60, 90].map(function (d) {
                  return '<button type="button" class="btn btn-sm ' + (horizonDays === d ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-horizon" data-days="' + d + '">' + d + ' ngày</button>';
                }).join('') +
              '</div>' +
              '<div class="btn-group" role="group" aria-label="Chọn kịch bản">' +
                Object.keys(SCENARIO_PRESETS).map(function (k) {
                  return '<button type="button" class="btn btn-sm ' + (scenario === k ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="set-scenario" data-scenario="' + k + '">' + SCENARIO_PRESETS[k].label + '</button>';
                }).join('') +
              '</div>' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="export-csv"><i class="bi bi-file-earmark-spreadsheet"></i> Xuất CSV</button>' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="print-forecast"><i class="bi bi-printer"></i> In / PDF</button>' +
            '</div>' +
          '</div>' +

          '<section class="mgr-assumptions-card" id="assumptions" aria-label="Giả định dự báo dòng tiền">' +
            '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">' +
              '<div>' +
                '<span class="fw-bold"><i class="bi bi-sliders me-1"></i>Khối điều chỉnh giả định kịch bản ' + IP.Utils.escapeHtml(SCENARIO_PRESETS[scenario].label) + '</span>' +
                (isCustomModified ? '<span class="badge bg-primary ms-2">Đang dùng giả định của bạn</span>' : '<span class="badge bg-secondary-subtle text-body-secondary ms-2">Mặc định kịch bản</span>') +
              '</div>' +
              '<button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-action="reset-assumptions"><i class="bi bi-arrow-counterclockwise"></i> Khôi phục mặc định</button>' +
            '</div>' +
            '<div id="fc-assump-err" class="alert alert-danger py-1 small d-none" role="alert"></div>' +
            '<div class="row g-3 align-items-end">' +
              '<div class="col-md-4">' +
                '<label class="form-label" for="fc-recovery">Tỷ lệ thu hồi nợ quá hạn (%) <span class="ip-num fw-bold text-primary" id="fc-rec-val">' + customAssumptions.recoveryRate + '%</span></label>' +
                '<input type="number" id="fc-recovery" class="form-control ip-num" value="' + customAssumptions.recoveryRate + '" min="0" max="100">' +
                '<div class="form-text">Tỷ lệ % tổng nợ quá hạn dự kiến thu hồi được trong kỳ hạn.</div>' +
              '</div>' +
              '<div class="col-md-4">' +
                '<label class="form-label" for="fc-delay">Độ trễ thanh toán bình quân (ngày)</label>' +
                '<input type="number" id="fc-delay" class="form-control ip-num" value="' + customAssumptions.delayDays + '" min="0" max="60">' +
                '<div class="form-text">Số ngày khách thường trả chậm hơn so với hạn ghi trên hóa đơn.</div>' +
              '</div>' +
              '<div class="col-md-4">' +
                '<div class="form-check mb-2">' +
                  '<input class="form-check-input" type="checkbox" id="fc-pending" ' + (customAssumptions.includePending ? 'checked' : '') + '>' +
                  '<label class="form-check-label fw-semibold small" for="fc-pending">Tính cả khoản chờ đối chiếu ngân hàng</label>' +
                '</div>' +
                '<div class="form-text">Mặc định tắt để đảm bảo nguyên tắc thận trọng trước khi Kế toán xác nhận.</div>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<div class="mgr-dashboard-grid">' +
            '<div>' +
              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">Biểu đồ kết hợp: Thực thu lịch sử & Dự báo ' + horizonDays + ' ngày tới</h2>' +
                '</div>' +
                '<div class="ip-card-body">' +
                  '<div class="mgr-chart-box"><canvas id="mgr-forecast-chart" aria-label="Biểu đồ dự báo dòng tiền"></canvas></div>' +
                  '<div class="small text-muted mt-2">Lưu ý: Dự báo được tổng hợp từ sổ theo dõi hóa đơn và giả định thu hồi công nợ hiện hành.</div>' +
                '</div>' +
              '</div>' +

              '<div class="ip-table-wrap">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">Bảng chi tiết dòng tiền dự báo theo kỳ</h2>' +
                  '<span class="small text-muted">Các kỳ dòng tiền thấp (< 45 triệu ₫) được tô vàng cảnh báo</span>' +
                '</div>' +
                '<div class="table-responsive">' +
                  '<table class="table ip-table-responsive-cards align-middle mb-0">' +
                    '<thead><tr><th>Kỳ dự báo</th><th class="text-end">Thu từ HĐ đến hạn</th><th class="text-end">Thu hồi quá hạn (' + customAssumptions.recoveryRate + '%)</th><th class="text-end">Đã xác nhận / Chờ khớp</th><th class="text-end">Tổng kỳ</th><th class="text-end">Lũy kế</th></tr></thead>' +
                    '<tbody>' +
                      fc.periods.map(function (p) {
                        return (
                          '<tr class="' + (p.isLowCash ? 'mgr-low-cash-row' : '') + '">' +
                            '<td data-label="Kỳ dự báo" class="fw-semibold">' + IP.Utils.escapeHtml(p.label) + (p.isLowCash ? ' <span class="badge bg-warning-subtle text-warning-emphasis ms-1">Thấp</span>' : '') + '</td>' +
                            '<td data-label="Thu từ HĐ đến hạn" class="text-end ip-num">' + IP.Fmt.currency(p.dueExpected, false, p.startDate) + '</td>' +
                            '<td data-label="Thu hồi quá hạn" class="text-end ip-num">' + IP.Fmt.currency(p.overdueRecovery, false, p.startDate) + '</td>' +
                            '<td data-label="Đã xác nhận / Chờ khớp" class="text-end ip-num">' + IP.Fmt.currency(p.confirmedAmount + p.pendingAmount, false, p.startDate) + '</td>' +
                            '<td data-label="Tổng kỳ" class="text-end ip-num fw-bold">' + IP.Fmt.currency(p.totalExpected, false, p.startDate) + '</td>' +
                            '<td data-label="Lũy kế" class="text-end ip-num fw-bold text-primary">' + IP.Fmt.currency(p.cumulative, false, p.startDate) + '</td>' +
                          '</tr>'
                        );
                      }).join('') +
                    '</tbody>' +
                    '<tfoot class="table-light fw-bold">' +
                      '<tr>' +
                        '<td>Tổng cộng (' + horizonDays + ' ngày)</td>' +
                        '<td class="text-end ip-num">' + IP.Fmt.currency(fc.totals.dueExpected) + '</td>' +
                        '<td class="text-end ip-num">' + IP.Fmt.currency(fc.totals.overdueRecovery) + '</td>' +
                        '<td class="text-end ip-num">' + IP.Fmt.currency(fc.totals.confirmedAmount + fc.totals.pendingAmount) + '</td>' +
                        '<td class="text-end ip-num">' + IP.Fmt.currency(fc.totals.cumulative) + '</td>' +
                        '<td class="text-end ip-num text-primary">' + IP.Fmt.currency(fc.totals.cumulative) + '</td>' +
                      '</tr>' +
                    '</tfoot>' +
                  '</table>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div>' +
              '<div class="mb-4" id="mgr-ai-forecast-slot"></div>' +

              '<div class="ip-card">' +
                '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Kịch bản đã lưu (' + savedReports.length + ')</h2></div>' +
                '<div class="ip-card-body p-0">' +
                  (savedReports.length
                    ? '<ul class="list-group list-group-flush small">' +
                        savedReports.map(function (r) {
                          return (
                            '<li class="list-group-item py-2 px-3">' +
                              '<div class="d-flex justify-content-between align-items-center mb-1">' +
                                '<span class="fw-bold">Kịch bản ' + IP.Utils.escapeHtml(r.scenario) + ' (' + r.horizon + ' ngày)</span>' +
                                '<button type="button" class="btn btn-sm btn-link text-danger p-0 text-decoration-none" data-action="delete-saved-rpt" data-id="' + r.id + '">Xóa</button>' +
                              '</div>' +
                              '<div class="text-muted">' + IP.Utils.escapeHtml(r.summary) + '</div>' +
                              '<div class="text-muted mt-1" style="font-size:0.72rem">Tỷ lệ thu hồi: ' + (r.assumptions ? r.assumptions.recoveryRate : 65) + '% · Độ trễ: ' + (r.assumptions ? r.assumptions.delayDays : 7) + ' ngày · ' + IP.Fmt.dateTime(r.createdAt) + '</div>' +
                            '</li>'
                          );
                        }).join('') +
                      '</ul>'
                    : '<div class="p-3 small text-muted text-center">Chưa có kịch bản dự báo nào được lưu.</div>') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        const aiSlot = root.querySelector('#mgr-ai-forecast-slot');
        IP.AI.mountPanel(aiSlot, {
          id: 'cashflow',
          manualActionLabel: 'Xem bảng dự báo thủ công',
          getContext: function () {
            return {
              mode: 'forecast',
              horizonDays: horizonDays,
              scenario: scenario,
              recoveryRate: customAssumptions.recoveryRate,
              delayDays: customAssumptions.delayDays,
              includePending: customAssumptions.includePending
            };
          },
          onAction: function (cmd, result) {
            if (cmd === 'save-report' && result && result.reportPayload) {
              const saved = IP.DB.saveAIReport(result.reportPayload);
              if (saved.ok) {
                IP.UI.toast({ title: 'Đã lưu báo cáo kịch bản', message: 'Kịch bản dự báo đã được lưu kèm các giả định hiện tại.', type: 'success' });
                render();
              }
            } else if (cmd === 'change-assumptions') {
              const el = root.querySelector('#fc-recovery');
              if (el) el.focus();
            }
          }
        });

        drawForecastChart(fc);
        bindAssumptionInputs();
      }

      function drawForecastChart(fc) {
        const ctx = document.getElementById('mgr-forecast-chart');
        if (!ctx || !window.Chart) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#EAF2EF' : '#152521';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

        const labels = fc.historical.map(function (h) { return h.label; })
          .concat(fc.periods.map(function (p) { return p.label; }));
        const histData = fc.historical.map(function (h) { return h.actual; })
          .concat(fc.periods.map(function () { return null; }));
        const forecastData = fc.historical.map(function () { return null; })
          .concat(fc.periods.map(function (p) { return p.totalExpected; }));

        chartInstance = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                type: 'bar',
                label: 'Thực thu lịch sử (VND)',
                data: histData,
                backgroundColor: '#7FB5A8',
                borderRadius: 6
              },
              {
                type: 'line',
                label: 'Dự báo thu kỳ tới (VND)',
                data: forecastData,
                borderColor: '#0E7A68',
                backgroundColor: 'rgba(14, 122, 104, 0.16)',
                fill: true,
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
        });
      }

      function bindAssumptionInputs() {
        const recEl = root.querySelector('#fc-recovery');
        const delEl = root.querySelector('#fc-delay');
        const pendEl = root.querySelector('#fc-pending');
        const errEl = root.querySelector('#fc-assump-err');

        function validateAndUpdate() {
          const rec = Number(recEl.value);
          const del = Number(delEl.value);
          if (isNaN(rec) || rec < 0 || rec > 100) {
            errEl.textContent = 'Tỷ lệ thu hồi nợ quá hạn phải từ 0% đến 100%.';
            errEl.classList.remove('d-none');
            return;
          }
          if (isNaN(del) || del < 0 || del > 60) {
            errEl.textContent = 'Độ trễ thanh toán bình quân phải từ 0 đến 60 ngày.';
            errEl.classList.remove('d-none');
            return;
          }
          errEl.classList.add('d-none');
          customAssumptions.recoveryRate = Math.round(rec);
          customAssumptions.delayDays = Math.round(del);
          customAssumptions.includePending = Boolean(pendEl.checked);
          isCustomModified = true;
          render();
        }

        if (recEl) recEl.addEventListener('change', validateAndUpdate);
        if (delEl) delEl.addEventListener('change', validateAndUpdate);
        if (pendEl) pendEl.addEventListener('change', validateAndUpdate);
      }

      window.addEventListener('ip:themechange', function () {
        render();
      });

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');

        if (action === 'set-horizon') {
          horizonDays = Number(btn.getAttribute('data-days'));
          render();
        } else if (action === 'set-scenario') {
          scenario = btn.getAttribute('data-scenario');
          customAssumptions = Object.assign({}, SCENARIO_PRESETS[scenario]);
          isCustomModified = false;
          render();
        } else if (action === 'reset-assumptions') {
          customAssumptions = Object.assign({}, SCENARIO_PRESETS[scenario]);
          isCustomModified = false;
          IP.UI.toast({ title: 'Đã khôi phục giả định mặc định', message: 'Kịch bản ' + SCENARIO_PRESETS[scenario].label + ' đã về thông số chuẩn.', type: 'info' });
          render();
        } else if (action === 'export-csv') {
          const fc = IP.Calc.forecastCashflow({
            horizonDays: horizonDays,
            scenario: scenario,
            recoveryRate: customAssumptions.recoveryRate,
            delayDays: customAssumptions.delayDays,
            includePending: customAssumptions.includePending
          });
          const headers = ['Kỳ dự báo', 'Từ ngày', 'Đến ngày', 'Thu từ HĐ đến hạn (VND)', 'Thu hồi quá hạn (VND)', 'Đã xác nhận/Chờ khớp (VND)', 'Tổng dự kiến (VND)', 'Lũy kế (VND)'];
          const rows = fc.periods.map(function (p) {
            return [p.label, p.startDate, p.endDate, p.dueExpected, p.overdueRecovery, p.confirmedAmount + p.pendingAmount, p.totalExpected, p.cumulative];
          });
          IP.UI.downloadCSV('du-bao-dong-tien-' + scenario, headers, rows);
        } else if (action === 'print-forecast') {
          window.print();
        } else if (action === 'delete-saved-rpt') {
          const rId = btn.getAttribute('data-id');
          IP.DB.deleteAIReport(rId);
          IP.UI.toast({ title: 'Đã xóa kịch bản đã lưu', message: 'Danh sách đã được cập nhật.', type: 'info' });
          render();
        }
      });
    }
  });
})(window);
