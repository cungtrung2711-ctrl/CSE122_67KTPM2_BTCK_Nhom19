# InvoicePilot — Hệ thống Quản lý Hóa đơn & Công nợ B2B (Bản Demo Front-end)

**Tuyên ngôn sản phẩm:** `Hóa đơn đúng hạn. Dòng tiền chủ động.`  
**Mô tả ngắn:** `InvoicePilot gom hóa đơn, công nợ, nhắc thanh toán và dự báo dòng tiền vào một không gian làm việc cho kế toán, kinh doanh, quản lý và quản trị viên.`

---

## 1. Giới thiệu & Bối cảnh sản phẩm

**InvoicePilot** là đồ án môn học **Phát triển ứng dụng Web (CSE122)**, được xây dựng hoàn toàn bằng **HTML5, CSS3, Vanilla JavaScript (ES2020) và Bootstrap 5.3** nhằm giải quyết 4 bài toán thực tế của doanh nghiệp nhỏ:

- **P1:** Trạng thái hóa đơn khó theo dõi khi dữ liệu nằm rải rác trên nhiều bảng tính.
- **P2:** Nhắc thanh toán thủ công tốn thời gian, dễ bỏ sót và khó giữ giọng điệu lịch sự.
- **P3:** Thông tin khách hàng, hóa đơn và giao dịch thanh toán không nằm chung một không gian.
- **P4:** Người quản lý thiếu bảng điều khiển công nợ và công cụ dự báo dòng tiền để ra quyết định.

---

## 2. Công nghệ sử dụng & Cách chạy dự án

### 2.1. Ngăn xếp công nghệ (Chỉ Front-end)
- **HTML5 & CSS3 thuần**: Hệ thống Design Tokens (`assets/css/tokens.css`), bố cục App Shell cố định sidebar 264px, hỗ trợ đầy đủ **Light Mode / Dark Mode** không nháy trang và **Responsive** tại các mốc `1440px / 1280px / 1024px / 768px / 390px` (dưới `768px` bảng dữ liệu tự động chuyển thành danh sách thẻ).
- **JavaScript thuần (ES2020)**: Không sử dụng React/Vue/Angular, không dùng Node.js/npm hay công cụ build, không dùng ES Module (`import`/`export`) và không gọi `fetch()` đọc file JSON cục bộ để trang mở trực tiếp từ ổ đĩa (`file://`) hoặc qua Live Server đều chạy ổn định.
- **Thư viện qua CDN**: Bootstrap `5.3.3` (CSS + JS Bundle), Bootstrap Icons `1.11.3`, Chart.js `4.4.1`, phông chữ **Be Vietnam Pro** từ Google Fonts.
- **Lưu trữ dữ liệu**: Toàn bộ dữ liệu được khởi tạo từ tầng Seed theo ngày hiện tại và lưu bền vững trong `localStorage` qua khóa `invoicepilot.db.v1`.

### 2.2. Cách chạy bằng VS Code Live Server (Khuyến nghị)
1. Mở thư mục gốc dự án trong **Visual Studio Code**.
2. Cài đặt tiện ích **Live Server** (Ritwick Dey) nếu chưa có.
3. Nhấp chuột phải vào file `index.html` (hoặc `login.html`) → chọn **Open with Live Server**.
4. Ngoài ra, có thể chạy bằng Python:
   ```bash
   python3 -m http.server 8080
   ```
   hoặc nhấp đúp mở trực tiếp file `index.html` trên trình duyệt.

---

## 3. Tài khoản Demo 4 Vai trò

Mật khẩu dùng chung cho tất cả tài khoản demo: **`123456`**

