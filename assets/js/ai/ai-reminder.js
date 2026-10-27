/**
 * @owner SV2
 * @spec §9.3 AI-2 Payment Reminder Draft Engine (ai-reminder.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.AI.register('reminder', {
    id: 'reminder',
    label: 'Soạn nội dung nhắc thanh toán (AI-2)',
    description: 'Tự động tổng hợp danh sách hóa đơn đang chọn, số dư còn phải thu, ngày đến hạn và giọng điệu để soạn thông điệp lịch sự.',
    ctaText: 'Soạn bằng AI',

    run: function (ctx, scenarioMode) {
      if (scenarioMode === 'error') {
        return {
          status: 'error',
          title: 'Không thể xử lý lúc này',
          summary: 'Trợ lý soạn thảo tạm thời gián đoạn kết nối. Bạn có thể bấm Thử lại hoặc chọn Dùng mẫu thủ công từ cấu hình.'
        };
      }

      const c = ctx || {};
      const customer = c.customerId ? IP.DB.getCustomer(c.customerId) : null;
      const invoices = (c.invoiceIds || [])
        .map(function (id) { return IP.DB.getInvoice(id); })
        .filter(function (inv) { return inv && IP.Calc.remaining(inv) > 0; });

      if (scenarioMode === 'insufficient' || !customer || invoices.length === 0) {
        return {
          status: 'insufficient',
          title: 'Không đủ dữ liệu để đưa ra đề xuất',
          summary: 'Vui lòng chọn một khách hàng và đánh dấu ít nhất 1 hóa đơn còn dư nợ chưa thu trước khi tạo bản nháp bằng AI.'
        };
      }

      const settings = IP.DB.getSettings();
      const comp = settings.company || {};
      const session = IP.Auth.getSession();
      const senderName = (session && session.name) ? session.name : 'Bộ phận Quản lý Công nợ';
      const channel = c.channel === 'sms' ? 'sms' : 'email';
      const tone = ['friendly', 'formal', 'firm'].includes(c.tone) ? c.tone : 'friendly';

      const totalAmount = invoices.reduce(function (s, inv) { return s + IP.Calc.remaining(inv); }, 0);
      const codes = invoices.map(function (i) { return i.number; }).join(', ');
      const maxOverdue = Math.max.apply(null, invoices.map(function (i) { return IP.Calc.overdueDays(i); }));

      let subject = '';
      let body = '';

      if (channel === 'sms') {
        subject = 'SMS thông báo công nợ ' + codes;
        if (tone === 'friendly') {
          body = '[HOA BINH CORP] Kinh gui ' + customer.name + ', xin thong bao lich thanh toan hoa don ' + codes + ' tong so tien ' + IP.Fmt.currency(totalAmount) + '. Quy doi tac vui long UNC qua ' + comp.bankName + ' (' + comp.bankAccount + '). Tran trong, ' + senderName + '.';
        } else if (tone === 'formal') {
          body = '[HOA BINH CORP] Thong bao cong no: Kinh de nghi ' + customer.name + ' thanh toan hoa don ' + codes + ' (' + IP.Fmt.currency(totalAmount) + ') ve TK ' + comp.bankAccount + ' (' + comp.bankName + '). LH: ' + comp.phone + '.';
        } else {
          body = '[HOA BINH CORP] De nghi ' + customer.name + ' tat toan khoan cong no qua han hoa don ' + codes + ' so tien ' + IP.Fmt.currency(totalAmount) + ' qua TK ' + comp.bankAccount + ' trong tuan nay. LH doi chieu: ' + senderName + '.';
        }
      } else {
        const linesText = invoices.map(function (inv) {
          const ov = IP.Calc.overdueDays(inv);
          return '- Hóa đơn điện tử ' + inv.number + ' (Ký hiệu 1C26TAA): ' + IP.Fmt.currency(IP.Calc.remaining(inv)) +
            ' (Hạn thanh toán: ' + IP.Fmt.date(inv.dueDate) + (ov > 0 ? ' · Quá hạn ' + ov + ' ngày' : '') + ')';
        }).join('\n');

        if (tone === 'friendly') {
          subject = 'Thông báo lịch thanh toán hóa đơn ' + codes + ' - ' + customer.name;
          body = 'Kính gửi ' + (customer.contactName || 'Quý đối tác') + ' - ' + customer.name + ',\n\n' +
            'Cảm ơn Quý công ty đã luôn tin tưởng hợp tác cùng ' + comp.name + '. Chúng tôi xin gửi thông báo nhắc lịch thanh toán cho các hóa đơn điện tử sau:\n\n' +
            linesText + '\n\n' +
            'Tổng số tiền cần thanh toán: ' + IP.Fmt.currency(totalAmount) + '\n' +
            'Thông tin thụ hưởng: ' + comp.bankName + ' - Số TK: ' + comp.bankAccount + ' (' + comp.bankBranch + ').\n\n' +
            'Nếu Quý công ty đã thực hiện ủy nhiệm chi hoặc có thắc mắc cần đối chiếu, vui lòng phản hồi lại email này hoặc liên hệ số ' + comp.phone + '.\n\n' +
            'Trân trọng,\n' + senderName + '\n' + comp.name;
        } else if (tone === 'formal') {
          subject = 'Đề nghị đối chiếu và thanh toán công nợ hóa đơn ' + codes + ' - ' + customer.name;
          body = 'Kính gửi Phòng Kế toán & Anh/Chị ' + (customer.contactName || '') + ' - ' + customer.name + ',\n\n' +
            'Căn cứ theo sổ theo dõi công nợ đến ngày ' + IP.Fmt.date(IP.Seed.todayISO()) + ', ' + comp.name + ' trân trọng thông báo các khoản phải thu đến hạn/quá hạn như sau:\n\n' +
            linesText + '\n\n' +
            'Tổng dư nợ đề nghị thanh toán: ' + IP.Fmt.currency(totalAmount) + '\n' +
            'Tài khoản nhận thanh toán: ' + comp.bankName + ' - Số TK: ' + comp.bankAccount + ' (' + comp.bankBranch + ').\n\n' +
            'Đề nghị Quý đơn vị sắp xếp kế hoạch thanh toán và thông tin lại lịch chuyển khoản dự kiến. Mọi vướng mắc về chứng từ xin liên hệ ' + comp.email + ' hoặc ' + comp.phone + '.\n\n' +
            'Trân trọng cảm ơn,\n' + senderName + '\n' + comp.name;
        } else {
          subject = 'Đề nghị ưu tiên tất toán công nợ quá hạn (' + codes + ') - ' + customer.name;
          body = 'Kính gửi Ban Giám đốc và Phòng Kế toán - ' + customer.name + ',\n\n' +
            'Chúng tôi nhận thấy khoản công nợ thuộc các hóa đơn dưới đây đã quá hạn thanh toán (tối đa ' + maxOverdue + ' ngày):\n\n' +
            linesText + '\n\n' +
            'Tổng số tiền quá hạn cần tất toán: ' + IP.Fmt.currency(totalAmount) + '\n' +
            'Tài khoản thụ hưởng: ' + comp.bankName + ' - Số TK: ' + comp.bankAccount + '.\n\n' +
            'Để đảm bảo tiến độ hợp tác và hạn mức tín dụng giữa hai đơn vị, rất mong Quý công ty ưu tiên hoàn tất thanh toán hoặc xác nhận lịch trả cụ thể trong vòng 3 ngày làm việc tới. Nếu cần hỗ trợ đối chiếu biên bản nghiệm thu, vui lòng liên hệ trực tiếp ' + senderName + ' (' + comp.phone + ').\n\n' +
            'Trân trọng,\n' + senderName + '\n' + comp.name;
        }
      }

      const hasFullContact = Boolean(customer.email && customer.contactName);
      return {
        status: 'ok',
        title: 'Đã soạn bản nháp (' + IP.Fmt.channelLabel(channel) + ' · ' + IP.Fmt.toneLabel(tone) + ')',
        summary: 'Tổng hợp ' + invoices.length + ' hóa đơn với tổng số dư ' + IP.Fmt.currency(totalAmount) + '.',
        content: {
          subject: subject,
          body: body
        },
        confidence: hasFullContact ? 'high' : 'medium',
        explanation: {
          dataUsed: [
            'Khách hàng: ' + customer.name + ' (Liên hệ: ' + (customer.contactName || 'Chưa rõ') + ')',
            invoices.length + ' hóa đơn (' + codes + '), tổng còn phải thu ' + IP.Fmt.currency(totalAmount)
          ],
          rules: [
            'Kênh: ' + IP.Fmt.channelLabel(channel) + ' · Giọng điệu: ' + IP.Fmt.toneLabel(tone),
            'Ngôn ngữ lịch sự, chuẩn mực B2B, không tự ý cam kết chiết khấu/giảm giá',
            'Bản nháp chỉ điền vào khung soạn thảo để bạn rà soát, không tự động gửi'
          ],
          evidence: [
            'Số ngày quá hạn lớn nhất trong nhóm chọn: ' + (maxOverdue > 0 ? (maxOverdue + ' ngày') : 'Chưa quá hạn'),
            'Tài khoản thụ hưởng trích từ Cấu hình hóa đơn: ' + comp.bankAccount
          ]
        }
      };
    },

    renderResultBody: function (res) {
      const c = res.content || { subject: '', body: '' };
      return (
        '<div class="bg-body border rounded p-2 mb-2 small">' +
          '<div class="fw-bold mb-1">Tiêu đề: ' + IP.Utils.escapeHtml(c.subject) + '</div>' +
          '<div class="text-muted" style="white-space:pre-line;max-height:130px;overflow-y:auto;">' + IP.Utils.escapeHtml(c.body) + '</div>' +
        '</div>'
      );
    },

    renderActions: function () {
      return (
        '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="use-draft"><i class="bi bi-check2"></i> Dùng bản nháp</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="edit-draft">Chỉnh sửa</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="dismiss">Từ chối</button>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="run"><i class="bi bi-arrow-clockwise"></i> Tạo lại</button>'
      );
    }
  });
})(window);
