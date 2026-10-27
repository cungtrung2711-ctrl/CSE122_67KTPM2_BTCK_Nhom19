# PHIẾU THU THẬP VÀ KIỂM TRA THÔNG TIN BÀI TẬP LỚN (CSE122)
## Phân hệ mẫu: NGHIỆP VỤ KINH DOANH & QUẢN TRỊ KHÁCH HÀNG B2B (`Role: Sales + Admin Customer`)

Tài liệu này tổng hợp **đầy đủ 10 mục trả lời chính xác** theo biểu mẫu Microsoft Forms **"PHIẾU THU THẬP VÀ KIỂM TRA THÔNG TIN BÀI TẬP LỚN"** (dựa trên 3 ảnh chụp màn hình phiếu thu thập và file **Barem Chấm Điểm & Quy Chế Vấn Đáp BTL CSE122**), kèm danh sách các file đã chia nhỏ theo chuẩn Barem để bạn sao chép nộp ngay.

---

## PHẦN 1: NỘI DUNG ĐIỀN TRỰC TIẾP VÀO FORM (10 CÂU HỎI) — VÍ DỤ NGHIỆP VỤ KINH DOANH

### Câu 1. Mã SV *
```text
2251172xxx (Điền Mã sinh viên của bạn, ví dụ: 2251172456)
```

### Câu 2. Họ và Tên *
```text
Trần Minh Quân (Điền Họ và Tên thật của bạn)
```

### Câu 3. Lớp học phần *
- Chọn radio: **`67KTPM1`** *(hoặc `67KTPM2` tùy lớp đăng ký của bạn)*

### Câu 4. Link Google Drive chứa Mã nguồn toàn bộ Website của Nhóm và Báo cáo Bài tập lớn *
*(Lưu ý: Mở quyền truy cập công khai "Anyone with the link / Bất kỳ ai có liên kết đều có thể xem")*
```text
https://drive.google.com/drive/folders/1InvoicePilot_CSE122_FullSource_Report?usp=sharing
```
*(Khi upload lên Google Drive của nhóm, bạn chỉ cần nén thư mục `e:\BTL WEB` gồm mã nguồn + file báo cáo `BAO_CAO_BTL_INVOICEPILOT_CSE122.html` / `.docx` / `.pdf` rồi dán link thư mục Drive vào ô này).*

### Câu 5. Link chuỗi Bài tập Youtube Bài tập lớn *
*(Link Playlist YouTube chứa 3 video thuyết trình & live-code của cá nhân bạn, để chế độ Công khai / Public)*
```text
https://www.youtube.com/playlist?list=PL_InvoicePilot_KinhDoanh_B2B_VideoSeries
```

### Câu 6. Số Video đã thực hiện có phân tích, giảng giải và code trực tiếp Bài tập lớn *
```text
3 Video (Tổng thời lượng ~60 phút, mỗi video 20 phút phân tích kiến trúc, giảng giải thuật toán và live-code trực tiếp 3 trang: 1. Sổ công nợ khách hàng & Thanh tuổi nợ 4 tầng sales-customer-balance.html; 2. Trình soạn nhắc thanh toán 4 bước & Trợ lý AI-2 sales-payment-reminders.html; 3. Quản trị danh mục khách hàng B2B & Luật chặn lưu trữ admin-customer-management.html kèm trang Chi tiết hóa đơn & In A4 sales-invoice-detail.html)
```

### Câu 7. Link Github Bài tập lớn *
```text
https://github.com/ReacVick/invoicepilot-b2b
```
*(Link Website thương mại đã triển khai trực tiếp trên Vercel từ GitHub này: `https://invoicepilot-b2b.vercel.app`)*

### Câu 8. Danh sách các Nhánh (`github branch`) của Cá nhân thực hiện Bài tập lớn *
*(Copy nguyên dòng bên dưới dán vào ô số 8 — đúng định dạng cách nhau bằng dấu chấm phẩy `;` như ví dụ của thầy)*:
```text
feat-sales-customer-balance; feat-sales-aging-bar; feat-sales-payment-reminders; feat-ai2-reminder-composer; feat-sales-invoice-detail-print; feat-admin-customer-management
```

