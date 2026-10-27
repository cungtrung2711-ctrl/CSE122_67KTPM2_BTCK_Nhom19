/**
 * @owner SV4
 * @spec §7.1 Interactive Auto-Sliding & Mouse-Wheel Scrollable Landing Page Slide Deck (landing.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  let _lndAutoTimer = null;

  IP.Pages.register('landing', {
    roles: ['public'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      if (_lndAutoTimer) {
        clearInterval(_lndAutoTimer);
        _lndAutoTimer = null;
      }

      const session = IP.Auth.getSession();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const isEn = IP.I18n && IP.I18n.getLang() === 'en';
      const fxDate = IP.I18n ? IP.I18n.getSelectedRateDate() : IP.Seed.todayISO();
      const fxRate = IP.I18n ? IP.I18n.getExchangeRateForDate(fxDate) : 25815;
      const skipLanding = IP.Auth.getSkipRoleLanding();

      let currentSlide = 0;
      let isAutoPlay = true;
      let isWheelEnabled = true;

      const SLIDES = [
        {
          id: 'overview',
          tabLabel: isEn ? '01 · Ecosystem Overview' : '01 · Tổng quan Hệ thống',
          icon: 'bi-layers-half',
          badge: isEn ? 'Slide 01/05 · Unified B2B E-Invoice & Receivables Platform' : 'Slide 01/05 · Hệ sinh thái Hóa đơn Điện tử & Công nợ B2B',
          title: isEn ? 'On-Time Invoices. Proactive Cash Flow.' : 'Hóa đơn đúng hạn. Dòng tiền chủ động.',
          subtitle: isEn
            ? 'InvoicePilot unifies tax-coded VAT e-invoice issuance (Symbol 1C26TAA under Decree 123/2020/ND-CP & Circular 78/2021/TT-BTC), automated bank statement reconciliation, polite B2B payment reminders, and 30–90 day cashflow forecasting.'
            : 'InvoicePilot kết nối quy trình phát hành hóa đơn GTGT có mã của Cơ quan Thuế (Ký hiệu 1C26TAA theo Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC), đối chiếu ủy nhiệm chi ngân hàng, tự động hóa nhắc nợ và dự báo dòng tiền cho 4 bộ phận.',
          roleKey: null,
          bullets: isEn
            ? [
                'Standardized tax-coded VAT e-invoices (1C26TAA) with real-time receivables ledger',
                'Strict role-based access control: Only System Admin can create, modify, or delete role accounts',
                'Bilingual UI (VI/EN) with automatic daily USD/VND exchange rate conversion by transaction date'
              ]
            : [
                'Chuẩn hóa hóa đơn điện tử GTGT có mã CQT (1C26TAA) gắn liền sổ theo dõi công nợ thực thu',
                'Phân quyền nghiêm ngặt: Chỉ Quản trị viên (Admin) được tạo, sửa, khóa hoặc xóa tài khoản các nghiệp vụ',
                'Hỗ trợ song ngữ Việt – Anh và tự động quy đổi đơn vị tiền tệ sang USD theo tỷ giá từng ngày'
              ],
          kpis: [
            { label: isEn ? 'Total Receivables (AR)' : 'Tổng phải thu (AR)', val: IP.Fmt.currency(1480000000, true, fxDate), sub: IP.Fmt.currency(1480000000, false, fxDate) },
            { label: isEn ? 'Overdue Receivables' : 'Nợ quá hạn cần thu', val: IP.Fmt.currency(412000000, true, fxDate), sub: IP.Fmt.currency(412000000, false, fxDate), cls: 'text-danger' },
            { label: isEn ? 'Expected (30 Days)' : 'Dự kiến thu 30 ngày', val: IP.Fmt.currency(586000000, true, fxDate), sub: IP.Fmt.currency(586000000, false, fxDate), cls: 'text-success' }
          ]
        },
        {
          id: 'accountant',
          tabLabel: isEn ? '02 · Accountant' : '02 · Nghiệp vụ Kế toán',
          icon: 'bi-receipt',
          badge: isEn ? 'Slide 02/05 · Role 1: Accounts Receivable Accountant (SV1)' : 'Slide 02/05 · Nghiệp vụ 1: Kế toán Công nợ (Accountant)',
          title: isEn ? 'E-Invoice Issuance, AI-1 Anomaly Check & Bank Reconciliation' : 'Phát hành Hóa đơn GTGT, Kiểm tra AI-1 & Đối chiếu Sao kê Ngân hàng',
          subtitle: isEn
            ? 'Designed for Chief & AR Accountants to issue sequential VAT invoices, detect credit limit or tax anomalies via AI-1 before sending, and match Vietcombank wire transfers to open invoices.'
            : 'Dành cho Kế toán trưởng & Kế toán công nợ lập hóa đơn tự động theo ký hiệu 1C26TAA, rà soát sai lệch hạn thanh toán/vượt hạn mức bằng AI-1 và khớp lệnh ủy nhiệm chi Vietcombank.',
          roleKey: 'accountant',
          accountEmail: 'ketoan@hoabinhdigital.vn',
          accountPass: 'KeToan@2026',
          accountHolder: 'Nguyễn Thu Hà',
          bullets: isEn
            ? [
                'Manage 52+ invoices across Draft, Sent, Partially Paid, Overdue, Paid, Voided, and Archived states',
                'AI-1 Anomaly Engine checks due dates, VAT rates (0%/5%/8%/10%), and 250% historical spikes',
                'Rule-based bank reconciliation desk with partial allocation, discrepancy flagging, and 1-click undo'
              ]
            : [
                'Quản lý vòng đời 52+ hóa đơn: Nháp, Đã gửi, Thanh toán một phần, Quá hạn, Đã thu, Đã hủy, Lưu trữ',
                'Trợ lý AI-1 kiểm tra chéo ngày đáo hạn, thuế suất GTGT (0%/5%/8%/10%) và cảnh báo vượt hạn mức tín dụng',
                'Bàn đối chiếu sao kê ngân hàng theo điểm khớp quy tắc, hỗ trợ phân bổ một phần và hoàn tác đối chiếu'
              ],
          kpis: [
            { label: isEn ? 'Active Invoices' : 'Hóa đơn quản lý', val: '52 HĐ', sub: isEn ? 'Symbol 1C26TAA' : 'Ký hiệu 1C26TAA' },
            { label: isEn ? 'Pending Bank TX' : 'GD chờ đối chiếu', val: '6 GD', sub: IP.Fmt.currency(215400000, false, fxDate), cls: 'text-warning' },
            { label: isEn ? 'Collected (30d)' : 'Đã thu 30 ngày', val: IP.Fmt.currency(468000000, true, fxDate), sub: isEn ? '100% Reconciled' : 'Đã khớp xác nhận', cls: 'text-success' }
          ]
        },
        {
          id: 'sales',
          tabLabel: isEn ? '03 · B2B Sales' : '03 · Nghiệp vụ Kinh doanh',
          icon: 'bi-building-check',
          badge: isEn ? 'Slide 03/05 · Role 2: B2B Sales & Credit Specialist (SV2)' : 'Slide 03/05 · Nghiệp vụ 2: Kinh doanh B2B & Đôn đốc Công nợ (Sales)',
          title: isEn ? 'Customer Credit Balances, Aging Bars & AI-2 Payment Reminders' : 'Quản lý Hạn mức Khách hàng, Thanh Tuổi nợ & Nhắc hạn bằng AI-2',
          subtitle: isEn
            ? 'Empowers B2B Sales teams to monitor customer credit utilization, inspect segmented aging bars (0–30, 31–60, 61–90, 90+ days), and compose polite Email/SMS payment reminders with AI-2.'
            : 'Giúp bộ phận Kinh doanh B2B nắm bắt tức thời dư nợ của 18 doanh nghiệp đối tác, theo dõi thanh phân bổ tuổi nợ và soạn thông điệp nhắc thanh toán lịch sự bằng AI-2.',
          roleKey: 'sales',
          accountEmail: 'kinhdoanh@hoabinhdigital.vn',
          accountPass: 'KinhDoanh@2026',
          accountHolder: 'Trần Minh Quân',
          bullets: isEn
            ? [
                'Monitor credit limits and aging buckets across 18 B2B enterprises across 8 industries',
                '4-step Payment Reminder Composer with AI-2 drafting in Friendly, Formal, or Firm & Polite tones',
                'Invoice detail lookup with internal commitment notes, due-date extension audit logs, and A4 print'
              ]
            : [
                'Giám sát hạn mức tín dụng và phân bổ tuổi nợ của 18 doanh nghiệp đối tác thuộc 8 nhóm ngành',
                'Trình soạn nhắc thanh toán 4 bước tích hợp AI-2 theo 3 giọng điệu: Thân thiện, Trang trọng, Cứng rắn lịch sự',
                'Tra cứu chi tiết hóa đơn, ghi chú lịch hẹn trả tiền, gia hạn hạn thanh toán có lý do và in bản A4'
              ],
          kpis: [
            { label: isEn ? 'Active B2B Clients' : 'Khách hàng hoạt động', val: '17 DN', sub: isEn ? '8 B2B Industries' : '8 ngành nghề B2B' },
            { label: isEn ? 'Scheduled / Sent' : 'Bản nhắc đã gửi/lịch', val: '12 Bản nhắc', sub: 'Email & SMS Brandname', cls: 'text-primary' },
            { label: isEn ? 'Due in 30 Days' : 'Dự kiến thu 30 ngày', val: IP.Fmt.currency(586000000, true, fxDate), sub: isEn ? 'Proactive follow-up' : 'Chủ động chăm sóc', cls: 'text-success' }
          ]
        },
        {
          id: 'manager',
          tabLabel: isEn ? '04 · CFO / Manager' : '04 · Nghiệp vụ Quản lý',
          icon: 'bi-bar-chart-line',
          badge: isEn ? 'Slide 04/05 · Role 3: CFO & Executive Management (SV3)' : 'Slide 04/05 · Nghiệp vụ 3: Quản lý & Giám đốc Tài chính (Manager / CFO)',
          title: isEn ? 'Executive AR Dashboard, Rule-Based Risk & 3-Scenario Cashflow Forecast' : 'Bảng điều khiển Công nợ, Chấm điểm Rủi ro & Dự báo Dòng tiền AI-3',
          subtitle: isEn
            ? 'Provides CFOs and Managers with live aging charts, Days Sales Outstanding (DSO), transparent overdue risk scoring, Sales owner assignment, and interactive 30/60/90-day cashflow scenarios.'
            : 'Cung cấp cho Giám đốc Tài chính bức tranh tổng thể về tuổi nợ, chỉ số DSO, chấm điểm rủi ro quá hạn theo công thức luật tường minh, giao việc cho Kinh doanh và dự báo dòng tiền 30/60/90 ngày.',
          roleKey: 'manager',
          accountEmail: 'quanly@hoabinhdigital.vn',
          accountPass: 'QuanLy@2026',
          accountHolder: 'Lê Hoàng Anh',
          bullets: isEn
            ? [
                'Live Chart.js visualizations for Aging Buckets, 90-Day Cash Inflows, and Top 5 Exposure Customers',
                'Explicit rule-based Risk Scoring (Overdue Days + Credit Utilization + Late History) & Owner Assignment',
                'Interactive Baseline / Conservative / Optimistic cashflow scenarios with AI-3 report snapshots'
              ]
            : [
                'Biểu đồ trực quan phân bổ tuổi nợ, dòng tiền 90 ngày và Top 5 khách hàng có dư nợ lớn nhất',
                'Chấm điểm rủi ro theo công thức luật minh bạch, phân công nhân sự Kinh doanh đôn đốc trực tiếp',
                'Mô phỏng 3 kịch bản dòng tiền (Cơ sở, Thận trọng, Lạc quan) và lưu bản chụp phân tích điều hành AI-3'
              ],
          kpis: [
            { label: isEn ? 'Average DSO' : 'Chỉ số DSO bình quân', val: isEn ? '34 days' : '34 ngày', sub: isEn ? '-4 days vs prior period' : 'Giảm 4 ngày so với kỳ trước' },
            { label: isEn ? 'High-Risk Overdue' : 'Khoản quá hạn rủi ro cao', val: '9 HĐ', sub: isEn ? 'Rule score >= 60' : 'Điểm rủi ro >= 60', cls: 'text-danger' },
            { label: isEn ? '60d Baseline Forecast' : 'Dự báo 60 ngày (Cơ sở)', val: IP.Fmt.currency(795000000, true, fxDate), sub: isEn ? '65% overdue recovery' : 'Tỷ lệ thu hồi 65%', cls: 'text-primary' }
          ]
        },
        {
          id: 'admin',
          tabLabel: isEn ? '05 · System Admin' : '05 · Nghiệp vụ Quản trị',
          icon: 'bi-shield-lock',
          badge: isEn ? 'Slide 05/05 · Role 4: System Administrator (SV4 — Exclusive Account Authority)' : 'Slide 05/05 · Nghiệp vụ 4: Quản trị viên Hệ thống (Admin — Đặc quyền Cấp tài khoản)',
          title: isEn ? 'Exclusive User Account CRUD, Customer Master Data & Tax Configuration' : 'Đặc quyền Quản trị Tài khoản, Danh mục Khách hàng & Cấu hình Hệ thống',
          subtitle: isEn
            ? 'Only the System Administrator has authority to create, modify roles/passwords, suspend, or delete accounts for other roles; manage B2B customer records; and configure invoice numbering & AI switches.'
            : 'Chỉ duy nhất Quản trị viên mới có quyền tạo mới, điều chỉnh vai trò/mật khẩu, tạm khóa hoặc xóa tài khoản của các nghiệp vụ khác; đồng thời quản lý khách hàng và cấu hình hóa đơn.',
          roleKey: 'admin',
          accountEmail: 'admin@hoabinhdigital.vn',
          accountPass: 'Admin@2026',
          accountHolder: 'Phạm Gia Bảo',
          bullets: isEn
            ? [
                'Admin-Only User CRUD: Create accounts, change roles, reset passwords, suspend/unsuspend, or delete users',
                'Customer Master Data management with tax ID validation and zero-balance archiving protection',
                'Configure invoice prefix/numbering, Email/SMS reminder templates, and AI-1/2/3 module toggles'
              ]
            : [
                'Đặc quyền CRUD Tài khoản: Tạo tài khoản mới, đổi vai trò, đặt mật khẩu, khóa/mở khóa hoặc xóa tài khoản',
                'Quản lý hồ sơ khách hàng B2B, kiểm tra mã số thuế và chặn lưu trữ khi khách hàng còn dư nợ chưa thu',
                'Cấu hình pháp nhân, tiền tố đánh số hóa đơn tự động, mẫu nhắc thanh toán và công tắc bật/tắt AI-1/2/3'
              ],
          kpis: [
            { label: isEn ? 'Managed Accounts' : 'Tài khoản hệ thống', val: '8 Users', sub: isEn ? '4 Core Role Accounts' : '4 TK nghiệp vụ chính' },
            { label: isEn ? 'Customer Records' : 'Hồ sơ doanh nghiệp', val: '18 B2B', sub: isEn ? 'Zero-balance archive guard' : 'Bảo vệ lưu trữ dư nợ', cls: 'text-primary' },
            { label: isEn ? 'AI Modules Active' : 'Mô-đun Trợ lý AI', val: '3 / 3 ON', sub: 'AI-1 · AI-2 · AI-3', cls: 'text-success' }
          ]
        }
      ];

      function renderSlideDeckOnly() {
        const deckHost = root.querySelector('#lnd-slide-deck-host');
        if (!deckHost) return;

        const s = SLIDES[currentSlide] || SLIDES[0];
        const pct = Math.round(((currentSlide + 1) / SLIDES.length) * 100);

        deckHost.innerHTML =
          '<div class="lnd-slide-deck" id="lnd-slide-deck" tabindex="0" aria-label="Slide giới thiệu các nghiệp vụ InvoicePilot">' +
            '<div class="lnd-slide-deck-header">' +
              '<div class="lnd-slide-tabs" role="tablist">' +
                SLIDES.map(function (item, idx) {
                  return (
                    '<button type="button" class="lnd-slide-tab-btn ' + (idx === currentSlide ? 'active' : '') + '" data-slide-to="' + idx + '" role="tab" aria-selected="' + (idx === currentSlide ? 'true' : 'false') + '">' +
                      '<i class="bi ' + item.icon + '"></i>' +
                      '<span>' + IP.Utils.escapeHtml(item.tabLabel) + '</span>' +
                    '</button>'
                  );
                }).join('') +
              '</div>' +
              '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                '<button type="button" class="btn btn-sm btn-outline-light py-1 px-2" id="lnd-slide-wheel-btn" title="Bật/Tắt cuộn con lăn chuột để chuyển slide">' +
                  '<i class="bi bi-mouse"></i> <span class="small">' + (isWheelEnabled ? (isEn ? 'Wheel Scroll: ON' : 'Cuộn con lăn: BẬT') : (isEn ? 'Wheel Scroll: OFF' : 'Cuộn con lăn: TẮT')) + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-light py-1 px-2" id="lnd-slide-play-btn">' +
                  '<i class="bi ' + (isAutoPlay ? 'bi-pause-circle' : 'bi-play-circle') + '"></i> <span class="small">' + (isAutoPlay ? (isEn ? 'Auto-Slide: ON' : 'Tự động chạy: BẬT') : (isEn ? 'Auto-Slide: PAUSED' : 'Tự động chạy: DỪNG')) + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-warning fw-bold text-dark py-1 px-3 shadow-sm" data-lnd-action="skip-landing" id="lnd-skip-deck-btn">' +
                  '<i class="bi bi-fast-forward-fill"></i> ' + (isEn ? 'Skip Landing Page' : 'Bỏ qua Landing Page') +
                '</button>' +
              '</div>' +
            '</div>' +

            '<div class="lnd-slide-progress-wrap">' +
              '<div class="lnd-slide-progress-bar" style="width:' + pct + '%;"></div>' +
            '</div>' +

            '<div class="lnd-slide-viewport">' +
              '<div class="lnd-slide-item active">' +
                '<div class="row g-4 align-items-center">' +
                  '<div class="col-lg-7">' +
                    '<div class="lnd-eyebrow"><i class="bi ' + s.icon + '"></i> ' + IP.Utils.escapeHtml(s.badge) + '</div>' +
                    '<h1 class="lnd-hero-title">' + IP.Utils.escapeHtml(s.title) + '</h1>' +
                    '<p class="text-muted mb-3">' + IP.Utils.escapeHtml(s.subtitle) + '</p>' +
                    '<ul class="list-unstyled mb-4">' +
                      s.bullets.map(function (b) {
                        return '<li class="d-flex align-items-start gap-2 mb-2 small"><i class="bi bi-check2-circle text-primary fs-6 mt-1"></i><span>' + IP.Utils.escapeHtml(b) + '</span></li>';
                      }).join('') +
                    '</ul>' +
                    '<div class="d-flex flex-wrap gap-2 align-items-center">' +
                      (s.roleKey
                        ? '<button type="button" class="btn btn-primary px-4 py-2" data-lnd-action="login-role" data-role="' + s.roleKey + '">' +
                            '<i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? ('Sign In as ' + IP.Fmt.roleLabel(s.roleKey)) : ('Đăng nhập Nghiệp vụ ' + IP.Fmt.roleLabel(s.roleKey))) +
                          '</button>' +
                          '<button type="button" class="btn btn-outline-secondary px-3 py-2" data-lnd-action="login-role-skip" data-role="' + s.roleKey + '">' +
                            '<i class="bi bi-fast-forward"></i> ' + (isEn ? 'Direct Workspace (Skip Intro)' : 'Vào thẳng bàn làm việc (Bỏ qua giới thiệu)') +
                          '</button>'
                        : '<button type="button" class="btn btn-primary px-4 py-2" data-lnd-action="open-login-popup">' +
                            '<i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? 'Sign In & Select Role' : 'Đăng nhập & Chọn nghiệp vụ') +
                          '</button>' +
                          '<button type="button" class="btn btn-outline-secondary px-3 py-2" data-lnd-action="skip-landing">' +
                            '<i class="bi bi-fast-forward"></i> ' + (isEn ? 'Skip Landing Page' : 'Bỏ qua Landing Page — Vào làm việc') +
                          '</button>') +
                    '</div>' +
                  '</div>' +

                  '<div class="col-lg-5">' +
                    '<div class="lnd-mockup-window">' +
                      '<div class="lnd-mockup-topbar">' +
                        '<div class="lnd-mockup-dots"><span></span><span></span><span></span></div>' +
                        '<span class="fw-semibold">' + IP.Utils.escapeHtml(s.tabLabel) + '</span>' +
                        '<span class="badge bg-success-subtle text-success-emphasis">' + (isEn ? ('FX: 1$=' + fxRate.toLocaleString('en-US') + '₫') : '1C26TAA') + '</span>' +
                      '</div>' +
                      '<div class="lnd-mockup-body">' +
                        '<div class="row g-2 mb-3">' +
                          s.kpis.map(function (k) {
                            return (
                              '<div class="col-4">' +
                                '<div class="p-2 border rounded bg-body-tertiary h-100">' +
                                  '<div class="small text-muted" style="font-size:0.71rem">' + IP.Utils.escapeHtml(k.label) + '</div>' +
                                  '<div class="fw-bold ip-num ' + (k.cls || '') + '">' + IP.Utils.escapeHtml(k.val) + '</div>' +
                                  '<div class="text-muted ip-num" style="font-size:0.68rem">' + IP.Utils.escapeHtml(k.sub) + '</div>' +
                                '</div>' +
                              '</div>'
                            );
                          }).join('') +
                        '</div>' +
                        (s.roleKey
                          ? '<div class="p-3 rounded border bg-body-tertiary mb-3 small">' +
                              '<div class="d-flex justify-content-between align-items-center mb-1">' +
                                '<span class="fw-bold text-primary"><i class="bi bi-person-badge me-1"></i>' + (isEn ? 'Role Account Credentials:' : 'Tài khoản Nghiệp vụ được cấp:') + '</span>' +
                                '<span class="badge bg-secondary-subtle text-body-secondary">' + IP.Utils.escapeHtml(s.accountHolder) + '</span>' +
                              '</div>' +
                              '<div class="font-monospace">Email: <strong>' + IP.Utils.escapeHtml(s.accountEmail) + '</strong></div>' +
                              '<div class="font-monospace">' + (isEn ? 'Password: ' : 'Mật khẩu: ') + '<strong>' + IP.Utils.escapeHtml(s.accountPass) + '</strong></div>' +
                            '</div>'
                          : '<div class="mb-3">' +
                              '<div class="d-flex justify-content-between small text-muted mb-1"><span>' + (isEn ? 'Receivables & Cashflow Distribution' : 'Phân bổ dòng tiền & tuổi nợ theo kỳ') + '</span><span class="ip-num">' + (isEn ? 'Unit: USD ($)' : 'Đơn vị: VND (₫)') + '</span></div>' +
                              '<div class="lnd-mockup-bars">' +
                                '<div class="lnd-mockup-bar" style="height:85%"></div>' +
                                '<div class="lnd-mockup-bar alt" style="height:60%"></div>' +
                                '<div class="lnd-mockup-bar" style="height:45%"></div>' +
                                '<div class="lnd-mockup-bar alt" style="height:30%"></div>' +
                                '<div class="lnd-mockup-bar" style="height:75%"></div>' +
                              '</div>' +
                            '</div>') +
                        '<div class="border rounded overflow-hidden small">' +
                          '<div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-body-tertiary fw-semibold">' +
                            '<span>' + (isEn ? 'Sample E-Invoices (Daily FX Applied)' : 'Hóa đơn điện tử GTGT (1C26TAA)') + '</span>' +
                            '<span>' + (isEn ? 'Amount & Status' : 'Số dư & Trạng thái') + '</span>' +
                          '</div>' +
                          '<div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" data-fx-date="' + IP.Seed.addDays(-140) + '">' +
                            '<div><strong>IP-2026-0001</strong> · Hạ tầng Thăng Long</div>' +
                            '<div class="d-flex align-items-center gap-2"><span class="ip-num fw-semibold">' + IP.Fmt.currency(66960000, false, IP.Seed.addDays(-140)) + '</span>' + IP.UI.statusBadge('overdue') + '</div>' +
                          '</div>' +
                          '<div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" data-fx-date="' + IP.Seed.addDays(-12) + '">' +
                            '<div><strong>IP-2026-0023</strong> · Vận tải Biển Đông</div>' +
                            '<div class="d-flex align-items-center gap-2"><span class="ip-num fw-semibold">' + IP.Fmt.currency(19800000, false, IP.Seed.addDays(-12)) + '</span>' + IP.UI.statusBadge('partial') + '</div>' +
                          '</div>' +
                          '<div class="d-flex justify-content-between align-items-center px-3 py-2" data-fx-date="' + IP.Seed.addDays(-25) + '">' +
                            '<div><strong>IP-2026-0037</strong> · Công nghệ Sao Khuê</div>' +
                            '<div class="d-flex align-items-center gap-2"><span class="ip-num fw-semibold">' + IP.Fmt.currency(39600000, false, IP.Seed.addDays(-25)) + '</span>' + IP.UI.statusBadge('paid') + '</div>' +
                          '</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="lnd-slide-footer">' +
              '<div class="d-flex align-items-center gap-3 flex-wrap">' +
                '<div class="lnd-slide-dots" role="tablist" aria-label="Slide Dots">' +
                  SLIDES.map(function (item, idx) {
                    return '<button type="button" class="lnd-slide-dot ' + (idx === currentSlide ? 'active' : '') + '" data-slide-to="' + idx + '" aria-label="Slide ' + (idx + 1) + '"></button>';
                  }).join('') +
                '</div>' +
                '<span class="small text-muted">' +
                  '<i class="bi bi-mouse me-1"></i>' +
                  (isEn
                    ? 'Tip: Scroll your mouse wheel over this presentation or use Left/Right arrows to switch role slides.'
                    : 'Mẹo: Cuộn con lăn chuột trên khung trình chiếu hoặc bấm phím mũi tên Trái/Phải để chuyển slide nghiệp vụ.') +
                '</span>' +
              '</div>' +
              '<div class="d-flex align-items-center gap-2">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-slide-step="-1"><i class="bi bi-chevron-left"></i> ' + (isEn ? 'Prev Slide' : 'Slide trước') + '</button>' +
                '<span class="badge bg-primary-subtle text-primary-emphasis px-2 py-1 ip-num">' + (currentSlide + 1) + ' / ' + SLIDES.length + '</span>' +
                '<button type="button" class="btn btn-sm btn-primary" data-slide-step="1">' + (isEn ? 'Next Slide' : 'Slide tiếp') + ' <i class="bi bi-chevron-right"></i></button>' +
              '</div>' +
            '</div>' +
          '</div>';

        const deckEl = deckHost.querySelector('#lnd-slide-deck');
        const playBtn = deckHost.querySelector('#lnd-slide-play-btn');
        const wheelBtn = deckHost.querySelector('#lnd-slide-wheel-btn');

        if (playBtn) {
          playBtn.addEventListener('click', function () {
            isAutoPlay = !isAutoPlay;
            renderSlideDeckOnly();
          });
        }
        if (wheelBtn) {
          wheelBtn.addEventListener('click', function () {
            isWheelEnabled = !isWheelEnabled;
            renderSlideDeckOnly();
          });
        }

        if (deckEl) {
          let lastWheelTime = 0;
          deckEl.addEventListener('wheel', function (ev) {
            if (!isWheelEnabled) return;
            if (Math.abs(ev.deltaY) < 12) return;
            const now = Date.now();
            if (now - lastWheelTime < 420) {
              ev.preventDefault();
              return;
            }
            if (ev.deltaY > 0 && currentSlide < SLIDES.length - 1) {
              ev.preventDefault();
              lastWheelTime = now;
              currentSlide++;
              renderSlideDeckOnly();
            } else if (ev.deltaY < 0 && currentSlide > 0) {
              ev.preventDefault();
              lastWheelTime = now;
              currentSlide--;
              renderSlideDeckOnly();
            }
          }, { passive: false });

          deckEl.addEventListener('keydown', function (ev) {
            if (ev.key === 'ArrowRight') {
              ev.preventDefault();
              currentSlide = (currentSlide + 1) % SLIDES.length;
              renderSlideDeckOnly();
            } else if (ev.key === 'ArrowLeft') {
              ev.preventDefault();
              currentSlide = (currentSlide - 1 + SLIDES.length) % SLIDES.length;
              renderSlideDeckOnly();
            }
          });
        }
      }

      root.innerHTML =
        '<header class="lnd-navbar">' +
          '<div class="container py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">' +
            '<a href="index.html" class="d-inline-flex align-items-center gap-2 text-decoration-none fw-bold fs-5 text-body">' +
              '<span style="width:30px;height:30px;display:inline-block">' + IP.Layout.LOGO_SVG + '</span>' +
              '<span>InvoicePilot</span>' +
              '<span class="badge bg-primary-subtle text-primary-emphasis small" style="font-size:0.7rem;">B2B FinTech</span>' +
            '</a>' +
            '<button class="btn btn-outline-secondary btn-sm d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#lnd-nav-collapse" aria-expanded="false" aria-label="Mở menu">' +
              '<i class="bi bi-list"></i>' +
            '</button>' +
            '<div class="collapse d-lg-flex align-items-center justify-content-between flex-grow-1 ms-lg-4" id="lnd-nav-collapse">' +
              '<nav class="d-flex flex-column flex-lg-row gap-3 my-2 my-lg-0" aria-label="Điều hướng trang giới thiệu">' +
                '<a href="#slide-trinh-chieu" class="text-decoration-none text-body fw-medium small">' + (isEn ? 'Role Slide Deck' : 'Slide Nghiệp vụ') + '</a>' +
                '<a href="#van-de" class="text-decoration-none text-body fw-medium small">' + (isEn ? 'AR Challenges' : 'Bài toán Công nợ') + '</a>' +
                '<a href="#vai-tro" class="text-decoration-none text-body fw-medium small">' + (isEn ? '4 Role Accounts' : '4 Phân hệ Nghiệp vụ') + '</a>' +
                '<a href="#ai" class="text-decoration-none text-body fw-medium small">' + (isEn ? 'AI Assistants' : 'Trợ lý AI') + '</a>' +
              '</nav>' +
              '<div class="d-flex align-items-center gap-2 mt-2 mt-lg-0 flex-wrap">' +
                '<button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" data-lnd-action="open-fx-modal" title="Bảng tỷ giá USD/VND theo từng ngày">' +
                  '<i class="bi bi-currency-exchange text-warning"></i> <span class="small ip-num">1$ = ' + fxRate.toLocaleString('en-US') + '₫</span>' +
                '</button>' +
                '<button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" id="lnd-lang-btn" data-lnd-action="toggle-lang">' +
                  '<i class="bi bi-translate"></i> <span class="fw-bold small">' + (isEn ? 'EN · USD' : 'VI · VND') + '</span>' +
                '</button>' +
                '<button type="button" class="ip-icon-btn" id="lnd-theme-btn" aria-label="Chuyển chế độ Sáng hoặc Tối">' +
                  '<i class="bi ' + (isDark ? 'bi-sun' : 'bi-moon-stars') + '"></i>' +
                '</button>' +
                '<button type="button" class="btn btn-warning btn-sm fw-bold text-dark" data-lnd-action="skip-landing">' +
                  '<i class="bi bi-fast-forward-fill"></i> ' + (isEn ? 'Skip Landing Page' : 'Bỏ qua Landing Page') +
                '</button>' +
                (session
                  ? '<a href="' + IP.Routes.homeForRole(session.role) + '" class="btn btn-primary btn-sm"><i class="bi bi-arrow-right-circle"></i> ' + (isEn ? ('Workspace (' + IP.Fmt.roleLabel(session.role) + ')') : ('Vào bàn làm việc (' + IP.Utils.escapeHtml(IP.Fmt.roleLabel(session.role)) + ')')) + '</a>'
                  : '<button type="button" class="btn btn-primary btn-sm" data-lnd-action="open-login-popup"><i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? 'Sign In (Pop-up)' : 'Đăng nhập (Pop-up)') + '</button>') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</header>' +

        '<section class="lnd-hero" id="slide-trinh-chieu">' +
          '<div class="container">' +
            '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">' +
              '<div class="form-check mb-0">' +
                '<input class="form-check-input" type="checkbox" id="lnd-skip-role-intro-chk" ' + (skipLanding ? 'checked' : '') + '>' +
                '<label class="form-check-label small fw-semibold" for="lnd-skip-role-intro-chk">' +
                  (isEn
                    ? 'Quick option: Skip per-role welcome intro after signing in and go straight to workspace'
                    : 'Tùy chọn nhanh: Bỏ qua trang giới thiệu (Landing Page) của từng nghiệp vụ sau khi đăng nhập, vào thẳng bàn làm việc') +
                '</label>' +
              '</div>' +
              '<span class="small text-muted"><i class="bi bi-arrows-move me-1"></i>' + (isEn ? 'Auto-play every 5.5s or scroll mouse wheel to explore 4 roles' : 'Tự động chuyển sau 5,5 giây hoặc cuộn con lăn chuột để xem từng nghiệp vụ') + '</span>' +
            '</div>' +
            '<div id="lnd-slide-deck-host"></div>' +
          '</div>' +
        '</section>' +

        '<section class="lnd-section" id="van-de">' +
          '<div class="container">' +
            '<div class="mb-4">' +
              '<div class="ip-label-sm">Thực trạng quản trị công nợ B2B</div>' +
              '<h2 class="ip-h1">4 điểm nghẽn khiến doanh nghiệp bị động dòng tiền và kéo dài DSO</h2>' +
            '</div>' +
            '<div class="row g-3">' +
              [
                { code: 'P1', icon: 'bi-table', title: 'Sổ theo dõi hóa đơn phân mảnh', desc: 'Chứng từ hóa đơn GTGT và lịch sử thu tiền một phần nằm rời rạc trên nhiều bảng tính khiến kế toán khó xác định chính xác số dư thực thu.' },
                { code: 'P2', icon: 'bi-envelope-exclamation', title: 'Đôn đốc thu hồi nợ thủ công, thiếu nhất quán', desc: 'Kinh doanh tốn nhiều giờ soạn thư nhắc nợ, dễ bỏ sót kỳ hạn thanh toán và thiếu mẫu đối chiếu chuẩn mực cho từng giai đoạn quá hạn.' },
                { code: 'P3', icon: 'bi-diagram-3', title: 'Đứt gãy thông tin giữa Kế toán & Kinh doanh', desc: 'Ủy nhiệm chi về tài khoản ngân hàng chưa được đối chiếu kịp thời khiến Kinh doanh nhắc nhầm khách đã trả hoặc cấp vượt hạn mức tín dụng.' },
                { code: 'P4', icon: 'bi-graph-down', title: 'Thiếu công cụ dự báo dòng tiền ngắn hạn', desc: 'Ban Giám đốc thiếu bảng phân tích tuổi nợ (1–30, 31–60, 61–90, >90 ngày) và kịch bản dòng tiền 30–90 ngày để điều phối vốn lưu động.' }
              ].map(function (p) {
                return (
                  '<div class="col-md-6 col-lg-3">' +
                    '<div class="ip-card h-100 p-3">' +
                      '<div class="d-flex justify-content-between align-items-center mb-2">' +
                        '<span class="ip-kpi-icon"><i class="bi ' + p.icon + '"></i></span>' +
                        '<span class="badge bg-secondary-subtle text-body-secondary">' + p.code + '</span>' +
                      '</div>' +
                      '<h3 class="fs-6 fw-bold mb-2">' + p.title + '</h3>' +
                      '<p class="small text-muted mb-0">' + p.desc + '</p>' +
                    '</div>' +
                  '</div>'
                );
              }).join('') +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="lnd-section" id="vai-tro">' +
          '<div class="container">' +
            '<div class="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">' +
              '<div>' +
                '<div class="ip-label-sm">Phân quyền & Tài khoản theo nghiệp vụ</div>' +
                '<h2 class="ip-h1 mb-0">4 phân hệ nghiệp vụ chuyên biệt — Chỉ Admin có quyền cấp phát & điều chỉnh tài khoản</h2>' +
              '</div>' +
              '<span class="badge bg-primary-subtle text-primary-emphasis p-2">Mỗi nghiệp vụ đều có Slide giới thiệu riêng & Nút bỏ qua vào thẳng bàn làm việc</span>' +
            '</div>' +
            '<div class="row g-3">' +
              IP.Auth.ROLE_ACCOUNTS.map(function (r) {
                return (
                  '<div class="col-md-6 col-lg-3">' +
                    '<div class="ip-card h-100 p-3 d-flex flex-column justify-content-between">' +
                      '<div>' +
                        '<div class="d-flex justify-content-between align-items-center mb-2">' +
                          '<span class="badge ' + r.badgeClass + '">' + IP.Utils.escapeHtml(IP.Fmt.roleLabel(r.role)) + '</span>' +
                          '<span class="small fw-semibold text-muted">' + IP.Utils.escapeHtml(r.name) + '</span>' +
                        '</div>' +
                        '<h3 class="fs-5 fw-bold mb-2">' + (isEn ? ('Role: ' + IP.Fmt.roleLabel(r.role)) : ('Nghiệp vụ ' + IP.Utils.escapeHtml(r.label))) + '</h3>' +
                        '<p class="small text-muted mb-3">' + IP.Utils.escapeHtml(r.desc) + '</p>' +
                        '<div class="p-2 rounded border bg-body-tertiary font-monospace small mb-3" style="font-size:0.76rem;">' +
                          '<div>TK: <strong class="text-primary">' + IP.Utils.escapeHtml(r.email) + '</strong></div>' +
                          '<div>MK: <strong>' + IP.Utils.escapeHtml(r.password) + '</strong></div>' +
                        '</div>' +
                      '</div>' +
                      '<div class="d-grid gap-2">' +
                        '<button type="button" class="btn btn-primary btn-sm" data-lnd-action="login-role" data-role="' + r.role + '">' +
                          '<i class="bi bi-box-arrow-in-right"></i> ' + (isEn ? ('Sign In: ' + IP.Fmt.roleLabel(r.role)) : ('Đăng nhập ' + IP.Utils.escapeHtml(r.label))) +
                        '</button>' +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-lnd-action="login-role-skip" data-role="' + r.role + '">' +
                          '<i class="bi bi-fast-forward"></i> ' + (isEn ? 'Direct Entry (Skip Intro)' : 'Vào thẳng (Bỏ qua giới thiệu)') +
                        '</button>' +
                      '</div>' +
                    '</div>' +
                  '</div>'
                );
              }).join('') +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="lnd-section" id="ai">' +
          '<div class="container">' +
            '<div class="ip-ai-panel p-4">' +
              '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">' +
                '<div>' +
                  '<span class="ip-ai-badge mb-2"><i class="bi bi-stars"></i> 3 Trợ lý AI Phân tích Nghiệp vụ & Chatbot Theo Vai trò</span>' +
                  '<h2 class="ip-h1 mb-1">Đầu vào &rarr; Kiểm tra quy tắc &rarr; Giải thích bằng chứng số liệu &rarr; Người dùng phê duyệt</h2>' +
                '</div>' +
                '<span class="badge bg-warning-subtle text-warning-emphasis">Phân tích trực tiếp trên sổ kế toán nội bộ</span>' +
              '</div>' +
              '<div class="row g-3">' +
                '<div class="col-md-4"><div class="bg-body border rounded p-3 h-100"><h3 class="fs-6 fw-bold">AI-1 · Kiểm tra hóa đơn bất thường</h3><p class="small text-muted mb-2">Đối chiếu ngày đáo hạn, thuế suất GTGT (0%/5%/8%/10%), hạn mức tín dụng còn lại và cảnh báo hóa đơn cao vượt ngưỡng trung bình lịch sử.</p><div class="small fw-semibold text-primary">Quyền kiểm soát: Chỉ điền gợi ý an toàn vào biểu mẫu, kế toán chủ động kiểm tra và bấm Lưu.</div></div></div>' +
                '<div class="col-md-4"><div class="bg-body border rounded p-3 h-100"><h3 class="fs-6 fw-bold">AI-2 · Soạn thông báo nhắc thanh toán</h3><p class="small text-muted mb-2">Tổng hợp mã hóa đơn, số tiền còn phải thu và ngày quá hạn thành thư đối chiếu Email/SMS Brandname theo 3 giọng điệu chuẩn B2B.</p><div class="small fw-semibold text-primary">Quyền kiểm soát: Đưa nội dung vào khung soạn thảo để chỉnh sửa, tuyệt đối không tự động gửi.</div></div></div>' +
                '<div class="col-md-4"><div class="bg-body border rounded p-3 h-100"><h3 class="fs-6 fw-bold">AI-3 · Tóm tắt & Dự báo dòng tiền</h3><p class="small text-muted mb-2">Tính toán mức độ tập trung dư nợ ở nhóm khách hàng lớn, cảnh báo kỳ hụt dòng tiền và phân tích 3 kịch bản thu hồi nợ quá hạn.</p><div class="small fw-semibold text-primary">Quyền kiểm soát: Lưu bản chụp báo cáo điều hành hoặc điều chỉnh trực tiếp giả định.</div></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<footer class="py-4 bg-body-tertiary">' +
          '<div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">' +
            '<div class="d-flex align-items-center gap-2">' +
              '<span style="width:24px;height:24px;display:inline-block">' + IP.Layout.LOGO_SVG + '</span>' +
              '<span class="fw-bold">InvoicePilot</span>' +
              '<span class="small text-muted">· Công ty Cổ phần Giải pháp Số hóa Hòa Bình (MST: 0108923456)</span>' +
            '</div>' +
            '<div class="small text-muted">Chuẩn hóa đơn điện tử Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC</div>' +
          '</div>' +
        '</footer>';

      renderSlideDeckOnly();

      if (isEn && IP.I18n) {
        IP.I18n.translateDOM(root);
      }

      _lndAutoTimer = setInterval(function () {
        if (document.body.getAttribute('data-page') !== 'landing') {
          clearInterval(_lndAutoTimer);
          _lndAutoTimer = null;
          return;
        }
        if (!isAutoPlay) return;
        currentSlide = (currentSlide + 1) % SLIDES.length;
        renderSlideDeckOnly();
        if (IP.I18n && IP.I18n.getLang() === 'en') {
          IP.I18n.translateDOM(root.querySelector('#lnd-slide-deck-host'));
        }
      }, 5500);

      const themeBtn = root.querySelector('#lnd-theme-btn');
      if (themeBtn) {
        themeBtn.addEventListener('click', function () {
          const cur = document.documentElement.getAttribute('data-theme');
          const next = cur === 'dark' ? 'light' : 'dark';
          IP.UI.applyTheme(next);
          themeBtn.innerHTML = '<i class="bi ' + (next === 'dark' ? 'bi-sun' : 'bi-moon-stars') + '"></i>';
        });
      }

      const skipChk = root.querySelector('#lnd-skip-role-intro-chk');
      if (skipChk) {
        skipChk.addEventListener('change', function () {
          IP.Auth.setSkipRoleLanding(Boolean(skipChk.checked));
        });
      }

      root.addEventListener('click', function (ev) {
        const slideTo = ev.target.closest('[data-slide-to]');
        if (slideTo) {
          currentSlide = Number(slideTo.getAttribute('data-slide-to')) || 0;
          renderSlideDeckOnly();
          if (IP.I18n && IP.I18n.getLang() === 'en') {
            IP.I18n.translateDOM(root.querySelector('#lnd-slide-deck-host'));
          }
          return;
        }
        const slideStep = ev.target.closest('[data-slide-step]');
        if (slideStep) {
          const delta = Number(slideStep.getAttribute('data-slide-step')) || 1;
          currentSlide = (currentSlide + delta + SLIDES.length) % SLIDES.length;
          renderSlideDeckOnly();
          if (IP.I18n && IP.I18n.getLang() === 'en') {
            IP.I18n.translateDOM(root.querySelector('#lnd-slide-deck-host'));
          }
          return;
        }

        const btn = ev.target.closest('[data-lnd-action]');
        if (!btn) return;
        const act = btn.getAttribute('data-lnd-action');
        const targetRole = btn.getAttribute('data-role') || '';

        if (act === 'toggle-lang') {
          if (IP.I18n) IP.I18n.toggleLang();
        } else if (act === 'open-fx-modal') {
          if (IP.I18n) IP.I18n.openExchangeRateModal();
        } else if (act === 'skip-landing') {
          IP.Auth.setSkipRoleLanding(true);
          const curSess = IP.Auth.getSession();
          if (curSess && curSess.role) {
            IP.Auth.setRoleLandingDismissed(curSess.role, true, true);
            const dest = IP.Routes.homeForRole(curSess.role);
            if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(dest);
            else window.location.href = dest;
          } else {
            const activeRole = SLIDES[currentSlide] && SLIDES[currentSlide].roleKey ? SLIDES[currentSlide].roleKey : 'accountant';
            IP.Auth.openLoginModal({ mandatory: true, role: activeRole });
          }
        } else if (act === 'open-login-popup') {
          IP.Auth.openLoginModal({ mandatory: !IP.Auth.getSession() });
        } else if (act === 'login-role') {
          IP.Auth.setSkipRoleLanding(false);
          IP.Auth.openLoginModal({ mandatory: !IP.Auth.getSession(), role: targetRole });
        } else if (act === 'login-role-skip') {
          IP.Auth.setSkipRoleLanding(true);
          const preset = IP.Auth.ROLE_ACCOUNTS.find(function (a) { return a.role === targetRole; });
          if (preset) {
            const res = IP.Auth.login(preset.email, preset.password, true);
            if (res.ok) {
              IP.Auth.setRoleLandingDismissed(targetRole, true, true);
              const dest = IP.Routes.homeForRole(targetRole);
              if (typeof window.IP_CanvasNav === 'function') window.IP_CanvasNav(dest);
              else window.location.href = dest;
            } else {
              IP.Auth.openLoginModal({ mandatory: true, role: targetRole });
            }
          }
        }
      });
    }
  });
})(window);