| Vai trò | Họ và tên | Email đăng nhập | Màn hình mặc định sau đăng nhập |
|---|---|---|---|
| **Kế toán** (`accountant`) | Nguyễn Thu Hà | `ketoan@invoicepilot.demo` | `accountant-invoice-list.html` |
| **Kinh doanh** (`sales`) | Trần Minh Quân | `kinhdoanh@invoicepilot.demo` | `sales-customer-balance.html` |
| **Quản lý** (`manager`) | Lê Hoàng Anh | `quanly@invoicepilot.demo` | `manager-receivable-dashboard.html` |
| **Quản trị viên** (`admin`) | Phạm Gia Bảo | `admin@invoicepilot.demo` | `admin-customer-management.html` |

> **Mẹo kiểm thử nhanh:** Sau khi đăng nhập, bạn có thể bấm vào **Menu Avatar ở góc phải trên cùng → Chuyển vai trò demo nhanh** để chuyển tức thì giữa 4 vai trò mà không cần gõ lại mật khẩu; dữ liệu vừa thao tác được giữ nguyên.

---

## 4. Danh mục 19 Màn hình & Phân công Mô-đun (SV1 – SV4)

| # | File HTML | Vai trò | Mục đích & Chức năng chính | CRUD & Trạng thái | AI | Phụ trách |
|---:|---|---|---|---|---|---|
| 1 | `index.html` | Chung | Trang giới thiệu sản phẩm, mockup HTML/CSS, 4 bài toán P1–P4, 4 vai trò | Read, CTA prefill role | — | SV4 |
| 2 | `login.html` | Chung | Đăng nhập mô phỏng, 4 thẻ chọn nhanh tài khoản demo | Auth, Role Guard | — | SV1 |
| 3 | `forgot-password.html` | Chung | Khôi phục mật khẩu mô phỏng kèm trạng thái lỗi & thử lại | Simulated Auth | — | SV1 |
| 4 | `profile.html` | Chung | Hồ sơ cá nhân, đổi mật khẩu demo, chọn giao diện, xuất/khôi phục DB | R/U, Reset DB, Export JSON | — | SV3 |
| 5 | `notifications.html` | Chung | Trung tâm thông báo theo danh mục, đánh dấu đã đọc, xóa tin đã đọc | R/U/D | — | SV2 |
| 6 | `403.html` | Chung | Trang báo chặn sai quyền truy cập kèm nút chuyển vai trò demo | Error state | — | SV2 |
| 7 | `404.html` | Chung | Trang báo không tìm thấy đường dẫn | Error state | — | SV2 |
| 8 | `accountant-invoice-list.html` | Kế toán | Danh sách hóa đơn, 4 KPI, lọc, sắp xếp, phân trang, thu tiền, xuất CSV | R, U, D (Lưu trữ), C (Nhân bản) | — | SV1 |
| 9 | `accountant-invoice-form.html` | Kế toán | Tạo / Sửa hóa đơn, dòng hàng động, tính VAT trực tiếp, xem trước bản in | C/R/U, Lưu nháp, Lưu & gửi | **AI-1** | SV1 |
| 10 | `accountant-reconciliation.html` | Kế toán | Đối chiếu giao dịch ngân hàng bằng thuật toán quy tắc, hoàn tác, từ chối | C/R/U/D đối chiếu | — | SV1 |
| 11 | `sales-customer-balance.html` | Kinh doanh | Công nợ khách hàng, thanh phân bổ tuổi nợ, drawer chi tiết khách hàng | R, Lọc tuổi nợ, Xuất CSV | — | SV2 |
| 12 | `sales-payment-reminders.html` | Kinh doanh | Quản lý nhắc thanh toán, Composer 4 bước, hẹn lịch / gửi ngay / gửi lại | C/R/U/D, Gửi mô phỏng | **AI-2** | SV2 |
| 13 | `sales-invoice-detail.html` | Kinh doanh | Chi tiết hóa đơn, ghi nhận thanh toán, đổi hạn, ghi chú nội bộ, in A4 | C/R/U/D hành động miền | Liên kết AI-2 | SV2 |
| 14 | `manager-receivable-dashboard.html` | Quản lý | Tổng quan công nợ, 4 KPI (có DSO), 3 biểu đồ Chart.js, lưu báo cáo | R, Lọc kỳ, Lưu/Xóa báo cáo | **AI-3** | SV3 |
| 15 | `manager-overdue-invoices.html` | Quản lý | Hóa đơn quá hạn, điểm rủi ro theo luật, giao phụ trách, ghi chú xử lý | C/R/U/D theo dõi quá hạn | — | SV3 |
| 16 | `manager-cashflow-forecast.html` | Quản lý | Dự báo dòng tiền 30/60/90 ngày, 3 kịch bản, chỉnh giả định trực tiếp | C/R/U/D kịch bản & báo cáo | **AI-3** | SV3 |
| 17 | `admin-customer-management.html` | Quản trị | Quản lý khách hàng, kiểm tra MST/Email, chặn lưu trữ khách còn nợ | C/R/U/D (Lưu trữ) | — | SV4 |
| 18 | `admin-user-management.html` | Quản trị | Quản lý người dùng, mời mới, khóa/mở khóa, cấp mật khẩu tạm 1 lần | C/R/U, Khóa/Mở khóa | — | SV4 |
| 19 | `admin-invoice-settings.html` | Quản trị | Cấu hình công ty, đánh số hóa đơn, CRUD mẫu nhắc, công tắc AI | C/R/U/D mẫu nhắc & cấu hình | Công tắc AI | SV4 |

