/**
 * @owner SV2
 * @spec §7.5, §10.1, §10.2 Seed 10 Notifications across types & roles
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('notifications', {
    order: 80,
    run: function (state, h) {
      state.notifications = [
        {
          id: 'ntf_001',
          role: 'accountant',
          type: 'payment',
          title: '6 giao dịch sao kê ngân hàng mới chờ đối chiếu',
          message: 'Hệ thống ghi nhận 6 khoản chuyển khoản từ sao kê Vietcombank đang ở trạng thái Chờ đối chiếu.',
          targetRouteKey: 'reconciliation',
          targetParams: { tab: 'pending' },
          read: false,
          createdAt: h.addHoursISO(-1)
        },
        {
          id: 'ntf_002',
          role: 'manager',
          type: 'invoice',
          title: 'Hóa đơn IP-2026-0001 quá hạn trên 100 ngày',
          message: 'Khoản phải thu của CTCP Đầu tư Hạ tầng Thăng Long cần được ưu tiên đôn đốc thu hồi.',
          targetRouteKey: 'manager.dashboard',
          targetParams: {},
          read: false,
          createdAt: h.addHoursISO(-3)
        },
        {
          id: 'ntf_003',
          role: 'sales',
          type: 'reminder',
          title: 'Gửi nhắc thanh toán chưa thành công (rem_003)',
          message: 'Email nhắc thanh toán gửi tới Xây dựng Hòa Phát Đạt bị gián đoạn kết nối, vui lòng kiểm tra và gửi lại.',
          targetRouteKey: 'sales.reminders',
          targetParams: { tab: 'failed' },
          read: false,
          createdAt: h.addHoursISO(-5)
        },
        {
          id: 'ntf_004',
          role: 'sales',
          type: 'invoice',
          title: '6 hóa đơn sắp đến hạn trong 7 ngày tới',
          message: 'Các hóa đơn từ IP-2026-0023 đến IP-2026-0028 sẽ đáo hạn trong tuần này.',
          targetRouteKey: 'sales.balance',
          targetParams: {},
          read: false,
          createdAt: h.addHoursISO(-9)
        },
        {
          id: 'ntf_005',
          role: 'accountant',
          type: 'payment',
          title: 'Phát hiện 2 giao dịch có chênh lệch số tiền',
          message: 'Khoản chuyển khoản của Thương mại Minh Tâm và Bao bì Phú Mỹ lệch so với số dư hóa đơn.',
          targetRouteKey: 'reconciliation',
          targetParams: { tab: 'discrepancy' },
          read: false,
          createdAt: h.addHoursISO(-15)
        },
        {
          id: 'ntf_006',
          role: 'manager',
          type: 'system',
          title: 'Đã lưu báo cáo phân tích dòng tiền 90 ngày',
          message: 'Lê Hoàng Anh đã tạo và lưu bản chụp phân tích dòng tiền kịch bản Cơ sở.',
          targetRouteKey: 'manager.dashboard',
          targetParams: {},
          read: true,
          createdAt: h.addHoursISO(-22)
        },
        {
          id: 'ntf_007',
          role: 'accountant',
          type: 'payment',
          title: 'Đã thu đủ hóa đơn IP-2026-0037 (Vận tải Biển Đông)',
          message: 'Khoản thanh toán 39.600.000 ₫ đã được xác nhận và cập nhật vào sổ công nợ.',
          targetRouteKey: 'invoice.view',
          targetParams: { id: 'inv_037' },
          read: true,
          createdAt: h.addHoursISO(-30)
        },
        {
          id: 'ntf_008',
          role: 'sales',
          type: 'reminder',
          title: 'Đã lên lịch 2 thông báo nhắc hạn tự động',
          message: 'Hai bản nhắc cho Vận tải Biển Đông và Sao Khuê Tech đã được xếp lịch gửi.',
          targetRouteKey: 'sales.reminders',
          targetParams: { tab: 'scheduled' },
          read: true,
          createdAt: h.addHoursISO(-40)
        },
        {
          id: 'ntf_009',
          role: 'admin',
          type: 'system',
          title: 'Đã cấp tài khoản mới: Bùi Thanh Tùng',
          message: 'Tài khoản kế toán viên đối chiếu ngân hàng (tung.bui@hoabinhdigital.vn) đang ở trạng thái Đã mời.',
          targetRouteKey: 'admin.users',
          targetParams: { status: 'invited' },
          read: true,
          createdAt: h.addHoursISO(-52)
        },
        {
          id: 'ntf_010',
          role: 'accountant',
          type: 'invoice',
          title: '3 hóa đơn dự thảo đang chờ kiểm tra & phát hành',
          message: 'Các hóa đơn IP-2026-0047, IP-2026-0048, IP-2026-0049 đang ở trạng thái Nháp.',
          targetRouteKey: 'invoice.list',
          targetParams: { status: 'draft' },
          read: true,
          createdAt: h.addHoursISO(-68)
        }
      ];
    }
  });
})(window);
