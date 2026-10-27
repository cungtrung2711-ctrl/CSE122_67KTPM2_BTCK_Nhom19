# Nghiệp vụ Quản lý (CFO) — `feature/quan-ly`

**Người dùng mẫu:** Lê Hoàng Anh · `quanly@hoabinhdigital.vn` / `QuanLy@2026`

## Màn hình
| Tệp | Mô tả |
| :--- | :--- |
| `manager-receivable-dashboard.html` | Tổng phải thu, DSO, cơ cấu tuổi nợ, biểu đồ Chart.js, tóm tắt điều hành |
| `manager-overdue-invoices.html` | Hóa đơn quá hạn, điểm rủi ro, phân công thu hồi, nhật ký xử lý |
| `manager-cashflow-forecast.html` | Dự báo dòng tiền 30/60/90 ngày theo 3 kịch bản với AI-3 |

## Tệp mã nguồn
- `assets/css/modules/manager.css`
- `assets/js/pages/dashboard.js`, `overdue.js`, `forecast.js`
- `assets/js/ai/ai-cashflow.js` (AI-3)
- `assets/js/data/db-followup.js`, `db-reports.js`, `seed-followup.js`, `seed-reports.js`
- `mockapi-data/3-mockapi-quanly-cashflow.json`
- Bản rút gọn quay video: `SV3-QuanLy-QuanTriNguoiDung/`

## Quy tắc nghiệp vụ
- DSO = (Tổng phải thu / Doanh thu kỳ) × Số ngày trong kỳ.
- 3 kịch bản dòng tiền: Lạc quan, Cơ sở, Thận trọng — mỗi kịch bản áp tỷ lệ thu hồi khác nhau theo nhóm tuổi nợ.
- Phân công chỉ chọn nhân sự Kinh doanh đang hoạt động; mỗi phân công gửi thông báo cho người nhận.
- Đóng theo dõi bắt buộc nhập lý do, có thể mở lại.

## Xác nhận Lưu / Hủy
| Thao tác | Hộp thoại | Sau khi xác nhận |
| :--- | :--- | :--- |
| Lưu phân công | "Xác nhận lưu phân công thu hồi công nợ?" | Đóng ngăn kéo, làm mới danh sách |
| Thêm ghi chú xử lý | "Xác nhận lưu ghi chú xử lý?" | Đóng ngăn kéo |
| Đóng / Mở lại theo dõi | Hỏi xác nhận (đóng cần lý do) | Đóng ngăn kéo |
| Đóng ngăn kéo | "Xác nhận đóng cửa sổ xử lý quá hạn?" | Đóng ngăn kéo |