### Quyết định phạm vi có chủ đích (Theo SPEC §5)
- **Không có `register.html`**: Đây là hệ thống nghiệp vụ nội bộ doanh nghiệp; tài khoản do Quản trị viên cấp tại `admin-user-management.html`.
- **Không tách `settings.html` dùng chung**: Tùy chọn cá nhân và giao diện nằm tại `profile.html`; cấu hình nghiệp vụ toàn hệ thống nằm tại `admin-invoice-settings.html`.
- **Không tách trang Dashboard riêng cho Kế toán và Kinh doanh**: Các thẻ KPI và bộ lọc nhanh được tích hợp trực tiếp trên màn hình làm việc chính (`accountant-invoice-list.html` và `sales-customer-balance.html`).

---

## 5. Kịch bản Kiểm thử Nhanh (5–10 phút)

1. **Luồng Kế toán (SV1)**:
   - Đăng nhập tài khoản Kế toán (`ketoan@invoicepilot.demo` / `123456`).
   - Tại `accountant-invoice-list.html`, bấm thẻ KPI **Quá hạn** để lọc nhanh → bấm vào một hóa đơn để mở Drawer chi tiết → bấm **Ghi nhận thanh toán**.
   - Chuyển sang **Tạo hóa đơn** (`accountant-invoice-form.html`), thử đặt Hạn thanh toán sớm hơn Ngày phát hành → bấm **Kiểm tra hóa đơn bằng AI (AI-1)** → bấm **Áp dụng gợi ý** để AI tự sửa hạn thanh toán → bấm **Lưu & Gửi hóa đơn**.
   - Mở **Đối chiếu thanh toán** (`accountant-reconciliation.html`), chọn 1 giao dịch ngân hàng chờ khớp → xem gợi ý khớp theo quy tắc luật → bấm **Xác nhận đối chiếu** → chuyển sang tab **Đã đối chiếu** và thử **Hoàn tác đối chiếu**.
2. **Luồng Kinh doanh (SV2)**:
   - Dùng menu Avatar góc phải trên → **Chuyển vai trò demo → Kinh doanh**.
   - Tại `sales-customer-balance.html`, bấm vào một khách hàng để mở Drawer → bấm **Tạo nhắc thanh toán**.
   - Trong Composer 4 bước tại `sales-payment-reminders.html`, bấm **Soạn bằng AI (AI-2)** → mở mục `Vì sao có kết quả này?` → bấm **Dùng bản nháp** → bấm **Gửi ngay (Mô phỏng)**.
   - Chuyển sang tab **Thất bại** và bấm **Gửi lại** trên bản ghi lỗi mẫu.
