/**
 * @owner SV3
 * @spec §8.3, §10.1, §10.2 Seed Overdue Follow-ups & Activity Timeline
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('followup', {
    order: 70,
    run: function (state, h) {
      const customFollowUps = {
        inv_001: {
          assignedTo: 'usr_sal',
          status: 'watching',
          notes: [
            { id: 'fn_01', text: 'Đã gọi điện cho kế toán trưởng Thăng Long, khách hẹn tất toán 60% còn lại sau khi giải ngân gói tín dụng tuần tới.', authorId: 'usr_sal', at: h.addDays(-4) + 'T10:15:00.000Z' },
            { id: 'fn_02', text: 'Ban quản lý yêu cầu theo dõi sát hàng tuần do quá hạn trên 90 ngày.', authorId: 'usr_mgr', at: h.addDays(-2) + 'T14:30:00.000Z' }
          ]
        },
        inv_002: {
          assignedTo: 'usr_sal3',
          status: 'watching',
          notes: [
            { id: 'fn_03', text: 'Khách hàng Hòa Phát Đạt đang chờ ký biên bản nghiệm thu giai đoạn 2.', authorId: 'usr_sal3', at: h.addDays(-6) + 'T09:20:00.000Z' }
          ]
        },
        inv_003: {
          assignedTo: 'usr_sal2',
          status: 'watching',
          notes: [
            { id: 'fn_04', text: 'Đã gửi email nhắc lần 2, khách xác nhận sẽ thanh toán trong 5 ngày làm việc.', authorId: 'usr_sal2', at: h.addDays(-3) + 'T15:00:00.000Z' }
          ]
        },
        inv_005: {
          assignedTo: 'usr_sal2',
          status: 'watching',
          notes: [
            { id: 'fn_05', text: 'Khách đã trả 35%, phần còn lại cam kết trả cuối tháng.', authorId: 'usr_sal2', at: h.addDays(-5) + 'T11:00:00.000Z' }
          ]
        },
        inv_014: {
          assignedTo: 'usr_sal',
          status: 'closed',
          closeReason: 'Đã thống nhất lịch giãn nợ có văn bản xác nhận của Giám đốc tài chính hai bên',
          notes: [
            { id: 'fn_06', text: 'Đã nhận công văn cam kết lịch thanh toán mới, tạm đóng cảnh báo nóng.', authorId: 'usr_mgr', at: h.addDays(-1) + 'T16:00:00.000Z' }
          ]
        }
      };

      // Assign owners based on customer ownerId and merge follow-up notes
      state.invoices.forEach(function (inv) {
        const cus = state.customers.find(function (c) { return c.id === inv.customerId; });
        const defaultOwner = (cus && cus.ownerId) ? cus.ownerId : 'usr_sal';
        if (customFollowUps[inv.id]) {
          inv.followUp = customFollowUps[inv.id];
        } else {
          inv.followUp = {
            assignedTo: defaultOwner,
            status: 'watching',
            notes: []
          };
        }
      });

      state.activities = [
        { id: 'act_001', entityType: 'invoice', entityId: 'inv_001', type: 'followup', message: 'Lê Hoàng Anh đã thêm ghi chú chỉ đạo thu hồi công nợ quá hạn cho IP-2026-0001.', actorId: 'usr_mgr', at: h.addHoursISO(-28) },
        { id: 'act_002', entityType: 'payment', entityId: 'pay_001', type: 'payment', message: 'Nguyễn Thu Hà đã xác nhận đối chiếu khoản thu 100% cho hóa đơn IP-2026-0037.', actorId: 'usr_acc', at: h.addHoursISO(-24) },
        { id: 'act_003', entityType: 'reminder', entityId: 'rem_002', type: 'reminder', message: 'Vũ Thị Mai Hương đã gửi email nhắc thanh toán lần 2 tới Bao bì Sao Phương Nam.', actorId: 'usr_sal2', at: h.addHoursISO(-20) },
        { id: 'act_004', entityType: 'invoice', entityId: 'inv_016', type: 'payment', message: 'Ghi nhận thanh toán đợt 1 cho hóa đơn IP-2026-0016 (Thực phẩm Á Châu).', actorId: 'usr_acc', at: h.addHoursISO(-14) },
        { id: 'act_005', entityType: 'invoice', entityId: 'inv_023', type: 'invoice', message: 'Hóa đơn IP-2026-0023 sắp đến hạn thanh toán trong 2 ngày.', actorId: 'usr_sal2', at: h.addHoursISO(-6) },
        { id: 'act_006', entityType: 'user', entityId: 'usr_acc2', type: 'user', message: 'Phạm Gia Bảo đã gửi lời mời tham gia hệ thống cho Bùi Thanh Tùng (Kế toán).', actorId: 'usr_adm', at: h.addHoursISO(-4) }
      ];
    }
  });
})(window);
