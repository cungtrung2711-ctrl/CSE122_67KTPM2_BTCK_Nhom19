/**
 * @owner SV3
 * @spec §9.4 AI-3 Cashflow Summary & Scenario Analysis Engine (ai-cashflow.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.AI.register('cashflow', {
    id: 'cashflow',
    label: 'Tóm tắt dòng tiền & Rủi ro công nợ (AI-3)',
    description: 'Phân tích độ tập trung công nợ, tuổi nợ quá hạn và dự báo dòng tiền theo kịch bản giả định đang chọn.',
    ctaText: 'Tạo tóm tắt bằng AI',

    run: function (ctx, scenarioMode) {
      if (scenarioMode === 'error') {
        return {
          status: 'error',
          title: 'Không thể xử lý lúc này',
          summary: 'Không thể tổng hợp báo cáo phân tích do gián đoạn tạm thời. Bạn có thể bấm Thử lại hoặc xem trực tiếp bảng số liệu.'
        };
      }

      const c = ctx || {};
      const openInvoices = IP.DB.listInvoices({ includeArchived: false }).filter(function (inv) {
        const eff = IP.Calc.effectiveStatus(inv);
        return ['sent', 'partial', 'overdue'].includes(eff) && IP.Calc.remaining(inv) > 0;
      });

      if (scenarioMode === 'insufficient' || openInvoices.length < 3) {
        return {
          status: 'insufficient',
          title: 'Không đủ dữ liệu để đưa ra đề xuất',
          summary: 'Cần tối thiểu 3 hóa đơn chưa thu trong kỳ phân tích để tạo bản tóm tắt có ý nghĩa thống kê. Vui lòng mở rộng kỳ lọc hoặc bổ sung dữ liệu.'
        };
      }

      const ag = IP.Calc.aging(openInvoices);
      const fc = IP.Calc.forecastCashflow({
        horizonDays: c.horizonDays || 60,
        scenario: c.scenario || 'base',
        recoveryRate: c.recoveryRate,
        delayDays: c.delayDays,
        includePending: c.includePending
      });

      const byCus = {};
      openInvoices.forEach(function (inv) {
        byCus[inv.customerId] = (byCus[inv.customerId] || 0) + IP.Calc.remaining(inv);
      });
      const sortedCus = Object.keys(byCus)
        .map(function (cid) {
          const cus = IP.DB.getCustomer(cid);
          return { id: cid, name: cus ? cus.name : cid, balance: byCus[cid] };
        })
        .sort(function (a, b) { return b.balance - a.balance; });

      const top2Sum = sortedCus.slice(0, 2).reduce(function (s, x) { return s + x.balance; }, 0);
      const top2Share = ag.totalReceivable > 0 ? Math.round((top2Sum / ag.totalReceivable) * 100) : 0;
      const over60Sum = ag.b61_90 + ag.b90plus;
      const over60Count = ag.counts.b61_90 + ag.counts.b90plus;
      const lowCashPeriods = fc.periods.filter(function (p) { return p.isLowCash; });

      const scenarioNames = { base: 'Cơ sở', conservative: 'Thận trọng', optimistic: 'Lạc quan' };
      const scenLabel = scenarioNames[fc.scenario] || 'Cơ sở';

      const summary = 'Trong tổng dư nợ phải thu ' + IP.Fmt.currency(ag.totalReceivable) + ' (' + openInvoices.length + ' hóa đơn mở), có ' +
        IP.Fmt.currency(ag.totalOverdue) + ' đang quá hạn. Ở kịch bản ' + scenLabel + ' (' + fc.horizonDays + ' ngày, tỷ lệ thu hồi quá hạn ' +
        fc.assumptions.recoveryRate + '%, độ trễ ' + fc.assumptions.delayDays + ' ngày), tổng dòng tiền dự kiến thu đạt ' +
        IP.Fmt.currency(fc.totals.cumulative) + '. Đáng chú ý, ' + top2Share + '% tổng công nợ đang tập trung ở 2 khách hàng lớn nhất.';

      const highlights = [
        {
          label: 'Mức độ tập trung khách hàng',
          value: top2Share + '% dư nợ ở 2 KH đầu',
          detail: (sortedCus[0] ? sortedCus[0].name : '') + (sortedCus[1] ? (' và ' + sortedCus[1].name) : '') + ' chiếm ' + IP.Fmt.currency(top2Sum) + '.'
        },
        {
          label: 'Công nợ quá hạn trên 60 ngày',
          value: over60Count + ' hóa đơn (' + IP.Fmt.currency(over60Sum) + ')',
          detail: 'Cần giao phụ trách Kinh doanh đôn đốc trực tiếp để giảm áp lực dòng tiền.'
        },
        {
          label: lowCashPeriods.length > 0 ? 'Cảnh báo kỳ thu thấp' : 'Nhịp thu dự kiến ổn định',
          value: lowCashPeriods.length > 0 ? (lowCashPeriods.length + ' kỳ dự kiến dưới ngưỡng') : ('Đạt ' + IP.Fmt.currency(fc.totals.cumulative)),
          detail: 'Thu từ hóa đơn trong hạn: ' + IP.Fmt.currency(fc.totals.dueExpected) + ' · Thu hồi quá hạn: ' + IP.Fmt.currency(fc.totals.overdueRecovery) + '.'
        }
      ];

      return {
        status: 'ok',
        title: 'Bản tóm tắt dòng tiền kịch bản ' + scenLabel + ' (' + fc.horizonDays + ' ngày)',
        summary: summary,
        highlights: highlights,
        reportPayload: {
          type: c.mode === 'forecast' ? 'forecast' : 'dashboard',
          period: c.period || (fc.horizonDays + 'd'),
          horizon: fc.horizonDays,
          scenario: fc.scenario,
          summary: summary,
          highlights: highlights,
          assumptions: fc.assumptions,
          confidence: openInvoices.length >= 10 ? 'high' : 'medium'
        },
        confidence: openInvoices.length >= 10 ? 'high' : 'medium',
        explanation: {
          dataUsed: [
            openInvoices.length + ' hóa đơn chưa tất toán (Tổng phải thu: ' + IP.Fmt.currency(ag.totalReceivable) + ')',
            'Phân bổ tuổi nợ: Trong hạn ' + IP.Fmt.currency(ag.current) + ', Quá hạn ' + IP.Fmt.currency(ag.totalOverdue)
          ],
          rules: [
            'Kịch bản: ' + scenLabel + ' · Tỷ lệ thu hồi nợ quá hạn: ' + fc.assumptions.recoveryRate + '% · Độ trễ bình quân: ' + fc.assumptions.delayDays + ' ngày',
            'Khoản chờ đối chiếu ngân hàng: ' + (fc.assumptions.includePending ? 'Có cộng vào kỳ đầu' : 'Không cộng (mặc định thận trọng)'),
            'Báo cáo dự báo dựa trên sổ theo dõi công nợ nội bộ, phục vụ điều hành dòng tiền'
          ],
          evidence: [
            '2 khách hàng dư nợ cao nhất chiếm ' + top2Share + '% (' + IP.Fmt.currency(top2Sum) + ')',
            'Dòng tiền lũy kế dự kiến ' + fc.horizonDays + ' ngày: ' + IP.Fmt.currency(fc.totals.cumulative)
          ]
        }
      };
    },

    renderResultBody: function (res) {
      const hlHtml = (res.highlights || []).map(function (h) {
        return (
          '<div class="ip-ai-finding">' +
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
              '<span class="small fw-bold">' + IP.Utils.escapeHtml(h.label) + '</span>' +
              '<span class="badge bg-warning-subtle text-warning-emphasis ip-num">' + IP.Utils.escapeHtml(h.value) + '</span>' +
            '</div>' +
            '<div class="small text-muted">' + IP.Utils.escapeHtml(h.detail) + '</div>' +
          '</div>'
        );
      }).join('');

      return (
        '<p class="small mb-2">' + IP.Utils.escapeHtml(res.summary) + '</p>' +
        '<div class="mb-2">' + hlHtml + '</div>'
      );
    },

    renderActions: function () {
      return (
        '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="save-report"><i class="bi bi-bookmark-check"></i> Lưu báo cáo</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="change-assumptions">Đổi giả định</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="dismiss">Bỏ qua</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="run"><i class="bi bi-arrow-clockwise"></i> Tạo lại</button>'
      );
    }
  });
})(window);
