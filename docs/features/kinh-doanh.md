# Nghiệp vụ Kinh doanh — `feature/kinh-doanh`

**Người dùng mẫu:** Trần Minh Quân · `kinhdoanh@hoabinhdigital.vn` / `KinhDoanh@2026`

## Màn hình
| Tệp | Mô tả |
| :--- | :--- |
| `sales-customer-balance.html` | Sổ công nợ, hạn mức tín dụng, thanh tuổi nợ 4 tầng, hồ sơ 360°, xuất CSV |
| `sales-payment-reminders.html` | Trình soạn nhắc thanh toán 4 bước + AI-2, quản lý trạng thái nhắc |
| `sales-invoice-detail.html` | Chi tiết hóa đơn, ghi chú nội bộ, gia hạn có lý do, in A4 |

## Tệp mã nguồn
- `assets/css/modules/sales.css`
- `assets/js/pages/customer-balance.js`, `reminders.js`, `invoice-detail.js`
- `assets/js/ai/ai-reminder.js` (AI-2)
- `assets/js/data/db-reminders.js`, `seed-reminders.js`
- `mockapi-data/2-mockapi-kinhdoanh-reminders.json`
- Bản rút gọn quay video: `SV2-KinhDoanh-QuanTriKhachHang/`

## Quy tắc nghiệp vụ
- Nhóm tuổi nợ theo số ngày quá hạn: `0–30`, `31–60`, `61–90`, `>90`.
- Khách rủi ro cao khi: quá hạn > 45 ngày **hoặc** dùng ≥ 80% hạn mức **hoặc** trễ hạn ≥ 3 lần.
- Nhắc thanh toán phải chọn ít nhất 1 hóa đơn còn nợ và có đủ tiêu đề, nội dung.
- Biến mẫu: `{ten_khach_hang}`, `{ma_hoa_don}`, `{so_tien}`, `{han_thanh_toan}`, `{ngan_hang}`, `{nguoi_gui}`.
- AI-2 hỗ trợ 3 giọng điệu: Thân thiện, Trang trọng, Cứng rắn lịch sự; SMS tự rút gọn dưới 160 ký tự.
- Gia hạn ngày đáo hạn bắt buộc nhập lý do và không sớm hơn ngày phát hành.

## Xác nhận Lưu / Hủy
| Thao tác | Hộp thoại | Sau khi xác nhận |
| :--- | :--- | :--- |
| Lưu nháp / Lên lịch / Gửi ngay | "Xác nhận lưu & gửi thông báo nhắc…?" | Đóng trình soạn, xóa tham số URL |
| Đóng trình soạn | "Xác nhận hủy soạn nhắc thanh toán?" | Đóng trình soạn |
| Lưu hạn mới | "Xác nhận lưu hạn thanh toán mới?" | Đóng modal, làm mới chi tiết |
| Lưu ghi chú nội bộ | "Xác nhận lưu ghi chú nội bộ?" | Lưu và làm mới |
