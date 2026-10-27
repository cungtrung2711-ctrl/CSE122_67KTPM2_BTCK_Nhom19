/**
 * @owner CORE
 * @spec §3.3, §4, §11 Application Shell, Ximitech-Inspired Scroll Role Landing Page, Theme Sync & Language Toggle (IP.Layout)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  const LOGO_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" aria-hidden="true">' +
      '<rect x="2" y="2" width="32" height="32" rx="9" fill="#0B5D50"/>' +
      '<path d="M10 8.5C10 7.67157 10.6716 7 11.5 7H21L26 12V26.5C26 27.3284 25.3284 28 24.5 28H11.5C10.6716 28 10 27.3284 10 26.5V8.5Z" stroke="#EAF2EF" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M20.5 7V12.5H26" stroke="#EAF2EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M13.5 23.5L17.5 19.5L19.8 21.8L23 17.5" stroke="#E8B44A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M20.2 17.5H23V20.3" stroke="#E8B44A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  // Default first page of each business role where the opening scroll landing page lives
  const ROLE_DEFAULT_PAGES = {
    accountant: 'accountant-invoice-list',
    sales: 'sales-customer-balance',
    manager: 'manager-receivable-dashboard',
    admin: 'admin-customer-management'
  };

  const ROLE_LANDING_CONTENT = {
    accountant: {
      slashTag: '/Kế toán Công nợ · Chuẩn hóa Hóa đơn & Đối chiếu Ngân hàng',
      slashTagEn: '/Accounts Receivable · E-Invoice & Bank Reconciliation',
      badge: 'Phân hệ Kế toán Công nợ (Accounts Receivable)',
      badgeEn: 'Accounts Receivable Module (Accountant)',
      headlineHtml: 'Hóa đơn chuẩn mực là <em>tài sản dòng tiền</em> — phát hành đúng, đối chiếu mỗi ngày.',
      headlineHtmlEn: 'Standardized invoices are <em>cashflow assets</em> — issue accurately, reconcile daily.',
      subtitle: 'Đa số doanh nghiệp để hóa đơn rời rạc trên nhiều bảng tính khiến thất thoát dòng tiền. Phân hệ Kế toán InvoicePilot chuẩn hóa hóa đơn GTGT có mã CQT (Ký hiệu 1C26TAA theo Thông tư 78/2021/TT-BTC), kiểm tra bất thường bằng AI-1 và khớp lệnh sao kê Vietcombank tự động.',
      subtitleEn: 'Fragmented spreadsheets delay cash collection. InvoicePilot standardizes tax-coded VAT e-invoices (Symbol 1C26TAA), audits anomalies with AI-1, and reconciles Vietcombank feeds daily.',
      ticker: [
        'Chuẩn Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
        'Ký hiệu hóa đơn điện tử 1C26TAA',
        'Kiểm tra bất thường trước phát hành với AI-1',
        'Đối chiếu sao kê Vietcombank theo điểm khớp quy tắc',
        'Tự động tính lại số dư thực thu'
      ],
      tickerEn: [
        'Compliant with Decree 123 & Circular 78',
        'Tax-coded E-Invoice Symbol 1C26TAA',
        'Pre-issuance AI-1 Anomaly Auditing',
        'Rule-based Vietcombank Feed Reconciliation',
        'Real-time Receivable Balance Recalculation'
      ],
      matrixTitle: 'Từ bảng tính rời rạc hay sổ công nợ chuẩn kiểm toán?',
      matrixTitleEn: 'Fragmented spreadsheets or audit-ready receivables ledger?',
      matrix: [
        {
          step: '01 — Rời rạc',
          stepEn: '01 — Fragmented',
          title: 'Lập hóa đơn thủ công trên nhiều file lẻ',
          titleEn: 'Manual invoicing across scattered files',
          desc: 'Dễ trùng số chứng từ, nhầm thuế suất GTGT 8%/10% hoặc quên kiểm tra hạn mức tín dụng còn lại của khách hàng.',
          descEn: 'Prone to duplicate numbers, wrong VAT rates (8%/10%), or missed credit limit checks.'
        },
        {
          step: '02 — Chậm đối chiếu',
          stepEn: '02 — Delayed Match',
          title: 'Sao kê ngân hàng chờ khớp thủ công',
          titleEn: 'Unmatched bank transfers',
          desc: 'Khách chuyển khoản thiếu mã hóa đơn hoặc thanh toán từng phần khiến kế toán mất hàng giờ rà soát ủy nhiệm chi.',
          descEn: 'Partial payments or unclear transfer memos take hours of manual bank statement checking.'
        },
        {
          step: '03 — Tài sản chuẩn hóa',
          stepEn: '03 — Standardized Asset',
          title: 'Sổ cái Hóa đơn Điện tử 1C26TAA tập trung',
          titleEn: 'Unified 1C26TAA E-Invoice Ledger',
          desc: 'Mỗi hóa đơn phát hành gắn chặt với lịch sử thu tiền, trạng thái dẫn xuất tự động và nhật ký kiểm toán minh bạch.',
          descEn: 'Every invoice links directly to confirmed payments, derived statuses, and an audit trail.',
          highlight: true
        },
        {
          step: '04 — Vận hành mỗi ngày',
          stepEn: '04 — Daily Operation',
          title: 'AI-1 rà soát & Bàn đối chiếu tự động',
          titleEn: 'AI-1 Audit & Automated Reconciliation',
          desc: 'AI-1 cảnh báo ngay khi vượt hạn mức hoặc lệch ngày đáo hạn; bàn đối chiếu gợi ý khớp chính xác theo quy tắc.',
          descEn: 'AI-1 flags credit breaches pre-issuance while the reconciliation desk scores bank matches automatically.',
          highlight: true
        }
      ],
      highlights: [
        {
          num: '01',
          icon: 'bi-receipt',
          title: 'Sổ theo dõi & Quản lý Hóa đơn',
          titleEn: 'Invoice Ledger & Collection Tracking',
          desc: 'Tra cứu 52+ hóa đơn theo trạng thái thực thu, lọc nhanh các khoản đáo hạn trong 7 ngày, xuất CSV chuẩn UTF-8 và ghi nhận thu tiền trực tiếp.',
          descEn: 'Track 52+ invoices by real-time collection status, filter invoices due within 7 days, export CSV, and record direct payments.',
          previewLabel: '52 Hóa đơn · Ký hiệu 1C26TAA · Lọc nhanh Quá hạn & Đến hạn 7 ngày',
          previewLabelEn: '52 Invoices · Symbol 1C26TAA · Quick Overdue & Due-in-7d Filters',
          href: 'accountant-invoice-list.html',
          cta: 'Vào Sổ Hóa đơn (Màn hình hiện tại)',
          ctaEn: 'Enter Invoice Ledger (Current Screen)'
        },
        {
          num: '02',
          icon: 'bi-file-earmark-plus',
          title: 'Phát hành Hóa đơn & Trợ lý AI-1',
          titleEn: 'Invoice Issuance & AI-1 Anomaly Check',
          desc: 'Tự động cấp số hóa đơn tiếp theo, tính thuế GTGT (0%/5%/8%/10%) và chạy AI-1 rà soát sai lệch hạn thanh toán hoặc vượt hạn mức tín dụng.',
          descEn: 'Auto-generate sequential invoice numbers, compute VAT (0%/5%/8%/10%), and audit due dates or credit limit breaches with AI-1.',
          previewLabel: 'Tích hợp AI-1 · Tự động áp dụng sửa lỗi ngày đáo hạn & VAT an toàn',
          previewLabelEn: 'Embedded AI-1 · Deterministic fixes for due dates & VAT rates',
          href: 'accountant-invoice-form.html',
          cta: 'Mở trang Lập hóa đơn mới',
          ctaEn: 'Open Invoice Creation Form'
        },
        {
          num: '03',
          icon: 'bi-arrow-left-right',
          title: 'Bàn Đối chiếu Sao kê Ngân hàng',
          titleEn: 'Automated Bank Feed Reconciliation',
          desc: 'Khớp giao dịch chuyển khoản chờ xử lý với hóa đơn mở theo quy tắc điểm khớp (100 điểm), xử lý chênh lệch và hỗ trợ hoàn tác đối chiếu.',
          descEn: 'Match incoming bank wire transfers to open invoices using deterministic scoring rules, resolve discrepancies, or undo matches.',
          previewLabel: '6 Giao dịch chờ đối chiếu · Hỗ trợ phân bổ một phần & hoàn tác',
          previewLabelEn: '6 Pending Bank Transfers · Partial allocation & undo support',
          href: 'accountant-reconciliation.html',
          cta: 'Mở Bàn đối chiếu thanh toán',
          ctaEn: 'Open Reconciliation Desk'
        }
      ],
      monthlyCycle: [
        { week: '01 · Đầu kỳ', weekEn: '01 · Week 1', title: 'Phát hành & Kiểm tra AI-1', titleEn: 'Issuance & AI-1 Audit', desc: 'Lập hóa đơn theo biên bản nghiệm thu, chạy AI-1 kiểm tra hạn mức và phát hành mã CQT.' },
        { week: '02 · Giữa kỳ', weekEn: '02 · Week 2', title: 'Đối chiếu Sao kê mỗi ngày', titleEn: 'Daily Bank Reconciliation', desc: 'Khớp lệnh ủy nhiệm chi Vietcombank vào hóa đơn mở, đánh dấu các khoản chênh lệch phí.' },
        { week: '03 · Đáo hạn', weekEn: '03 · Week 3', title: 'Rà soát Hóa đơn sắp đến hạn', titleEn: 'Due-Soon Review', desc: 'Lọc danh sách hóa đơn đến hạn trong 7 ngày để phối hợp Kinh doanh nhắc lịch thanh toán.' },
        { week: '04 · Cuối tháng', weekEn: '04 · Month-End', title: 'Chốt sổ & Xuất báo cáo CSV', titleEn: 'Ledger Close & CSV Export', desc: 'Hoàn tất đối chiếu các khoản treo, lưu trữ hóa đơn nháp hủy và xuất bảng kê CSV.' }
      ]
    },
    sales: {
      slashTag: '/Kinh doanh B2B · Quản trị Hạn mức & Đôn đốc Thu hồi Nợ',
      slashTagEn: '/B2B Sales · Credit Limit Control & Proactive Collection',
      badge: 'Phân hệ Kinh doanh B2B & Chăm sóc Công nợ',
      badgeEn: 'B2B Sales & Credit Collection Module',
      headlineHtml: 'Bán hàng B2B bền vững khi <em>công nợ được thu hồi đúng hạn</em> và giữ trọn uy tín đối tác.',
      headlineHtmlEn: 'B2B sales thrive when <em>receivables are collected on time</em> while preserving client trust.',
      subtitle: 'Kinh doanh không chỉ ký hợp đồng mà còn đồng hành thu hồi dòng tiền. Phân hệ Kinh doanh giúp bạn nắm chắc hạn mức tín dụng của 18 doanh nghiệp B2B, phân tích thanh tuổi nợ (Aging Bar) và dùng AI-2 soạn thư nhắc thanh toán tinh tế.',
      subtitleEn: 'Track real-time credit limits across 18 B2B clients, inspect aging bars, and draft polite B2B payment reminders with AI-2.',
      ticker: [
        'Giám sát hạn mức tín dụng 18 doanh nghiệp B2B',
        'Thanh phân bổ tuổi nợ (0–30, 31–60, 61–90, >90 ngày)',
        'Soạn thư nhắc thanh toán 3 giọng điệu bằng AI-2',
        'Ghi nhận cam kết trả nợ & gia hạn có lý do kiểm toán',
        'Xuất bản in hóa đơn chuẩn A4'
      ],
      tickerEn: [
        'Credit Limit Monitoring for 18 B2B Enterprises',
        'Visual Aging Bars (0–30, 31–60, 61–90, >90 days)',
        '3-Tone Polite Reminder Drafting with AI-2',
        'Audit-Logged Due Date Extensions & Internal Notes',
        'A4 Commercial Invoice Print Layout'
      ],
      matrixTitle: 'Nhắc nợ thủ công ngại ngùng hay quy trình chăm sóc công nợ chuyên nghiệp?',
      matrixTitleEn: 'Awkward manual follow-ups or professional B2B credit care?',
      matrix: [
        {
          step: '01 — Bị động',
          stepEn: '01 — Reactive',
          title: 'Không biết khách đã chạm trần hạn mức',
          titleEn: 'Blind to credit limit breaches',
          desc: 'Kinh doanh ký thêm đơn hàng mới trong khi khách đang nợ quá hạn trên 60 ngày chưa tất toán.',
          descEn: 'Signing new orders while the client already has invoices overdue beyond 60 days.'
        },
        {
          step: '02 — Ngại nhắc nợ',
          stepEn: '02 — Delayed Follow-up',
          title: 'Soạn email nhắc thanh toán tốn thời gian',
          titleEn: 'Time-consuming manual emails',
          desc: 'Dễ quên lịch hẹn hoặc dùng câu chữ thiếu nhất quán làm ảnh hưởng mối quan hệ đối tác B2B.',
          descEn: 'Missed follow-up schedules or inconsistent tone can strain long-term B2B relationships.'
        },
        {
          step: '03 — Minh bạch số dư',
          stepEn: '03 — Clear Balances',
          title: 'Hồ sơ Công nợ 360° theo từng khách hàng',
          titleEn: '360° Customer Receivable Drawer',
          desc: 'Mở ngăn kéo khách hàng thấy ngay tổng dư nợ, phần quá hạn, lịch sử trả tiền và danh sách hóa đơn mở.',
          descEn: 'Instant customer drawer showing total balance, overdue portion, payment history, and open invoices.',
          highlight: true
        },
        {
          step: '04 — Nhắc đúng lúc',
          stepEn: '04 — Timely Reminders',
          title: 'Trợ lý AI-2 soạn thảo chuẩn mực trong 2 giây',
          titleEn: 'AI-2 Polite Composer in 2 Seconds',
          desc: 'Tự động tổng hợp mã hóa đơn, số tiền còn thiếu và số tài khoản thụ hưởng theo 3 giọng điệu lịch sự.',
          descEn: 'Automatically compiles invoice codes, remaining amounts, and bank details in 3 polite tones.',
          highlight: true
        }
      ],
      highlights: [
        {
          num: '01',
          icon: 'bi-building-check',
          title: 'Sổ Công nợ & Hạn mức Khách hàng',
          titleEn: 'Customer Balances & Credit Limits',
          desc: 'Giám sát dư nợ trong hạn/quá hạn của 18 doanh nghiệp B2B, xem thanh tuổi nợ trực quan và mở ngăn kéo chi tiết khách hàng.',
          descEn: 'Monitor current and overdue balances across 18 B2B clients, inspect visual aging bars, and open the customer drawer.',
          previewLabel: '18 Doanh nghiệp B2B · Thanh tuổi nợ 4 cấp · Ngăn kéo chi tiết KH',
          previewLabelEn: '18 B2B Clients · 4-Tier Aging Bar · Customer Detail Drawer',
          href: 'sales-customer-balance.html',
          cta: 'Vào Sổ Công nợ khách hàng (Màn hình hiện tại)',
          ctaEn: 'Enter Customer Balances (Current Screen)'
        },
        {
          num: '02',
          icon: 'bi-envelope-paper',
          title: 'Trình soạn Nhắc thanh toán & AI-2',
          titleEn: 'Payment Reminder Composer & AI-2',
          desc: 'Quy trình 4 bước chọn khách hàng, hóa đơn nợ, kênh Email/SMS và dùng AI-2 soạn thông điệp theo 3 giọng điệu.',
          descEn: '4-step composer to select clients, unpaid invoices, Email/SMS channel, and generate AI-2 drafts.',
          previewLabel: 'Trợ lý AI-2 · 3 Giọng điệu (Thân thiện / Trang trọng / Cứng rắn lịch sự)',
          previewLabelEn: 'AI-2 Assistant · 3 Tones (Friendly / Formal / Firm & Polite)',
          href: 'sales-payment-reminders.html',
          cta: 'Mở Trình nhắc thanh toán',
          ctaEn: 'Open Reminder Composer'
        },
        {
          num: '03',
          icon: 'bi-file-text',
          title: 'Tra cứu Chi tiết & In Hóa đơn A4',
          titleEn: 'Invoice Detail Lookup & A4 Print',
          desc: 'Xem chi tiết từng dòng hàng hóa, lưu ghi chú nội bộ cam kết thanh toán, cập nhật hạn thanh toán kèm lý do và in bản A4.',
          descEn: 'Inspect line items, log internal payment commitments, extend due dates with mandatory reasons, and print A4 invoices.',
          previewLabel: 'In hóa đơn A4 · Gia hạn có kiểm soát · Ghi nhận thu tiền nhanh',
          previewLabelEn: 'A4 Print View · Audited Due Date Extension · Quick Payment Entry',
          href: 'sales-invoice-detail.html',
          cta: 'Mở Tra cứu chi tiết hóa đơn',
          ctaEn: 'Open Invoice Detail Lookup'
        }
      ],
      monthlyCycle: [
        { week: '01 · Tuần 1', weekEn: '01 · Week 1', title: 'Rà soát Hạn mức trước đơn mới', titleEn: 'Credit Limit Check', desc: 'Kiểm tra tỷ lệ dư nợ/hạn mức tín dụng của khách hàng trước khi duyệt đơn hàng trả chậm mới.' },
        { week: '02 · Tuần 2', weekEn: '02 · Week 2', title: 'Nhắc nhẹ Hóa đơn sắp đáo hạn', titleEn: 'Friendly Pre-Due Reminders', desc: 'Dùng AI-2 giọng điệu Thân thiện gửi thông báo nhắc trước 3–5 ngày cho các hóa đơn sắp đến hạn.' },
        { week: '03 · Tuần 3', weekEn: '03 · Week 3', title: 'Đôn đốc Khoản quá hạn 31–60 ngày', titleEn: 'Overdue Follow-up Calls', desc: 'Liên hệ trực tiếp người phụ trách kế toán của khách, ghi chú ngày hẹn trả vào chi tiết hóa đơn.' },
        { week: '04 · Cuối tháng', weekEn: '04 · Month-End', title: 'Phối hợp Kế toán khớp tiền về', titleEn: 'Collection Confirmation', desc: 'Cập nhật chứng từ khách đã chuyển để Kế toán xác nhận đối chiếu và giải phóng hạn mức.' }
      ]
    },
    manager: {
      slashTag: '/Quản lý & CFO · Giám sát Tuổi nợ, DSO & Dự báo Dòng tiền',
      slashTagEn: '/CFO & Executive · Aging Analytics, DSO & Cashflow Forecast',
      badge: 'Phân hệ Giám đốc Tài chính & Quản lý Điều hành (CFO / Manager)',
      badgeEn: 'CFO & Executive Receivables Management Module',
      headlineHtml: 'Quản trị công nợ bằng <em>dữ liệu định lượng</em> — nhìn rõ rủi ro, chủ động dòng tiền 90 ngày.',
      headlineHtmlEn: 'Govern receivables with <em>quantitative clarity</em> — spot risks early, steer 90-day cashflow.',
      subtitle: 'Người quản lý cần hơn một danh sách hóa đơn: bạn cần biết dòng tiền đang kẹt ở nhóm tuổi nợ nào, khách hàng nào tập trung rủi ro cao nhất và kịch bản dòng tiền 30/60/90 ngày tới sẽ biến động ra sao với trợ lý AI-3.',
      subtitleEn: 'Executives need more than invoice lists: see where cash is trapped across aging buckets, score overdue risks transparently, and simulate 30/60/90-day cashflow scenarios with AI-3.',
      ticker: [
        'Chỉ số DSO (Days Sales Outstanding) theo kỳ',
        '3 Biểu đồ trực quan: Aging, Dòng tiền 90 ngày & Top 5 KH',
        'Chấm điểm rủi ro quá hạn theo công thức luật tường minh',
        'Phân công chuyên viên Kinh doanh xử lý nợ quá hạn',
        'Mô hình dự báo 3 kịch bản (Cơ sở / Thận trọng / Lạc quan) + AI-3'
      ],
      tickerEn: [
        'Period DSO (Days Sales Outstanding) Tracking',
        '3 Interactive Charts: Aging, 90-Day Cashflow & Top 5 Clients',
        'Transparent Rule-Based Overdue Risk Scoring',
        'Direct Sales Owner Assignment for Overdue Accounts',
        '3-Scenario Cashflow Forecasting + AI-3 Executive Briefings'
      ],
      matrixTitle: 'Đợi báo cáo cuối quý hay điều hành dòng tiền theo thời gian thực?',
      matrixTitleEn: 'Wait for quarter-end reports or steer cashflow in real time?',
      matrix: [
        {
          step: '01 — Mù mờ dòng tiền',
          stepEn: '01 — Cash Blindness',
          title: 'Chỉ biết doanh thu trên giấy, thiếu tiền mặt',
          titleEn: 'Paper revenue without cash visibility',
          desc: 'Doanh số ký hợp đồng cao nhưng tiền nằm kẹt ở các khoản phải thu quá hạn trên 60–90 ngày.',
          descEn: 'High booked revenue while working capital stays trapped in 60–90+ day overdue receivables.'
        },
        {
          step: '02 — Thiếu ưu tiên',
          stepEn: '02 — Unprioritized',
          title: 'Đôn đốc dàn trải, bỏ sót rủi ro lớn',
          titleEn: 'Scattered collection efforts',
          desc: 'Không có thang điểm định lượng để phân biệt khoản trễ hạn thông thường với khách hàng có nguy cơ nợ xấu cao.',
          descEn: 'No quantitative risk score to separate minor delays from high-exposure credit risks.'
        },
        {
          step: '03 — Bảng điều khiển CFO',
          stepEn: '03 — CFO Command',
          title: 'Đo lường DSO, Tuổi nợ & Độ tập trung',
          titleEn: 'Live DSO, Aging & Concentration Metrics',
          desc: 'Biểu đồ hóa toàn bộ cấu trúc phải thu và tự động phát hiện tỷ lệ tập trung công nợ ở nhóm khách hàng đầu bảng.',
          descEn: 'Visualizes aging buckets and highlights receivable concentration across top accounts.',
          highlight: true
        },
        {
          step: '04 — Dự báo chủ động',
          stepEn: '04 — Proactive Forecast',
          title: 'Mô phỏng 3 kịch bản & Lưu báo cáo AI-3',
          titleEn: '3-Scenario Simulation & AI-3 Snapshots',
          desc: 'Thay đổi tỷ lệ thu hồi quá hạn và độ trễ thanh toán để kiểm tra sức chịu đựng dòng tiền trong 30–90 ngày.',
          descEn: 'Adjust recovery rates and payment delays to stress-test 30–90 day cashflow resilience.',
          highlight: true
        }
      ],
      highlights: [
        {
          num: '01',
          icon: 'bi-bar-chart-line',
          title: 'Bảng điều khiển Tổng quan & AI-3',
          titleEn: 'Executive Receivables Dashboard & AI-3',
          desc: 'Theo dõi 4 KPI cốt lõi, chỉ số DSO, 3 biểu đồ phân tích trực quan và tạo bản chụp báo cáo điều hành bằng AI-3.',
          descEn: 'Monitor 4 core KPIs, DSO metrics, 3 interactive charts, and save AI-3 executive cashflow snapshots.',
          previewLabel: '3 Biểu đồ Chart.js · Chỉ số DSO · Lưu trữ báo cáo AI-3',
          previewLabelEn: '3 Chart.js Visuals · DSO Formula Tooltip · Saved AI-3 Reports',
          href: 'manager-receivable-dashboard.html',
          cta: 'Vào Bảng điều khiển Tổng quan (Màn hình hiện tại)',
          ctaEn: 'Enter Executive Dashboard (Current Screen)'
        },
        {
          num: '02',
          icon: 'bi-exclamation-octagon',
          title: 'Điều phối Xử lý Hóa đơn Quá hạn',
          titleEn: 'Overdue Invoices & Risk Assignment',
          desc: 'Chấm điểm rủi ro (Cao/Trung bình/Thấp) theo công thức luật, giao phụ trách cho nhân sự Kinh doanh và đóng/mở theo dõi.',
          descEn: 'Score overdue risk via explicit formulas, assign Sales owners, log handling notes, and close/reopen follow-ups.',
          previewLabel: 'Chấm điểm rủi ro luật (0–100) · Giao việc hàng loạt cho Kinh doanh',
          previewLabelEn: 'Rule-based Risk Scoring (0–100) · Bulk Sales Owner Assignment',
          href: 'manager-overdue-invoices.html',
          cta: 'Mở Quản lý hóa đơn quá hạn',
          ctaEn: 'Open Overdue Invoices'
        },
        {
          num: '03',
          icon: 'bi-graph-up-arrow',
          title: 'Dự báo Dòng tiền 3 Kịch bản',
          titleEn: '3-Scenario Cashflow Forecast',
          desc: 'Điều chỉnh tỷ lệ thu hồi nợ quá hạn (%) và độ trễ thanh toán (ngày) trên 3 kịch bản Cơ sở, Thận trọng, Lạc quan.',
          descEn: 'Tune overdue recovery rate (%) and payment delay (days) across Baseline, Conservative, and Optimistic scenarios.',
          previewLabel: 'Kỳ hạn 30/60/90 ngày · Cảnh báo tuần thiếu hụt tiền mặt (< 45 tr ₫)',
          previewLabelEn: '30/60/90-Day Horizons · Low-cash period warnings',
          href: 'manager-cashflow-forecast.html',
          cta: 'Mở Dự báo dòng tiền',
          ctaEn: 'Open Cashflow Forecast'
        }
      ],
      monthlyCycle: [
        { week: '01 · Đầu tháng', weekEn: '01 · Week 1', title: 'Đánh giá DSO & Tuổi nợ toàn công ty', titleEn: 'DSO & Aging Review', desc: 'Xem Dashboard tổng quan 90 ngày, chạy AI-3 để nhận diện độ tập trung công nợ ở nhóm khách hàng lớn.' },
        { week: '02 · Tuần 2', weekEn: '02 · Week 2', title: 'Phân công xử lý nhóm Rủi ro Cao', titleEn: 'High-Risk Assignment', desc: 'Lọc các hóa đơn quá hạn có điểm rủi ro >= 60, giao chỉ đạo cụ thể cho từng chuyên viên Kinh doanh.' },
        { week: '03 · Tuần 3', weekEn: '03 · Week 3', title: 'Kiểm tra Kịch bản Dòng tiền Thận trọng', titleEn: 'Stress-Test Cashflow', desc: 'Mở trang Dự báo dòng tiền ở kịch bản Thận trọng (thu hồi 45%) để chủ động kế hoạch chi trả.' },
        { week: '04 · Cuối tháng', weekEn: '04 · Month-End', title: 'Lưu Báo cáo AI-3 & Họp điều hành', titleEn: 'Save AI-3 Snapshot', desc: 'Lưu bản chụp báo cáo dòng tiền kèm giả định và xuất CSV phục vụ họp giao ban tài chính.' }
      ]
    },
    admin: {
      slashTag: '/Quản trị Hệ thống · Phân quyền Tài khoản & Cấu hình Chuẩn Thuế',
      slashTagEn: '/System Admin · Exclusive Account Control & E-Invoice Settings',
      badge: 'Phân hệ Quản trị Hệ thống & Kiểm soát Nội bộ (System Admin)',
      badgeEn: 'System Administration & Internal Control Module',
      headlineHtml: 'Nền móng phân quyền chặt chẽ — <em>bảo vệ dữ liệu công nợ</em> và vận hành chuẩn mực.',
      headlineHtmlEn: 'Strict access governance — <em>protecting receivable data</em> and standardizing operations.',
      subtitle: 'Tài khoản Quản trị viên (Admin) nắm giữ nền móng vận hành của InvoicePilot: đặc quyền duy nhất được phép tạo mới, chỉnh sửa vai trò, khóa hoặc xóa tài khoản của các nghiệp vụ khác; đồng thời quản lý danh mục khách hàng B2B và cấu hình hóa đơn điện tử.',
      subtitleEn: 'The System Administrator holds exclusive authority to create, edit roles, suspend, or delete user accounts across all business units, manage B2B master data, and configure e-invoice rules.',
      ticker: [
        'Đặc quyền duy nhất tạo, sửa, khóa & xóa tài khoản các nghiệp vụ',
        'Bảo vệ Quản trị viên hoạt động cuối cùng & Chống tự khóa tài khoản',
        'Quản lý 18 hồ sơ doanh nghiệp B2B & Chặn lưu trữ khi còn dư nợ',
        'Cấu hình tiền tố đánh số hóa đơn tự động & Thuế suất GTGT mặc định',
        'Quản lý mẫu nhắc thanh toán & Công tắc bật/tắt 3 mô-đun AI'
      ],
      tickerEn: [
        'Exclusive CRUD & Suspension Authority over All Role Accounts',
        'Last-Active-Admin Protection & Self-Lock Prevention',
        '18 B2B Customer Master Profiles with Zero-Balance Archive Guard',
        'Automated Invoice Numbering Prefix & Default VAT Configuration',
        'Reminder Template Management & AI-1/2/3 Master Switches'
      ],
      matrixTitle: 'Cấp quyền tự do thiếu kiểm soát hay quản trị nội bộ chuẩn doanh nghiệp?',
      matrixTitleEn: 'Uncontrolled access or enterprise-grade internal governance?',
      matrix: [
        {
          step: '01 — Rủi ro phân quyền',
          stepEn: '01 — Access Risk',
          title: 'Ai cũng sửa được cấu hình và tài khoản',
          titleEn: 'Unrestricted account edits',
          desc: 'Thiếu tách biệt nhiệm vụ khiến nhân sự nghiệp vụ có thể tự ý thay đổi hạn mức hoặc xóa dữ liệu.',
          descEn: 'Lack of segregation of duties allows unauthorized changes to credit limits or user roles.'
        },
        {
          step: '02 — Dữ liệu thiếu chuẩn',
          stepEn: '02 — Unstandardized',
          title: 'Mã khách hàng và số hóa đơn lộn xộn',
          titleEn: 'Inconsistent codes & templates',
          desc: 'Mỗi người đặt mã hóa đơn một kiểu, xóa nhầm khách hàng đang còn công nợ chưa thu.',
          descEn: 'Inconsistent invoice prefixes or accidental archiving of clients who still owe money.'
        },
        {
          step: '03 — Đặc quyền Admin',
          stepEn: '03 — Admin Exclusive',
          title: 'Kiểm soát tập trung 100% tài khoản nghiệp vụ',
          titleEn: '100% Centralized Account Governance',
          desc: 'Chỉ Admin mới được cấp phát, đổi vai trò, đặt lại mật khẩu tạm hoặc thu hồi quyền truy cập.',
          descEn: 'Only Admin can issue accounts, change roles, generate one-time passwords, or revoke access.',
          highlight: true
        },
        {
          step: '04 — Chốt chặn an toàn',
          stepEn: '04 — Safety Guardrails',
          title: 'Luật bảo vệ dữ liệu & Công tắc AI linh hoạt',
          titleEn: 'Data Integrity Guards & AI Switches',
          desc: 'Tự động chặn lưu trữ khách còn dư nợ, chặn xóa mẫu nhắc mặc định và bật/tắt AI tức thời.',
          descEn: 'Blocks archiving clients with open balances, protects default templates, and toggles AI engines live.',
          highlight: true
        }
      ],
      highlights: [
        {
          num: '01',
          icon: 'bi-buildings',
          title: 'Quản lý Danh mục Khách hàng B2B',
          titleEn: 'B2B Customer Master Management',
          desc: 'Quản lý mã số thuế, người liên hệ, kỳ hạn thanh toán chuẩn (0–90 ngày), hạn mức tín dụng và kiểm soát điều kiện lưu trữ.',
          descEn: 'Manage tax codes, contacts, standard payment terms (0–90 days), credit limits, and zero-balance archiving rules.',
          previewLabel: '18 Khách hàng · Chặn lưu trữ khi còn dư nợ > 0 ₫',
          previewLabelEn: '18 B2B Customers · Blocks archiving when balance > 0',
          href: 'admin-customer-management.html',
          cta: 'Vào Quản lý Khách hàng (Màn hình hiện tại)',
          ctaEn: 'Enter Customer Management (Current Screen)'
        },
        {
          num: '02',
          icon: 'bi-people',
          title: 'Quản trị & Phân quyền Người dùng (Đặc quyền Admin)',
          titleEn: 'User & Role Administration (Admin Exclusive)',
          desc: 'Tạo tài khoản mới cho Kế toán/Kinh doanh/Quản lý, chỉnh sửa vai trò, cấp mật khẩu tạm thời, khóa/mở khóa hoặc xóa tài khoản.',
          descEn: 'Create accounts for Accountant/Sales/Manager, edit roles, reset passwords, suspend/unsuspend, or delete accounts.',
          previewLabel: 'Toàn quyền CRUD tài khoản · Bảo vệ Admin hoạt động cuối cùng',
          previewLabelEn: 'Full User CRUD · Protects last active Administrator',
          href: 'admin-user-management.html',
          cta: 'Mở Quản lý Người dùng',
          ctaEn: 'Open User Management'
        },
        {
          num: '03',
          icon: 'bi-sliders',
          title: 'Cấu hình Hóa đơn, Mẫu nhắc & Công tắc AI',
          titleEn: 'Invoice Settings, Templates & AI Switches',
          desc: 'Thiết lập pháp nhân, tiền tố đánh số hóa đơn mới, quản lý mẫu Email/SMS nhắc nợ và bật/tắt AI-1, AI-2, AI-3.',
          descEn: 'Configure company legal info, invoice numbering prefixes, reminder templates, and AI-1/2/3 master switches.',
          previewLabel: '4 Tab cấu hình · Áp dụng ngay cho hóa đơn mới · Xuất/Khôi phục JSON',
          previewLabelEn: '4 Settings Tabs · Applies to new invoices · JSON Export/Restore',
          href: 'admin-invoice-settings.html',
          cta: 'Mở Cấu hình Hóa đơn & AI',
          ctaEn: 'Open Invoice & AI Settings'
        }
      ],
      monthlyCycle: [
        { week: '01 · Đầu kỳ', weekEn: '01 · Week 1', title: 'Chuẩn hóa Danh mục Khách hàng & Hạn mức', titleEn: 'Customer & Credit Setup', desc: 'Cập nhật hồ sơ khách hàng B2B mới, kiểm tra mã số thuế và phân công chuyên viên Kinh doanh phụ trách.' },
        { week: '02 · Giữa kỳ', weekEn: '02 · Week 2', title: 'Rà soát Phân quyền & Tài khoản Nhân sự', titleEn: 'User Access Audit', desc: 'Cấp tài khoản cho nhân sự mới, tạm khóa hoặc thu hồi tài khoản của nhân sự chuyển bộ phận.' },
        { week: '03 · Định kỳ', weekEn: '03 · Week 3', title: 'Tinh chỉnh Mẫu nhắc & Ngưỡng AI', titleEn: 'Templates & AI Tuning', desc: 'Cập nhật mẫu thông báo nhắc thanh toán và điều chỉnh ngưỡng cảnh báo hóa đơn bất thường (250%).' },
        { week: '04 · Cuối tháng', weekEn: '04 · Month-End', title: 'Sao lưu JSON & Lưu trữ Khách hàng tất toán', titleEn: 'JSON Backup & Archiving', desc: 'Xuất tệp sao lưu JSON toàn hệ thống và lưu trữ các khách hàng ngừng hợp tác đã tất toán hết dư nợ.' }
      ]
    }
  };

  function buildNotificationDropdown(role) {
    const isEn = IP.I18n && IP.I18n.getLang() === 'en';
    const unread = IP.DB.listNotifications({ role: role, unreadOnly: true });
    const recent = IP.DB.listNotifications({ role: role }).slice(0, 5);
    const countBadge = unread.length > 0
      ? '<span class="ip-notif-dot" id="ip-topbar-notif-count">' + unread.length + '</span>'
      : '<span class="ip-notif-dot d-none" id="ip-topbar-notif-count">0</span>';

    const itemsHtml = recent.length
      ? recent.map(function (n) {
          const href = n.link || IP.Routes.url(n.targetRouteKey || 'notifications', n.targetParams || {}, role);
          return (
            '<li>' +
              '<a class="dropdown-item py-2 border-bottom text-wrap ' + (!n.read ? 'fw-semibold' : '') + '" href="' + IP.Utils.escapeHtml(href) + '" data-notif-id="' + n.id + '">' +
                '<div class="d-flex justify-content-between align-items-center mb-1">' +
                  '<span class="small">' + IP.Utils.escapeHtml(n.title) + '</span>' +
                  (!n.read ? '<span class="badge bg-primary rounded-pill" style="font-size:0.65rem">' + (isEn ? 'New' : 'Mới') + '</span>' : '') +
                '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(n.message) + '</div>' +
                '<div class="small text-muted mt-1" style="font-size:0.72rem">' + IP.Fmt.relative(n.createdAt) + '</div>' +
              '</a>' +
            '</li>'
          );
        }).join('')
      : '<li class="px-3 py-3 text-center text-muted small">' + (isEn ? 'No new notifications.' : 'Không có thông báo mới.') + '</li>';

    return (
      '<div class="dropdown">' +
        '<button type="button" class="ip-icon-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-label="' + (isEn ? 'System Notifications' : 'Thông báo hệ thống') + '">' +
          '<i class="bi bi-bell"></i>' + countBadge +
        '</button>' +
        '<ul class="dropdown-menu dropdown-menu-end shadow border p-0" style="width: 340px; max-width: 92vw;">' +
          '<li class="px-3 py-2 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">' +
            '<span class="fw-bold small">' + (isEn ? ('Notifications (' + unread.length + ' unread)') : ('Thông báo (' + unread.length + ' chưa đọc)')) + '</span>' +
            '<a href="notifications.html" class="small text-decoration-none fw-semibold">' + (isEn ? 'View All' : 'Xem tất cả') + '</a>' +
          '</li>' +
          itemsHtml +
        '</ul>' +
      '</div>'
    );
  }

  let _roleScrollHandler = null;
  let _roleGateTimer = null;

  function cleanupRoleLandingListeners() {
    if (_roleScrollHandler) {
      window.removeEventListener('scroll', _roleScrollHandler);
      _roleScrollHandler = null;
    }
    if (_roleGateTimer) {
      clearInterval(_roleGateTimer);
      _roleGateTimer = null;
    }
  }

  function computeRoleLiveSnapshot(role) {
    const st = IP.DB.getState();
    const openInvs = st.invoices.filter(function (i) { return !i.voided && !i.archived && i.sentAt && IP.Calc.remaining(i) > 0; });
    const totalAR = openInvs.reduce(function (s, i) { return s + IP.Calc.remaining(i); }, 0);
    const overdueInvs = openInvs.filter(function (i) { return IP.Calc.overdueDays(i) > 0; });
    const overdueAR = overdueInvs.reduce(function (s, i) { return s + IP.Calc.remaining(i); }, 0);
    const pendingBank = st.payments.filter(function (p) { return p.status === 'pending' && !p.discrepancy; }).length;
    const activeCustomers = st.customers.filter(function (c) { return c.status === 'active'; }).length;
    const activeUsers = st.users.filter(function (u) { return u.status === 'active'; }).length;

    if (role === 'accountant') {
      return [
        { label: 'Tổng phải thu đang mở', labelEn: 'Open Receivables', val: IP.Fmt.currency(totalAR, true), sub: openInvs.length + ' hóa đơn 1C26TAA' },
        { label: 'Sao kê chờ đối chiếu', labelEn: 'Pending Bank Feeds', val: pendingBank + ' giao dịch', sub: 'Vietcombank tự động' },
        { label: 'Kiểm soát trước phát hành', labelEn: 'Pre-Issue Audit', val: 'AI-1 Bật', sub: 'Ngưỡng cảnh báo 250%' }
      ];
    }
    if (role === 'sales') {
      return [
        { label: 'Khách hàng B2B hoạt động', labelEn: 'Active B2B Clients', val: activeCustomers + ' doanh nghiệp', sub: 'Quản lý hạn mức & kỳ hạn' },
        { label: 'Dư nợ quá hạn cần nhắc', labelEn: 'Overdue to Follow Up', val: IP.Fmt.currency(overdueAR, true), sub: overdueInvs.length + ' hóa đơn quá hạn' },
        { label: 'Trình soạn nhắc thanh toán', labelEn: 'Reminder Composer', val: 'AI-2 Bật', sub: 'Email & SMS 3 giọng điệu' }
      ];
    }
    if (role === 'manager') {
      const dsoObj = IP.Calc.dso(90);
      return [
        { label: 'Tổng công nợ phải thu', labelEn: 'Total AR Exposure', val: IP.Fmt.currency(totalAR, true), sub: 'Quá hạn: ' + IP.Fmt.currency(overdueAR, true) },
        { label: 'Kỳ thu tiền bình quân (DSO)', labelEn: 'Average DSO (90d)', val: dsoObj.days + ' ngày', sub: 'Giảm ' + Math.abs(dsoObj.delta) + ' ngày so với kỳ trước' },
        { label: 'Dự báo dòng tiền 3 kịch bản', labelEn: '3-Scenario Forecast', val: 'AI-3 Bật', sub: 'Cơ sở · Thận trọng · Lạc quan' }
      ];
    }
    return [
      { label: 'Tài khoản nhân sự hoạt động', labelEn: 'Active Staff Accounts', val: activeUsers + ' / ' + st.users.length, sub: '4 vai trò phân quyền' },
      { label: 'Hồ sơ doanh nghiệp B2B', labelEn: 'B2B Client Profiles', val: st.customers.length + ' đối tác', sub: 'Chặn lưu trữ khi còn nợ' },
      { label: 'Quy chuẩn đánh số & AI', labelEn: 'Numbering & AI Switches', val: '1C26TAA', sub: '3 công tắc AI đang bật' }
    ];
  }

  /**
   * Mounts the Ximitech.vn-inspired Scroll-Driven Role Landing Page at the opening of the role's first page.
   * When the user scrolls down through the chapters and reaches the end gate (or clicks Skip / Don't Show Again),
   * it transitions smoothly into the role's live operational task workspace (#ip-role-workspace-anchor).
   */
  function mountRoleLandingBanner(role, userName, forceShow) {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    cleanupRoleLandingListeners();

    const existing = document.getElementById('ip-role-landing-section');
    if (existing) existing.remove();

    const currentPageId = document.body.getAttribute('data-page') || '';
    const defaultPageId = ROLE_DEFAULT_PAGES[role] || 'accountant-invoice-list';

    // Only mount on the first (default) page of that role, unless explicitly opened via topbar button
    if (!forceShow && currentPageId !== defaultPageId) {
      return;
    }

    if (!forceShow && IP.Auth.isRoleLandingDismissed(role)) {
      return;
    }

    const isEn = IP.I18n && IP.I18n.getLang() === 'en';
    const info = ROLE_LANDING_CONTENT[role] || ROLE_LANDING_CONTENT.accountant;
    const hiddenForever = IP.Auth.isRoleLandingHiddenForever(role);
    const liveMetrics = computeRoleLiveSnapshot(role);
    const roleLabel = IP.Fmt.roleLabel(role);

    // Ensure a workspace anchor banner exists right above the page's task content
    let wsAnchor = document.getElementById('ip-role-workspace-anchor');
    if (!wsAnchor) {
      wsAnchor = document.createElement('div');
      wsAnchor.id = 'ip-role-workspace-anchor';
      wsAnchor.className = 'ximi-workspace-anchor-banner ip-no-print';
      wsAnchor.innerHTML =
        '<div class="d-flex align-items-center gap-2">' +
          '<span class="badge bg-primary"><i class="bi bi-window-stack me-1"></i>' + (isEn ? 'Task Workspace' : 'Trang tác vụ nghiệp vụ') + '</span>' +
          '<span class="small fw-semibold">' +
            (isEn
              ? ('Live Operational Workspace · ' + IP.Utils.escapeHtml(roleLabel))
              : ('Bàn làm việc tác vụ trực tiếp · Nghiệp vụ ' + IP.Utils.escapeHtml(roleLabel))) +
          '</span>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-2">' +
          '<button type="button" class="btn btn-sm btn-link p-0 text-decoration-none small" data-shell-action="show-role-landing">' +
            '<i class="bi bi-arrow-up-circle"></i> ' + (isEn ? 'Reopen Role Landing Intro' : 'Mở lại phần giới thiệu nghiệp vụ ở đầu trang') +
          '</button>' +
        '</div>';
      mainEl.insertBefore(wsAnchor, mainEl.firstChild);
    }

    const section = document.createElement('section');
    section.id = 'ip-role-landing-section';
    section.className = 'ximi-role-landing ip-no-print';
    section.setAttribute('aria-label', (isEn ? 'Role Opening Landing Page: ' : 'Landing Page mở đầu nghiệp vụ ') + roleLabel);

    const tickerList = isEn ? info.tickerEn : info.ticker;
    const chaptersMeta = [
      { id: 'ximi-ch-01', num: '01', label: isEn ? 'Overview' : 'Tổng quan' },
      { id: 'ximi-ch-02', num: '02', label: isEn ? 'Problem & Asset' : 'Thách thức & Giải pháp' },
      { id: 'ximi-ch-03', num: '03', label: isEn ? '3 Core Workflows' : '3 Màn hình & AI' },
      { id: 'ximi-ch-04', num: '04', label: isEn ? 'Monthly Rhythm' : 'Nhịp vận hành' },
      { id: 'ximi-ch-05', num: '05', label: isEn ? 'Enter Workspace' : 'Vào trang tác vụ' }
    ];

    section.innerHTML =
      /* Sticky Top Navigation & Skip / Don't Show Again Bar */
      '<div class="ximi-sticky-bar">' +
        '<div class="d-flex align-items-center gap-2 flex-wrap">' +
          '<span class="badge bg-warning text-dark fw-bold"><i class="bi bi-compass-fill me-1"></i>' + (isEn ? ('Role Intro · ' + IP.Utils.escapeHtml(roleLabel)) : ('Mở đầu nghiệp vụ · ' + IP.Utils.escapeHtml(roleLabel))) + '</span>' +
          '<div class="ximi-chapter-nav d-none d-xl-flex" role="navigation" aria-label="Chapters">' +
            chaptersMeta.map(function (c, i) {
              return (
                '<button type="button" class="ximi-chapter-pill ' + (i === 0 ? 'active' : '') + '" data-ximi-jump="' + c.id + '">' +
                  '<span>' + c.num + '</span><span>' + IP.Utils.escapeHtml(c.label) + '</span>' +
                '</button>'
              );
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-2 flex-wrap">' +
          '<div class="form-check form-switch mb-0 me-1 text-white-50 small d-flex align-items-center gap-1">' +
            '<input class="form-check-input mt-0" type="checkbox" id="ip-never-show-role-landing-chk" ' + (hiddenForever ? 'checked' : '') + '>' +
            '<label class="form-check-label small text-light" for="ip-never-show-role-landing-chk" style="cursor:pointer;">' +
              (isEn ? 'Do not show again on future visits' : 'Không hiển thị lại khi vào lần mới') +
            '</label>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-outline-light py-1 px-2" id="ip-never-show-role-landing-btn" title="' + (isEn ? 'Hide this role intro on future visits and jump to workspace' : 'Ẩn phần giới thiệu này ở các lần vào sau và nhảy thẳng vào trang tác vụ') + '">' +
            '<i class="bi bi-eye-slash"></i> ' + (isEn ? 'Don\'t Show Again' : 'Không hiển thị lại') +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-warning fw-bold text-dark py-1 px-3 shadow-sm" id="ip-skip-role-landing-btn">' +
            '<i class="bi bi-chevron-double-down"></i> ' + (isEn ? 'Skip — Jump to Workspace' : 'Bỏ qua — Nhảy vào trang tác vụ') +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="ximi-scroll-progress"><div class="ximi-scroll-progress-fill" id="ximi-scroll-progress-bar"></div></div>' +

      /* Chapter 01: Hero Section */
      '<div class="ximi-hero" id="ximi-ch-01" data-ximi-chapter="0">' +
        '<div class="row g-4 align-items-center">' +
          '<div class="col-lg-7">' +
            '<div class="ximi-slash-tag">' + IP.Utils.escapeHtml(isEn ? info.slashTagEn : info.slashTag) + '</div>' +
            '<h2 class="ximi-hero-headline">' + (isEn ? info.headlineHtmlEn : info.headlineHtml) + '</h2>' +
            '<p class="text-white-50 mb-4" style="font-size:0.96rem;max-width:660px;">' +
              (isEn ? ('Welcome <strong>' + IP.Utils.escapeHtml(userName) + '</strong>. ') : ('Xin chào <strong>' + IP.Utils.escapeHtml(userName) + '</strong>. ')) +
              IP.Utils.escapeHtml(isEn ? info.subtitleEn : info.subtitle) +
            '</p>' +
            '<div class="d-flex flex-wrap gap-2 mb-3">' +
              '<button type="button" class="btn btn-warning fw-bold text-dark px-3 py-2" data-ximi-jump="ximi-ch-02">' +
                '<i class="bi bi-mouse"></i> ' + (isEn ? 'Scroll Down to Explore Role (01 → 05)' : 'Vuốt / Cuộn xuống để xem giới thiệu nghiệp vụ (01 → 05)') +
              '</button>' +
              '<button type="button" class="btn btn-outline-light px-3 py-2" data-ximi-action="enter-workspace-now">' +
                '<i class="bi bi-lightning-charge"></i> ' + (isEn ? 'Jump Straight to Task Workspace' : 'Vào thẳng trang tác vụ ngay') +
              '</button>' +
            '</div>' +
            '<div class="small text-white-50 d-flex align-items-center gap-2">' +
              '<i class="bi bi-arrow-down-circle text-warning"></i>' +
              '<span>' + (isEn ? 'Scroll down through the briefing — reaching the end automatically jumps into your live task workspace.' : 'Khi vuốt xuống hết phần giới thiệu này, trang sẽ tự động chuyển mượt mà vào bàn làm việc tác vụ của bạn.') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="col-lg-5">' +
            '<div class="p-3 p-md-4 rounded-4 border border-light border-opacity-10" style="background:rgba(255,255,255,0.05);">' +
              '<div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-light border-opacity-10">' +
                '<span class="small fw-bold text-warning"><i class="bi bi-activity me-1"></i>' + (isEn ? 'Live Role Indicators' : 'Chỉ số trực tiếp của nghiệp vụ') + '</span>' +
                '<span class="badge bg-success-subtle text-success-emphasis">' + (isEn ? 'Synced with Local DB' : 'Đồng bộ thời gian thực') + '</span>' +
              '</div>' +
              liveMetrics.map(function (m) {
                return (
                  '<div class="ximi-live-feed-pill d-flex justify-content-between align-items-center">' +
                    '<div>' +
                      '<div class="fw-semibold text-white">' + IP.Utils.escapeHtml(isEn ? m.labelEn : m.label) + '</div>' +
                      '<div class="small text-white-50" style="font-size:0.74rem;">' + IP.Utils.escapeHtml(m.sub) + '</div>' +
                    '</div>' +
                    '<div class="fw-bold fs-6 text-warning ip-num">' + IP.Utils.escapeHtml(m.val) + '</div>' +
                  '</div>'
                );
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Ximitech-style Marquee Ticker Ribbon */
      '<div class="ximi-ticker" aria-label="Role capabilities">' +
        tickerList.map(function (item) {
          return '<span class="ximi-ticker-item"><span class="ximi-ticker-dot"></span>' + IP.Utils.escapeHtml(item) + '</span>';
        }).join('') +
      '</div>' +

      /* Chapter 02: 4-Stage Problem vs. Standardized Asset Matrix (Ximitech 01-04 pattern) */
      '<div class="ximi-chapter" id="ximi-ch-02" data-ximi-chapter="1">' +
        '<div class="ximi-chapter-head">' +
          '<div>' +
            '<span class="ximi-chapter-num">02 / ' + (isEn ? 'CHALLENGE VS. STANDARDIZED ASSET' : 'THÁCH THỨC & GIÁ TRỊ CHUẨN HÓA') + '</span>' +
            '<h3 class="fs-4 fw-bold mb-1">' + IP.Utils.escapeHtml(isEn ? info.matrixTitleEn : info.matrixTitle) + '</h3>' +
            '<p class="small text-muted mb-0">' + (isEn ? 'Why structured workflow discipline turns receivables into reliable cashflow.' : 'Sự khác biệt giữa cách quản lý rời rạc truyền thống và quy trình chuẩn hóa theo vai trò trên InvoicePilot.') + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-outline-secondary" data-ximi-jump="ximi-ch-03">' +
            (isEn ? 'Next: 3 Core Screens' : 'Tiếp theo: 3 Màn hình tác vụ') + ' <i class="bi bi-arrow-down"></i>' +
          '</button>' +
        '</div>' +
        '<div class="ximi-matrix-grid">' +
          info.matrix.map(function (card) {
            return (
              '<div class="ximi-matrix-card ' + (card.highlight ? 'is-highlight' : '') + '">' +
                '<span class="ximi-matrix-step">' + IP.Utils.escapeHtml(isEn ? card.stepEn : card.step) + '</span>' +
                '<h4 class="fs-6 fw-bold mb-2">' + IP.Utils.escapeHtml(isEn ? card.titleEn : card.title) + '</h4>' +
                '<p class="small text-muted mb-0">' + IP.Utils.escapeHtml(isEn ? card.descEn : card.desc) + '</p>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</div>' +

      /* Chapter 03: 3 Core Role Screens & AI Capabilities */
      '<div class="ximi-chapter" id="ximi-ch-03" data-ximi-chapter="2">' +
        '<div class="ximi-chapter-head">' +
          '<div>' +
            '<span class="ximi-chapter-num">03 / ' + (isEn ? '3 CORE WORKFLOW SCREENS & AI ASSISTANT' : 'BA PHÂN HỆ TÁC VỤ CỐT LÕI & TRỢ LÝ AI') + '</span>' +
            '<h3 class="fs-4 fw-bold mb-1">' + (isEn ? ('Three Dedicated Screens for ' + IP.Utils.escapeHtml(roleLabel)) : ('Ba màn hình làm việc chuyên biệt của ' + IP.Utils.escapeHtml(roleLabel))) + '</h3>' +
            '<p class="small text-muted mb-0">' + (isEn ? 'Click any screen below to open it directly, or keep scrolling to enter the current workspace.' : 'Bạn có thể bấm chọn mở bất kỳ màn hình nào bên dưới hoặc tiếp tục vuốt xuống để vào bàn làm việc hiện tại.') + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-outline-secondary" data-ximi-jump="ximi-ch-04">' +
            (isEn ? 'Next: Monthly Rhythm' : 'Tiếp theo: Nhịp vận hành tháng') + ' <i class="bi bi-arrow-down"></i>' +
          '</button>' +
        '</div>' +
        '<div class="row g-3 align-items-stretch">' +
          info.highlights.map(function (h, idx) {
            const isCurrentScreen = idx === 0;
            return (
              '<div class="col-lg-4">' +
                '<div class="ximi-workflow-card">' +
                  '<div>' +
                    '<div class="d-flex justify-content-between align-items-center mb-3">' +
                      '<span class="ip-kpi-icon"><i class="bi ' + h.icon + '"></i></span>' +
                      '<span class="badge ' + (isCurrentScreen ? 'bg-primary' : 'bg-secondary-subtle text-body-secondary') + ' font-monospace">Màn hình ' + h.num + '/03</span>' +
                    '</div>' +
                    '<h4 class="fs-5 fw-bold mb-2">' + IP.Utils.escapeHtml(isEn ? h.titleEn : h.title) + '</h4>' +
                    '<p class="small text-muted mb-3">' + IP.Utils.escapeHtml(isEn ? h.descEn : h.desc) + '</p>' +
                    '<div class="p-2 rounded border bg-body-tertiary small fw-semibold text-primary mb-3">' +
                      '<i class="bi bi-check2-circle me-1"></i>' + IP.Utils.escapeHtml(isEn ? h.previewLabelEn : h.previewLabel) +
                    '</div>' +
                  '</div>' +
                  (isCurrentScreen
                    ? '<button type="button" class="btn btn-primary btn-sm w-100" data-ximi-action="enter-workspace-now">' +
                        '<i class="bi bi-arrow-down-circle"></i> ' + IP.Utils.escapeHtml(isEn ? h.ctaEn : h.cta) +
                      '</button>'
                    : '<a href="' + h.href + '" class="btn btn-outline-primary btn-sm w-100" data-ximi-nav-other="1">' +
                        IP.Utils.escapeHtml(isEn ? h.ctaEn : h.cta) + ' <i class="bi bi-arrow-right"></i>' +
                      '</a>') +
                '</div>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</div>' +

      /* Chapter 04: Monthly Operational Cycle (Ximitech "Một tháng vận hành" pattern) */
      '<div class="ximi-chapter" id="ximi-ch-04" data-ximi-chapter="3">' +
        '<div class="ximi-chapter-head">' +
          '<div>' +
            '<span class="ximi-chapter-num">04 / ' + (isEn ? 'ONE MONTH OF ROLE OPERATIONS' : 'MỘT THÁNG VẬN HÀNH NGHIỆP VỤ') + '</span>' +
            '<h3 class="fs-4 fw-bold mb-1">' + (isEn ? ('Standard Monthly Rhythm · ' + IP.Utils.escapeHtml(roleLabel)) : ('Nhịp vận hành chuẩn mỗi tháng · Nghiệp vụ ' + IP.Utils.escapeHtml(roleLabel))) + '</h3>' +
            '<p class="small text-muted mb-0">' + (isEn ? 'Clear responsibilities from Week 1 to Month-End so no invoice or receivable falls through the cracks.' : 'Trách nhiệm rõ ràng từ Tuần 1 đến Cuối tháng giúp dữ liệu công nợ luôn sạch, đúng hạn và minh bạch.') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="ximi-matrix-grid">' +
          info.monthlyCycle.map(function (mc) {
            return (
              '<div class="ximi-matrix-card">' +
                '<span class="badge bg-primary-subtle text-primary-emphasis mb-2 font-monospace">' + IP.Utils.escapeHtml(isEn ? mc.weekEn : mc.week) + '</span>' +
                '<h4 class="fs-6 fw-bold mb-2">' + IP.Utils.escapeHtml(isEn ? mc.titleEn : mc.title) + '</h4>' +
                '<p class="small text-muted mb-0">' + IP.Utils.escapeHtml(mc.desc) + '</p>' +
              '</div>'
            );
          }).join('') +
        '</div>' +
      '</div>' +

      /* Chapter 05: End-of-Landing Auto-Transition Gate into the Live Role Workspace */
      '<div class="ximi-transition-gate" id="ximi-ch-05" data-ximi-chapter="4">' +
        '<span class="badge bg-warning text-dark mb-2"><i class="bi bi-rocket-takeoff-fill me-1"></i>05 / ' + (isEn ? 'END OF ROLE BRIEFING — ENTERING WORKSPACE' : 'KẾT THÚC GIỚI THIỆU — CHUYỂN VÀO TRANG TÁC VỤ') + '</span>' +
        '<h3 class="fs-4 fw-bold text-white mb-2">' +
          (isEn
            ? ('Ready to start working in ' + IP.Utils.escapeHtml(roleLabel) + ' Workspace')
            : ('Sẵn sàng bắt đầu tác vụ Nghiệp vụ ' + IP.Utils.escapeHtml(roleLabel))) +
        '</h3>' +
        '<p class="small text-white-50 mb-3 mx-auto" style="max-width:620px;">' +
          (isEn
            ? 'You have reached the end of the role introduction. The landing view is automatically transitioning you into the live operational workspace below.'
            : 'Bạn đã cuộn đến cuối trang giới thiệu nghiệp vụ. Hệ thống tự động đóng phần mở đầu này và đưa bạn nhảy thẳng vào bàn làm việc tác vụ ngay bên dưới.') +
        '</p>' +
        '<div class="ximi-gate-progress-track" aria-hidden="true">' +
          '<div class="ximi-gate-progress-bar" id="ximi-gate-auto-bar"></div>' +
        '</div>' +
        '<div class="d-flex justify-content-center align-items-center gap-2 flex-wrap mt-3">' +
          '<button type="button" class="btn btn-warning fw-bold text-dark px-4 py-2 shadow" data-ximi-action="enter-workspace-now">' +
            '<i class="bi bi-check2-circle"></i> ' + (isEn ? 'Enter Task Workspace Now' : 'Nhảy vào trang tác vụ ngay') +
          '</button>' +
          '<button type="button" class="btn btn-outline-light px-3 py-2" data-ximi-action="enter-workspace-never-show">' +
            '<i class="bi bi-eye-slash"></i> ' + (isEn ? 'Enter & Don\'t Show Again on Future Visits' : 'Vào trang tác vụ & Không hiển thị lại lần sau') +
          '</button>' +
        '</div>' +
      '</div>';

    mainEl.insertBefore(section, mainEl.firstChild);

    let isTransitioning = false;

    function completeRoleLandingTransition(rememberForever, reasonText) {
      if (isTransitioning) return;
      isTransitioning = true;
      cleanupRoleLandingListeners();

      const neverChk = section.querySelector('#ip-never-show-role-landing-chk');
      const persistHide = rememberForever !== undefined ? Boolean(rememberForever) : Boolean(neverChk && neverChk.checked);
      IP.Auth.setRoleLandingDismissed(role, true, persistHide);

      section.classList.add('ximi-collapsing');
      setTimeout(function () {
        if (section.parentNode) section.remove();
        const anchor = document.getElementById('ip-role-workspace-anchor');
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (IP.UI && typeof IP.UI.toast === 'function') {
          IP.UI.toast({
            title: isEn ? ('Entered ' + roleLabel + ' Workspace') : ('Đã vào trang tác vụ ' + roleLabel),
            message: reasonText || (persistHide
              ? (isEn ? 'Role intro hidden for future visits. You can reopen it anytime from the topbar.' : 'Đã lưu tùy chọn không hiển thị lại khi vào lần mới. Bạn có thể mở lại từ thanh công cụ.')
              : (isEn ? 'You are now in the operational workspace. Click "Role Intro" in the topbar to view again.' : 'Bạn đang ở trang tác vụ chính. Có thể bấm "Giới thiệu nghiệp vụ" trên thanh công cụ nếu muốn xem lại.')),
            type: 'success'
          });
        }
      }, 280);
    }

    // Bind buttons inside section
    const skipBtn = section.querySelector('#ip-skip-role-landing-btn');
    const neverBtn = section.querySelector('#ip-never-show-role-landing-btn');
    const neverChk = section.querySelector('#ip-never-show-role-landing-chk');

    if (neverChk) {
      neverChk.addEventListener('change', function () {
        IP.Auth.setRoleLandingHiddenForever(role, Boolean(neverChk.checked));
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        completeRoleLandingTransition(Boolean(neverChk && neverChk.checked));
      });
    }

    if (neverBtn) {
      neverBtn.addEventListener('click', function () {
        if (neverChk) neverChk.checked = true;
        completeRoleLandingTransition(true);
      });
    }

    section.addEventListener('click', function (ev) {
      const jumpBtn = ev.target.closest('[data-ximi-jump]');
      if (jumpBtn) {
        const targetId = jumpBtn.getAttribute('data-ximi-jump');
        const targetEl = section.querySelector('#' + targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      const navOther = ev.target.closest('[data-ximi-nav-other]');
      if (navOther) {
        const persist = Boolean(neverChk && neverChk.checked);
        IP.Auth.setRoleLandingDismissed(role, true, persist);
        return;
      }

      const actBtn = ev.target.closest('[data-ximi-action]');
      if (actBtn) {
        const act = actBtn.getAttribute('data-ximi-action');
        if (act === 'enter-workspace-now') {
          completeRoleLandingTransition(Boolean(neverChk && neverChk.checked));
        } else if (act === 'enter-workspace-never-show') {
          if (neverChk) neverChk.checked = true;
          completeRoleLandingTransition(true);
        }
      }
    });

    // Scroll tracking: update active chapter pill, progress bar, and auto-transition when reaching end gate!
    let gateProgress = 0;
    _roleScrollHandler = function () {
      const secEl = document.getElementById('ip-role-landing-section');
      if (!secEl || isTransitioning) return;

      const rect = secEl.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const totalScrollable = Math.max(1, rect.height - viewportH * 0.55);
      const scrolled = Math.max(0, -rect.top);
      const pct = Math.min(100, Math.max(10, Math.round((scrolled / totalScrollable) * 100)));

      const progBar = secEl.querySelector('#ximi-scroll-progress-bar');
      if (progBar) progBar.style.width = pct + '%';

      // Highlight current chapter pill
      const chapters = secEl.querySelectorAll('[data-ximi-chapter]');
      let activeIdx = 0;
      chapters.forEach(function (ch, idx) {
        const cRect = ch.getBoundingClientRect();
        if (cRect.top <= viewportH * 0.45) {
          activeIdx = idx;
        }
      });
      const pills = secEl.querySelectorAll('.ximi-chapter-pill');
      pills.forEach(function (p, idx) {
        p.classList.toggle('active', idx === activeIdx);
      });

      // Check if user scrolled to the end gate (#ximi-ch-05) or past the bottom of the landing section
      const gateEl = secEl.querySelector('#ximi-ch-05');
      if (gateEl) {
        const gateRect = gateEl.getBoundingClientRect();
        // If user scrolls past the bottom of the gate into the workspace below, jump immediately
        if (gateRect.bottom <= viewportH * 0.65) {
          completeRoleLandingTransition(Boolean(neverChk && neverChk.checked));
          return;
        }
        // If the end gate is clearly visible in viewport, start filling the auto-transition bar
        if (gateRect.top <= viewportH * 0.78 && scrolled > 120) {
          if (!_roleGateTimer) {
            const gateBar = secEl.querySelector('#ximi-gate-auto-bar');
            _roleGateTimer = setInterval(function () {
              if (!document.getElementById('ip-role-landing-section') || isTransitioning) {
                clearInterval(_roleGateTimer);
                _roleGateTimer = null;
                return;
              }
              const gRectNow = gateEl.getBoundingClientRect();
              if (gRectNow.top > viewportH * 0.85) {
                gateProgress = 0;
                if (gateBar) gateBar.style.width = '0%';
                clearInterval(_roleGateTimer);
                _roleGateTimer = null;
                return;
              }
              gateProgress += 20;
              if (gateBar) gateBar.style.width = Math.min(100, gateProgress) + '%';
              if (gateProgress >= 100) {
                clearInterval(_roleGateTimer);
                _roleGateTimer = null;
                completeRoleLandingTransition(Boolean(neverChk && neverChk.checked));
              }
            }, 160);
          }
        }
      }
    };

    window.addEventListener('scroll', _roleScrollHandler, { passive: true });
  }

  function updateTopbarThemeAndLangIcons() {
    const effTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isEn = IP.I18n && IP.I18n.getLang() === 'en';
    const fxDate = IP.I18n ? IP.I18n.getSelectedRateDate() : '';
    const fxRate = IP.I18n ? IP.I18n.getExchangeRateForDate(fxDate) : 25815;

    const themeBtn = document.getElementById('ip-theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = '<i class="bi ' + (effTheme === 'dark' ? 'bi-sun' : 'bi-moon-stars') + '"></i>';
      themeBtn.setAttribute('aria-pressed', effTheme === 'dark' ? 'true' : 'false');
      themeBtn.setAttribute('title', isEn ? ('Switch Light / Dark (' + effTheme + ')') : ('Chuyển chế độ Sáng / Tối (Đang dùng: ' + (effTheme === 'dark' ? 'Tối' : 'Sáng') + ')'));
    }

    const langBtn = document.getElementById('ip-lang-toggle-btn');
    if (langBtn) {
      langBtn.innerHTML = '<i class="bi bi-translate"></i> <span class="fw-bold small">' + (isEn ? 'EN · USD' : 'VI · VND') + '</span>';
      langBtn.setAttribute('title', isEn ? 'Switch to Vietnamese (VND)' : 'Chuyển sang Tiếng Anh (EN) & Quy đổi USD theo ngày');
    }

    const fxBtn = document.getElementById('ip-fx-rate-btn');
    if (fxBtn) {
      fxBtn.innerHTML = '<i class="bi bi-currency-exchange text-warning"></i> <span class="small ip-num">1$ = ' + fxRate.toLocaleString('en-US') + '₫</span>';
      fxBtn.setAttribute('title', isEn ? ('Daily FX Rate (' + IP.Fmt.date(fxDate) + '): 1 USD = ' + fxRate.toLocaleString('en-US') + ' VND') : ('Bảng tỷ giá ngày (' + IP.Fmt.date(fxDate) + '): 1 USD = ' + fxRate.toLocaleString('en-US') + ' VND'));
    }
  }

  window.addEventListener('ip:themechange', function () {
    updateTopbarThemeAndLangIcons();
  });

  function mountShell(pageId, session) {
    const mainEl = document.getElementById('main-content');
    if (!mainEl || document.querySelector('.ip-app-shell')) return;

    const isEn = IP.I18n && IP.I18n.getLang() === 'en';
    const fxDate = IP.I18n ? IP.I18n.getSelectedRateDate() : '';
    const fxRate = IP.I18n ? IP.I18n.getExchangeRateForDate(fxDate) : 25815;
    const role = (session && session.role) ? session.role : 'accountant';
    const userName = (session && session.name) ? session.name : 'Nguyễn Thu Hà';
    const roleLabel = IP.Fmt.roleLabel(role);
    const homeUrl = IP.Routes.homeForRole(role);
    const menu = IP.Nav.getMenuForRole(role);
    const pageMeta = IP.Routes.PAGE_META[pageId] || { title: document.title || 'Không gian làm việc' };

    const primaryLinks = menu.primary.map(function (item) {
      const isAct = item.pageId === pageId ? 'active' : '';
      return (
        '<li>' +
          '<a class="ip-nav-link ' + isAct + '" href="' + item.href + '" ' + (isAct ? 'aria-current="page"' : '') + '>' +
            '<i class="bi ' + item.icon + '" aria-hidden="true"></i>' +
            '<span>' + IP.Utils.escapeHtml(IP.I18n ? IP.I18n.t(item.label) : item.label) + '</span>' +
          '</a>' +
        '</li>'
      );
    }).join('');

    const secondaryLinks = menu.secondary.map(function (item) {
      const isAct = item.pageId === pageId ? 'active' : '';
      return (
        '<li>' +
          '<a class="ip-nav-link ' + isAct + '" href="' + item.href + '" ' + (isAct ? 'aria-current="page"' : '') + '>' +
            '<i class="bi ' + item.icon + '" aria-hidden="true"></i>' +
            '<span>' + IP.Utils.escapeHtml(IP.I18n ? IP.I18n.t(item.label) : item.label) + '</span>' +
          '</a>' +
        '</li>'
      );
    }).join('');

    const shell = document.createElement('div');
    shell.className = 'ip-app-shell';
    shell.innerHTML =
      '<div class="ip-sidebar-backdrop" id="ip-sidebar-backdrop"></div>' +
      '<aside class="ip-sidebar" id="ip-sidebar" aria-label="Điều hướng chính">' +
        '<a class="ip-sidebar-brand" href="' + homeUrl + '">' +
          LOGO_SVG +
          '<span>InvoicePilot</span>' +
        '</a>' +
        '<div class="ip-sidebar-role-tag">' +
          '<span>' + (isEn ? ('Module: ' + IP.Utils.escapeHtml(roleLabel)) : ('Phân hệ ' + IP.Utils.escapeHtml(roleLabel))) + '</span>' +
          '<span class="badge bg-success-subtle text-success-emphasis">' + (isEn ? 'Verified' : 'Đã xác thực') + '</span>' +
        '</div>' +
        '<ul class="ip-sidebar-nav">' +
          '<li class="ip-nav-section-title">' + (isEn ? (IP.Utils.escapeHtml(roleLabel) + ' Workspace') : ('Nghiệp vụ ' + IP.Utils.escapeHtml(roleLabel))) + '</li>' +
          primaryLinks +
          '<li class="ip-nav-section-title">' + (isEn ? 'Account & System' : 'Tài khoản & Hệ thống') + '</li>' +
          secondaryLinks +
        '</ul>' +
        '<div class="ip-sidebar-footer">' +
          '<div class="ip-mini-profile">' +
            '<span class="ip-avatar">' + IP.Utils.escapeHtml(IP.Utils.initials(userName)) + '</span>' +
            '<div class="ip-mini-profile-info">' +
              '<div class="ip-mini-profile-name" id="ip-sidebar-user-name">' + IP.Utils.escapeHtml(userName) + '</div>' +
              '<div class="ip-mini-profile-role">' + IP.Utils.escapeHtml(roleLabel) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</aside>' +
      '<div class="ip-main-wrap">' +
        '<header class="ip-topbar">' +
          '<div class="ip-topbar-left">' +
            '<button type="button" class="ip-icon-btn d-lg-none" id="ip-mobile-menu-btn" aria-label="Mở menu điều hướng">' +
              '<i class="bi bi-list fs-5"></i>' +
            '</button>' +
            '<nav aria-label="Breadcrumb">' +
              '<ol class="ip-breadcrumb">' +
                '<li><a href="' + homeUrl + '">' + IP.Utils.escapeHtml(roleLabel) + '</a></li>' +
                '<li aria-hidden="true">/</li>' +
                '<li class="active" aria-current="page">' + IP.Utils.escapeHtml(IP.I18n ? IP.I18n.t(pageMeta.title) : pageMeta.title) + '</li>' +
              '</ol>' +
            '</nav>' +
          '</div>' +
          '<div class="ip-topbar-right">' +
            '<button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2 d-none d-xl-inline-flex" data-shell-action="show-role-landing" title="Mở lại phần Landing Page giới thiệu nghiệp vụ ' + IP.Utils.escapeHtml(roleLabel) + '">' +
              '<i class="bi bi-compass"></i> <span class="small">' + (isEn ? 'Role Intro' : 'Giới thiệu nghiệp vụ') + '</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2 d-none d-md-inline-flex" id="ip-fx-rate-btn" data-shell-action="open-fx-modal" title="Bảng tỷ giá USD/VND theo từng ngày">' +
              '<i class="bi bi-currency-exchange text-warning"></i> <span class="small ip-num">1$ = ' + fxRate.toLocaleString('en-US') + '₫</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" id="ip-lang-toggle-btn" data-shell-action="toggle-lang" aria-label="Switch Language VI / EN">' +
              '<i class="bi bi-translate"></i> <span class="fw-bold small">' + (isEn ? 'EN · USD' : 'VI · VND') + '</span>' +
            '</button>' +
            '<button type="button" class="btn btn-outline-primary btn-sm py-1 px-2 d-none d-sm-inline-flex" data-shell-action="open-login-modal" title="Đăng nhập tài khoản nghiệp vụ khác">' +
              '<i class="bi bi-person-badge"></i> <span class="small">' + (isEn ? 'Switch Account' : 'Đổi tài khoản') + '</span>' +
            '</button>' +
            '<div id="ip-topbar-notif-wrap">' + buildNotificationDropdown(role) + '</div>' +
            '<button type="button" class="ip-icon-btn" id="ip-theme-toggle-btn" title="Chuyển chế độ Sáng / Tối" aria-label="Chuyển chế độ Sáng hoặc Tối">' +
              '<i class="bi ' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'bi-sun' : 'bi-moon-stars') + '"></i>' +
            '</button>' +
            '<div class="dropdown">' +
              '<button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 py-1 px-2" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu tài khoản">' +
                '<span class="ip-avatar" style="width:28px;height:28px;font-size:0.75rem;">' + IP.Utils.escapeHtml(IP.Utils.initials(userName)) + '</span>' +
                '<span class="d-none d-md-inline small fw-semibold" id="ip-topbar-user-name">' + IP.Utils.escapeHtml(userName) + '</span>' +
                '<i class="bi bi-chevron-down small"></i>' +
              '</button>' +
              '<ul class="dropdown-menu dropdown-menu-end shadow border">' +
                '<li class="px-3 py-2 border-bottom">' +
                  '<div class="fw-bold small">' + IP.Utils.escapeHtml(userName) + '</div>' +
                  '<div class="text-muted" style="font-size:0.76rem">' + IP.Utils.escapeHtml(session ? session.email : '') + ' · ' + IP.Utils.escapeHtml(roleLabel) + '</div>' +
                '</li>' +
                '<li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>' + (isEn ? 'My Profile & Appearance' : 'Hồ sơ cá nhân') + '</a></li>' +
                '<li><a class="dropdown-item" href="notifications.html"><i class="bi bi-bell me-2"></i>' + (isEn ? 'Notification Center' : 'Trung tâm thông báo') + '</a></li>' +
                '<li><button type="button" class="dropdown-item" data-shell-action="show-role-landing"><i class="bi bi-compass me-2"></i>' + (isEn ? 'Reopen Role Landing Intro' : 'Mở lại trang giới thiệu nghiệp vụ') + '</button></li>' +
                '<li><button type="button" class="dropdown-item" data-shell-action="open-fx-modal"><i class="bi bi-currency-exchange me-2"></i>' + (isEn ? 'Daily USD/VND Exchange Rates' : 'Bảng tỷ giá USD/VND theo ngày') + '</button></li>' +
                '<li><button type="button" class="dropdown-item" data-shell-action="open-login-modal"><i class="bi bi-box-arrow-in-right me-2"></i>' + (isEn ? 'Sign in with another role account' : 'Đăng nhập tài khoản nghiệp vụ khác') + '</button></li>' +
                (role === 'admin'
                  ? '<li><a class="dropdown-item text-primary fw-semibold" href="admin-user-management.html"><i class="bi bi-shield-lock me-2"></i>' + (isEn ? 'User & Role Administration' : 'Quản trị & Cấp phát tài khoản') + '</a></li>'
                  : '') +
                '<li><hr class="dropdown-divider"></li>' +
                '<li><a class="dropdown-item" href="index.html"><i class="bi bi-house me-2"></i>' + (isEn ? 'Back to Main Landing Page' : 'Về Landing Page tổng quan') + '</a></li>' +
                '<li><button type="button" class="dropdown-item text-danger" data-shell-action="logout"><i class="bi bi-box-arrow-right me-2"></i>' + (isEn ? 'Sign Out' : 'Đăng xuất') + '</button></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</header>' +
      '</div>';

    mainEl.parentNode.insertBefore(shell, mainEl);
    mainEl.classList.add('ip-content');
    shell.querySelector('.ip-main-wrap').appendChild(mainEl);

    const sidebar = shell.querySelector('#ip-sidebar');
    const backdrop = shell.querySelector('#ip-sidebar-backdrop');
    const mobileBtn = shell.querySelector('#ip-mobile-menu-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', function () {
        sidebar.classList.toggle('show');
        backdrop.classList.toggle('show');
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        sidebar.classList.remove('show');
        backdrop.classList.remove('show');
      });
    }

    const themeBtn = shell.querySelector('#ip-theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        IP.UI.applyTheme(next);
        updateTopbarThemeAndLangIcons();
      });
    }

    shell.addEventListener('click', function (ev) {
      const actBtn = ev.target.closest('[data-shell-action]');
      if (actBtn) {
        const action = actBtn.getAttribute('data-shell-action');
        if (action === 'open-login-modal') {
          IP.Auth.openLoginModal({ mandatory: false });
        } else if (action === 'show-role-landing') {
          IP.Auth.setRoleLandingDismissed(role, false, false);
          const curPage = document.body.getAttribute('data-page') || '';
          const defPage = ROLE_DEFAULT_PAGES[role] || 'accountant-invoice-list';
          if (curPage !== defPage) {
            const targetHome = IP.Routes.homeForRole(role);
            if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(targetHome);
            else window.location.href = targetHome;
          } else {
            mountRoleLandingBanner(role, userName, true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (action === 'toggle-lang') {
          if (IP.I18n) {
            const nextLang = IP.I18n.toggleLang();
            const rate = IP.I18n.getExchangeRateForDate();
            if (IP.UI && IP.UI.toast) {
              IP.UI.toast({
                title: nextLang === 'en' ? 'Switched to English (USD)' : 'Đã chuyển sang Tiếng Việt (VND)',
                message: nextLang === 'en'
                  ? ('All currency figures are now converted to USD using daily rates (Ref: 1 USD = ' + rate.toLocaleString('en-US') + ' VND).')
                  : 'Toàn bộ giao diện và đơn vị tiền tệ đã chuyển về Tiếng Việt (VND).',
                type: 'info'
              });
            }
          }
        } else if (action === 'open-fx-modal') {
          if (IP.I18n) IP.I18n.openExchangeRateModal();
        } else if (action === 'logout') {
          IP.Auth.logout('index.html');
        }
      }
      const notifLink = ev.target.closest('[data-notif-id]');
      if (notifLink) {
        const nId = notifLink.getAttribute('data-notif-id');
        IP.DB.markNotificationRead(nId);
      }
    });

    IP.DB.subscribe(function () {
      const wrap = document.getElementById('ip-topbar-notif-wrap');
      if (wrap) wrap.innerHTML = buildNotificationDropdown(role);
      const latestSess = IP.Auth.getSession();
      if (latestSess) {
        const tName = document.getElementById('ip-topbar-user-name');
        const sName = document.getElementById('ip-sidebar-user-name');
        if (tName) tName.textContent = latestSess.name;
        if (sName) sName.textContent = latestSess.name;
      }
    });
  }

  window.addEventListener('ip:langchange', function () {
    const oldShell = document.querySelector('.ip-app-shell');
    let mainEl = document.getElementById('main-content');
    if (oldShell && mainEl) {
      oldShell.parentNode.insertBefore(mainEl, oldShell);
      oldShell.remove();
    }
    if (mainEl) {
      mainEl.innerHTML = '';
    }
    IP.Layout.boot();
  });

  IP.Layout = {
    LOGO_SVG: LOGO_SVG,
    ROLE_DEFAULT_PAGES: ROLE_DEFAULT_PAGES,
    ROLE_LANDING_CONTENT: ROLE_LANDING_CONTENT,
    mount: mountShell,
    mountRoleLandingBanner: mountRoleLandingBanner,
    boot: function () {
      IP.DB.init();
      cleanupRoleLandingListeners();
      const body = document.body;
      const pageId = body.getAttribute('data-page') || '';
      const rolesAttr = body.getAttribute('data-roles') || 'public';

      const guardRes = IP.Auth.guard(rolesAttr);
      if (!guardRes.allowed) {
        if (guardRes.reason === 'unauthenticated') {
          const landingDef = IP.Pages.get('landing');
          if (landingDef && typeof landingDef.init === 'function') {
            landingDef.init({ pageId: 'landing', session: null });
          }
          IP.Auth.openLoginModal({
            mandatory: true,
            redirectUrl: guardRes.redirectTarget
          });
        }
        return;
      }

      const noShellPages = ['landing', 'login', 'forgot-password', 'error-403', 'error-404'];
      if (!noShellPages.includes(pageId)) {
        mountShell(pageId, guardRes.session);
      }

      const pageDef = IP.Pages.get(pageId);
      if (pageDef && typeof pageDef.init === 'function') {
        pageDef.init({ pageId: pageId, session: guardRes.session });
      }

      // Mount Ximitech-style Role Landing Page ONLY on the default first page of the role
      if (!noShellPages.includes(pageId) && guardRes.session) {
        const role = guardRes.session.role;
        const defaultPageForRole = ROLE_DEFAULT_PAGES[role] || 'accountant-invoice-list';
        if (pageId === defaultPageForRole) {
          mountRoleLandingBanner(role, guardRes.session.name, false);
          const mainEl = document.getElementById('main-content');
          if (mainEl && !mainEl.__ipRoleLandingObserver) {
            mainEl.__ipRoleLandingObserver = true;
            const obs = new MutationObserver(function () {
              const curSess = IP.Auth.getSession();
              if (!curSess) return;
              const curPage = document.body.getAttribute('data-page') || '';
              const curDefault = ROLE_DEFAULT_PAGES[curSess.role] || 'accountant-invoice-list';
              if (curPage !== curDefault) return;
              if (!IP.Auth.isRoleLandingDismissed(curSess.role) && !document.getElementById('ip-role-landing-section')) {
                mountRoleLandingBanner(curSess.role, curSess.name, false);
              }
            });
            obs.observe(mainEl, { childList: true });
          }
        }
      }

      if (IP.I18n && IP.I18n.getLang() === 'en') {
        IP.I18n.translateDOM(document.body);
      }

      if (pageId === 'landing' && !guardRes.session) {
        IP.Auth.openLoginModal({ mandatory: true });
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    IP.Layout.boot();
  });
})(window);
