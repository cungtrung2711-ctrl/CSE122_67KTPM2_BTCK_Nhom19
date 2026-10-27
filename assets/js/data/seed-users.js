/**
 * @owner SV4
 * @spec §4, §10.1, §10.2 Seed 8 Users (4 Core Role Accounts + 4 Operational Accounts)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('users', {
    order: 20,
    run: function (state, h) {
      state.users = [
        {
          id: 'usr_acc',
          name: 'Nguyễn Thu Hà',
          email: 'ketoan@hoabinhdigital.vn',
          password: 'KeToan@2026',
          role: 'accountant',
          status: 'active',
          phone: '0904112233',
          title: 'Kế toán trưởng công nợ (AR Chief Accountant)',
          lastLoginAt: h.addHoursISO(-2),
          isCoreAccount: true,
          createdAt: h.addDays(-180)
        },
        {
          id: 'usr_sal',
          name: 'Trần Minh Quân',
          email: 'kinhdoanh@hoabinhdigital.vn',
          password: 'KinhDoanh@2026',
          role: 'sales',
          status: 'active',
          phone: '0912334455',
          title: 'Trưởng phòng Kinh doanh B2B',
          lastLoginAt: h.addHoursISO(-3),
          isCoreAccount: true,
          createdAt: h.addDays(-180)
        },
        {
          id: 'usr_mgr',
          name: 'Lê Hoàng Anh',
          email: 'quanly@hoabinhdigital.vn',
          password: 'QuanLy@2026',
          role: 'manager',
          status: 'active',
          phone: '0988776655',
          title: 'Giám đốc Tài chính & Vận hành (CFO)',
          lastLoginAt: h.addHoursISO(-1),
          isCoreAccount: true,
          createdAt: h.addDays(-180)
        },
        {
          id: 'usr_adm',
          name: 'Phạm Gia Bảo',
          email: 'admin@hoabinhdigital.vn',
          password: 'Admin@2026',
          role: 'admin',
          status: 'active',
          phone: '0936998877',
          title: 'Quản trị viên Hệ thống & Phân quyền (System Admin)',
          lastLoginAt: h.addHoursISO(-5),
          isCoreAccount: true,
          createdAt: h.addDays(-180)
        },
        {
          id: 'usr_sal2',
          name: 'Vũ Thị Mai Hương',
          email: 'huong.vu@hoabinhdigital.vn',
          password: 'KinhDoanh@2026',
          role: 'sales',
          status: 'active',
          phone: '0977123456',
          title: 'Chuyên viên Quản lý Khách hàng (Khối Sản xuất)',
          lastLoginAt: h.addHoursISO(-18),
          isCoreAccount: false,
          createdAt: h.addDays(-120)
        },
        {
          id: 'usr_sal3',
          name: 'Đặng Quốc Khánh',
          email: 'khanh.dang@hoabinhdigital.vn',
          password: 'KinhDoanh@2026',
          role: 'sales',
          status: 'active',
          phone: '0945667788',
          title: 'Chuyên viên Quản lý Khách hàng (Khối Thương mại)',
          lastLoginAt: h.addHoursISO(-26),
          isCoreAccount: false,
          createdAt: h.addDays(-95)
        },
        {
          id: 'usr_acc2',
          name: 'Bùi Thanh Tùng',
          email: 'tung.bui@hoabinhdigital.vn',
          password: 'KeToan@2026',
          role: 'accountant',
          status: 'invited',
          phone: '0963445566',
          title: 'Kế toán viên đối chiếu ngân hàng',
          lastLoginAt: null,
          isCoreAccount: false,
          createdAt: h.addDays(-5)
        },
        {
          id: 'usr_sal4',
          name: 'Hoàng Nhật Nam',
          email: 'nam.hoang@hoabinhdigital.vn',
          password: 'KinhDoanh@2026',
          role: 'sales',
          status: 'disabled',
          lockReason: 'Đã điều chuyển sang chi nhánh miền Nam từ đầu quý',
          phone: '0932114477',
          title: 'Chuyên viên Kinh doanh dự án',
          lastLoginAt: h.addDays(-40) + 'T09:00:00.000Z',
          isCoreAccount: false,
          createdAt: h.addDays(-150)
        }
      ];
    }
  });
})(window);
