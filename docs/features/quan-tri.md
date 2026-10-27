# Nghiệp vụ Quản trị viên — `feature/quan-tri`

**Người dùng mẫu:** Phạm Gia Bảo · `admin@hoabinhdigital.vn` / `Admin@2026`

## Màn hình
| Tệp | Mô tả |
| :--- | :--- |
| `admin-customer-management.html` | CRUD khách hàng B2B, kiểm tra MST, chặn lưu trữ khách còn nợ |
| `admin-user-management.html` | Cấp / sửa / khóa / xóa tài khoản, cấp lại mật khẩu |
| `admin-invoice-settings.html` | Thông tin đơn vị, ký hiệu & đánh số hóa đơn, mẫu nhắc, bật/tắt AI, sao lưu dữ liệu |

## Tệp mã nguồn
- `assets/css/modules/admin.css`
- `assets/js/pages/admin-customers.js`, `admin-users.js`, `admin-settings.js`
- `assets/js/data/db-customers.js`, `db-users.js`, `db-settings.js`, `seed-customers.js`, `seed-users.js`, `seed-settings.js`
- `mockapi-data/4-mockapi-quantri-system.json`

## Quy tắc nghiệp vụ
- Mã số thuế gồm 10 hoặc 13 chữ số và không được trùng.
- Không được lưu trữ khách hàng còn dư nợ > 0.
- Không thể tự khóa / xóa / hạ quyền tài khoản đang đăng nhập; hệ thống luôn giữ ít nhất 1 Quản trị viên hoạt động.
- Khi xóa tài khoản Kinh doanh, khách hàng đang phụ trách được bàn giao lại.
- Khóa tài khoản bắt buộc nhập lý do; mật khẩu cấp lại chỉ hiển thị một lần.
- Khôi phục dữ liệu mẫu yêu cầu nhập xác nhận mạnh.

## Xác nhận Lưu / Hủy
| Thao tác | Hộp thoại | Sau khi xác nhận |
| :--- | :--- | :--- |
| Lưu khách hàng | "Xác nhận lưu khách hàng mới?" / "…cập nhật khách hàng?" | Đóng modal và ngăn kéo |
| Lưu tài khoản | "Xác nhận cấp tài khoản mới?" | Đóng modal |
| Lưu mẫu nhắc | "Xác nhận lưu mẫu nhắc mới?" | Đóng modal |
| Lưu cấu hình | "Xác nhận lưu cấu hình hệ thống?" | Lưu và làm mới |
| Hoàn tác thay đổi | "Xác nhận hủy các thay đổi chưa lưu?" | Khôi phục giá trị đã lưu |
