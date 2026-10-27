/**
 * @owner CORE
 * @spec §2.6, §2.11, §10.4 Utilities, Bilingual (VI/EN) Engine & Daily USD/VND Exchange Rate (IP.Utils, IP.I18n, IP.Fmt)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});

  const LANG_KEY = 'invoicepilot.lang.v2';
  const FX_DATE_KEY = 'invoicepilot.fxdate.v2';
  // Reference rate anchored on Vietcombank & State Bank of Vietnam USD/VND rate (25,610 - 26,020 VND/USD, mid 25,815)
  const BASE_USD_VND_RATE = 25815;

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function uid(prefix) {
    const p = prefix || 'id';
    const rand = Math.random().toString(36).substring(2, 7);
    const ts = Date.now().toString(36).slice(-4);
    return p + '_' + ts + rand;
  }

  function debounce(fn, wait) {
    let t = null;
    return function () {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait || 200);
    };
  }

  function getQueryParams() {
    const params = {};
    const search = window.location.search || '';
    const usp = new URLSearchParams(search);
    usp.forEach(function (val, key) {
      params[key] = val;
    });
    return params;
  }

  function setQueryParams(updates, replace) {
    const usp = new URLSearchParams(window.location.search || '');
    Object.keys(updates || {}).forEach(function (k) {
      const v = updates[k];
      if (v === null || v === undefined || v === '') {
        usp.delete(k);
      } else {
        usp.set(k, String(v));
      }
    });
    const qs = usp.toString();
    const newUrl = window.location.pathname + (qs ? '?' + qs : '') + (window.location.hash || '');
    try {
      if (replace !== false && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', newUrl);
      } else if (window.history && window.history.pushState) {
        window.history.pushState(null, '', newUrl);
      }
    } catch (e) {}
  }

  // =========================================================================
  // Language & Daily USD/VND Exchange Rate Engine (IP.I18n)
  // =========================================================================
  function getLang() {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      return saved === 'en' ? 'en' : 'vi';
    } catch (e) {
      return 'vi';
    }
  }

  function getSelectedRateDate() {
    try {
      const saved = window.localStorage.getItem(FX_DATE_KEY);
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
    } catch (e) {}
    return (IP.Seed && typeof IP.Seed.todayISO === 'function')
      ? IP.Seed.todayISO()
      : new Date().toISOString().slice(0, 10);
  }

  function setSelectedRateDate(dateISO) {
    const clean = String(dateISO || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return;
    try {
      window.localStorage.setItem(FX_DATE_KEY, clean);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('ip:langchange', {
      detail: { lang: getLang(), fxDate: clean, rate: getExchangeRateForDate(clean) }
    }));
  }

  /**
   * Computes a deterministic daily USD/VND exchange rate for any calendar date YYYY-MM-DD.
   * Each date has its own realistic Vietcombank/SBV market rate between 25,460 and 26,020 VND/USD.
   */
  function getExchangeRateForDate(dateISO) {
    const targetDate = (dateISO && /^\d{4}-\d{2}-\d{2}/.test(String(dateISO)))
      ? String(dateISO).slice(0, 10)
      : getSelectedRateDate();

    const parts = targetDate.split('-');
    const y = Number(parts[0] || 2026);
    const m = Number(parts[1] || 10);
    const d = Number(parts[2] || 24);
    const daySeed = y * 372 + m * 31 + d;
    const wave1 = Math.sin(daySeed * 0.43) * 145;
    const wave2 = Math.cos(daySeed * 0.19) * 65;
    const rawRate = BASE_USD_VND_RATE + Math.round(wave1 + wave2);
    // Round to nearest 5 VND like commercial bank FX boards
    return Math.round(rawRate / 5) * 5;
  }

  function getDailyRateTable(daysCount) {
    const count = Number(daysCount || 14);
    const baseToday = (IP.Seed && typeof IP.Seed.todayISO === 'function')
      ? IP.Seed.todayISO()
      : new Date().toISOString().slice(0, 10);
    const rows = [];
    for (let i = 0; i < count; i++) {
      const dateStr = (IP.Seed && typeof IP.Seed.addDays === 'function')
        ? IP.Seed.addDays(-i, baseToday)
        : baseToday;
      const rate = getExchangeRateForDate(dateStr);
      const prevDate = (IP.Seed && typeof IP.Seed.addDays === 'function')
        ? IP.Seed.addDays(-(i + 1), baseToday)
        : baseToday;
      const prevRate = getExchangeRateForDate(prevDate);
      rows.push({
        date: dateStr,
        buyTransfer: rate - 190,
        midRate: rate,
        sellRate: rate + 205,
        delta: rate - prevRate
      });
    }
    return rows;
  }

  function formatNumberVND(n) {
    const num = Math.round(Number(n || 0));
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    return sign + String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatNumberEN(n, decimals) {
    const dec = decimals !== undefined ? decimals : 0;
    const num = Number(n || 0);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }

  function formatNumber(n) {
    if (getLang() === 'en') {
      return formatNumberEN(Math.round(Number(n || 0)), 0);
    }
    return formatNumberVND(n);
  }

  function convertVNDToUSD(amountVND, dateISO) {
    const rate = getExchangeRateForDate(dateISO);
    return Number(amountVND || 0) / (rate || BASE_USD_VND_RATE);
  }

  function formatCurrency(amount, compact, dateISO) {
    const num = Math.round(Number(amount || 0));
    const lang = getLang();

    if (lang === 'en') {
      const rate = getExchangeRateForDate(dateISO);
      const usd = num / rate;
      const absUsd = Math.abs(usd);
      const sign = usd < 0 ? '-' : '';
      if (compact) {
        if (absUsd >= 1000000) {
          return sign + '$' + (absUsd / 1000000).toFixed(2) + 'M';
        }
        if (absUsd >= 1000) {
          return sign + '$' + (absUsd / 1000).toFixed(1) + 'K';
        }
      }
      return sign + '$' + formatNumberEN(absUsd, 2);
    }

    if (compact) {
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      if (abs >= 1000000000) {
        return sign + (abs / 1000000000).toFixed(2).replace('.', ',') + '\u00A0tỷ\u00A0₫';
      }
      if (abs >= 1000000) {
        return sign + (abs / 1000000).toFixed(1).replace(',0', '').replace('.', ',') + '\u00A0tr\u00A0₫';
      }
    }
    return formatNumberVND(num) + '\u00A0₫';
  }

  function formatPercent(val) {
    const num = Number(val || 0);
    const rounded = Math.round(num * 10) / 10;
    if (getLang() === 'en') {
      return rounded.toString() + '%';
    }
    return rounded.toString().replace('.', ',') + '%';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const clean = String(iso).slice(0, 10);
    const parts = clean.split('-');
    if (parts.length !== 3) return escapeHtml(iso);
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return formatDate(iso);
    const pad = function (x) { return String(x).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatRelative(iso) {
    const isEn = getLang() === 'en';
    if (!iso) return isEn ? 'None' : 'Chưa có';
    const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    if (isNaN(d.getTime())) return formatDate(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1 && diffMin > -1) return isEn ? 'Just now' : 'Vừa xong';
    if (diffMin > 0) {
      if (diffMin < 60) return isEn ? (diffMin + ' mins ago') : (diffMin + ' phút trước');
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return isEn ? (diffHours + ' hours ago') : (diffHours + ' giờ trước');
      const diffDays = Math.round(diffHours / 24);
      if (diffDays <= 30) return isEn ? (diffDays + ' days ago') : (diffDays + ' ngày trước');
      return formatDate(iso);
    } else {
      const futureDays = Math.round(Math.abs(diffMin) / (60 * 24));
      if (futureDays === 0) return isEn ? 'Due today' : 'Trong hôm nay';
      return isEn ? ('In ' + futureDays + ' days') : ('Còn ' + futureDays + ' ngày');
    }
  }

  const STATUS_LABELS_VI = {
    draft: 'Nháp',
    sent: 'Đã gửi',
    partial: 'Thanh toán một phần',
    overdue: 'Quá hạn',
    paid: 'Đã thanh toán',
    voided: 'Đã hủy',
    archived: 'Đã lưu trữ',
    pending: 'Chờ đối chiếu',
    confirmed: 'Đã xác nhận',
    rejected: 'Đã từ chối',
    scheduled: 'Đã lên lịch',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
    active: 'Hoạt động',
    invited: 'Đã mời',
    disabled: 'Tạm khóa',
    watching: 'Đang theo dõi',
    closed: 'Đã đóng',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp'
  };

  const STATUS_LABELS_EN = {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partially Paid',
    overdue: 'Overdue',
    paid: 'Paid',
    voided: 'Voided',
    archived: 'Archived',
    pending: 'Pending Match',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    scheduled: 'Scheduled',
    failed: 'Failed',
    cancelled: 'Cancelled',
    active: 'Active',
    invited: 'Invited',
    disabled: 'Suspended',
    watching: 'Monitoring',
    closed: 'Closed',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  const ROLE_LABELS_VI = {
    accountant: 'Kế toán',
    sales: 'Kinh doanh',
    manager: 'Quản lý',
    admin: 'Quản trị viên'
  };

  const ROLE_LABELS_EN = {
    accountant: 'Accountant',
    sales: 'Sales',
    manager: 'Manager',
    admin: 'Administrator'
  };

  const METHOD_LABELS_VI = {
    transfer: 'Chuyển khoản',
    cash: 'Tiền mặt',
    ewallet: 'Ví điện tử'
  };

  const METHOD_LABELS_EN = {
    transfer: 'Bank Transfer',
    cash: 'Cash',
    ewallet: 'Corporate E-Wallet'
  };

  const TONE_LABELS_VI = {
    friendly: 'Thân thiện',
    formal: 'Trang trọng',
    firm: 'Cứng rắn lịch sự'
  };

  const TONE_LABELS_EN = {
    friendly: 'Friendly',
    formal: 'Formal',
    firm: 'Firm & Polite'
  };

  const CHANNEL_LABELS_VI = {
    email: 'Email',
    sms: 'SMS'
  };

  const CHANNEL_LABELS_EN = {
    email: 'Email',
    sms: 'SMS'
  };

  // Exact & Phrase Translation Dictionary (VI -> EN)
  const EXACT_DICT = {
    'Chuyển đến nội dung chính': 'Skip to main content',
    'Hệ thống 19 Màn hình': '19-Screen B2B Suite',
    'Điều hướng màn hình:': 'Navigate Screen:',
    'Mở Pop-up Đăng nhập / Đổi tài khoản': 'Sign In / Switch Role Account',
    'Hóa đơn': 'Invoices',
    'Tạo hóa đơn': 'Create Invoice',
    'Sửa hóa đơn': 'Edit Invoice',
    'Đối chiếu thanh toán': 'Payment Reconciliation',
    'Công nợ khách hàng': 'Customer Balances',
    'Nhắc thanh toán': 'Payment Reminders',
    'Chi tiết hóa đơn': 'Invoice Detail',
    'Tra cứu chi tiết hóa đơn': 'Invoice Detail Lookup',
    'Tổng quan công nợ': 'Receivables Overview',
    'Hóa đơn quá hạn': 'Overdue Invoices',
    'Dự báo dòng tiền': 'Cashflow Forecast',
    'Khách hàng': 'Customers',
    'Quản lý khách hàng': 'Customer Management',
    'Người dùng': 'Users',
    'Quản lý người dùng': 'User Management',
    'Cấu hình hóa đơn': 'Invoice Settings',
    'Thông báo': 'Notifications',
    'Trung tâm thông báo': 'Notification Center',
    'Hồ sơ cá nhân': 'My Profile',
    'Giới thiệu sản phẩm': 'Product Introduction',
    'Đăng nhập': 'Sign In',
    'Đăng xuất': 'Sign Out',
    'Quên mật khẩu': 'Forgot Password',
    'Quên mật khẩu?': 'Forgot password?',
    'Không có quyền truy cập': 'Access Denied (403)',
    'Không tìm thấy trang': 'Page Not Found (404)',
    'Đã xác thực': 'Verified',
    'Tài khoản & Hệ thống': 'Account & System',
    'Giới thiệu nghiệp vụ': 'Role Intro Deck',
    'Mở trang giới thiệu nghiệp vụ': 'Open Role Intro Slide Deck',
    'Đổi tài khoản': 'Switch Account',
    'Đăng nhập tài khoản nghiệp vụ khác': 'Sign in with another role account',
    'Quản trị & Cấp phát tài khoản': 'User & Role Administration',
    'Về Landing Page tổng quan': 'Back to Main Landing Page',
    'Về trang giới thiệu': 'Back to Landing Page',
    'Thông tin cá nhân': 'Personal Profile',
    'Bảo mật': 'Security & Password',
    'Giao diện & Dữ liệu': 'Appearance, Language & Data',
    'Chế độ giao diện (Sáng / Tối)': 'Theme Appearance (Light / Dark / System)',
    'Giao diện Sáng (Light)': 'Light Mode',
    'Nền giấy ấm dịu mắt cho làm việc ban ngày': 'Warm paper canvas optimized for daytime accounting work',
    'Giao diện Tối (Dark)': 'Dark Mode',
    'Độ tương phản chuẩn cho môi trường thiếu sáng': 'High-contrast moss slate surface for low-light environments',
    'Theo thiết bị (System)': 'System Default',
    'Tự động đồng bộ theo hệ điều hành của bạn': 'Automatically syncs with your operating system preference',
    'Ngôn ngữ & Đơn vị tiền tệ (VND / USD theo ngày)': 'Language & Daily Currency Conversion (VND / USD)',
    'Sao lưu & Khôi phục Dữ liệu Hệ thống': 'System Data Backup & Recovery',
    'Xuất sao lưu dữ liệu (.json)': 'Export Backup Data (.json)',
    'Khôi phục dữ liệu chuẩn ban đầu': 'Restore Default Enterprise Data',
    'Lưu thông tin': 'Save Profile',
    'Cập nhật mật khẩu': 'Update Password',
    'Họ và tên': 'Full Name',
    'Địa chỉ Email (Chỉ đọc)': 'Work Email (Read-only)',
    'Số điện thoại liên hệ': 'Contact Phone Number',
    'Chức danh / Ghi chú công việc': 'Job Title / Department Notes',
    'Mật khẩu hiện tại': 'Current Password',
    'Mật khẩu mới (Tối thiểu 6 ký tự)': 'New Password (Min. 6 characters)',
    'Xác nhận mật khẩu mới': 'Confirm New Password',
    'TK Nghiệp vụ chính': 'Core Role Account',
    'Tổng phải thu': 'Total Receivables',
    'Tổng công nợ phải thu': 'Total Accounts Receivable',
    'Tổng phải thu trong kỳ': 'Period Total Receivables',
    'Tổng quá hạn': 'Total Overdue',
    'Dư nợ quá hạn': 'Overdue Balance',
    'Đến hạn trong 7 ngày': 'Due Within 7 Days',
    'Đã thu 30 ngày qua': 'Collected (Last 30 Days)',
    'Chỉ tính giao dịch đã xác nhận': 'Confirmed bank & manual collections only',
    'Khách hàng rủi ro cao': 'High-Risk Customers',
    'Dự kiến thu 30 ngày tới': 'Expected Collection (Next 30 Days)',
    'Dự kiến thu 30 ngày': 'Expected in 30 Days',
    'Từ các hóa đơn sắp đáo hạn': 'From upcoming due invoices',
    'Số hóa đơn': 'Invoice No.',
    'Ngày phát hành': 'Issue Date',
    'Hạn thanh toán': 'Due Date',
    'Tổng tiền': 'Total Amount',
    'Đã thu': 'Collected',
    'Còn lại': 'Remaining',
    'Còn phải thu': 'Remaining Balance',
    'Trạng thái': 'Status',
    'Thao tác': 'Actions',
    'Chọn': 'Select',
    'Tìm kiếm nhanh': 'Quick Search',
    'Tất cả trạng thái': 'All Statuses',
    'Tất cả khách hàng': 'All Customers',
    'Kỳ phát hành': 'Issue Period',
    'Tất cả': 'All',
    '30 ngày qua': 'Last 30 Days',
    'Quý này (90 ngày)': 'This Quarter (90 Days)',
    'Tháng này (30 ngày)': 'This Month (30 Days)',
    'Năm nay': 'This Year',
    'Toàn bộ': 'All Time',
    'Xóa tất cả bộ lọc': 'Clear All Filters',
    'Xóa bộ lọc': 'Clear Filters',
    'Đối chiếu NH': 'Bank Match',
    'Ghi nhận thanh toán': 'Record Payment',
    'Xem chi tiết': 'View Details',
    'Chỉnh sửa hóa đơn': 'Edit Invoice',
    'Kiểm tra bằng AI-1': 'Run AI-1 Anomaly Check',
    'Nhân bản thành nháp': 'Duplicate as Draft',
    'Lưu trữ': 'Archive',
    'Đã tất toán': 'Settled in Full',
    'Hủy': 'Cancel',
    'Hủy bỏ': 'Cancel',
    'Xác nhận': 'Confirm',
    'Đóng': 'Close',
    'Làm mới': 'Refresh',
    'Làm mới sao kê': 'Refresh Bank Feed',
    'Danh sách hóa đơn': 'Invoice List',
    'Quay lại danh sách': 'Back to Invoice List',
    'Xem trước bản in': 'Print Preview',
    'Lưu & Gửi hóa đơn': 'Save & Issue Invoice',
    'Lưu bản nháp': 'Save Draft',
    'Thêm dòng hàng': 'Add Line Item',
    'Thêm khách hàng': 'Add Customer',
    'Tìm nâng cao': 'Advanced Lookup',
    'Tổng hợp thanh toán': 'Payment Summary',
    'Cộng tiền hàng:': 'Subtotal:',
    'Chiết khấu:': 'Discount:',
    'Thuế GTGT (VAT):': 'VAT Tax:',
    'Tổng thanh toán:': 'Total Payable:',
    'Đã thu xác nhận:': 'Confirmed Collected:',
    'Còn phải thu:': 'Balance Due:',
    'Chờ đối chiếu': 'Pending Match',
    'Đã đối chiếu': 'Reconciled',
    'Sai lệch': 'Discrepancies',
    'Sai lệch / Từ chối': 'Discrepancies / Rejected',
    'Xác nhận đối chiếu': 'Confirm Reconciliation',
    'Đánh dấu Sai lệch': 'Flag Discrepancy',
    'Từ chối giao dịch': 'Reject Transaction',
    'Hoàn tác đối chiếu': 'Undo Reconciliation',
    'Tạo nhắc thanh toán': 'Create Reminder',
    'Lên lịch gửi': 'Schedule Send',
    'Gửi ngay': 'Send Now',
    'Gửi lại': 'Resend',
    'Soạn bằng AI': 'Draft with AI-2',
    'Dùng mẫu thủ công': 'Use Manual Template',
    'Dùng bản nháp': 'Use AI Draft',
    'Chỉnh sửa': 'Edit',
    'Từ chối': 'Discard',
    'Tạo lại': 'Regenerate',
    'Bỏ qua': 'Dismiss',
    'Kiểm tra lại': 'Re-check',
    'Thử lại': 'Retry',
    'Áp dụng gợi ý': 'Apply Safe Fixes',
    'Tự chỉnh sửa': 'Edit Manually',
    'Lưu báo cáo': 'Save Report Snapshot',
    'Đổi giả định': 'Adjust Assumptions',
    'Khôi phục mặc định': 'Reset Defaults',
    'Cơ sở': 'Baseline',
    'Thận trọng': 'Conservative',
    'Lạc quan': 'Optimistic',
    'Mời người dùng': 'Create / Invite User',
    'Thêm mẫu nhắc': 'Add Reminder Template',
    'Lưu thay đổi': 'Save Changes',
    'Hoàn tác thay đổi': 'Discard Changes',
    'Đánh dấu tất cả đã đọc': 'Mark All as Read',
    'Xem tất cả': 'View All',
    'Trợ lý AI': 'AI Assistant',
    'Bài toán Công nợ': 'AR Challenges',
    '4 Phân hệ Nghiệp vụ': '4 Role Modules',
    'Quy trình Chuẩn': 'Standard Workflow',
    'Hóa đơn đúng hạn. Dòng tiền chủ động.': 'On-Time Invoices. Proactive Cash Flow.',
    'Đăng nhập & Chọn nghiệp vụ': 'Sign In & Select Role',
    'Xem tài khoản 4 nghiệp vụ': 'View 4 Role Accounts'
  };

  // Ordered Phrase Replacements for natural English sentence structure
  const PHRASE_RULES = [
    [/Quá hạn (\d+) ngày/g, '$1 days overdue'],
    [/quá hạn (\d+) ngày/g, '$1 days overdue'],
    [/Còn (\d+) ngày/g, 'Due in $1 days'],
    [/Trễ nhất (\d+) ngày/g, 'Max $1 days late'],
    [/Hiển thị (\d+)–(\d+) trong (\d+) bản ghi/g, 'Showing $1–$2 of $3 records'],
    [/Đã chọn (\d+) hóa đơn/g, '$1 invoices selected'],
    [/Có (\d+) vấn đề cần chú ý/g, '$1 issues require attention'],
    [/Có (\d+) điểm cần lưu ý/g, '$1 findings require review'],
    [/Thông báo \((\d+) chưa đọc\)/g, 'Notifications ($1 unread)'],
    [/Thông báo gần đây \((\d+) chưa đọc\)/g, 'Recent Notifications ($1 unread)'],
    [/Xóa thông báo đã đọc \((\d+)\)/g, 'Delete Read ($1)'],
    [/Tải thêm thông báo \((\d+)\)/g, 'Load More ($1)'],
    [/Xuất CSV \((\d+)\)/g, 'Export CSV ($1)'],
    [/Lịch sử thanh toán \((\d+)\)/g, 'Payment History ($1)'],
    [/Lịch sử nhắc thanh toán \((\d+)\)/g, 'Reminder History ($1)'],
    [/Hóa đơn đang mở \((\d+)\)/g, 'Open Invoices ($1)'],
    [/Hóa đơn gần đây \((\d+)\)/g, 'Recent Invoices ($1)'],
    [/Hóa đơn chưa tất toán \((\d+)\)/g, 'Unpaid Invoices ($1)'],
    [/Báo cáo AI đã lưu gần đây \((\d+)\)/g, 'Recently Saved AI Reports ($1)'],
    [/Kịch bản đã lưu \((\d+)\)/g, 'Saved Forecast Scenarios ($1)'],
    [/2\. Danh mục hàng hóa & Dịch vụ \((\d+) dòng\)/g, '2. Line Items & Services ($1 items)'],
    [/Mô tả hàng hóa \/ dịch vụ #(\d+)/g, 'Item / Service Description #$1'],
    [/3\. Mẫu nhắc thanh toán \((\d+) mẫu\)/g, '3. Reminder Templates ($1 templates)'],
    [/2\. Nhật ký & Ghi chú xử lý \((\d+)\)/g, '2. Follow-up Log & Notes ($1)'],
    [/Chờ đối chiếu \((\d+) GD\)/g, 'Pending Match ($1 TX)'],
    [/Đã đối chiếu \((\d+) GD\)/g, 'Reconciled ($1 TX)'],
    [/Chờ đối chiếu \((\d+)\)/g, 'Pending ($1)'],
    [/Đã đối chiếu \((\d+)\)/g, 'Reconciled ($1)'],
    [/Sai lệch \((\d+)\)/g, 'Discrepancies ($1)'],
    [/Quá hạn \((\d+) HĐ\)/g, 'Overdue ($1 Inv)'],
    [/Bấm để lọc (\d+) hóa đơn quá hạn/g, 'Click to filter $1 overdue invoices'],
    [/(\d+) hóa đơn cần nhắc sớm/g, '$1 invoices due soon'],
    [/(\d+) khách hàng/g, '$1 customers'],
    [/(\d+) doanh nghiệp/g, '$1 companies'],
    [/(\d+) tài khoản/g, '$1 accounts'],
    [/(\d+) hóa đơn/g, '$1 invoices'],
    [/(\d+) giao dịch/g, '$1 transactions'],
    [/(\d+) đợt thanh toán/g, '$1 payments'],
    [/(\d+) ngày/g, '$1 days'],
    [/Độ tin cậy: Cao/g, 'Confidence: High'],
    [/Độ tin cậy: Trung bình/g, 'Confidence: Medium'],
    [/Độ tin cậy: Thấp/g, 'Confidence: Low'],
    [/Rủi ro Cao/g, 'High Risk'],
    [/Rủi ro Trung bình/g, 'Medium Risk'],
    [/Rủi ro Thấp/g, 'Low Risk'],
    [/Vì sao có kết quả này\?/g, 'Why this AI analysis?'],
    [/Dữ liệu đã dùng:/g, 'Data Analyzed:'],
    [/Quy tắc & Giả định:/g, 'Rules & Assumptions:'],
    [/Bằng chứng số liệu:/g, 'Numeric Evidence:'],
    [/Trợ lý AI \(Phân tích Nội bộ\)/g, 'AI Assistant (Internal Rule Engine)'],
    [/Trợ lý AI \(mô phỏng\)/g, 'AI Assistant (Internal Engine)'],
    [/Chế độ kiểm thử:/g, 'Test Scenario:'],
    [/Tùy chọn demo:/g, 'Test Scenario:'],
    [/Bình thường/g, 'Normal Data'],
    [/Thiếu dữ liệu/g, 'Insufficient Data'],
    [/Lỗi xử lý/g, 'Processing Error'],
    [/Kết quả phân tích từ sổ dữ liệu hiện hành, vui lòng kiểm tra trước khi áp dụng\./g, 'Generated from live ledger records; please review before applying.'],
    [/Kết quả được tạo từ dữ liệu demo, hãy kiểm tra trước khi áp dụng\./g, 'Generated from live ledger records; please review before applying.'],
    [/Phân hệ Kế toán/g, 'Accounting Module'],
    [/Phân hệ Kinh doanh/g, 'Sales Module'],
    [/Phân hệ Quản lý/g, 'Management Module'],
    [/Phân hệ Quản trị viên/g, 'Admin Module'],
    [/Nghiệp vụ Kế toán/g, 'Accounting Operations'],
    [/Nghiệp vụ Kinh doanh/g, 'B2B Sales Operations'],
    [/Nghiệp vụ Quản lý/g, 'CFO & Management'],
    [/Nghiệp vụ Quản trị viên/g, 'System Administration'],
    [/Quản lý danh mục hóa đơn, theo dõi tiến độ thu tiền và đối chiếu công nợ khách hàng\./g, 'Manage e-invoices, track collection progress, and reconcile customer receivables.'],
    [/Lập hóa đơn mới hoặc chỉnh sửa thông tin, kiểm tra bất thường bằng AI-1 trước khi phát hành\./g, 'Create or edit VAT invoices and run AI-1 anomaly checks before issuance.'],
    [/Khớp giao dịch sao kê ngân hàng với hóa đơn mở, xử lý chênh lệch và hoàn tác đối chiếu khi cần\./g, 'Match bank statement transactions to open invoices, resolve discrepancies, or undo matches.'],
    [/Theo dõi số dư phải thu, phân tích tuổi nợ từng khách hàng và chủ động gửi nhắc thanh toán\./g, 'Monitor customer receivables, analyze aging buckets, and send proactive payment reminders.'],
    [/Soạn thông điệp nhắc hạn lịch sự bằng AI-2 hoặc mẫu chuẩn, quản lý lịch gửi và theo dõi lịch sử phản hồi\./g, 'Draft polite B2B payment reminders with AI-2 or templates, schedule dispatches, and track responses.'],
    [/Theo dõi sức khỏe dòng tiền, phân tích tuổi nợ, chỉ số DSO và tóm tắt điều hành bằng AI-3\./g, 'Monitor cashflow health, aging buckets, DSO metrics, and executive AI-3 summaries.'],
    [/Đánh giá mức rủi ro theo công thức luật tường minh, giao phụ trách Kinh doanh và theo dõi ghi chú xử lý\./g, 'Evaluate overdue risk via transparent rule formulas, assign Sales owners, and log follow-up notes.'],
    [/Mô phỏng dòng tiền thu về theo kỳ hạn 30\/60\/90 ngày và điều chỉnh trực tiếp các giả định thu hồi nợ\./g, 'Project 30/60/90-day cash inflows and dynamically adjust overdue recovery assumptions.'],
    [/Quản trị danh mục doanh nghiệp đối tác, hạn mức tín dụng, kỳ hạn chuẩn và phân công chuyên viên Kinh doanh\./g, 'Manage B2B customer master data, credit limits, payment terms, and assigned Sales owners.'],
    [/Đặc quyền dành riêng cho Quản trị viên: Tạo mới, chỉnh sửa, phân quyền, khóa\/mở khóa hoặc xóa tài khoản của các nghiệp vụ khác\./g, 'Administrator Exclusive: Create, edit, assign roles, suspend/unsuspend, or delete accounts across all business roles.'],
    [/Thiết lập thông tin pháp nhân, quy tắc đánh số hóa đơn, mẫu nhắc thanh toán và công tắc trợ lý AI\./g, 'Configure legal entity info, invoice numbering rules, reminder templates, and AI module switches.'],
    [/Đầy đủ:/g, 'Full amount:'],
    [/Trước thuế:/g, 'Subtotal:'],
    [/Tất cả nhóm tuổi nợ/g, 'All Aging Buckets'],
    [/Tất cả phụ trách/g, 'All Owners'],
    [/Đang hoạt động/g, 'Active'],
    [/Tổng dư nợ giảm dần/g, 'Highest Balance First'],
    [/Quá hạn cao nhất/g, 'Highest Overdue First'],
    [/Tên khách hàng A–Z/g, 'Customer Name A–Z'],
    [/Người liên hệ/g, 'Contact Person'],
    [/Tổng dư nợ/g, 'Total Balance'],
    [/Trong đó quá hạn/g, 'Of Which Overdue'],
    [/Phân bổ tuổi nợ/g, 'Aging Breakdown'],
    [/Thanh toán gần nhất/g, 'Last Payment'],
    [/Chưa có/g, 'None'],
    [/100% trong hạn/g, '100% Current'],
    [/Không còn dư nợ/g, 'Zero Balance'],
    [/Nhắc hạn/g, 'Remind'],
    [/Chi tiết/g, 'Details'],
    [/Cơ cấu tuổi nợ \(Aging Buckets\)/g, 'Receivables Aging Breakdown (USD)'],
    [/Dự kiến dòng tiền thu về 90 ngày tới/g, 'Projected 90-Day Cash Inflow (USD)'],
    [/Top 5 khách hàng có dư nợ cao nhất/g, 'Top 5 Customers by Outstanding Balance'],
    [/Hóa đơn quá hạn cần chú ý/g, 'Priority Overdue Invoices'],
    [/Mở trang Dự báo chi tiết →/g, 'Open Detailed Forecast →'],
    [/DSO \(Số ngày thu tiền BQ\)/g, 'DSO (Days Sales Outstanding)'],
    [/So với kỳ trước:/g, 'vs. Prior Period:'],
    [/Kỳ dự báo/g, 'Forecast Period'],
    [/Thu từ HĐ đến hạn/g, 'From Due Invoices'],
    [/Thu hồi quá hạn/g, 'Overdue Recovery'],
    [/Đã xác nhận \/ Chờ khớp/g, 'Confirmed / Pending'],
    [/Tổng kỳ/g, 'Period Total'],
    [/Lũy kế/g, 'Cumulative Cash'],
    [/Tổng cộng/g, 'Grand Total'],
    [/Tỷ lệ thu hồi nợ quá hạn \(%\)/g, 'Overdue Recovery Rate (%)'],
    [/Độ trễ thanh toán bình quân \(ngày\)/g, 'Average Payment Delay (Days)'],
    [/Tính cả khoản chờ đối chiếu ngân hàng/g, 'Include Pending Bank Reconciliations'],
    [/Mã KH/g, 'Cust. Code'],
    [/Tên doanh nghiệp/g, 'Company Name'],
    [/Mã số thuế/g, 'Tax ID (MST)'],
    [/Phụ trách KD/g, 'Sales Owner'],
    [/Dư nợ hiện tại/g, 'Current Balance'],
    [/Đăng nhập gần nhất/g, 'Last Login'],
    [/Ngày tạo/g, 'Created Date'],
    [/Tạo \/ Cấp tài khoản mới/g, 'Create Role Account'],
    [/1\. Thông tin công ty/g, '1. Company Info'],
    [/2\. Hóa đơn & Đánh số/g, '2. Invoice Numbering'],
    [/3\. Mẫu nhắc thanh toán/g, '3. Reminder Templates'],
    [/4\. AI & Dữ liệu hệ thống/g, '4. AI & System Data'],
    [/4\. AI & Dữ liệu demo/g, '4. AI & System Data']
  ];

  /**
   * Converts inline VND strings inside descriptive text (e.g., "66.960.000 ₫" or "1,48 tỷ ₫")
   * into USD using the daily rate when language is 'en'.
   */
  function convertInlineVNDInText(str, dateISO) {
    if (!str || getLang() !== 'en') return str;
    const rate = getExchangeRateForDate(dateISO);
    let out = String(str);

    // Match compact "1,48 tỷ ₫" or "412 tr ₫"
    out = out.replace(/(-?\d+(?:[.,]\d+)?)\s*tỷ\s*₫/gi, function (_, numStr) {
      const valVnd = parseFloat(numStr.replace(',', '.')) * 1000000000;
      const usd = valVnd / rate;
      return '$' + (usd >= 1000000 ? (usd / 1000000).toFixed(2) + 'M' : (usd / 1000).toFixed(1) + 'K');
    });
    out = out.replace(/(-?\d+(?:[.,]\d+)?)\s*tr(?:iệu)?\s*₫/gi, function (_, numStr) {
      const valVnd = parseFloat(numStr.replace(',', '.')) * 1000000;
      const usd = valVnd / rate;
      return '$' + (usd >= 1000 ? (usd / 1000).toFixed(1) + 'K' : usd.toFixed(2));
    });
    // Match full "66.960.000 ₫"
    out = out.replace(/(-?\d{1,3}(?:\.\d{3})+)\s*₫/g, function (_, numStr) {
      const rawVnd = Number(numStr.replace(/\./g, ''));
      if (isNaN(rawVnd)) return _;
      const usd = rawVnd / rate;
      return '$' + formatNumberEN(usd, 2);
    });
    return out;
  }

  function translateString(rawStr, dateISO) {
    if (!rawStr || getLang() !== 'en') return rawStr;
    const trimmed = String(rawStr).trim();
    if (!trimmed) return rawStr;

    let result = String(rawStr);
    if (EXACT_DICT[trimmed]) {
      result = rawStr.replace(trimmed, EXACT_DICT[trimmed]);
      return convertInlineVNDInText(result, dateISO);
    }

    for (let i = 0; i < PHRASE_RULES.length; i++) {
      result = result.replace(PHRASE_RULES[i][0], PHRASE_RULES[i][1]);
    }

    // Replace remaining exact keys if they appear as substrings after separators
    Object.keys(EXACT_DICT).forEach(function (k) {
      if (k.length >= 6 && result.includes(k)) {
        result = result.split(k).join(EXACT_DICT[k]);
      }
    });

    return convertInlineVNDInText(result, dateISO);
  }

  /**
   * Extracts a contextual ISO date (YYYY-MM-DD) from a table row or element if present
   * so that each invoice/payment row converts USD using its own issue/payment date!
   */
  function extractRowDateISO(el) {
    if (!el || !el.closest) return null;
    const row = el.closest('tr, .acc-tx-item, .acc-match-card, .lnd-slide-card, [data-fx-date]');
    if (!row) return null;
    if (row.getAttribute && row.getAttribute('data-fx-date')) {
      return row.getAttribute('data-fx-date');
    }
    const text = row.textContent || '';
    const m = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    if (m) {
      return m[3] + '-' + m[2] + '-' + m[1];
    }
    return null;
  }

  let _isTranslatingDOM = false;

  function translateDOM(rootEl) {
    if (_isTranslatingDOM) return;
    const lang = getLang();
    document.documentElement.setAttribute('lang', lang);
    if (lang !== 'en') return;

    const target = rootEl || document.body;
    if (!target) return;

    _isTranslatingDOM = true;
    try {
      // 1. Translate attributes (placeholder, title, aria-label, data-label)
      const attrEls = target.querySelectorAll('[placeholder], [title], [aria-label], [data-label]');
      attrEls.forEach(function (el) {
        ['placeholder', 'title', 'aria-label', 'data-label'].forEach(function (attr) {
          const val = el.getAttribute(attr);
          if (val) {
            const tr = translateString(val);
            if (tr !== val) el.setAttribute(attr, tr);
          }
        });
      });

      // 2. Walk text nodes and translate + apply row-specific daily USD exchange rate
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) {
        const parentTag = n.parentNode ? n.parentNode.tagName : '';
        if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'CODE') continue;
        if (n.nodeValue && n.nodeValue.trim()) {
          nodes.push(n);
        }
      }

      nodes.forEach(function (textNode) {
        const rowDate = extractRowDateISO(textNode.parentNode);
        const orig = textNode.nodeValue;
        const translated = translateString(orig, rowDate);
        if (translated !== orig) {
          textNode.nodeValue = translated;
        }
        // Attach helpful daily exchange rate tooltip on money cells when in EN mode
        if (textNode.parentNode && textNode.nodeValue && textNode.nodeValue.includes('$')) {
          const pEl = textNode.parentNode;
          if (pEl.classList && (pEl.classList.contains('ip-num') || pEl.classList.contains('ip-kpi-value') || pEl.tagName === 'TD')) {
            const effDate = rowDate || getSelectedRateDate();
            const rate = getExchangeRateForDate(effDate);
            if (!pEl.getAttribute('title')) {
              pEl.setAttribute('title', 'FX Rate (' + formatDate(effDate) + '): 1 USD = ' + formatNumberEN(rate, 0) + ' VND');
            }
          }
        }
      });
    } finally {
      _isTranslatingDOM = false;
    }
  }

  function setLang(lang) {
    const next = lang === 'en' ? 'en' : 'vi';
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch (e) {}
    document.documentElement.setAttribute('lang', next);

    window.dispatchEvent(new CustomEvent('ip:langchange', {
      detail: {
        lang: next,
        fxDate: getSelectedRateDate(),
        rate: getExchangeRateForDate(getSelectedRateDate())
      }
    }));
    return next;
  }

  function toggleLang() {
    const next = getLang() === 'en' ? 'vi' : 'en';
    return setLang(next);
  }

  function openExchangeRateModal() {
    const modalId = 'ip-fx-rate-modal';
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    const isEn = getLang() === 'en';
    const selectedDate = getSelectedRateDate();
    const currentRate = getExchangeRateForDate(selectedDate);
    const rows = getDailyRateTable(14);

    modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML =
      '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h2 class="modal-title fs-5 fw-bold">' +
                (isEn ? 'Daily USD / VND Exchange Rate Schedule' : 'Bảng tỷ giá quy đổi USD / VND theo từng ngày') +
              '</h2>' +
              '<div class="small text-muted">' +
                (isEn
                  ? 'Reference: State Bank of Vietnam & Vietcombank commercial FX board. Every invoice & payment converts by its date.'
                  : 'Tham chiếu: Tỷ giá trung tâm NHNN & Vietcombank. Khi chuyển sang Tiếng Anh (EN), tiền tệ tự động quy đổi sang USD theo ngày.') +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="p-3 rounded border bg-body-tertiary mb-3 d-flex justify-content-between align-items-center flex-wrap gap-3">' +
              '<div>' +
                '<div class="small text-muted">' + (isEn ? 'Active Valuation Date for KPIs & Summary:' : 'Ngày tỷ giá áp dụng cho KPI & Tổng hợp:') + '</div>' +
                '<div class="fw-bold fs-5 text-primary ip-num">1 USD = ' + formatNumberEN(currentRate, 0) + ' VND <span class="badge bg-primary-subtle text-primary-emphasis ms-1">' + formatDate(selectedDate) + '</span></div>' +
              '</div>' +
              '<div class="d-flex align-items-center gap-2">' +
                '<label class="small fw-semibold" for="ip-fx-date-picker">' + (isEn ? 'Select Date:' : 'Chọn ngày tỷ giá:') + '</label>' +
                '<input type="date" id="ip-fx-date-picker" class="form-control form-control-sm" style="width:auto;" value="' + selectedDate + '">' +
              '</div>' +
            '</div>' +
            '<div class="table-responsive">' +
              '<table class="table table-sm table-hover align-middle mb-0">' +
                '<thead>' +
                  '<tr>' +
                    '<th>' + (isEn ? 'Date' : 'Ngày giao dịch') + '</th>' +
                    '<th class="text-end">' + (isEn ? 'Buy Transfer (VND)' : 'Mua chuyển khoản (VND)') + '</th>' +
                    '<th class="text-end">' + (isEn ? 'Applied Mid Rate (1 USD)' : 'Tỷ giá quy đổi chuẩn (1 USD)') + '</th>' +
                    '<th class="text-end">' + (isEn ? 'Sell Rate (VND)' : 'Bán ra (VND)') + '</th>' +
                    '<th class="text-end">' + (isEn ? 'Daily Change' : 'Biến động ngày') + '</th>' +
                    '<th class="text-end">' + (isEn ? 'Apply' : 'Áp dụng') + '</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  rows.map(function (r) {
                    const isSel = r.date === selectedDate;
                    const deltaStr = (r.delta >= 0 ? '+' : '') + r.delta + ' ₫';
                    const deltaCls = r.delta > 0 ? 'text-danger' : (r.delta < 0 ? 'text-success' : 'text-muted');
                    return (
                      '<tr class="' + (isSel ? 'table-active fw-bold' : '') + '">' +
                        '<td>' + formatDate(r.date) + (isSel ? ' <span class="badge bg-primary ms-1">' + (isEn ? 'Active' : 'Đang chọn') + '</span>' : '') + '</td>' +
                        '<td class="text-end ip-num">' + formatNumberEN(r.buyTransfer, 0) + ' ₫</td>' +
                        '<td class="text-end ip-num fw-bold text-primary">' + formatNumberEN(r.midRate, 0) + ' ₫</td>' +
                        '<td class="text-end ip-num">' + formatNumberEN(r.sellRate, 0) + ' ₫</td>' +
                        '<td class="text-end ip-num ' + deltaCls + '">' + deltaStr + '</td>' +
                        '<td class="text-end">' +
                          '<button type="button" class="btn btn-sm ' + (isSel ? 'btn-primary' : 'btn-outline-secondary') + ' py-0 px-2" data-pick-fx-date="' + r.date + '">' +
                            (isSel ? (isEn ? 'Selected' : 'Đang dùng') : (isEn ? 'Use Rate' : 'Chọn ngày')) +
                          '</button>' +
                        '</td>' +
                      '</tr>'
                    );
                  }).join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer justify-content-between">' +
            '<span class="small text-muted">' + (isEn ? 'Switching language to English automatically converts all amounts to USD.' : 'Khi bấm chuyển sang EN, toàn bộ số tiền tự động đổi sang USD theo tỷ giá ngày.') + '</span>' +
            '<button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">' + (isEn ? 'Close' : 'Đóng') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modalEl);
    const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(modalEl) : null;

    const picker = modalEl.querySelector('#ip-fx-date-picker');
    if (picker) {
      picker.addEventListener('change', function () {
        if (picker.value) {
          setSelectedRateDate(picker.value);
          if (bsModal) bsModal.hide();
          modalEl.remove();
        }
      });
    }

    modalEl.addEventListener('click', function (ev) {
      const btn = ev.target.closest('[data-pick-fx-date]');
      if (!btn) return;
      const d = btn.getAttribute('data-pick-fx-date');
      setSelectedRateDate(d);
      if (bsModal) bsModal.hide();
      modalEl.remove();
    });

    if (bsModal) bsModal.show();
    else modalEl.style.display = 'block';
  }

  IP.I18n = {
    LANG_KEY: LANG_KEY,
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    t: translateString,
    translateDOM: translateDOM,
    getExchangeRateForDate: getExchangeRateForDate,
    getSelectedRateDate: getSelectedRateDate,
    setSelectedRateDate: setSelectedRateDate,
    getDailyRateTable: getDailyRateTable,
    convertVNDToUSD: convertVNDToUSD,
    openExchangeRateModal: openExchangeRateModal
  };

  IP.Utils = {
    escapeHtml: escapeHtml,
    uid: uid,
    debounce: debounce,
    getQueryParams: getQueryParams,
    setQueryParams: setQueryParams,
    clone: function (obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    initials: function (name) {
      if (!name) return 'IP';
      const parts = String(name).trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
    isValidEmail: function (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    },
    isValidPhone: function (phone) {
      return /^(0|\+84)[0-9]{8,10}$/.test(String(phone || '').replace(/\s+/g, ''));
    },
    isValidTaxCode: function (tax) {
      return /^[0-9]{10}([0-9]{3})?$/.test(String(tax || '').replace(/[-\s]/g, ''));
    },
    copyText: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () {
          return fallbackCopy(text);
        });
      }
      return Promise.resolve(fallbackCopy(text));
    }
  };

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return true;
  }

  IP.Fmt = {
    currency: formatCurrency,
    formatCurrency: formatCurrency,
    number: formatNumber,
    formatNumber: formatNumber,
    percent: formatPercent,
    formatPercent: formatPercent,
    date: formatDate,
    formatDate: formatDate,
    dateTime: formatDateTime,
    relative: formatRelative,
    formatRelative: formatRelative,
    statusLabel: function (s) {
      const map = getLang() === 'en' ? STATUS_LABELS_EN : STATUS_LABELS_VI;
      return map[s] || s || '—';
    },
    roleLabel: function (r) {
      const map = getLang() === 'en' ? ROLE_LABELS_EN : ROLE_LABELS_VI;
      return map[r] || r || '—';
    },
    methodLabel: function (m) {
      const map = getLang() === 'en' ? METHOD_LABELS_EN : METHOD_LABELS_VI;
      return map[m] || m || '—';
    },
    toneLabel: function (t) {
      const map = getLang() === 'en' ? TONE_LABELS_EN : TONE_LABELS_VI;
      return map[t] || t || '—';
    },
    channelLabel: function (c) {
      const map = getLang() === 'en' ? CHANNEL_LABELS_EN : CHANNEL_LABELS_VI;
      return map[c] || c || '—';
    }
  };

  // Observe DOM mutations so modals, drawers, toasts, and re-rendered tables automatically translate in EN mode
  document.addEventListener('DOMContentLoaded', function () {
    if (getLang() === 'en') {
      translateDOM(document.body);
    }
    const obs = new MutationObserver(function () {
      if (getLang() === 'en' && !_isTranslatingDOM) {
        translateDOM(document.body);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });
})(window);