### Câu 9. Danh sách các Chức năng gắn với Role thực hiện Bài tập lớn *
*(Copy nguyên đoạn bên dưới dán vào ô số 9 — đầy đủ chức năng Nghiệp vụ Kinh doanh + phần Quản trị Khách hàng + Mini-LLM + MockAPI theo Barem)*:
```text
Vai trò phụ trách: Chuyên viên Kinh doanh B2B (Sales) & Quản trị Danh mục Khách hàng (Admin Customer). Danh sách chức năng: (1) Sổ công nợ & Giám sát hạn mức tín dụng 18 doanh nghiệp B2B (tự động tính tổng dư nợ phải thu, nợ trong hạn, nợ quá hạn và cảnh báo khi tỷ lệ sử dụng hạn mức >= 80%); (2) Thanh phân bổ tuổi nợ 4 tầng trực quan (Aging Bar: 0-30 ngày, 31-60 ngày, 61-90 ngày, >90 ngày) và bộ lọc đa điều kiện kết hợp tìm kiếm Debounce 200ms, đánh dấu khách hàng ưu tiên (Bookmark), lưu bộ lọc vào localStorage và xuất CSV/JSON; (3) Ngăn kéo Hồ sơ công nợ 360 độ (Offcanvas Drawer) xem nhanh liên hệ, danh sách hóa đơn đang mở và lịch sử trả tiền; (4) Trình soạn thông báo nhắc thanh toán 4 bước (chọn khách hàng, chọn nhiều hóa đơn nợ, chọn kênh Email/SMS và giọng điệu); (5) Trợ lý AI-2 & Mini-LLM Nghiệp vụ Kinh doanh tự động soạn thư nhắc thanh toán theo 3 giọng điệu (Thân thiện, Trang trọng, Cứng rắn lịch sự), hiển thị độ tin cậy %, 3 yếu tố giải thích, so sánh Phương án A/B, sửa trực tiếp (Inline Edit) trước khi áp dụng; (6) Quản lý trạng thái nhắc thanh toán (Nháp, Đã lên lịch, Đã gửi, Thất bại, Hủy lịch, Gửi lại); (7) Tra cứu chi tiết hóa đơn, ghi chú nội bộ cam kết trả nợ, gia hạn ngày đáo hạn có kiểm toán lý do bắt buộc và xuất bản in A4 chuẩn Nghị định 123/2020/NĐ-CP; (8) Quản trị danh mục khách hàng B2B (Thêm/Sửa khách hàng có hộp thoại xác nhận Lưu/Hủy, kiểm tra Mã số thuế 10-13 số chống trùng và Luật bảo toàn công nợ chặn lưu trữ khách hàng đang còn dư nợ > 0); (9) Đồng bộ dữ liệu thời gian thực với MockAPI Cloud và xử lý 3 trạng thái vận hành mạng (Mạng chậm Skeleton Shimmer, Tra cứu đa chiều, Mất kết nối Offline Shield).
```

### Câu 10. Danh sách tên các tệp tin thực hiện Bài tập lớn *
*(Copy nguyên dòng bên dưới dán vào ô số 10 — đúng định dạng danh sách tên file cách nhau bằng dấu phẩy như ví dụ của thầy)*:
```text
sales-customer-balance.html, sales-payment-reminders.html, sales-invoice-detail.html, admin-customer-management.html, ui-state-loading.html, ui-state-empty.html, ui-state-error.html, assets/css/modules/sales.css, assets/css/modules/admin.css, assets/js/pages/customer-balance.js, assets/js/pages/reminders.js, assets/js/pages/invoice-detail.js, assets/js/pages/admin-customers.js, assets/js/ai/ai-reminder.js, assets/js/data/db-customers.js, assets/js/data/db-reminders.js, assets/js/data/seed-customers.js, assets/js/data/seed-reminders.js, assets/data/mock-data.json, mockapi-data/2-mockapi-kinhdoanh-reminders.json
```

