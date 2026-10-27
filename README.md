# InvoicePilot — Nhánh Nghiệp vụ Quản lý CFO & Phân tích Dòng tiền (Manager & CFO Analytics) (`feature/quan-ly`)

> **Kho lưu trữ:** `https://github.com/ReacVick/invoicepilot-b2b` | **Nhánh:** `feature/quan-ly`
> Nhánh này được tổ chức chuyên biệt, độc lập cho **Nghiệp vụ Quản lý CFO & Phân tích Dòng tiền (Manager & CFO Analytics)** phục vụ phân chia công việc theo BTL CSE122. Toàn bộ mã nguồn cốt lõi của nghiệp vụ khác đã được tinh gọn, chỉ giữ lại các màn hình, module JavaScript, CSS và dữ liệu MockAPI của đúng phân hệ này.

---

## 1. Danh sách các Tệp tin Mã nguồn của Phân hệ này
### 1.1. Các Màn hình HTML Giao diện
- [`manager-receivable-dashboard.html`](./manager-receivable-dashboard.html) : Màn hình nghiệp vụ chính
- [`manager-overdue-invoices.html`](./manager-overdue-invoices.html) : Màn hình nghiệp vụ chính
- [`manager-cashflow-forecast.html`](./manager-cashflow-forecast.html) : Màn hình nghiệp vụ chính
- [`index.html`](./index.html) : Màn hình giới thiệu tổng quan
- [`login.html`](./login.html) : Đăng nhập xác thực vai trò
- [`profile.html`](./profile.html) & [`notifications.html`](./notifications.html) : Hồ sơ cá nhân & Thông báo
- [`ui-state-loading.html`](./ui-state-loading.html), [`ui-state-empty.html`](./ui-state-empty.html), [`ui-state-error.html`](./ui-state-error.html) : 3 trạng thái mạng & tra cứu

### 1.2. Các Module JavaScript & CSS Nghiệp vụ Riêng biệt
- CSS nghiệp vụ: `assets/css/modules/manager.css`
- Các Page Controller JS:
  - `assets/js/pages/dashboard.js`
  - `assets/js/pages/overdue.js`
  - `assets/js/pages/forecast.js`
- Trợ lý AI chuyên biệt: `assets/js/ai/ai-cashflow.js`
- Tệp dữ liệu MockAPI Cloud: `mockapi-data/3-mockapi-quanly-cashflow.json`
- Thư mục chứa code rút gọn (~300 dòng) phục vụ quay video demo: `SV3-QuanLy-QuanTriNguoiDung/`

---

## 2. Tài liệu Nghiệp vụ Chi tiết
Xem đặc tả quy tắc nghiệp vụ, tính toán công thức, trợ lý AI và luồng xác nhận Lưu/Hủy tại:
👉 [`docs/features/quan-ly.md`](./docs/features/quan-ly.md)

---

## 3. Hướng dẫn Chạy & Kiểm thử trên Nhánh này
1. Clone hoặc chuyển sang nhánh này:
   ```bash
   git checkout feature/quan-ly
   ```
2. Mở trực tiếp màn hình khởi đầu của nghiệp vụ: [`manager-receivable-dashboard.html`](./manager-receivable-dashboard.html) bằng trình duyệt web hoặc Live Server trong VS Code.
3. Hệ thống sẽ tự động nhận diện và đăng nhập đúng vai trò của nghiệp vụ để demo trực tiếp.

---
© 2026 Nhóm InvoicePilot — CSE122 (Lớp 67KTPM)
