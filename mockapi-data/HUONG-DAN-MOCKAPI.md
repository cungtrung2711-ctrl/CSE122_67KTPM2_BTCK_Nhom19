# Hướng dẫn Cài đặt & Đồng bộ 4 Link MockAPI cho 4 Nghiệp vụ InvoicePilot (BTL-19)

Bộ dữ liệu chuẩn này được thiết kế đặc thù cho **4 phân hệ nghiệp vụ** của hệ thống **InvoicePilot**, tuân thủ 100% quy chuẩn tiền tệ số nguyên VND, ngày chuẩn ISO `YYYY-MM-DD`, mã số thuế 10/13 chữ số và chuẩn Hóa đơn điện tử Nghị định 123/2020/NĐ-CP – Nghị định 70/2025/NĐ-CP.

---

## 1. Danh sách 4 File JSON Chuẩn tương ứng với 4 Link MockAPI của bạn

| STT | Nghiệp vụ (Role) | Tên Resource gợi ý trên MockAPI | File JSON chuẩn để nạp | Nội dung dữ liệu chính |
| :--- | :--- | :--- | :--- | :--- |
| **Link 1** | **Kế toán (`accountant`)** | `/invoices` hoặc `/ketoan` | [`1-mockapi-ketoan-invoices.json`](file:///e:/BTL%20WEB/mockapi-data/1-mockapi-ketoan-invoices.json) | Hóa đơn GTGT điện tử (`1C26TAA`), chi tiết dòng hàng (`items`), thuế suất 0%/5%/8%/10% và lịch sử giao dịch ngân hàng chờ đối chiếu (`payments`). |
| **Link 2** | **Kinh doanh (`sales`)** | `/reminders` hoặc `/kinhdoanh` | [`2-mockapi-kinhdoanh-reminders.json`](file:///e:/BTL%20WEB/mockapi-data/2-mockapi-kinhdoanh-reminders.json) | Hồ sơ theo dõi hạn mức tín dụng khách hàng, số dư quá hạn và lịch nhắc thanh toán đa kênh (`Email`/`SMS`, `friendly`/`formal`/`firm`, AI-2). |
| **Link 3** | **Quản lý (`manager`)** | `/cashflow` hoặc `/quanly` | [`3-mockapi-quanly-cashflow.json`](file:///e:/BTL%20WEB/mockapi-data/3-mockapi-quanly-cashflow.json) | Hồ sơ đôn đốc nợ quá hạn (`overdue_followup`), điểm rủi ro (`riskScore`), phân nhóm tuổi nợ Aging, chỉ số `DSO` và báo cáo dự báo 3 kịch bản (`AI-3`). |
| **Link 4** | **Quản trị viên (`admin`)** | `/system` hoặc `/quantri` | [`4-mockapi-quantri-system.json`](file:///e:/BTL%20WEB/mockapi-data/4-mockapi-quantri-system.json) | Danh mục Doanh nghiệp B2B (`customers`), tài khoản phân quyền RBAC 4 vai trò (`users`) và cấu hình hệ thống hóa đơn điện tử (`settings`). |

---

## 2. Hai cách nạp dữ liệu lên 4 Link MockAPI (Nhanh nhất)

### Cách 1: Tự động nạp 1-Click ngay trên Giao diện Web InvoicePilot (Khuyên dùng)
1. Mở trang web **InvoicePilot** (trên máy hoặc trên `https://invoicepilot-b2b.vercel.app`).
2. Bấm vào nút **"MockAPI Cloud (4 Link)"** trên thanh điều khiển phía trên cùng (hoặc vào **Quản trị viên → Cấu hình hóa đơn & AI**).
3. Dán **4 đường link Endpoint MockAPI** của bạn vào 4 ô tương ứng:
   - Link 1 (Kế toán): `https://<project-id>.mockapi.io/api/v1/...`
   - Link 2 (Kinh doanh): `https://<project-id>.mockapi.io/api/v1/...`
   - Link 3 (Quản lý): `https://<project-id>.mockapi.io/api/v1/...`
   - Link 4 (Quản trị viên): `https://<project-id>.mockapi.io/api/v1/...`
4. Bấm nút **"Đẩy dữ liệu chuẩn lên 4 Link MockAPI (Auto-Seed POST)"**: Trang web sẽ tự động gửi `fetch(..., { method: 'POST' })` để khởi tạo dữ liệu mẫu chuẩn lên cả 4 link MockAPI của bạn!
5. Bấm nút **"Đồng bộ dữ liệu từ 4 Link MockAPI về Web (GET Sync)"**: Trang web sẽ tải dữ liệu trực tiếp từ 4 link MockAPI của bạn, đo độ trễ mạng (`ms`) và cập nhật toàn bộ biểu đồ, bảng biểu và Mini-LLM!

### Cách 2: Copy-Paste trực tiếp trên trang quản trị MockAPI.io
1. Truy cập dự án của bạn trên [https://mockapi.io](https://mockapi.io).
2. Tại mỗi Resource trong 4 Resource của bạn, bấm vào nút **Data** (nằm cạnh nút Edit/Delete của Resource đó).
3. Mở file `.json` tương ứng trong thư mục `mockapi-data/` (hoặc bấm nút **"Copy JSON chuẩn"** ngay trong hộp thoại MockAPI trên trang web InvoicePilot), dán toàn bộ mảng `[...]` vào ô Data trên MockAPI.io rồi bấm **Update**.
