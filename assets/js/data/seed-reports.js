/**
 * @owner SV3
 * @spec §8.3, §9.4, §10.1, §10.2 Seed 2 Saved AI Cashflow Reports
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('reports', {
    order: 90,
    run: function (state, h) {
      state.aiReports = [
        {
          id: 'rpt_001',
          type: 'dashboard',
          period: '90d',
          horizon: 90,
          scenario: 'base',
          summary: 'Tổng dư nợ phải thu hiện tập trung mạnh ở nhóm quá hạn trên 30 ngày, trong đó 3 khách hàng đầu bảng chiếm hơn 42% tổng dư nợ quá hạn. Dòng tiền dự kiến thu trong 30 ngày tới khả quan nhờ 6 hóa đơn sắp đáo hạn của nhóm khách hàng rủi ro thấp.',
          highlights: [
            { label: 'Rủi ro tập trung công nợ', value: '42% dư nợ quá hạn', detail: 'Tập trung tại Xây dựng Hòa Phát Đạt, Hạ tầng Thăng Long và Bao bì Sao Phương Nam.' },
            { label: 'Khoản quá hạn trên 60 ngày', value: '9 hóa đơn cần xử lý', detail: 'Cần ưu tiên đôn đốc trực tiếp để tránh kéo dài DSO sang quý tới.' },
            { label: 'Cơ hội thu sớm 30 ngày', value: '14 hóa đơn trong hạn', detail: 'Nhóm Vận tải Biển Đông và Sao Khuê Tech có lịch sử thanh toán đúng hạn cao.' }
          ],
          assumptions: {
            recoveryRate: 65,
            delayDays: 10,
            includePending: false
          },
          confidence: 'high',
          createdAt: h.addHoursISO(-22),
          createdBy: 'usr_mgr'
        },
        {
          id: 'rpt_002',
          type: 'forecast',
          period: '60d',
          horizon: 60,
          scenario: 'conservative',
          summary: 'Ở kịch bản Thận trọng (tỷ lệ thu hồi nợ quá hạn 45%, độ trễ bình quân 18 ngày), dòng tiền thu về trong 2 tuần đầu có thể thấp hơn kỳ vọng nếu chưa đối chiếu xong 6 giao dịch ngân hàng đang chờ xử lý.',
          highlights: [
            { label: 'Tác động độ trễ 18 ngày', value: 'Dịch chuyển kỳ thu', detail: 'Các khoản đến hạn cuối tháng có xu hướng lùi sang tuần đầu tháng kế tiếp.' },
            { label: 'Khoản chờ đối chiếu ngân hàng', value: '6 giao dịch chờ khớp', detail: 'Nếu hoàn tất đối chiếu trong tuần này, dòng tiền thực thu ngắn hạn sẽ tăng đáng kể.' }
          ],
          assumptions: {
            recoveryRate: 45,
            delayDays: 18,
            includePending: false
          },
          confidence: 'medium',
          createdAt: h.addDays(-3) + 'T16:20:00.000Z',
          createdBy: 'usr_mgr'
        }
      ];
    }
  });
})(window);
