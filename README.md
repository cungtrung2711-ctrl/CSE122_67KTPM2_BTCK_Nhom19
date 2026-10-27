# InvoicePilot — Nhánh Nghiệp vụ Kinh doanh & Quản trị Khách hàng B2B (Sales & Customer Management) (`feature/kinh-doanh`)

> **Kho lưu trữ:** `https://github.com/ReacVick/invoicepilot-b2b` | **Nhánh:** `feature/kinh-doanh`
> Nhánh này được tổ chức chuyên biệt, độc lập cho **Nghiệp vụ Kinh doanh & Quản trị Khách hàng B2B (Sales & Customer Management)** phục vụ phân chia công việc theo BTL CSE122. Toàn bộ mã nguồn cốt lõi của nghiệp vụ khác đã được tinh gọn, chỉ giữ lại các màn hình, module JavaScript, CSS và dữ liệu MockAPI của đúng phân hệ này.

---

## 1. Danh sách các Tệp tin Mã nguồn của Phân hệ này
### 1.1. Các Màn hình HTML Giao diện
- [`sales-customer-balance.html`](./sales-customer-balance.html) : Màn hình nghiệp vụ chính
- [`sales-payment-reminders.html`](./sales-payment-reminders.html) : Màn hình nghiệp vụ chính
- [`sales-invoice-detail.html`](./sales-invoice-detail.html) : Màn hình nghiệp vụ chính
- [`admin-customer-management.html`](./admin-customer-management.html) : Màn hình nghiệp vụ chính
- [`index.html`](./index.html) : Màn hình giới thiệu tổng quan
- [`login.html`](./login.html) : Đăng nhập xác thực vai trò
- [`profile.html`](./profile.html) & [`notifications.html`](./notifications.html) : Hồ sơ cá nhân & Thông báo
- [`ui-state-loading.html`](./ui-state-loading.html), [`ui-state-empty.html`](./ui-state-empty.html), [`ui-state-error.html`](./ui-state-error.html) : 3 trạng thái mạng & tra cứu

### 1.2. Các Module JavaScript & CSS Nghiệp vụ Riêng biệt
- CSS nghiệp vụ: `assets/css/modules/sales.css`
- Các Page Controller JS:
  - `assets/js/pages/customer-balance.js`
  - `assets/js/pages/reminders.js`
  - `assets/js/pages/invoice-detail.js`
  - `assets/js/pages/admin-customers.js`
- Trợ lý AI chuyên biệt: `assets/js/ai/ai-reminder.js`
- Tệp dữ liệu MockAPI Cloud: `mockapi-data/2-mockapi-kinhdoanh-reminders.json`
- Thư mục chứa code rút gọn (~300 dòng) phục vụ quay video demo: `SV2-KinhDoanh-QuanTriKhachHang/`

---

## 2. Tài liệu Nghiệp vụ Chi tiết
Xem đặc tả quy tắc nghiệp vụ, tính toán công thức, trợ lý AI và luồng xác nhận Lưu/Hủy tại:
👉 [`docs/features/kinh-doanh.md`](./docs/features/kinh-doanh.md)

---

## 3. Hướng dẫn Chạy & Kiểm thử trên Nhánh này
1. Clone hoặc chuyển sang nhánh này:
   ```bash
   git checkout feature/kinh-doanh
   ```
2. Mở trực tiếp màn hình khởi đầu của nghiệp vụ: [`sales-customer-balance.html`](./sales-customer-balance.html) bằng trình duyệt web hoặc Live Server trong VS Code.
3. Hệ thống sẽ tự động nhận diện và đăng nhập đúng vai trò của nghiệp vụ để demo trực tiếp.

---
© 2026 Nhóm InvoicePilot — CSE122 (Lớp 67KTPM)