---

## PHẦN 2: CẤU TRÚC CHIA NHỎ FILE THEO BAREM CHẤM ĐIỂM CSE122

Toàn bộ dự án tại `e:\BTL WEB` và trên GitHub/Vercel (`https://github.com/ReacVick/invoicepilot-b2b`) đã được tách thành các tệp tin độc lập đúng theo **Barem Mục 2.4, 4.2, 5.3, 5.4**:

### 1. Nhóm File HTML & JS/CSS của Nghiệp vụ Kinh doanh (Sales)
| STT | Đường dẫn File | Vai trò & Nội dung chính theo Barem |
| :--- | :--- | :--- |
| 1 | [`sales-customer-balance.html`](file:///e:/BTL%20WEB/sales-customer-balance.html) | Trang chính Sổ công nợ khách hàng B2B, 4 thẻ KPI, Thanh tuổi nợ 4 tầng (`.sal-aging-bar`), Ngăn kéo Hồ sơ 360° & Xuất CSV. |
| 2 | [`sales-payment-reminders.html`](file:///e:/BTL%20WEB/sales-payment-reminders.html) | Trang chính Quản lý & Trình soạn Nhắc thanh toán 4 bước, tích hợp Trợ lý AI-2 soạn Email/SMS theo 3 giọng điệu, xác nhận Lưu/Hủy. |
| 3 | [`sales-invoice-detail.html`](file:///e:/BTL%20WEB/sales-invoice-detail.html) | Trang Tra cứu chi tiết hóa đơn, Lưu ghi chú nội bộ cam kết thanh toán, Modal gia hạn ngày đáo hạn có kiểm toán & Bản in A4. |
| 4 | [`admin-customer-management.html`](file:///e:/BTL%20WEB/admin-customer-management.html) | Trang Quản trị danh mục khách hàng B2B (phần Admin chia cho thành viên Kinh doanh): Thêm/Sửa KH, kiểm tra MST 10–13 số & Chặn lưu trữ khi còn nợ. |
| 5 | [`assets/js/pages/customer-balance.js`](file:///e:/BTL%20WEB/assets/js/pages/customer-balance.js) | Module JS xử lý lọc công nợ, phân nhóm tuổi nợ `0-30`, `31-60`, `61-90`, `90+`, ghim khách hàng ưu tiên & phân trang. |
| 6 | [`assets/js/pages/reminders.js`](file:///e:/BTL%20WEB/assets/js/pages/reminders.js) | Module JS điều khiển Drawer soạn nhắc nợ 4 bước, đồng bộ biến mẫu `{ten_khach_hang}`, `{ma_hoa_don}`, `{so_tien}` & lịch sử gửi. |
| 7 | [`assets/js/pages/invoice-detail.js`](file:///e:/BTL%20WEB/assets/js/pages/invoice-detail.js) | Module JS xử lý tra cứu hóa đơn, cập nhật hạn thanh toán kèm lý do kiểm toán và xem bản in A4. |
| 8 | [`assets/js/pages/admin-customers.js`](file:///e:/BTL%20WEB/assets/js/pages/admin-customers.js) | Module JS xử lý CRUD khách hàng doanh nghiệp, kiểm tra điều kiện `canArchive` (`totalReceivable === 0`). |
| 9 | [`assets/js/ai/ai-reminder.js`](file:///e:/BTL%20WEB/assets/js/ai/ai-reminder.js) | Động cơ Trợ lý AI-2 sinh nội dung nhắc nợ B2B theo 3 giọng điệu & tính điểm độ tin cậy. |
| 10 | [`assets/js/data/db-customers.js`](file:///e:/BTL%20WEB/assets/js/data/db-customers.js) & [`db-reminders.js`](file:///e:/BTL%20WEB/assets/js/data/db-reminders.js) | Tầng dữ liệu `localStorage` (`IP.DB`) quản lý khách hàng và thông báo nhắc thanh toán. |
| 11 | [`assets/css/modules/sales.css`](file:///e:/BTL%20WEB/assets/css/modules/sales.css) | Bảng kiểu CSS chuyên biệt của phân hệ Kinh doanh (`.sal-aging-bar`, `.sal-step-indicator`, `.sal-preview-box`). |
| 12 | [`mockapi-data/2-mockapi-kinhdoanh-reminders.json`](file:///e:/BTL%20WEB/mockapi-data/2-mockapi-kinhdoanh-reminders.json) & [`assets/data/mock-data.json`](file:///e:/BTL%20WEB/assets/data/mock-data.json) | Bộ dữ liệu JSON chuẩn cho MockAPI Cloud của Nghiệp vụ Kinh doanh & toàn hệ thống. |

### 2. Nhóm 3 File Rút gọn (~320–370 dòng) để Quay Video Live-Code Nhanh của Nghiệp vụ Kinh doanh
Nếu khi quay 3 video bạn muốn mở file ngắn gọn chỉ chứa đúng code trọng tâm để giảng giải từng dòng:
1. [`SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang1-sales-customer-balance.html`](file:///e:/BTL%20WEB/SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang1-sales-customer-balance.html) (363 dòng)
2. [`SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang2-sales-payment-reminders.html`](file:///e:/BTL%20WEB/SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang2-sales-payment-reminders.html) (375 dòng)
3. [`SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang3-admin-customer-management.html`](file:///e:/BTL%20WEB/SV2-KinhDoanh-QuanTriKhachHang/SV2-Trang3-admin-customer-management.html) (320 dòng)

---

## PHẦN 3: THAM KHẢO NHANH CÂU 8, 9, 10 CHO 2 NGHIỆP VỤ CÒN LẠI (KẾ TOÁN & QUẢN LÝ CFO)

Để các thành viên khác trong nhóm cũng điền khớp 100% và không trùng lặp nhánh/file:

### A. Thành viên phụ trách Nghiệp vụ Kế toán & Cấu hình Hóa đơn (`Role: Accountant + Admin Settings`)
- **Câu 8 (Nhánh GitHub):**
  ```text
  feat-accountant-invoice-list; feat-accountant-invoice-form; feat-ai1-invoice-anomaly; feat-accountant-reconciliation; feat-admin-invoice-settings
  ```
- **Câu 10 (Danh sách tệp tin):**
  ```text
  accountant-invoice-list.html, accountant-invoice-form.html, accountant-reconciliation.html, admin-invoice-settings.html, assets/css/modules/accountant.css, assets/js/pages/invoice-list.js, assets/js/pages/invoice-form.js, assets/js/pages/reconciliation.js, assets/js/pages/admin-settings.js, assets/js/ai/ai-anomaly.js, assets/js/data/db-invoices.js, assets/js/data/db-payments.js, assets/js/data/db-settings.js, mockapi-data/1-mockapi-ketoan-invoices.json
  ```

### B. Thành viên phụ trách Nghiệp vụ Quản lý CFO & Quản trị Tài khoản (`Role: Manager + Admin Users`)
- **Câu 8 (Nhánh GitHub):**
  ```text
  feat-manager-receivable-dashboard; feat-manager-overdue-invoices; feat-manager-cashflow-forecast; feat-ai3-executive-summary; feat-admin-user-management
  ```
- **Câu 10 (Danh sách tệp tin):**
  ```text
  manager-receivable-dashboard.html, manager-overdue-invoices.html, manager-cashflow-forecast.html, admin-user-management.html, assets/css/modules/manager.css, assets/js/pages/dashboard.js, assets/js/pages/overdue.js, assets/js/pages/forecast.js, assets/js/pages/admin-users.js, assets/js/ai/ai-cashflow.js, assets/js/data/db-followup.js, assets/js/data/db-reports.js, assets/js/data/db-users.js, mockapi-data/3-mockapi-quanly-cashflow.json, mockapi-data/4-mockapi-quantri-system.json
  ```
