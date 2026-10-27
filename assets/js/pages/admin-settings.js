/**
 * @owner SV4
 * @spec §8.4, §9 Admin Invoice Settings, Reminder Templates & AI Toggles Page Script (admin-settings.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('admin-invoice-settings', {
    roles: ['admin'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentTab = ['company', 'numbering', 'templates', 'ai'].includes(params.tab) ? params.tab : 'company';
      let workingSettings = IP.DB.getSettings();
      let isDirty = false;

      window.addEventListener('beforeunload', function (e) {
        if (isDirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      function render() {
        const comp = workingSettings.company || {};
        const def = workingSettings.invoiceDefaults || {};
        const templates = workingSettings.reminderTemplates || [];
        const ai = workingSettings.ai || {};
        const nextPreview = IP.DB.nextInvoiceNumberPreview(def);

        let panelHtml = '';
        if (currentTab === 'company') {
          panelHtml =
            '<div class="ip-card">' +
              '<div class="ip-card-header"><h2 class="ip-h2 mb-0">1. Thông tin đơn vị phát hành & Tài khoản ngân hàng</h2></div>' +
              '<div class="ip-card-body">' +
                '<div class="row g-3 mb-4">' +
                  '<div class="col-md-8">' +
                    '<label class="form-label" for="st-comp-name">Tên doanh nghiệp phát hành <span class="text-danger">*</span></label>' +
                    '<input type="text" id="st-comp-name" class="form-control" data-st-group="company" data-st-field="name" value="' + IP.Utils.escapeHtml(comp.name) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-comp-tax">Mã số thuế (10–13 số)</label>' +
                    '<input type="text" id="st-comp-tax" class="form-control font-monospace" data-st-group="company" data-st-field="taxCode" value="' + IP.Utils.escapeHtml(comp.taxCode) + '">' +
                  '</div>' +
                  '<div class="col-md-12">' +
                    '<label class="form-label" for="st-comp-addr">Địa chỉ trụ sở</label>' +
                    '<input type="text" id="st-comp-addr" class="form-control" data-st-group="company" data-st-field="address" value="' + IP.Utils.escapeHtml(comp.address) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-comp-email">Email liên hệ công nợ</label>' +
                    '<input type="email" id="st-comp-email" class="form-control" data-st-group="company" data-st-field="email" value="' + IP.Utils.escapeHtml(comp.email) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-comp-phone">Số điện thoại</label>' +
                    '<input type="text" id="st-comp-phone" class="form-control" data-st-group="company" data-st-field="phone" value="' + IP.Utils.escapeHtml(comp.phone) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-comp-logo">Chữ viết tắt biểu trưng (2–3 ký tự)</label>' +
                    '<input type="text" id="st-comp-logo" class="form-control font-monospace" maxlength="3" data-st-group="company" data-st-field="logoText" value="' + IP.Utils.escapeHtml(comp.logoText || 'IP') + '">' +
                  '</div>' +
                  '<div class="col-md-5">' +
                    '<label class="form-label" for="st-comp-bank">Ngân hàng thụ hưởng</label>' +
                    '<input type="text" id="st-comp-bank" class="form-control" data-st-group="company" data-st-field="bankName" value="' + IP.Utils.escapeHtml(comp.bankName) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-comp-acc">Số tài khoản ngân hàng</label>' +
                    '<input type="text" id="st-comp-acc" class="form-control font-monospace" data-st-group="company" data-st-field="bankAccount" value="' + IP.Utils.escapeHtml(comp.bankAccount) + '">' +
                  '</div>' +
                  '<div class="col-md-3">' +
                    '<label class="form-label" for="st-comp-branch">Chi nhánh</label>' +
                    '<input type="text" id="st-comp-branch" class="form-control" data-st-group="company" data-st-field="bankBranch" value="' + IP.Utils.escapeHtml(comp.bankBranch) + '">' +
                  '</div>' +
                '</div>' +

                '<div class="border-top pt-3">' +
                  '<div class="ip-label-sm mb-2">Xem trước tiêu đề bản in hóa đơn</div>' +
                  '<div class="p-3 border rounded bg-body-tertiary d-flex justify-content-between align-items-center flex-wrap gap-2">' +
                    '<div class="d-flex align-items-center gap-3">' +
                      '<span class="ip-avatar" style="width:44px;height:44px;border-radius:10px;">' + IP.Utils.escapeHtml(comp.logoText || 'IP') + '</span>' +
                      '<div>' +
                        '<div class="fw-bold">' + IP.Utils.escapeHtml(comp.name) + '</div>' +
                        '<div class="small text-muted">MST: ' + IP.Utils.escapeHtml(comp.taxCode) + ' · ' + IP.Utils.escapeHtml(comp.address) + '</div>' +
                        '<div class="small text-muted">TK: ' + IP.Utils.escapeHtml(comp.bankAccount) + ' - ' + IP.Utils.escapeHtml(comp.bankName) + '</div>' +
                      '</div>' +
                    '</div>' +
                    '<span class="badge bg-primary-subtle text-primary-emphasis font-monospace">' + IP.Utils.escapeHtml(nextPreview) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
        } else if (currentTab === 'numbering') {
          panelHtml =
            '<div class="ip-card">' +
              '<div class="ip-card-header"><h2 class="ip-h2 mb-0">2. Quy tắc đánh số & Mặc định hóa đơn mới</h2></div>' +
              '<div class="ip-card-body">' +
                '<div class="alert alert-info small py-2 mb-3"><i class="bi bi-info-circle me-1"></i>Các thay đổi tại đây chỉ áp dụng cho <strong>hóa đơn tạo mới</strong> từ thời điểm lưu, không làm thay đổi các hóa đơn lịch sử đã phát hành.</div>' +
                '<div class="row g-3">' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-def-prefix">Tiền tố hóa đơn (2–6 ký tự) <span class="text-danger">*</span></label>' +
                    '<input type="text" id="st-def-prefix" class="form-control font-monospace" data-st-group="invoiceDefaults" data-st-field="prefix" value="' + IP.Utils.escapeHtml(def.prefix) + '">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-def-next">Số thứ tự tiếp theo (> 0) <span class="text-danger">*</span></label>' +
                    '<input type="number" id="st-def-next" class="form-control ip-num" data-st-group="invoiceDefaults" data-st-field="nextNumber" value="' + def.nextNumber + '" min="1">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label">Xem trước mã hóa đơn tiếp theo</label>' +
                    '<div class="form-control bg-body-tertiary fw-bold font-monospace text-primary" id="st-next-preview">' + IP.Utils.escapeHtml(nextPreview) + '</div>' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-def-term">Kỳ hạn thanh toán mặc định (1–365 ngày)</label>' +
                    '<input type="number" id="st-def-term" class="form-control ip-num" data-st-group="invoiceDefaults" data-st-field="defaultTermDays" value="' + def.defaultTermDays + '" min="1" max="365">' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label" for="st-def-vat">Thuế suất GTGT mặc định</label>' +
                    '<select id="st-def-vat" class="form-select" data-st-group="invoiceDefaults" data-st-field="defaultVat">' +
                      [0, 5, 8, 10].map(function (v) {
                        return '<option value="' + v + '" ' + (Number(def.defaultVat) === v ? 'selected' : '') + '>' + v + '%</option>';
                      }).join('') +
                    '</select>' +
                  '</div>' +
                  '<div class="col-md-4">' +
                    '<label class="form-label">Đơn vị tiền tệ (Chỉ đọc)</label>' +
                    '<input type="text" class="form-control" value="VND (Đồng Việt Nam)" readonly>' +
                  '</div>' +
                  '<div class="col-12">' +
                    '<label class="form-label" for="st-def-terms">Điều khoản thanh toán mặc định trên hóa đơn</label>' +
                    '<textarea id="st-def-terms" class="form-control" rows="2" data-st-group="invoiceDefaults" data-st-field="defaultTerms">' + IP.Utils.escapeHtml(def.defaultTerms || '') + '</textarea>' +
                  '</div>' +
                  '<div class="col-12">' +
                    '<label class="form-label" for="st-def-footer">Chân trang bản in hóa đơn</label>' +
                    '<input type="text" id="st-def-footer" class="form-control" data-st-group="invoiceDefaults" data-st-field="footerNote" value="' + IP.Utils.escapeHtml(def.footerNote || '') + '">' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
        } else if (currentTab === 'templates') {
          panelHtml =
            '<div class="ip-card">' +
              '<div class="ip-card-header">' +
                '<div>' +
                  '<h2 class="ip-h2 mb-0">3. Mẫu nhắc thanh toán (' + templates.length + ' mẫu)</h2>' +
                  '<div class="small text-muted">Biến hỗ trợ: <code>{ten_khach_hang}</code>, <code>{ma_hoa_don}</code>, <code>{so_tien}</code>, <code>{han_thanh_toan}</code>, <code>{ngan_hang}</code>, <code>{nguoi_gui}</code></div>' +
                '</div>' +
                '<button type="button" class="btn btn-primary btn-sm" data-action="add-template"><i class="bi bi-plus-lg"></i> Thêm mẫu nhắc</button>' +
              '</div>' +
              '<div class="table-responsive">' +
                '<table class="table ip-table-responsive-cards align-middle mb-0">' +
                  '<thead><tr><th>Tên mẫu</th><th>Kênh</th><th>Giọng điệu</th><th>Nội dung tóm tắt</th><th>Mặc định</th><th class="text-end">Thao tác</th></tr></thead>' +
                  '<tbody>' +
                    templates.map(function (t) {
                      const sameChannelCount = templates.filter(function (x) { return x.channel === t.channel; }).length;
                      const delBlocked = sameChannelCount <= 1 || t.isDefault;
                      const delReason = sameChannelCount <= 1
                        ? 'Không thể xóa mẫu cuối cùng của kênh ' + IP.Fmt.channelLabel(t.channel)
                        : (t.isDefault ? 'Mẫu đang là mặc định của kênh. Hãy đặt mẫu khác làm mặc định trước khi xóa.' : '');
                      return (
                        '<tr>' +
                          '<td data-label="Tên mẫu" class="fw-bold">' + IP.Utils.escapeHtml(t.name) + '</td>' +
                          '<td data-label="Kênh">' + IP.Fmt.channelLabel(t.channel) + '</td>' +
                          '<td data-label="Giọng điệu">' + IP.Fmt.toneLabel(t.tone) + '</td>' +
                          '<td data-label="Nội dung" style="max-width:280px;"><div class="small text-muted text-truncate">' + IP.Utils.escapeHtml(t.body) + '</div></td>' +
                          '<td data-label="Mặc định">' + (t.isDefault ? '<span class="badge bg-success-subtle text-success-emphasis">Mặc định</span>' : '<span class="text-muted small">—</span>') + '</td>' +
                          '<td data-label="Thao tác" class="text-end">' +
                            '<div class="btn-group">' +
                              '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-template" data-id="' + t.id + '"><i class="bi bi-pencil"></i> Sửa</button>' +
                              '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-template" data-id="' + t.id + '" ' +
                                (delBlocked ? ('disabled title="' + IP.Utils.escapeHtml(delReason) + '"') : '') + '>' +
                                '<i class="bi bi-trash"></i>' + (delBlocked ? ' Bảo vệ' : '') +
                              '</button>' +
                            '</div>' +
                          '</td>' +
                        '</tr>'
                      );
                    }).join('') +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>';
        } else {
          panelHtml =
            '<div class="ip-card mb-4">' +
              '<div class="ip-card-header"><h2 class="ip-h2 mb-0">4. Công tắc Trợ lý AI & Ngưỡng cảnh báo</h2></div>' +
              '<div class="ip-card-body">' +
                '<p class="small text-muted mb-3">Khi tắt một trợ lý AI tại đây, màn hình tương ứng của Kế toán / Kinh doanh / Quản lý sẽ hiển thị khối thông báo "AI đang tắt trong Cấu hình hóa đơn" và vẫn cho phép thao tác thủ công bình thường.</p>' +
                '<div class="list-group mb-3">' +
                  '<label class="list-group-item d-flex justify-content-between align-items-center py-3">' +
                    '<div><div class="fw-bold">AI-1 · Kiểm tra hóa đơn bất thường (Phân hệ Kế toán)</div><div class="small text-muted">Kiểm tra chéo hạn thanh toán, thuế suất GTGT, hạn mức tín dụng và lịch sử khách hàng trên form tạo/sửa hóa đơn.</div></div>' +
                    '<input class="form-check-input fs-4" type="checkbox" id="st-ai-anomaly" ' + (ai.anomaly ? 'checked' : '') + '>' +
                  '</label>' +
                  '<label class="list-group-item d-flex justify-content-between align-items-center py-3">' +
                    '<div><div class="fw-bold">AI-2 · Soạn thông điệp nhắc thanh toán (Phân hệ Kinh doanh)</div><div class="small text-muted">Tự động soạn nháp Email/SMS nhắc nợ theo giọng điệu lịch sự dựa trên các hóa đơn đang chọn.</div></div>' +
                    '<input class="form-check-input fs-4" type="checkbox" id="st-ai-reminder" ' + (ai.reminder ? 'checked' : '') + '>' +
                  '</label>' +
                  '<label class="list-group-item d-flex justify-content-between align-items-center py-3">' +
                    '<div><div class="fw-bold">AI-3 · Tóm tắt dòng tiền & Phân tích kịch bản (Phân hệ Quản lý)</div><div class="small text-muted">Tóm tắt rủi ro tập trung công nợ và phân tích dòng tiền 30/60/90 ngày trên Dashboard và Dự báo.</div></div>' +
                    '<input class="form-check-input fs-4" type="checkbox" id="st-ai-cashflow" ' + (ai.cashflow ? 'checked' : '') + '>' +
                  '</label>' +
                '</div>' +
                '<div class="row g-3 align-items-center">' +
                  '<div class="col-md-6">' +
                    '<label class="form-label" for="st-ai-threshold">Ngưỡng cảnh báo giá trị hóa đơn cao bất thường (%)</label>' +
                    '<input type="number" id="st-ai-threshold" class="form-control ip-num" value="' + (ai.anomalyThreshold || 250) + '" min="120" max="1000">' +
                    '<div class="form-text">Mặc định 250% (tức gấp 2,5 lần giá trị hóa đơn trung bình lịch sử của khách hàng đó).</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="ip-card">' +
              '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Quản lý Sao lưu Dữ liệu & Phiên bản Hệ thống</h2></div>' +
              '<div class="ip-card-body d-flex justify-content-between align-items-center flex-wrap gap-3">' +
                '<div>' +
                  '<div class="fw-semibold">Phiên bản dữ liệu: <code>' + IP.Utils.escapeHtml(workingSettings.dataVersion || '1.0.0') + '</code> · Lõi: <code>' + IP.CORE_VERSION + '</code></div>' +
                  '<div class="small text-muted">Khôi phục dữ liệu chuẩn ban đầu sẽ xóa các thay đổi phát sinh và nạp lại 18 khách hàng, 52 hóa đơn mẫu chuẩn.</div>' +
                '</div>' +
                '<div class="d-flex gap-2">' +
                  '<button type="button" class="btn btn-outline-secondary" data-action="export-json"><i class="bi bi-download"></i> Xuất JSON</button>' +
                  '<button type="button" class="btn btn-outline-danger" data-action="reset-system-data"><i class="bi bi-arrow-counterclockwise"></i> Khôi phục dữ liệu chuẩn ban đầu</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Cấu hình hóa đơn</h1>' +
              '<p class="ip-page-subtitle">Thiết lập thông tin pháp nhân, quy tắc đánh số hóa đơn, mẫu nhắc thanh toán và công tắc trợ lý AI.</p>' +
            '</div>' +
          '</div>' +

          '<div id="st-err-box" class="alert alert-danger py-2 small d-none mb-3" role="alert"></div>' +

          '<div class="adm-settings-layout">' +
            '<nav class="adm-vtabs" aria-label="Các mục cấu hình">' +
              '<button type="button" class="adm-vtab-btn ' + (currentTab === 'company' ? 'active' : '') + '" data-action="switch-tab" data-tab="company"><i class="bi bi-building"></i> 1. Thông tin công ty</button>' +
              '<button type="button" class="adm-vtab-btn ' + (currentTab === 'numbering' ? 'active' : '') + '" data-action="switch-tab" data-tab="numbering"><i class="bi bi-hash"></i> 2. Hóa đơn & Đánh số</button>' +
              '<button type="button" class="adm-vtab-btn ' + (currentTab === 'templates' ? 'active' : '') + '" data-action="switch-tab" data-tab="templates"><i class="bi bi-envelope-paper"></i> 3. Mẫu nhắc thanh toán</button>' +
              '<button type="button" class="adm-vtab-btn ' + (currentTab === 'ai' ? 'active' : '') + '" data-action="switch-tab" data-tab="ai"><i class="bi bi-stars"></i> 4. Trợ lý AI & Dữ liệu hệ thống</button>' +
            '</nav>' +
            '<div>' +
              panelHtml +
              '<div class="adm-sticky-savebar">' +
                '<div class="small">' +
                  (isDirty
                    ? '<span class="text-warning fw-bold"><i class="bi bi-exclamation-circle me-1"></i>Bạn có thay đổi chưa lưu</span>'
                    : '<span><i class="bi bi-check2-circle me-1"></i>Mọi cấu hình đã được đồng bộ</span>') +
                '</div>' +
                '<div class="d-flex gap-2">' +
                  '<button type="button" class="btn btn-sm btn-outline-light" data-action="discard-changes" ' + (!isDirty ? 'disabled' : '') + '>Hoàn tác thay đổi</button>' +
                  '<button type="button" class="btn btn-sm btn-warning fw-bold" data-action="save-settings" ' + (!isDirty ? 'disabled' : '') + '><i class="bi bi-check2-circle"></i> Lưu thay đổi</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        bindInputs();
      }

      function bindInputs() {
        root.querySelectorAll('[data-st-group]').forEach(function (inp) {
          inp.addEventListener('input', function () {
            const g = inp.getAttribute('data-st-group');
            const f = inp.getAttribute('data-st-field');
            workingSettings[g][f] = inp.type === 'number' ? Number(inp.value) : inp.value;
            isDirty = true;
            const prevEl = root.querySelector('#st-next-preview');
            if (prevEl) {
              prevEl.textContent = IP.DB.nextInvoiceNumberPreview(workingSettings.invoiceDefaults);
            }
            updateSaveBarState();
          });
        });

        ['anomaly', 'reminder', 'cashflow'].forEach(function (key) {
          const chk = root.querySelector('#st-ai-' + key);
          if (chk) {
            chk.addEventListener('change', function () {
              workingSettings.ai[key] = Boolean(chk.checked);
              isDirty = true;
              updateSaveBarState();
            });
          }
        });

        const thEl = root.querySelector('#st-ai-threshold');
        if (thEl) {
          thEl.addEventListener('input', function () {
            workingSettings.ai.anomalyThreshold = Number(thEl.value);
            isDirty = true;
            updateSaveBarState();
          });
        }
      }

      function updateSaveBarState() {
        const saveBtn = root.querySelector('[data-action="save-settings"]');
        const discBtn = root.querySelector('[data-action="discard-changes"]');
        if (saveBtn) saveBtn.disabled = !isDirty;
        if (discBtn) discBtn.disabled = !isDirty;
      }

      function openTemplateModal(editId) {
        const templates = IP.DB.getSettings().reminderTemplates || [];
        const existing = editId ? templates.find(function (t) { return t.id === editId; }) : null;
        const d = existing || {
          name: '',
          channel: 'email',
          tone: 'friendly',
          subject: 'Nhắc lịch thanh toán hóa đơn {ma_hoa_don} - {ten_khach_hang}',
          body: 'Kính gửi {ten_khach_hang},\n\nXin thông báo hóa đơn {ma_hoa_don} với số tiền {so_tien} có hạn thanh toán ngày {han_thanh_toan}. Quý khách vui lòng chuyển khoản qua {ngan_hang}.\n\nTrân trọng,\n{nguoi_gui}',
          isDefault: false
        };

        const mId = 'adm-tpl-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();
        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-lg modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<form id="adm-tpl-form" novalidate>' +
                '<div class="modal-header">' +
                  '<h2 class="modal-title fs-5 fw-bold">' + (existing ? 'Chỉnh sửa mẫu nhắc thanh toán' : 'Thêm mẫu nhắc thanh toán mới') + '</h2>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div id="tpl-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                  '<div class="row g-3 mb-3">' +
                    '<div class="col-md-6">' +
                      '<label class="form-label" for="tf-name">Tên mẫu nhắc <span class="text-danger">*</span></label>' +
                      '<input type="text" id="tf-name" class="form-control" value="' + IP.Utils.escapeHtml(d.name) + '" required>' +
                    '</div>' +
                    '<div class="col-md-3">' +
                      '<label class="form-label" for="tf-channel">Kênh gửi</label>' +
                      '<select id="tf-channel" class="form-select">' +
                        '<option value="email" ' + (d.channel === 'email' ? 'selected' : '') + '>Email</option>' +
                        '<option value="sms" ' + (d.channel === 'sms' ? 'selected' : '') + '>SMS</option>' +
                      '</select>' +
                    '</div>' +
                    '<div class="col-md-3">' +
                      '<label class="form-label" for="tf-tone">Giọng điệu</label>' +
                      '<select id="tf-tone" class="form-select">' +
                        '<option value="friendly" ' + (d.tone === 'friendly' ? 'selected' : '') + '>Thân thiện</option>' +
                        '<option value="formal" ' + (d.tone === 'formal' ? 'selected' : '') + '>Trang trọng</option>' +
                        '<option value="firm" ' + (d.tone === 'firm' ? 'selected' : '') + '>Cứng rắn lịch sự</option>' +
                      '</select>' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<label class="form-label" for="tf-subject">Tiêu đề mẫu <span class="text-danger">*</span></label>' +
                      '<input type="text" id="tf-subject" class="form-control" value="' + IP.Utils.escapeHtml(d.subject) + '" required>' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<label class="form-label" for="tf-body">Nội dung mẫu <span class="text-danger">*</span></label>' +
                      '<textarea id="tf-body" class="form-control" rows="5" required>' + IP.Utils.escapeHtml(d.body) + '</textarea>' +
                      '<div class="form-text">Biến tự động thay thế: <code>{ten_khach_hang}</code>, <code>{ma_hoa_don}</code>, <code>{so_tien}</code>, <code>{han_thanh_toan}</code>, <code>{ngan_hang}</code>, <code>{nguoi_gui}</code></div>' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<div class="form-check">' +
                        '<input class="form-check-input" type="checkbox" id="tf-default" ' + (d.isDefault ? 'checked' : '') + '>' +
                        '<label class="form-check-label small fw-semibold" for="tf-default">Đặt làm mẫu mặc định cho kênh này</label>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="submit" class="btn btn-primary">Lưu mẫu nhắc</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#adm-tpl-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          const errEl = mEl.querySelector('#tpl-err');
          errEl.classList.add('d-none');
          const payload = {
            name: mEl.querySelector('#tf-name').value,
            channel: mEl.querySelector('#tf-channel').value,
            tone: mEl.querySelector('#tf-tone').value,
            subject: mEl.querySelector('#tf-subject').value,
            body: mEl.querySelector('#tf-body').value,
            isDefault: mEl.querySelector('#tf-default').checked
          };
          const res = existing ? IP.DB.updateReminderTemplate(existing.id, payload) : IP.DB.createReminderTemplate(payload);
          if (!res.ok) {
            errEl.textContent = res.error.message;
            errEl.classList.remove('d-none');
            return;
          }
          if (bsModal) bsModal.hide();
          else mEl.remove();
          workingSettings = IP.DB.getSettings();
          IP.UI.toast({ title: 'Đã lưu mẫu nhắc thanh toán', message: res.data.name, type: 'success' });
          render();
        });
        if (bsModal) bsModal.show();
      }

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'switch-tab') {
          const nextTab = btn.getAttribute('data-tab');
          if (isDirty) {
            IP.UI.confirmModal({
              title: 'Chuyển tab khi chưa lưu thay đổi?',
              message: 'Các chỉnh sửa ở tab hiện tại chưa được lưu vào hệ thống. Bạn có muốn bỏ thay đổi và chuyển tab không?',
              confirmText: 'Bỏ thay đổi & Chuyển tab',
              variant: 'warning',
              onConfirm: function () {
                workingSettings = IP.DB.getSettings();
                isDirty = false;
                currentTab = nextTab;
                render();
              }
            });
          } else {
            currentTab = nextTab;
            render();
          }
        } else if (action === 'save-settings') {
          const errBox = root.querySelector('#st-err-box');
          if (errBox) errBox.classList.add('d-none');
          const res = IP.DB.saveSettings(workingSettings);
          if (!res.ok) {
            if (errBox) {
              errBox.textContent = res.error.message;
              errBox.classList.remove('d-none');
            }
            IP.UI.toast({ title: 'Lỗi cấu hình', message: res.error.message, type: 'danger' });
            return;
          }
          workingSettings = IP.DB.getSettings();
          isDirty = false;
          IP.UI.toast({ title: 'Đã lưu cấu hình hệ thống', message: 'Các thiết lập mới đã có hiệu lực ngay lập tức.', type: 'success' });
          render();
        } else if (action === 'discard-changes') {
          workingSettings = IP.DB.getSettings();
          isDirty = false;
          IP.UI.toast({ title: 'Đã hoàn tác thay đổi', message: 'Khôi phục về giá trị đã lưu gần nhất.', type: 'info' });
          render();
        } else if (action === 'add-template') {
          openTemplateModal(null);
        } else if (action === 'edit-template') {
          openTemplateModal(id);
        } else if (action === 'delete-template') {
          IP.UI.confirmModal({
            title: 'Xóa mẫu nhắc thanh toán này?',
            message: 'Mẫu nhắc này sẽ bị xóa khỏi danh sách cấu hình.',
            confirmText: 'Xóa mẫu nhắc',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.deleteReminderTemplate(id);
              if (!res.ok) {
                IP.UI.toast({ title: 'Không thể xóa mẫu', message: res.error.message, type: 'danger' });
                return;
              }
              workingSettings = IP.DB.getSettings();
              IP.UI.toast({ title: 'Đã xóa mẫu nhắc', message: 'Danh sách mẫu nhắc đã được cập nhật.', type: 'success' });
              render();
            }
          });
        } else if (action === 'export-json') {
          const jsonStr = IP.DB.exportJSON();
          const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'invoicepilot-settings-db-' + IP.Seed.todayISO() + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          IP.UI.toast({ title: 'Đã xuất JSON', message: 'Tệp dữ liệu đã được tải xuống.', type: 'success' });
        } else if (action === 'reset-system-data') {
          IP.UI.confirmModal({
            title: 'Xác nhận khôi phục bộ dữ liệu chuẩn ban đầu?',
            message: 'Mọi hóa đơn mới, giao dịch đối chiếu, cấu hình tùy chỉnh và báo cáo AI đã lưu sẽ bị xóa để quay về dữ liệu mẫu gốc ban đầu.',
            requireReason: true,
            reasonLabel: 'Nhập chữ "KHOI PHUC" hoặc lý do để xác nhận mạnh',
            confirmText: 'Khôi phục dữ liệu mẫu gốc',
            variant: 'danger',
            onConfirm: function () {
              IP.DB.reset();
              workingSettings = IP.DB.getSettings();
              isDirty = false;
              IP.UI.toast({ title: 'Đã khôi phục dữ liệu mẫu gốc', message: 'Toàn bộ hệ thống đã trở về trạng thái ban đầu.', type: 'success' });
              render();
            }
          });
        }
      });
    }
  });
})(window);
