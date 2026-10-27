/**
 * @owner SV1
 * @spec §8.1, §9.2 Accountant Invoice Form & AI-1 Integration (invoice-form.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('accountant-invoice-form', {
    roles: ['accountant'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const editId = params.id || '';
      const existingInv = editId ? IP.DB.getInvoice(editId) : null;
      const isEdit = Boolean(existingInv);

      const settings = IP.DB.getSettings();
      const def = settings.invoiceDefaults || {};
      const today = IP.Seed.todayISO();

      const draft = isEdit
        ? IP.Utils.clone(existingInv)
        : {
            id: null,
            number: IP.DB.nextInvoiceNumberPreview(),
            customerId: params.customerId || 'cus_01',
            issueDate: today,
            dueDate: IP.Seed.addDays(def.defaultTermDays || 30, today),
            paymentTermDays: def.defaultTermDays || 30,
            poNumber: 'PO-26-' + String(Date.now()).slice(-3),
            items: [
              {
                id: IP.Utils.uid('itm'),
                description: 'Gói dịch vụ nền tảng quản trị hóa đơn điện tử Enterprise',
                quantity: 1,
                unit: 'Gói',
                unitPrice: 18000000,
                discountPercent: 0,
                vatRate: def.defaultVat !== undefined ? def.defaultVat : 10,
                lineTotal: 19800000
              }
            ],
            notes: def.defaultTerms || '',
            internalNote: '',
            paidAmount: 0
          };

      let isDirty = false;
      let dueManuallyEdited = isEdit;
      let aiPanelCtrl = null;

      window.addEventListener('beforeunload', function (e) {
        if (isDirty) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      function render() {
        const activeCustomers = IP.DB.listCustomers({ status: 'active' });
        const selectedCus = IP.DB.getCustomer(draft.customerId);
        const cusBal = selectedCus ? IP.Calc.customerBalance(selectedCus.id) : { totalReceivable: 0 };
        const totals = IP.Calc.computeTotals(draft.items);
        const rem = Math.max(0, totals.total - Number(draft.paidAmount || 0));

        const itemsHtml = draft.items.map(function (it, idx) {
          const lineCalc = IP.Calc.computeTotals([it]).items[0];
          return (
            '<div class="acc-line-item-row" data-idx="' + idx + '">' +
              '<div class="row g-2 align-items-end">' +
                '<div class="col-12 col-md-4">' +
                  '<label class="form-label small">Mô tả hàng hóa / dịch vụ #' + (idx + 1) + ' <span class="text-danger">*</span></label>' +
                  '<input type="text" class="form-control form-control-sm" data-item-field="description" data-idx="' + idx + '" value="' + IP.Utils.escapeHtml(it.description) + '" placeholder="Nhập tên dịch vụ / sản phẩm" required>' +
                '</div>' +
                '<div class="col-4 col-md-1">' +
                  '<label class="form-label small">ĐVT</label>' +
                  '<input type="text" class="form-control form-control-sm" data-item-field="unit" data-idx="' + idx + '" value="' + IP.Utils.escapeHtml(it.unit || 'Gói') + '">' +
                '</div>' +
                '<div class="col-4 col-md-1">' +
                  '<label class="form-label small">SL <span class="text-danger">*</span></label>' +
                  '<input type="number" class="form-control form-control-sm ip-num" data-item-field="quantity" data-idx="' + idx + '" value="' + it.quantity + '" min="1" step="1">' +
                '</div>' +
                '<div class="col-4 col-md-2">' +
                  '<label class="form-label small">Đơn giá (VND)</label>' +
                  '<input type="number" class="form-control form-control-sm ip-num" data-item-field="unitPrice" data-idx="' + idx + '" value="' + it.unitPrice + '" min="0" step="100000">' +
                '</div>' +
                '<div class="col-4 col-md-1">' +
                  '<label class="form-label small">CK %</label>' +
                  '<input type="number" class="form-control form-control-sm ip-num" data-item-field="discountPercent" data-idx="' + idx + '" value="' + (it.discountPercent || 0) + '" min="0" max="100">' +
                '</div>' +
                '<div class="col-4 col-md-1">' +
                  '<label class="form-label small">VAT %</label>' +
                  '<select class="form-select form-select-sm" data-item-field="vatRate" data-idx="' + idx + '">' +
                    [0, 5, 8, 10].map(function (v) {
                      return '<option value="' + v + '" ' + (Number(it.vatRate) === v ? 'selected' : '') + '>' + v + '%</option>';
                    }).join('') +
                  '</select>' +
                '</div>' +
                '<div class="col-4 col-md-2 d-flex align-items-center justify-content-between gap-1">' +
                  '<div class="text-end flex-grow-1">' +
                    '<div class="small text-muted">Thành tiền</div>' +
                    '<div class="fw-bold small ip-num" data-line-total="' + idx + '">' + IP.Fmt.currency(lineCalc.lineTotal) + '</div>' +
                  '</div>' +
                  '<button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-item" data-idx="' + idx + '" ' + (draft.items.length <= 1 ? 'disabled title="Phải có tối thiểu 1 dòng hàng"' : '') + ' aria-label="Xóa dòng ' + (idx + 1) + '"><i class="bi bi-trash"></i></button>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">' + (isEdit ? ('Sửa hóa đơn · ' + IP.Utils.escapeHtml(draft.number)) : 'Tạo hóa đơn') + '</h1>' +
              '<p class="ip-page-subtitle">Lập hóa đơn mới hoặc chỉnh sửa thông tin, kiểm tra bất thường bằng AI-1 trước khi phát hành.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="cancel-form"><i class="bi bi-arrow-left"></i> Quay lại danh sách</button>' +
              '<button type="button" class="btn btn-outline-secondary" data-action="preview-print"><i class="bi bi-printer"></i> Xem trước bản in</button>' +
            '</div>' +
          '</div>' +

          (isEdit && draft.paidAmount > 0
            ? '<div class="alert alert-warning small mb-3" role="status"><i class="bi bi-info-circle me-1"></i>Hóa đơn này đã thu xác nhận <strong>' + IP.Fmt.currency(draft.paidAmount) + '</strong>. Thay đổi tổng tiền sẽ ảnh hưởng tới đối chiếu và không thể giảm tổng thấp hơn số tiền đã thu.</div>'
            : '') +

          '<div id="inv-form-err-summary" class="alert alert-danger d-none mb-3 small" role="alert"></div>' +

          '<div class="acc-form-layout">' +
            '<div>' +
              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header"><h2 class="ip-h2 mb-0">1. Thông tin chung & Khách hàng</h2></div>' +
                '<div class="ip-card-body">' +
                  '<div class="row g-3">' +
                    '<div class="col-md-4">' +
                      '<label class="form-label" for="inv-number">Số hóa đơn</label>' +
                      '<input type="text" id="inv-number" class="form-control font-monospace" value="' + IP.Utils.escapeHtml(draft.number) + '" readonly>' +
                      '<div class="form-text">Sinh tự động, có thể chỉnh trong Cấu hình hóa đơn.</div>' +
                    '</div>' +
                    '<div class="col-md-8">' +
                      '<div class="d-flex justify-content-between align-items-center">' +
                        '<label class="form-label" for="inv-customer">Khách hàng <span class="text-danger">*</span></label>' +
                        '<div class="d-flex gap-2">' +
                          '<button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-action="open-cus-picker"><i class="bi bi-search"></i> Tìm nâng cao</button>' +
                          '<button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-action="quick-add-cus"><i class="bi bi-plus-circle"></i> Thêm khách hàng</button>' +
                        '</div>' +
                      '</div>' +
                      '<select id="inv-customer" class="form-select" ' + (isEdit && draft.paidAmount > 0 ? 'disabled' : '') + '>' +
                        activeCustomers.map(function (c) {
                          return '<option value="' + c.id + '" ' + (draft.customerId === c.id ? 'selected' : '') + '>' + IP.Utils.escapeHtml(c.name) + ' (' + IP.Utils.escapeHtml(c.code) + ')</option>';
                        }).join('') +
                      '</select>' +
                      (selectedCus
                        ? '<div class="small text-muted mt-1">Liên hệ: <strong>' + IP.Utils.escapeHtml(selectedCus.contactName) + '</strong> (' + IP.Utils.escapeHtml(selectedCus.email) + ') · Dư nợ hiện tại: <strong class="ip-num">' + IP.Fmt.currency(cusBal.totalReceivable) + '</strong> / Hạn mức: <strong class="ip-num">' + IP.Fmt.currency(selectedCus.creditLimit) + '</strong></div>'
                        : '') +
                    '</div>' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label" for="inv-issue-date">Ngày phát hành <span class="text-danger">*</span></label>' +
                      '<input type="date" id="inv-issue-date" class="form-control" value="' + draft.issueDate + '">' +
                    '</div>' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label" for="inv-due-date">Hạn thanh toán <span class="text-danger">*</span></label>' +
                      '<input type="date" id="inv-due-date" class="form-control" value="' + draft.dueDate + '">' +
                      (draft.dueDate < draft.issueDate ? '<div class="small text-danger mt-1">Cảnh báo: Hạn thanh toán đang trước ngày phát hành!</div>' : '') +
                    '</div>' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label">Chọn nhanh kỳ hạn</label>' +
                      '<div class="btn-group w-100" role="group" aria-label="Chọn nhanh kỳ hạn">' +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="set-term" data-days="15">15 ngày</button>' +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="set-term" data-days="30">30 ngày</button>' +
                        '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="set-term" data-days="45">45 ngày</button>' +
                      '</div>' +
                    '</div>' +
                    '<div class="col-sm-6">' +
                      '<label class="form-label" for="inv-po">Mã tham chiếu / Số PO</label>' +
                      '<input type="text" id="inv-po" class="form-control" value="' + IP.Utils.escapeHtml(draft.poNumber || '') + '" placeholder="VD: PO-26-108">' +
                    '</div>' +
                    '<div class="col-sm-6">' +
                      '<label class="form-label" for="inv-internal-note">Ghi chú nội bộ (Chỉ hiển thị nội bộ)</label>' +
                      '<input type="text" id="inv-internal-note" class="form-control" value="' + IP.Utils.escapeHtml(draft.internalNote || '') + '" placeholder="Ghi chú cho Kinh doanh / Quản lý...">' +
                    '</div>' +
                    '<div class="col-12">' +
                      '<label class="form-label" for="inv-notes">Điều khoản & Ghi chú in trên hóa đơn</label>' +
                      '<textarea id="inv-notes" class="form-control" rows="2">' + IP.Utils.escapeHtml(draft.notes || '') + '</textarea>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="ip-card mb-4">' +
                '<div class="ip-card-header">' +
                  '<h2 class="ip-h2 mb-0">2. Danh mục hàng hóa & Dịch vụ (' + draft.items.length + ' dòng)</h2>' +
                  '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="add-item"><i class="bi bi-plus-circle"></i> Thêm dòng hàng</button>' +
                '</div>' +
                '<div class="ip-card-body">' +
                  itemsHtml +
                '</div>' +
              '</div>' +
            '</div>' +

            '<aside class="acc-sticky-side">' +
              '<div class="ip-card">' +
                '<div class="ip-card-header"><h2 class="ip-h2 mb-0">Tổng hợp thanh toán</h2></div>' +
                '<div class="ip-card-body">' +
                  '<div class="d-flex justify-content-between small mb-2"><span>Cộng tiền hàng:</span><span class="ip-num fw-semibold" id="sum-subtotal">' + IP.Fmt.currency(totals.subtotal) + '</span></div>' +
                  '<div class="d-flex justify-content-between small mb-2"><span>Chiết khấu:</span><span class="ip-num text-muted" id="sum-discount">-' + IP.Fmt.currency(totals.discountTotal) + '</span></div>' +
                  '<div class="d-flex justify-content-between small mb-2"><span>Thuế GTGT (VAT):</span><span class="ip-num" id="sum-vat">' + IP.Fmt.currency(totals.vatTotal) + '</span></div>' +
                  '<div class="d-flex justify-content-between border-top pt-2 mt-2 mb-2"><span class="fw-bold">Tổng thanh toán:</span><span class="fw-bold fs-5 text-primary ip-num" id="sum-total">' + IP.Fmt.currency(totals.total) + '</span></div>' +
                  '<div class="d-flex justify-content-between small text-muted mb-1"><span>Đã thu xác nhận:</span><span class="ip-num">' + IP.Fmt.currency(draft.paidAmount || 0) + '</span></div>' +
                  '<div class="d-flex justify-content-between small fw-semibold mb-3"><span>Còn phải thu:</span><span class="ip-num" id="sum-rem">' + IP.Fmt.currency(rem) + '</span></div>' +
                  '<div class="d-grid gap-2">' +
                    '<button type="button" class="btn btn-primary" data-action="save-send"><i class="bi bi-send-check"></i> Lưu & Gửi hóa đơn</button>' +
                    '<button type="button" class="btn btn-outline-secondary" data-action="save-draft"><i class="bi bi-file-earmark-check"></i> Lưu bản nháp</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div id="acc-ai-anomaly-slot"></div>' +
            '</aside>' +
          '</div>';

        // Mount AI-1 Panel
        const aiSlot = root.querySelector('#acc-ai-anomaly-slot');
        aiPanelCtrl = IP.AI.mountPanel(aiSlot, {
          id: 'anomaly',
          manualActionLabel: 'Tự kiểm tra thủ công',
          getContext: function () {
            syncDraftFromInputs();
            return { draft: draft };
          },
          onAction: function (cmd, result, payload) {
            if (cmd === 'focus-field') {
              if (payload === 'dueDate') root.querySelector('#inv-due-date').focus();
              else if (payload === 'issueDate') root.querySelector('#inv-issue-date').focus();
              else if (payload === 'customerId') root.querySelector('#inv-customer').focus();
              else {
                const firstItem = root.querySelector('[data-item-field="description"]');
                if (firstItem) firstItem.focus();
              }
            } else if (cmd === 'apply-fixes' && result && Array.isArray(result.findings)) {
              let applied = 0;
              result.findings.forEach(function (f) {
                if (f.fixType === 'dueDate' && f.fixValue) {
                  draft.dueDate = f.fixValue;
                  applied++;
                } else if (f.fixType === 'vatRate' && f.fixValue !== undefined) {
                  draft.items.forEach(function (it) { it.vatRate = Number(f.fixValue); });
                  applied++;
                }
              });
              isDirty = true;
              render();
              IP.UI.toast({
                title: 'Đã áp dụng gợi ý AI vào biểu mẫu',
                message: 'Đã điền ' + applied + ' điều chỉnh an toàn (hạn thanh toán / VAT). Vui lòng kiểm tra và bấm Lưu.',
                type: 'success'
              });
            } else if (cmd === 'manual-edit' || cmd === 'manual') {
              const firstInput = root.querySelector('#inv-due-date');
              if (firstInput) firstInput.focus();
            }
          }
        });

        bindFieldListeners();
      }

      function syncDraftFromInputs() {
        const cusEl = root.querySelector('#inv-customer');
        const issEl = root.querySelector('#inv-issue-date');
        const dueEl = root.querySelector('#inv-due-date');
        const poEl = root.querySelector('#inv-po');
        const intNoteEl = root.querySelector('#inv-internal-note');
        const notesEl = root.querySelector('#inv-notes');

        if (cusEl) draft.customerId = cusEl.value;
        if (issEl) draft.issueDate = issEl.value;
        if (dueEl) draft.dueDate = dueEl.value;
        if (poEl) draft.poNumber = poEl.value;
        if (intNoteEl) draft.internalNote = intNoteEl.value;
        if (notesEl) draft.notes = notesEl.value;
      }

      function updateLiveTotalsOnly() {
        const totals = IP.Calc.computeTotals(draft.items);
        totals.items.forEach(function (it, idx) {
          draft.items[idx].lineTotal = it.lineTotal;
          const cell = root.querySelector('[data-line-total="' + idx + '"]');
          if (cell) cell.textContent = IP.Fmt.currency(it.lineTotal);
        });
        const subEl = root.querySelector('#sum-subtotal');
        const discEl = root.querySelector('#sum-discount');
        const vatEl = root.querySelector('#sum-vat');
        const totEl = root.querySelector('#sum-total');
        const remEl = root.querySelector('#sum-rem');
        if (subEl) subEl.textContent = IP.Fmt.currency(totals.subtotal);
        if (discEl) discEl.textContent = '-' + IP.Fmt.currency(totals.discountTotal);
        if (vatEl) vatEl.textContent = IP.Fmt.currency(totals.vatTotal);
        if (totEl) totEl.textContent = IP.Fmt.currency(totals.total);
        if (remEl) remEl.textContent = IP.Fmt.currency(Math.max(0, totals.total - Number(draft.paidAmount || 0)));
      }

      function bindFieldListeners() {
        const cusEl = root.querySelector('#inv-customer');
        if (cusEl) {
          cusEl.addEventListener('change', function () {
            isDirty = true;
            draft.customerId = cusEl.value;
            const c = IP.DB.getCustomer(draft.customerId);
            if (c && !dueManuallyEdited) {
              draft.paymentTermDays = c.paymentTermDays || 30;
              draft.dueDate = IP.Seed.addDays(draft.paymentTermDays, draft.issueDate);
            }
            render();
          });
        }

        const issEl = root.querySelector('#inv-issue-date');
        if (issEl) {
          issEl.addEventListener('change', function () {
            isDirty = true;
            draft.issueDate = issEl.value;
            if (!dueManuallyEdited) {
              draft.dueDate = IP.Seed.addDays(draft.paymentTermDays || 30, draft.issueDate);
            }
            render();
          });
        }

        const dueEl = root.querySelector('#inv-due-date');
        if (dueEl) {
          dueEl.addEventListener('change', function () {
            isDirty = true;
            dueManuallyEdited = true;
            draft.dueDate = dueEl.value;
            render();
          });
        }

        root.querySelectorAll('[data-item-field]').forEach(function (inp) {
          inp.addEventListener('input', function () {
            isDirty = true;
            const idx = Number(inp.getAttribute('data-idx'));
            const field = inp.getAttribute('data-item-field');
            if (!draft.items[idx]) return;
            if (field === 'description' || field === 'unit') {
              draft.items[idx][field] = inp.value;
            } else {
              draft.items[idx][field] = Number(inp.value || 0);
            }
            updateLiveTotalsOnly();
          });
        });
      }

      function handleSave(sendNow) {
        syncDraftFromInputs();
        const errBox = root.querySelector('#inv-form-form-err') || root.querySelector('#inv-form-err-summary');
        if (errBox) errBox.classList.add('d-none');

        const payload = Object.assign({}, draft, { sendNow: sendNow });
        const res = isEdit
          ? IP.DB.updateInvoice(draft.id, payload)
          : IP.DB.createInvoice(payload);

        if (!res.ok) {
          if (errBox) {
            errBox.textContent = res.error.message;
            errBox.classList.remove('d-none');
          }
          IP.UI.toast({ title: 'Chưa thể lưu hóa đơn', message: res.error.message, type: 'danger' });
          return;
        }

        isDirty = false;
        IP.UI.toast({
          title: sendNow ? 'Đã lưu & phát hành hóa đơn' : 'Đã lưu hóa đơn nháp',
          message: 'Hóa đơn ' + res.data.number + ' đã được lưu thành công.',
          type: 'success'
        });
        setTimeout(function () {
          window.location.href = 'accountant-invoice-list.html?open=' + res.data.id;
        }, 350);
      }

      function openQuickCreateCustomerModal() {
        const modalId = 'acc-quick-cus-modal';
        let mEl = document.getElementById(modalId);
        if (mEl) mEl.remove();

        mEl = document.createElement('div');
        mEl.id = modalId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<form id="acc-quick-cus-form" novalidate>' +
                '<div class="modal-header">' +
                  '<h2 class="modal-title fs-5 fw-bold">Thêm nhanh khách hàng mới</h2>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div id="qc-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="qc-name">Tên doanh nghiệp <span class="text-danger">*</span></label>' +
                    '<input type="text" id="qc-name" class="form-control" placeholder="VD: Công ty TNHH Thương mại Bình Minh" required>' +
                  '</div>' +
                  '<div class="row g-2 mb-3">' +
                    '<div class="col-6">' +
                      '<label class="form-label" for="qc-tax">Mã số thuế (10–13 số)</label>' +
                      '<input type="text" id="qc-tax" class="form-control" value="0109988776">' +
                    '</div>' +
                    '<div class="col-6">' +
                      '<label class="form-label" for="qc-contact">Người liên hệ <span class="text-danger">*</span></label>' +
                      '<input type="text" id="qc-contact" class="form-control" placeholder="Họ và tên" required>' +
                    '</div>' +
                  '</div>' +
                  '<div class="row g-2 mb-2">' +
                    '<div class="col-6">' +
                      '<label class="form-label" for="qc-email">Email nhận HĐ <span class="text-danger">*</span></label>' +
                      '<input type="email" id="qc-email" class="form-control" placeholder="ketoan@doitac.vn" required>' +
                    '</div>' +
                    '<div class="col-6">' +
                      '<label class="form-label" for="qc-limit">Hạn mức tín dụng (VND)</label>' +
                      '<input type="number" id="qc-limit" class="form-control ip-num" value="150000000">' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="submit" class="btn btn-primary">Lưu & Chọn khách hàng</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#acc-quick-cus-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          const res = IP.DB.createCustomer({
            name: mEl.querySelector('#qc-name').value,
            taxCode: mEl.querySelector('#qc-tax').value,
            contactName: mEl.querySelector('#qc-contact').value,
            email: mEl.querySelector('#qc-email').value,
            creditLimit: Number(mEl.querySelector('#qc-limit').value || 150000000),
            paymentTermDays: 30
          });
          if (!res.ok) {
            const errEl = mEl.querySelector('#qc-err');
            errEl.textContent = res.error.message;
            errEl.classList.remove('d-none');
            return;
          }
          if (bsModal) bsModal.hide();
          else mEl.remove();
          draft.customerId = res.data.id;
          isDirty = true;
          render();
          IP.UI.toast({ title: 'Đã thêm khách hàng', message: 'Đã chọn ' + res.data.name + '.', type: 'success' });
        });
        if (bsModal) bsModal.show();
      }

      function openPrintPreviewModal() {
        syncDraftFromInputs();
        const totals = IP.Calc.computeTotals(draft.items);
        const previewInv = Object.assign({}, draft, totals);
        const mId = 'acc-print-preview-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();
        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">' +
            '<div class="modal-content">' +
              '<div class="modal-header">' +
                '<h2 class="modal-title fs-5 fw-bold">Xem trước bản in hóa đơn · ' + IP.Utils.escapeHtml(draft.number) + '</h2>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
              '</div>' +
              '<div class="modal-body bg-secondary-subtle p-4">' +
                IP.UI.renderInvoicePrint(previewInv) +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Đóng</button>' +
                '<button type="button" class="btn btn-primary" id="acc-modal-print-btn"><i class="bi bi-printer"></i> In hóa đơn (A4)</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#acc-modal-print-btn').addEventListener('click', function () {
          window.print();
        });
        if (bsModal) bsModal.show();
      }

      render();
      if (params.ai === '1' && aiPanelCtrl) {
        aiPanelCtrl.run();
      }

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');

        if (action === 'add-item') {
          syncDraftFromInputs();
          isDirty = true;
          draft.items.push({
            id: IP.Utils.uid('itm'),
            description: 'Dịch vụ hỗ trợ kỹ thuật và bảo trì định kỳ',
            quantity: 1,
            unit: 'Gói',
            unitPrice: 9500000,
            discountPercent: 0,
            vatRate: def.defaultVat !== undefined ? def.defaultVat : 10,
            lineTotal: 10450000
          });
          render();
        } else if (action === 'remove-item') {
          const idx = Number(btn.getAttribute('data-idx'));
          if (draft.items.length <= 1) return;
          syncDraftFromInputs();
          const row = draft.items[idx];
          if (row && row.description) {
            IP.UI.confirmModal({
              title: 'Xóa dòng hàng hóa này?',
              message: 'Bạn có chắc chắn muốn xóa dòng "' + row.description + '" khỏi hóa đơn?',
              confirmText: 'Xóa dòng',
              variant: 'danger',
              onConfirm: function () {
                draft.items.splice(idx, 1);
                isDirty = true;
                render();
              }
            });
          } else {
            draft.items.splice(idx, 1);
            render();
          }
        } else if (action === 'set-term') {
          syncDraftFromInputs();
          const days = Number(btn.getAttribute('data-days') || 30);
          draft.paymentTermDays = days;
          draft.dueDate = IP.Seed.addDays(days, draft.issueDate);
          dueManuallyEdited = true;
          isDirty = true;
          render();
        } else if (action === 'open-cus-picker') {
          syncDraftFromInputs();
          IP.UI.openCustomerPicker({
            selectedId: draft.customerId,
            onSelect: function (chosen) {
              draft.customerId = chosen.id;
              if (!dueManuallyEdited) {
                draft.paymentTermDays = chosen.paymentTermDays || 30;
                draft.dueDate = IP.Seed.addDays(draft.paymentTermDays, draft.issueDate);
              }
              isDirty = true;
              render();
            }
          });
        } else if (action === 'quick-add-cus') {
          syncDraftFromInputs();
          openQuickCreateCustomerModal();
        } else if (action === 'preview-print') {
          openPrintPreviewModal();
        } else if (action === 'save-draft') {
          handleSave(false);
        } else if (action === 'save-send') {
          handleSave(true);
        } else if (action === 'cancel-form') {
          if (isDirty) {
            IP.UI.confirmModal({
              title: 'Rời khỏi biểu mẫu chưa lưu?',
              message: 'Các thay đổi bạn vừa nhập trên biểu mẫu hóa đơn chưa được lưu. Bạn có chắc muốn rời trang?',
              confirmText: 'Rời trang',
              variant: 'danger',
              onConfirm: function () {
                isDirty = false;
                window.location.href = 'accountant-invoice-list.html';
              }
            });
          } else {
            window.location.href = 'accountant-invoice-list.html';
          }
        }
      });
    }
  });
})(window);
