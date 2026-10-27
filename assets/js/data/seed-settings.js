/**
 * @owner SV4
 * @spec §8.4, §10.1, §10.2 Seed Settings & Reminder Templates (Chuẩn NĐ 123/2020/NĐ-CP & TT 78/2021/TT-BTC)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Seed.register('settings', {
    order: 10,
    run: function (state) {
      state.settings = {
        company: {
          name: 'Công ty Cổ phần Giải pháp Số hóa Hòa Bình',
          taxCode: '0108923456',
          address: 'Tầng 9, Tòa nhà Peakview, 36 Hoàng Cầu, Phường Ô Chợ Dừa, Quận Đống Đa, Hà Nội',
          email: 'congno@hoabinhdigital.vn',
          phone: '02438556688',
          website: 'https://hoabinhdigital.vn',
          bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
          bankAccount: '0011004567899',
          bankBranch: 'Chi nhánh Sở Giao Dịch - Hà Nội',
          logoText: 'HB',
          eInvoiceSymbol: '1C26TAA',
          eInvoiceFormCode: '1'
        },
        invoiceDefaults: {
          prefix: 'IP',
          format: 'IP-{YYYY}-{0000}',
          nextNumber: 53,
          defaultTermDays: 30,
          defaultVat: 10,
          currency: 'VND',
          defaultTerms: 'Thanh toán chuyển khoản 100% trong thời hạn ghi trên hóa đơn theo hợp đồng kinh tế. Vui lòng ghi rõ số hóa đơn và mã ký hiệu 1C26TAA trong nội dung ủy nhiệm chi.',
          footerNote: 'Bản thể hiện của hóa đơn điện tử có mã của Cơ quan Thuế theo Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC.'
        },
        reminderTemplates: [
          {
            id: 'tpl_01',
            name: 'Email thông báo lịch thanh toán định kỳ (Trước/Đến hạn)',
            channel: 'email',
            tone: 'friendly',
            subject: 'Thông báo lịch thanh toán hóa đơn GTGT {ma_hoa_don} - {ten_khach_hang}',
            body: 'Kính gửi Phòng Kế toán - {ten_khach_hang},\n\nCông ty Cổ phần Giải pháp Số hóa Hòa Bình xin trân trọng thông báo hóa đơn điện tử số {ma_hoa_don} (Ký hiệu: 1C26TAA) với tổng giá trị thanh toán {so_tien} sẽ đến hạn vào ngày {han_thanh_toan}.\n\nQuý đối tác vui lòng thực hiện ủy nhiệm chi về tài khoản: {ngan_hang}.\nNếu Quý đơn vị đã hoàn tất lệnh chuyển tiền, xin vui lòng bỏ qua thông báo này.\n\nTrân trọng,\n{nguoi_gui}',
            isDefault: true
          },
          {
            id: 'tpl_02',
            name: 'Email đối chiếu & đề nghị tất toán công nợ quá hạn',
            channel: 'email',
            tone: 'formal',
            subject: 'Đề nghị đối chiếu và tất toán công nợ quá hạn hóa đơn {ma_hoa_don} - {ten_khach_hang}',
            body: 'Kính gửi Ban Giám đốc và Phòng Kế toán - {ten_khach_hang},\n\nCăn cứ biên bản nghiệm thu và sổ theo dõi công nợ phải thu đến hôm nay, khoản thanh toán thuộc hóa đơn {ma_hoa_don} trị giá {so_tien} (hạn thanh toán {han_thanh_toan}) hiện đã quá hạn theo thỏa thuận hợp đồng.\n\nĐề nghị Quý đơn vị sắp xếp lịch thanh toán về tài khoản {ngan_hang} và phản hồi lịch chuyển dự kiến để bộ phận kế toán công nợ cập nhật hồ sơ tín dụng.\n\nTrân trọng cảm ơn,\n{nguoi_gui}',
            isDefault: false
          },
          {
            id: 'tpl_03',
            name: 'Tin nhắn SMS Brandname thông báo công nợ đến hạn/quá hạn',
            channel: 'sms',
            tone: 'firm',
            subject: 'SMS thông báo công nợ {ma_hoa_don}',
            body: '[HOA BINH CORP] Kinh gui {ten_khach_hang}, hoa don dien tu {ma_hoa_don} so tien {so_tien} han {han_thanh_toan} chua ghi nhan thanh toan. Quy doi tac vui long UNC qua {ngan_hang}. LH doi chieu: {nguoi_gui}.',
            isDefault: true
          }
        ],
        ai: {
          anomaly: true,
          reminder: true,
          cashflow: true,
          anomalyThreshold: 250
        },
        dataVersion: '2.0.0'
      };
    }
  });
})(window);
