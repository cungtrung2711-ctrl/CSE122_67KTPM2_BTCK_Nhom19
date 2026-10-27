/**
 * @owner SV1
 * @spec §9.2 AI-1 Invoice Anomaly Check Engine (ai-anomaly.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.AI.register('anomaly', {
    id: 'anomaly',
    label: 'Kiểm tra hóa đơn bất thường (AI-1)',
    description: 'Đối chiếu hóa đơn đang soạn với lịch sử khách hàng, hạn mức tín dụng, thuế suất GTGT và quy tắc ngày tháng.',
    ctaText: 'Kiểm tra hóa đơn bằng AI',

    run: function (ctx, scenarioMode) {
      if (scenarioMode === 'error') {
        return {
          status: 'error',
          title: 'Không thể xử lý yêu cầu lúc này',
          summary: 'Bộ kiểm tra hóa đơn tạm thời gián đoạn kết nối. Bạn có thể bấm Thử lại hoặc tự kiểm tra thủ công các trường trên biểu mẫu.'
        };
      }

      const d = (ctx && ctx.draft) ? ctx.draft : {};
      const validItems = (d.items || []).filter(function (it) {
        return it && String(it.description || '').trim() && Number(it.quantity) > 0;
      });

      if (scenarioMode === 'insufficient' || !d.customerId || validItems.length === 0) {
        return {
          status: 'insufficient',
          title: 'Chưa đủ dữ liệu để kiểm tra đáng tin cậy',
          summary: 'Vui lòng chọn Khách hàng và nhập ít nhất 1 dòng hàng hóa/dịch vụ có tên và số lượng > 0 trước khi chạy AI kiểm tra.'
        };
      }

      const settings = IP.DB.getSettings();
      const thresholdPct = (settings.ai && settings.ai.anomalyThreshold) ? Number(settings.ai.anomalyThreshold) : 250;
      const defaultVat = (settings.invoiceDefaults && settings.invoiceDefaults.defaultVat !== undefined) ? Number(settings.invoiceDefaults.defaultVat) : 10;
      const customer = IP.DB.getCustomer(d.customerId);
      const custHistory = IP.DB.listInvoices({ customerId: d.customerId }).filter(function (inv) {
        return inv.id !== d.id && !inv.voided && !inv.archived;
      });

      const findings = [];
      const totals = IP.Calc.computeTotals(d.items || []);
      const today = IP.Seed.todayISO();

      if (d.issueDate && d.dueDate && d.dueDate < d.issueDate) {
        const suggestedDue = IP.Seed.addDays(customer ? customer.paymentTermDays : 30, d.issueDate);
        findings.push({
          severity: 'danger',
          severityLabel: 'Lỗi',
          field: 'dueDate',
          fieldName: 'Hạn thanh toán',
          problem: 'Hạn thanh toán (' + IP.Fmt.date(d.dueDate) + ') đang sớm hơn ngày phát hành (' + IP.Fmt.date(d.issueDate) + ').',
          suggestion: 'Đặt lại hạn thanh toán thành ' + IP.Fmt.date(suggestedDue) + ' (+' + (customer ? customer.paymentTermDays : 30) + ' ngày).',
          fixType: 'dueDate',
          fixValue: suggestedDue
        });
      }

      if (d.number) {
        const dup = IP.DB.getState().invoices.some(function (inv) {
          return inv.id !== d.id && inv.number.trim().toLowerCase() === String(d.number).trim().toLowerCase();
        });
        if (dup) {
          findings.push({
            severity: 'danger',
            severityLabel: 'Lỗi',
            field: 'number',
            fieldName: 'Số hóa đơn',
            problem: 'Số hóa đơn "' + d.number + '" bị trùng với một hóa đơn đã có.',
            suggestion: 'Sử dụng mã tự động tiếp theo: ' + IP.DB.nextInvoiceNumberPreview()
          });
        }
      }

      (d.items || []).forEach(function (it, idx) {
        if (!String(it.description || '').trim() || Number(it.quantity) <= 0 || Number(it.unitPrice) < 0) {
          findings.push({
            severity: 'danger',
            severityLabel: 'Lỗi',
            field: 'items',
            fieldName: 'Dòng hàng thứ ' + (idx + 1),
            problem: 'Thiếu mô tả hoặc số lượng/đơn giá không hợp lệ.',
            suggestion: 'Điền đầy đủ mô tả và đơn giá lớn hơn 0 ₫.'
          });
        }
        if (Number(it.vatRate) !== defaultVat) {
          findings.push({
            severity: 'info',
            severityLabel: 'Gợi ý',
            field: 'items',
            fieldName: 'Thuế suất GTGT dòng ' + (idx + 1),
            problem: 'Thuế GTGT đang để ' + it.vatRate + '%, khác mức mặc định hệ thống (' + defaultVat + '%).',
            suggestion: 'Đồng bộ thuế suất về mức mặc định ' + defaultVat + '% nếu thuộc nhóm dịch vụ chuẩn.',
            fixType: 'vatRate',
            fixValue: defaultVat
          });
        }
      });

      const bal = customer ? IP.Calc.customerBalance(customer.id) : { totalReceivable: 0 };
      const projectedBalance = bal.totalReceivable + totals.total;
      if (customer && customer.creditLimit > 0 && projectedBalance > customer.creditLimit) {
        const overAmt = projectedBalance - customer.creditLimit;
        findings.push({
          severity: 'warning',
          severityLabel: 'Cảnh báo',
          field: 'customerId',
          fieldName: 'Hạn mức tín dụng khách hàng',
          problem: 'Tổng dư nợ sau phát hành (' + IP.Fmt.currency(projectedBalance) + ') vượt hạn mức tín dụng của ' + customer.name + ' (' + IP.Fmt.currency(customer.creditLimit) + ') là ' + IP.Fmt.currency(overAmt) + '.',
          suggestion: 'Đề nghị khách thanh toán bớt hóa đơn cũ hoặc rút ngắn hạn thanh toán xuống 15 ngày.'
        });
      }

      let avgHistory = 0;
      if (custHistory.length > 0) {
        avgHistory = Math.round(custHistory.reduce(function (s, i) { return s + Number(i.total || 0); }, 0) / custHistory.length);
        const ratioPct = avgHistory > 0 ? Math.round((totals.total / avgHistory) * 100) : 100;
        if (ratioPct >= thresholdPct) {
          findings.push({
            severity: 'warning',
            severityLabel: 'Cảnh báo',
            field: 'items',
            fieldName: 'Giá trị hóa đơn bất thường',
            problem: 'Tổng hóa đơn (' + IP.Fmt.currency(totals.total) + ') bằng ' + ratioPct + '% mức trung bình lịch sử của khách (' + IP.Fmt.currency(avgHistory) + '), vượt ngưỡng cảnh báo ' + thresholdPct + '%.',
            suggestion: 'Kiểm tra lại số lượng hoặc đơn giá xem có bị dư chữ số 0 hay không.'
          });
        }
      }

      if (d.issueDate && IP.Calc.diffDays(d.issueDate, today) > 7) {
        findings.push({
          severity: 'warning',
          severityLabel: 'Cảnh báo',
          field: 'issueDate',
          fieldName: 'Ngày phát hành',
          problem: 'Ngày phát hành (' + IP.Fmt.date(d.issueDate) + ') cách hôm nay hơn 7 ngày trong tương lai.',
          suggestion: 'Đặt lại ngày phát hành về hôm nay (' + IP.Fmt.date(today) + ') nếu phát hành ngay.'
        });
      }

      if (customer && (!customer.email || !customer.contactName)) {
        findings.push({
          severity: 'info',
          severityLabel: 'Gợi ý',
          field: 'customerId',
          fieldName: 'Thông tin liên hệ khách hàng',
          problem: 'Khách hàng thiếu email hoặc tên người nhận hóa đơn.',
          suggestion: 'Cập nhật email khách hàng trước khi bấm Lưu & gửi.'
        });
      }

      const confidence = custHistory.length >= 2 ? 'high' : 'low';
      const summaryText = findings.length > 0
        ? ('Có ' + findings.length + ' vấn đề cần chú ý trước khi phát hành hóa đơn.')
        : 'Không phát hiện bất thường rõ ràng. Bạn vẫn nên rà soát lại số tiền và điều khoản trước khi lưu.';

      return {
        status: 'ok',
        title: findings.length > 0 ? ('Có ' + findings.length + ' điểm cần lưu ý') : 'Không phát hiện bất thường rõ ràng',
        summary: summaryText,
        findings: findings,
        confidence: confidence,
        explanation: {
          dataUsed: [
            'Dự thảo hóa đơn (' + validItems.length + ' dòng hàng, tổng ' + IP.Fmt.currency(totals.total) + ')',
            'Khách hàng: ' + (customer ? customer.name : 'Chưa rõ') + ' (' + custHistory.length + ' hóa đơn lịch sử)'
          ],
          rules: [
            'Kiểm tra hạn thanh toán >= ngày phát hành, thuế suất mặc định ' + defaultVat + '%',
            'Ngưỡng cảnh báo giá trị cao bất thường: ' + thresholdPct + '% trung bình lịch sử',
            'Đối chiếu tổng dư nợ dự kiến với hạn mức tín dụng khách hàng'
          ],
          evidence: [
            'Dư nợ hiện tại của khách: ' + IP.Fmt.currency(bal.totalReceivable) + ' / Hạn mức: ' + IP.Fmt.currency(customer ? customer.creditLimit : 0),
            custHistory.length >= 2
              ? ('Trung bình ' + custHistory.length + ' hóa đơn trước của khách: ' + IP.Fmt.currency(avgHistory))
              : 'Chưa đủ lịch sử để so sánh sâu (ít hơn 2 hóa đơn lịch sử)'
          ]
        }
      };
    },

    renderResultBody: function (res) {
      if (!res.findings || res.findings.length === 0) {
        return '<div class="alert alert-success py-2 px-3 small mb-2">' +
          '<i class="bi bi-shield-check me-1"></i>' + IP.Utils.escapeHtml(res.summary) +
        '</div>';
      }
      const listHtml = res.findings.map(function (f) {
        const badgeCls = f.severity === 'danger' ? 'ip-badge-overdue' : (f.severity === 'warning' ? 'ip-badge-partial' : 'ip-badge-sent');
        return (
          '<div class="ip-ai-finding">' +
            '<div class="d-flex justify-content-between align-items-center mb-1">' +
              '<span class="ip-badge ' + badgeCls + '">' + IP.Utils.escapeHtml(f.severityLabel) + ' · ' + IP.Utils.escapeHtml(f.fieldName) + '</span>' +
              '<button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-ai-cmd="focus-field" data-ai-payload="' + IP.Utils.escapeHtml(f.field) + '">Tới trường này</button>' +
            '</div>' +
            '<div class="small fw-semibold mb-1">' + IP.Utils.escapeHtml(f.problem) + '</div>' +
            '<div class="small text-muted">Đề xuất: ' + IP.Utils.escapeHtml(f.suggestion) + '</div>' +
          '</div>'
        );
      }).join('');
      return '<div class="mb-2">' + listHtml + '</div>';
    },

    renderActions: function (res) {
      const hasSafeFix = (res.findings || []).some(function (f) { return Boolean(f.fixType); });
      return (
        (hasSafeFix ? '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="apply-fixes"><i class="bi bi-magic"></i> Áp dụng gợi ý</button>' : '') +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="manual-edit">Tự chỉnh sửa</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="dismiss">Bỏ qua</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="run"><i class="bi bi-arrow-clockwise"></i> Kiểm tra lại</button>'
      );
    }
  });
})(window);
