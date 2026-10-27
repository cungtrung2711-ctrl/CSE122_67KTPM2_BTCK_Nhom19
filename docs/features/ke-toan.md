# Nghiệp vụ Kế toán — `feature/ke-toan`

**Người dùng mẫu:** Nguyễn Thu Hà · `ketoan@hoabinhdigital.vn` / `KeToan@2026`

## Màn hình
| Tệp | Mô tả |
| :--- | :--- |
| `accountant-invoice-list.html` | Danh sách hóa đơn, KPI, bộ lọc, ngăn kéo chi tiết, ghi nhận thanh toán, xuất CSV |
| `accountant-invoice-form.html` | Lập / sửa hóa đơn, tính VAT – chiết khấu, AI-1 kiểm tra bất thường, xem trước A4 |
| `accountant-reconciliation.html` | Đối chiếu sao kê ngân hàng với hóa đơn |
| `admin-invoice-settings.html` | (Phần quản trị liên quan) cấu hình ký hiệu, đánh số hóa đơn |

## Tệp mã nguồn
- `assets/css/modules/accountant.css`
- `assets/js/pages/invoice-list.js`, `invoice-form.js`, `reconciliation.js`
- `assets/js/ai/ai-anomaly.js` (AI-1)
- `assets/js/data/db-invoices.js`, `db-payments.js`, `seed-invoices.js`, `seed-payments.js`
- `mockapi-data/1-mockapi-ketoan-invoices.json`

## Quy tắc nghiệp vụ
- Tổng tiền dòng = `SL × Đơn giá × (1 − CK%) × (1 + VAT%)`, làm tròn số nguyên VND.
- Ngày đáo hạn không được sớm hơn ngày phát hành; hóa đơn phải có khách hàng và ít nhất 1 dòng hàng hợp lệ.
- Số tiền thanh toán phải > 0 và không vượt quá số còn phải thu.
- `paidAmount` và trạng thái (`Nháp → Đã gửi → Thanh toán một phần → Đã thanh toán / Quá hạn`) được dẫn xuất từ các thanh toán `confirmed`.
- Đánh dấu sai lệch bắt buộc nhập ghi chú; từ chối giao dịch bắt buộc nhập lý do.

## Xác nhận Lưu / Hủy
| Thao tác | Hộp thoại | Sau khi xác nhận |
| :--- | :--- | :--- |
| Lưu & Gửi / Lưu nháp | "Xác nhận lưu & phát hành hóa đơn?" | Lưu và quay về danh sách |
| Quay lại danh sách | "Xác nhận hủy thao tác?" | Về danh sách, bỏ dữ liệu đang nhập |
| Lưu thanh toán | "Xác nhận lưu giao dịch thanh toán?" | Đóng modal và ngăn kéo |
| Khớp đối chiếu | "Xác nhận lưu & khớp đối chiếu thanh toán?" | Bỏ chọn giao dịch, làm mới danh sách |
