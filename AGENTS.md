# AGENTS.md — Quy tắc bền vững của dự án InvoicePilot

Tài liệu này quy định các nguyên tắc kiến trúc và kỹ thuật bắt buộc cho mọi phiên làm việc trên dự án **InvoicePilot** (Môn Phát triển ứng dụng Web – CSE122):

1. **Kiến trúc Multi-page tĩnh thuần túy**:
   - Chỉ sử dụng HTML5, CSS3, Vanilla JavaScript (ES2020) và Bootstrap 5.3 + Chart.js 4.x + Bootstrap Icons qua CDN.
   - Không sử dụng React/Vue/Angular, không dùng Tailwind, không dùng công cụ build, không dùng Node.js/npm để chạy web.
   - Không dùng ES Modules (`import`/`export`) và không dùng `fetch()` đọc file JSON cục bộ để đảm bảo trang mở trực tiếp từ ổ đĩa (`file://`) hoặc qua Live Server đều chạy ổn định.
2. **Vị trí file & Phân quyền sở hữu**:
   - Toàn bộ 19 file HTML nằm ở thư mục gốc của dự án với tên file chính xác theo SPEC §5.
   - Mỗi file có đúng một chủ sở hữu (`@owner CORE`, `@owner SV1`, `@owner SV2`, `@owner SV3`, `@owner SV4`), xem chi tiết tại `docs/contracts/ownership.md`.
   - Mở rộng hệ thống thông qua cơ chế đăng ký (`IP.DB.extend`, `IP.Seed.register`, `IP.AI.register`, `IP.Pages.register`); mọi yêu cầu thay đổi file của thành viên khác hoặc CORE phải thông qua `docs/CHANGE-REQUESTS.md`.
3. **Ngôn ngữ & Trải nghiệm người dùng**:
   - Toàn bộ giao diện, thông báo, dữ liệu mẫu và tài liệu kỹ thuật sử dụng **100% tiếng Việt** tự nhiên, chuẩn thuật ngữ kế toán – công nợ, xưng hô "bạn".
   - Tuyệt đối không sử dụng `alert()`, `confirm()`, `prompt()` của trình duyệt; phải dùng Modal, Drawer và Toast của hệ thống (`IP.UI`).
   - Tuyệt đối không sử dụng ảnh stock, ảnh AI hoặc emoji trong giao diện; chỉ dùng inline SVG, Bootstrap Icons và HTML/CSS thuần.
4. **Tầng dữ liệu & Hợp đồng chung**:
   - Mọi thao tác đọc/ghi dữ liệu nghiệp vụ chỉ đi qua `window.IP.DB` và tính toán qua `window.IP.Calc`.
   - Tiền tệ lưu dạng số nguyên VND; ngày tháng lưu dạng ISO (`YYYY-MM-DD`); trạng thái hóa đơn và số tiền đã thu (`paidAmount`) luôn được dẫn xuất tự động từ các giao dịch thanh toán đã xác nhận (`confirmed`).