3. **Luồng Quản lý (SV3)**:
   - Chuyển sang vai trò **Quản lý**. Tại `manager-receivable-dashboard.html`, đổi kỳ phân tích, bấm **Tạo tóm tắt bằng AI (AI-3)** → bấm **Lưu báo cáo**.
   - Mở `manager-overdue-invoices.html`, rê chuột vào huy hiệu **Rủi ro Cao** để xem công thức luật → bấm **Xử lý** để giao phụ trách Kinh doanh và thêm ghi chú chỉ đạo.
   - Mở `manager-cashflow-forecast.html`, chọn kịch bản **Thận trọng**, chỉnh **Tỷ lệ thu hồi nợ quá hạn (%)** và xem bảng + biểu đồ cập nhật tức thì.
4. **Luồng Quản trị viên (SV4)**:
   - Chuyển sang vai trò **Quản trị viên**. Tại `admin-customer-management.html`, thử lưu trữ khách hàng `KH-001` (bị khóa vì còn dư nợ) và lưu trữ `KH-017` (thành công vì dư nợ = 0 ₫).
   - Tại `admin-user-management.html`, kiểm tra các nút khóa trên tài khoản Demo / Admin đang được bảo vệ kèm lý do; bấm **Mời người dùng** hoặc **Sinh mật khẩu tạm**.
   - Tại `admin-invoice-settings.html`, đổi Tiền tố hóa đơn thành `HDM` và lưu lại → chuyển về Kế toán mở trang Tạo hóa đơn để thấy mã mới `HDM-2026-...`.

---

## 6. Cách trình diễn Trạng thái Giao diện (`?demo=`) & 3 Trạng thái AI

- **Trạng thái trang dữ liệu (`?demo=`)**: Thêm tham số vào URL của bất kỳ trang dữ liệu nào:
  - `?demo=loading` — Hiển thị khung xương (skeleton) tải dữ liệu trong 1,5 giây rồi hiển thị dữ liệu thật.
  - `?demo=empty` — Hiển thị trạng thái rỗng kèm nút **Thoát chế độ Demo rỗng** (không làm mất dữ liệu thật).
  - `?demo=error` — Hiển thị trạng thái lỗi tải dữ liệu kèm mã lỗi và nút **Thử lại ngay**.
- **Trạng thái Trợ lý AI (`Tùy chọn demo`)**: Ngay góc phải trên của mỗi khung AI-1, AI-2, AI-3 có hộp chọn **Tùy chọn demo**:
  - `Bình thường`: Chạy thuật toán phân tích trên dữ liệu thực tế.
  - `Thiếu dữ liệu`: Hiển thị cảnh báo thiếu dữ liệu đầu vào kèm hướng dẫn bổ sung.
  - `Lỗi xử lý`: Hiển thị thông báo lỗi xử lý tạm thời kèm nút **Thử lại** hoặc thao tác thủ công.
- **Khôi phục dữ liệu mẫu gốc**: Vào `profile.html` (tab **Giao diện & Dữ liệu**) hoặc `admin-invoice-settings.html` (tab **4. AI & Dữ liệu demo**) → bấm **Khôi phục dữ liệu demo**.

---

## 7. Giới hạn của Bản Demo Học tập

- Toàn bộ ứng dụng chạy phía trình duyệt (**Frontend-only**); dữ liệu lưu trong `localStorage` của từng trình duyệt.
- Đăng nhập, phân quyền, gửi Email/SMS nhắc nợ, sao kê ngân hàng và 3 trợ lý AI đều là mô phỏng bằng thuật toán JavaScript cục bộ phục vụ mục đích học tập môn Phát triển ứng dụng Web.
