/**
 * @owner SV2
 * @spec §8.2, §9.3 Sales Payment Reminders & AI-2 Composer (reminders.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('sales-payment-reminders', {
    roles: ['sales'],
    init: function () {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      let currentTab = params.tab || 'all';
      let searchQuery = '';
      let channelFilter = 'all';

      // Composer state
      let composerOpen = false;
      let editingReminderId = null;
      const composer = {
        customerId: 'cus_01',
        invoiceIds: [],
        channel: 'email',
        tone: 'friendly',
        subject: '',
        body: '',
        scheduledAt: IP.Seed.addDays(1) + 'T09:00',
        aiGenerated: false,
        notice: ''
      };

      function initComposerFromParams() {
        if (!params.customerId && !params.invoiceId && !params.open) return;

        if (params.open) {
          const existing = IP.DB.getReminder(params.open);
          if (existing) {
            editingReminderId = existing.id;
            composer.customerId = existing.customerId;
            composer.invoiceIds = existing.invoiceIds.slice();
            composer.channel = existing.channel;
            composer.tone = existing.tone;
            composer.subject = existing.subject;
            composer.body = existing.body;
            composer.Open = true;
            composerOpen = true;
            return;
          }
        }

        let validCus = params.customerId ? IP.DB.getCustomer(params.customerId) : null;
        const validInv = params.invoiceId ? IP.DB.getInvoice(params.invoiceId) : null;

        if (!validCus && validInv) {
          validCus = IP.DB.getCustomer(validInv.customerId);
        }

        if (params.customerId && !validCus) {
          composer.notice = 'Mã khách hàng trên đường dẫn không tồn tại nên hệ thống đã chọn mặc định khách hàng đầu tiên.';
        }

        if (validCus) {
          composer.customerId = validCus.id;
        }
        const openInvs = IP.DB.listInvoices({ customerId: composer.customerId }).filter(function (inv) {
          return !inv.voided && !inv.archived && IP.Calc.remaining(inv) > 0;
        });
        if (validInv && validInv.customerId === composer.customerId && IP.Calc.remaining(validInv) > 0) {
          composer.invoiceIds = [validInv.id];
        } else {
          composer.invoiceIds = openInvs.slice(0, 2).map(function (i) { return i.id; });
        }
        applyManualTemplate();
        composerOpen = true;
      }

      function applyManualTemplate(templateId) {
        const settings = IP.DB.getSettings();
        const templates = settings.reminderTemplates || [];
        const tpl = (templateId && templates.find(function (t) { return t.id === templateId; })) ||
          templates.find(function (t) { return t.channel === composer.channel && t.isDefault; }) ||
          templates[0];
        if (!tpl) return;

        const cus = IP.DB.getCustomer(composer.customerId) || { name: 'Quý khách hàng' };
        const invs = composer.invoiceIds.map(function (id) { return IP.DB.getInvoice(id); }).filter(Boolean);
        const codes = invs.length ? invs.map(function (i) { return i.number; }).join(', ') : 'IP-2026-XXXX';
        const sumAmt = invs.reduce(function (s, i) { return s + IP.Calc.remaining(i); }, 0);
        const dueStr = invs[0] ? IP.Fmt.date(invs[0].dueDate) : IP.Fmt.date(IP.Seed.todayISO());
        const comp = settings.company || {};
        const sess = IP.Auth.getSession();

        function replaceVars(text) {
          return String(text || '')
            .replace(/\{ten_khach_hang\}/g, cus.name)
            .replace(/\{ma_hoa_don\}/g, codes)
            .replace(/\{so_tien\}/g, IP.Fmt.currency(sumAmt))
            .replace(/\{han_thanh_toan\}/g, dueStr)
            .replace(/\{ngan_hang\}/g, (comp.bankName || 'Vietcombank') + ' - ' + (comp.bankAccount || ''))
            .replace(/\{nguoi_gui\}/g, (sess && sess.name) ? sess.name : 'Bộ phận Công nợ');
        }

        composer.subject = replaceVars(tpl.subject);
        composer.body = replaceVars(tpl.body);
        composer.aiGenerated = false;
      }

      function render() {
        const all = IP.DB.listReminders({});
        const counts = {
          all: all.length,
          draft: all.filter(function (r) { return r.status === 'draft'; }).length,
          scheduled: all.filter(function (r) { return r.status === 'scheduled'; }).length,
          sent: all.filter(function (r) { return r.status === 'sent'; }).length,
          failed: all.filter(function (r) { return r.status === 'failed'; }).length,
          cancelled: all.filter(function (r) { return r.status === 'cancelled'; }).length
        };

        const filtered = IP.DB.listReminders({
          status: currentTab,
          channel: channelFilter,
          q: searchQuery
        });

        const statusTabs = [
          { id: 'all', label: 'Tất cả (' + counts.all + ')' },
          { id: 'draft', label: 'Nháp (' + counts.draft + ')' },
          { id: 'scheduled', label: 'Đã lên lịch (' + counts.scheduled + ')' },
          { id: 'sent', label: 'Đã gửi (' + counts.sent + ')' },
          { id: 'failed', label: 'Thất bại (' + counts.failed + ')' },
          { id: 'cancelled', label: 'Đã hủy (' + counts.cancelled + ')' }
        ];

        const rowsHtml = filtered.map(function (r) {
          const cus = IP.DB.getCustomer(r.customerId);
          const invCodes = (r.invoiceIds || []).map(function (id) {
            const inv = IP.DB.getInvoice(id);
            return inv ? inv.number : id;
          }).join(', ');

          return (
            '<tr>' +
              '<td data-label="Khách hàng">' +
                '<div class="fw-bold">' + IP.Utils.escapeHtml(cus ? cus.name : r.customerId) + '</div>' +
                '<div class="small text-muted">' + IP.Utils.escapeHtml(cus ? cus.email : '') + '</div>' +
              '</td>' +
              '<td data-label="Hóa đơn liên quan"><span class="font-monospace small fw-semibold">' + IP.Utils.escapeHtml(invCodes) + '</span></td>' +
              '<td data-label="Kênh & Giọng điệu">' +
                '<div>' + IP.Fmt.channelLabel(r.channel) + ' · ' + IP.Fmt.toneLabel(r.tone) + '</div>' +
                (r.aiGenerated ? '<span class="badge bg-warning-subtle text-warning-emphasis" style="font-size:0.68rem">Soạn bởi AI-2</span>' : '') +
              '</td>' +
              '<td data-label="Nội dung tóm tắt" style="max-width:280px;">' +
                '<div class="fw-semibold text-truncate">' + IP.Utils.escapeHtml(r.subject) + '</div>' +
                '<div class="small text-muted text-truncate">' + IP.Utils.escapeHtml(r.body) + '</div>' +
                (r.failReason ? '<div class="small text-danger mt-1"><i class="bi bi-exclamation-circle"></i> ' + IP.Utils.escapeHtml(r.failReason) + '</div>' : '') +
              '</td>' +
              '<td data-label="Thời gian">' +
                '<div class="small">' + (r.sentAt ? ('Đã gửi: ' + IP.Fmt.dateTime(r.sentAt)) : (r.scheduledAt ? ('Hẹn: ' + IP.Fmt.dateTime(r.scheduledAt)) : ('Tạo: ' + IP.Fmt.dateTime(r.createdAt)))) + '</div>' +
              '</td>' +
              '<td data-label="Trạng thái">' + IP.UI.statusBadge(r.status) + '</td>' +
              '<td data-label="Thao tác" class="text-end">' +
                '<div class="btn-group">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-reminder" data-id="' + r.id + '" title="Xem hoặc chỉnh sửa"><i class="bi bi-pencil"></i></button>' +
                  (r.status === 'failed'
                    ? '<button type="button" class="btn btn-sm btn-primary" data-action="retry-send" data-id="' + r.id + '"><i class="bi bi-arrow-repeat"></i> Gửi lại</button>'
                    : '') +
                  (r.status === 'draft' || r.status === 'scheduled'
                    ? '<button type="button" class="btn btn-sm btn-primary" data-action="send-now-row" data-id="' + r.id + '"><i class="bi bi-send"></i> Gửi ngay</button>'
                    : '') +
                  (r.status === 'scheduled'
                    ? '<button type="button" class="btn btn-sm btn-outline-warning" data-action="cancel-reminder" data-id="' + r.id + '" title="Hủy lịch gửi"><i class="bi bi-x-lg"></i></button>'
                    : '') +
                  (r.status === 'draft' || r.status === 'cancelled'
                    ? '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-reminder" data-id="' + r.id + '" title="Xóa bản nhắc"><i class="bi bi-trash"></i></button>'
                    : '') +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Nhắc thanh toán</h1>' +
              '<p class="ip-page-subtitle">Soạn thông điệp nhắc hạn lịch sự bằng AI-2 hoặc mẫu chuẩn, quản lý lịch gửi và theo dõi lịch sử phản hồi.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-primary" data-action="open-composer"><i class="bi bi-plus-lg"></i> Tạo nhắc thanh toán</button>' +
            '</div>' +
          '</div>' +

          '<div class="ip-filter-bar">' +
            '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
              '<div class="d-flex flex-wrap gap-1" role="tablist">' +
                statusTabs.map(function (t) {
                  return '<button type="button" class="btn btn-sm ' + (currentTab === t.id ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="' + t.id + '">' + IP.Utils.escapeHtml(t.label) + '</button>';
                }).join('') +
              '</div>' +
              '<div class="d-flex gap-2">' +
                '<input type="search" id="rem-q" class="form-control form-control-sm" style="width:210px;" value="' + IP.Utils.escapeHtml(searchQuery) + '" placeholder="Tìm khách hàng, nội dung...">' +
                '<select id="rem-channel" class="form-select form-select-sm" style="width:140px;">' +
                  '<option value="all" ' + (channelFilter === 'all' ? 'selected' : '') + '>Mọi kênh</option>' +
                  '<option value="email" ' + (channelFilter === 'email' ? 'selected' : '') + '>Email</option>' +
                  '<option value="sms" ' + (channelFilter === 'sms' ? 'selected' : '') + '>SMS</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="ip-table-wrap">' +
            (filtered.length
              ? '<div class="table-responsive">' +
                  '<table class="table ip-table-responsive-cards align-middle">' +
                    '<thead><tr><th>Khách hàng</th><th>Hóa đơn</th><th>Kênh & Giọng điệu</th><th>Nội dung</th><th>Thời gian</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr></thead>' +
                    '<tbody>' + rowsHtml + '</tbody>' +
                  '</table>' +
                '</div>'
              : IP.UI.renderEmptyState({
                  title: 'Chưa có bản nhắc thanh toán nào trong mục này',
                  description: 'Bấm Tạo nhắc thanh toán để soạn bản nhắc mới bằng AI-2.',
                  actionText: 'Tạo nhắc thanh toán',
                  actionAttr: 'open-composer'
                })) +
          '</div>' +
          '<div id="sal-composer-host"></div>';

        const qEl = root.querySelector('#rem-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            searchQuery = qEl.value;
            render();
          }, 200));
        }
        const chEl = root.querySelector('#rem-channel');
        if (chEl) {
          chEl.addEventListener('change', function () {
            channelFilter = chEl.value;
            render();
          });
        }

        if (composerOpen) {
          renderComposerDrawer();
        }
      }

      function renderComposerDrawer() {
        const host = document.getElementById('sal-composer-host');
        if (!host) return;

        const customers = IP.DB.listCustomers({ status: 'active' });
        const selectedCus = IP.DB.getCustomer(composer.customerId);
        const unpaidInvs = IP.DB.listInvoices({ customerId: composer.customerId }).filter(function (inv) {
          return !inv.voided && !inv.archived && inv.sentAt && IP.Calc.remaining(inv) > 0;
        });
        const selectedTotal = unpaidInvs
          .filter(function (inv) { return composer.invoiceIds.includes(inv.id); })
          .reduce(function (s, inv) { return s + IP.Calc.remaining(inv); }, 0);
        const templates = (IP.DB.getSettings().reminderTemplates || []);

        host.innerHTML =
          '<div class="offcanvas offcanvas-end ip-drawer-xl show" tabindex="-1" style="visibility:visible;" aria-modal="true" role="dialog">' +
            '<div class="offcanvas-header border-bottom">' +
              '<div>' +
                '<h2 class="offcanvas-title fs-5 fw-bold mb-0">' + (editingReminderId ? 'Chỉnh sửa bản nhắc thanh toán' : 'Soạn nhắc thanh toán mới (4 bước)') + '</h2>' +
                '<div class="small text-muted">Ghi nhận lịch sử gửi thông báo nhắc thanh toán và nhật ký chăm sóc công nợ B2B.</div>' +
              '</div>' +
              '<button type="button" class="btn-close" data-action="close-composer" aria-label="Đóng"></button>' +
            '</div>' +
            '<div class="offcanvas-body">' +
              (composer.notice ? '<div class="alert alert-warning py-2 small mb-3">' + IP.Utils.escapeHtml(composer.notice) + '</div>' : '') +
              '<div id="comp-err-box" class="alert alert-danger py-2 small d-none" role="alert"></div>' +

              '<div class="sal-step-indicator">' +
                '<div class="sal-step-pill active">1. Người nhận & Hóa đơn</div>' +
                '<div class="sal-step-pill active">2. Kênh & Giọng điệu</div>' +
                '<div class="sal-step-pill active">3. Nội dung & AI-2</div>' +
                '<div class="sal-step-pill active">4. Rà soát & Gửi</div>' +
              '</div>' +

              '<div class="ip-card mb-3">' +
                '<div class="ip-card-body">' +
                  '<h3 class="fs-6 fw-bold mb-2">Bước 1: Chọn khách hàng & Hóa đơn cần nhắc</h3>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="comp-customer">Khách hàng <span class="text-danger">*</span></label>' +
                    '<select id="comp-customer" class="form-select">' +
                      customers.map(function (c) {
                        const b = IP.Calc.customerBalance(c.id);
                        return '<option value="' + c.id + '" ' + (composer.customerId === c.id ? 'selected' : '') + '>' +
                          IP.Utils.escapeHtml(c.name) + ' (Dư nợ: ' + IP.Fmt.currency(b.totalReceivable) + ')' +
                        '</option>';
                      }).join('') +
                    '</select>' +
                    (selectedCus ? '<div class="small text-muted mt-1">Người nhận: <strong>' + IP.Utils.escapeHtml(selectedCus.contactName) + '</strong> · Email: <code>' + IP.Utils.escapeHtml(selectedCus.email) + '</code> · ĐT: ' + IP.Utils.escapeHtml(selectedCus.phone) + '</div>' : '') +
                  '</div>' +

                  '<div class="mb-2">' +
                    '<div class="d-flex justify-content-between align-items-center mb-1">' +
                      '<span class="form-label mb-0">Hóa đơn chưa tất toán (' + unpaidInvs.length + ')</span>' +
                      '<span class="small fw-bold text-primary ip-num">Tổng chọn nhắc: ' + IP.Fmt.currency(selectedTotal) + '</span>' +
                    '</div>' +
                    (unpaidInvs.length
                      ? '<div class="list-group">' +
                          unpaidInvs.map(function (inv) {
                            const checked = composer.invoiceIds.includes(inv.id) ? 'checked' : '';
                            const ov = IP.Calc.overdueDays(inv);
                            return (
                              '<label class="list-group-item d-flex justify-content-between align-items-center small">' +
                                '<div class="d-flex align-items-center gap-2">' +
                                  '<input type="checkbox" class="form-check-input mt-0" data-comp-inv="' + inv.id + '" ' + checked + '>' +
                                  '<span><strong>' + IP.Utils.escapeHtml(inv.number) + '</strong> · Hạn ' + IP.Fmt.date(inv.dueDate) + (ov > 0 ? (' <span class="text-danger">(Quá hạn ' + ov + ' ngày)</span>') : '') + '</span>' +
                                '</div>' +
                                '<span class="fw-bold ip-num">' + IP.Fmt.currency(IP.Calc.remaining(inv)) + '</span>' +
                              '</label>'
                            );
                          }).join('') +
                        '</div>'
                      : '<div class="alert alert-warning py-2 small mb-0">Khách hàng này hiện không có hóa đơn nào cần nhắc thanh toán.</div>') +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="ip-card mb-3">' +
                '<div class="ip-card-body">' +
                  '<h3 class="fs-6 fw-bold mb-2">Bước 2: Kênh gửi & Giọng điệu</h3>' +
                  '<div class="row g-3">' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label" for="comp-channel">Kênh gửi</label>' +
                      '<select id="comp-channel" class="form-select">' +
                        '<option value="email" ' + (composer.channel === 'email' ? 'selected' : '') + '>Email doanh nghiệp</option>' +
                        '<option value="sms" ' + (composer.channel === 'sms' ? 'selected' : '') + '>Tin nhắn SMS</option>' +
                      '</select>' +
                    '</div>' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label" for="comp-tone">Giọng điệu</label>' +
                      '<select id="comp-tone" class="form-select">' +
                        '<option value="friendly" ' + (composer.tone === 'friendly' ? 'selected' : '') + '>Thân thiện (Nhắc nhẹ)</option>' +
                        '<option value="formal" ' + (composer.tone === 'formal' ? 'selected' : '') + '>Trang trọng (Đối chiếu)</option>' +
                        '<option value="firm" ' + (composer.tone === 'firm' ? 'selected' : '') + '>Cứng rắn nhưng lịch sự</option>' +
                      '</select>' +
                    '</div>' +
                    '<div class="col-sm-4">' +
                      '<label class="form-label" for="comp-tpl">Dùng mẫu thủ công</label>' +
                      '<select id="comp-tpl" class="form-select">' +
                        '<option value="">-- Chọn mẫu từ Cấu hình --</option>' +
                        templates.map(function (t) {
                          return '<option value="' + t.id + '">' + IP.Utils.escapeHtml(t.name) + '</option>';
                        }).join('') +
                      '</select>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="mb-3" id="sal-ai-reminder-slot"></div>' +

              '<div class="ip-card mb-3">' +
                '<div class="ip-card-body">' +
                  '<h3 class="fs-6 fw-bold mb-2">Bước 3 & 4: Nội dung soạn thảo & Xem trước</h3>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="comp-subject">Tiêu đề (Tối đa 120 ký tự) <span class="text-danger">*</span></label>' +
                    '<input type="text" id="comp-subject" class="form-control" maxlength="120" value="' + IP.Utils.escapeHtml(composer.subject) + '">' +
                  '</div>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="comp-body">Nội dung thông điệp (Tối đa 2.000 ký tự) <span class="text-danger">*</span></label>' +
                    '<textarea id="comp-body" class="form-control" rows="6" maxlength="2000">' + IP.Utils.escapeHtml(composer.body) + '</textarea>' +
                  '</div>' +
                  '<div class="row g-3 align-items-end">' +
                    '<div class="col-sm-6">' +
                      '<label class="form-label" for="comp-sched">Thời gian hẹn gửi (Nếu chọn Lên lịch)</label>' +
                      '<input type="datetime-local" id="comp-sched" class="form-control" value="' + IP.Utils.escapeHtml(composer.scheduledAt) + '">' +
                    '</div>' +
                    '<div class="col-sm-6">' +
                      '<div class="small text-muted">Xem trước bản gửi (' + IP.Fmt.channelLabel(composer.channel) + '):</div>' +
                      '<div class="sal-preview-box mt-1" id="comp-live-preview">' + IP.Utils.escapeHtml(composer.body || 'Chưa có nội dung...') + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="offcanvas-header border-top bg-body-tertiary d-flex justify-content-between flex-wrap gap-2">' +
              '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="save-rem-mode" data-mode="draft"><i class="bi bi-file-earmark"></i> Lưu bản nháp</button>' +
              '<div class="d-flex gap-2">' +
                '<button type="button" class="btn btn-outline-primary btn-sm" data-action="save-rem-mode" data-mode="scheduled"><i class="bi bi-clock"></i> Lên lịch gửi</button>' +
                '<button type="button" class="btn btn-primary btn-sm" data-action="save-rem-mode" data-mode="sent"><i class="bi bi-send-check"></i> Gửi thông báo ngay</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="offcanvas-backdrop fade show" data-action="close-composer"></div>';

        const aiSlot = host.querySelector('#sal-ai-reminder-slot');
        IP.AI.mountPanel(aiSlot, {
          id: 'reminder',
          manualActionLabel: 'Dùng mẫu thủ công',
          getContext: function () {
            syncComposerInputs(host);
            return composer;
          },
          onAction: function (cmd, result) {
            if ((cmd === 'use-draft' || cmd === 'edit-draft') && result && result.content) {
              composer.subject = result.content.subject;
              composer.body = result.content.body;
              composer.aiGenerated = true;
              const subEl = host.querySelector('#comp-subject');
              const bodyEl = host.querySelector('#comp-body');
              const prevEl = host.querySelector('#comp-live-preview');
              if (subEl) subEl.value = composer.subject;
              if (bodyEl) {
                bodyEl.value = composer.body;
                if (cmd === 'edit-draft') bodyEl.focus();
              }
              if (prevEl) prevEl.textContent = composer.body;
              IP.UI.toast({ title: 'Đã đưa bản nháp AI vào trình soạn thảo', message: 'Bạn có thể chỉnh sửa thêm trước khi Lưu hoặc Gửi.', type: 'success' });
            } else if (cmd === 'manual') {
              applyManualTemplate();
              renderComposerDrawer();
            }
          }
        });

        // Bind composer inputs
        const cusSel = host.querySelector('#comp-customer');
        if (cusSel) {
          cusSel.addEventListener('change', function () {
            composer.customerId = cusSel.value;
            const openInvs = IP.DB.listInvoices({ customerId: composer.customerId }).filter(function (i) {
              return !i.voided && !i.archived && IP.Calc.remaining(i) > 0;
            });
            composer.invoiceIds = openInvs.slice(0, 2).map(function (i) { return i.id; });
            applyManualTemplate();
            renderComposerDrawer();
          });
        }
        host.querySelectorAll('[data-comp-inv]').forEach(function (chk) {
          chk.addEventListener('change', function () {
            const invId = chk.getAttribute('data-comp-inv');
            if (chk.checked) {
              if (!composer.invoiceIds.includes(invId)) composer.invoiceIds.push(invId);
            } else {
              composer.invoiceIds = composer.invoiceIds.filter(function (x) { return x !== invId; });
            }
            renderComposerDrawer();
          });
        });
        const chSel = host.querySelector('#comp-channel');
        if (chSel) {
          chSel.addEventListener('change', function () {
            composer.channel = chSel.value;
            applyManualTemplate();
            renderComposerDrawer();
          });
        }
        const toneSel = host.querySelector('#comp-tone');
        if (toneSel) {
          toneSel.addEventListener('change', function () {
            composer.tone = toneSel.value;
          });
        }
        const tplSel = host.querySelector('#comp-tpl');
        if (tplSel) {
          tplSel.addEventListener('change', function () {
            if (tplSel.value) {
              applyManualTemplate(tplSel.value);
              renderComposerDrawer();
            }
          });
        }
        const bodyEl = host.querySelector('#comp-body');
        if (bodyEl) {
          bodyEl.addEventListener('input', function () {
            composer.body = bodyEl.value;
            const prev = host.querySelector('#comp-live-preview');
            if (prev) prev.textContent = bodyEl.value;
          });
        }
      }

      function syncComposerInputs(host) {
        const subEl = host.querySelector('#comp-subject');
        const bodyEl = host.querySelector('#comp-body');
        const schedEl = host.querySelector('#comp-sched');
        const chEl = host.querySelector('#comp-channel');
        const toneEl = host.querySelector('#comp-tone');
        if (subEl) composer.subject = subEl.value;
        if (bodyEl) composer.body = bodyEl.value;
        if (schedEl) composer.scheduledAt = schedEl.value;
        if (chEl) composer.channel = chEl.value;
        if (toneEl) composer.tone = toneEl.value;
      }

      initComposerFromParams();
      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'switch-tab') {
          currentTab = btn.getAttribute('data-tab');
          render();
        } else if (action === 'open-composer') {
          editingReminderId = null;
          composer.notice = '';
          const openInvs = IP.DB.listInvoices({ customerId: composer.customerId }).filter(function (i) {
            return !i.voided && !i.archived && IP.Calc.remaining(i) > 0;
          });
          composer.invoiceIds = openInvs.slice(0, 2).map(function (i) { return i.id; });
          applyManualTemplate();
          composerOpen = true;
          render();
        } else if (action === 'close-composer') {
          IP.UI.confirmModal({
            title: 'Xác nhận hủy soạn nhắc thanh toán?',
            message: 'Bạn có chắc chắn muốn hủy bỏ và đóng cửa sổ soạn thông báo nhắc thanh toán không?',
            confirmText: 'Chắc chắn hủy & Thoát',
            cancelText: 'Tiếp tục soạn',
            variant: 'danger',
            onConfirm: function () {
              composerOpen = false;
              editingReminderId = null;
              const host = document.getElementById('sal-composer-host');
              if (host) host.innerHTML = '';
              IP.Utils.setQueryParams({ customerId: null, invoiceId: null, open: null });
              render();
            }
          });
        } else if (action === 'edit-reminder') {
          const rem = IP.DB.getReminder(id);
          if (!rem) return;
          editingReminderId = rem.id;
          composer.customerId = rem.customerId;
          composer.invoiceIds = (rem.invoiceIds || []).slice();
          composer.channel = rem.channel;
          composer.tone = rem.tone;
          composer.subject = rem.subject;
          composer.body = rem.body;
          composerOpen = true;
          render();
        } else if (action === 'save-rem-mode') {
          const host = document.getElementById('sal-composer-host');
          syncComposerInputs(host);
          const mode = btn.getAttribute('data-mode');
          const errBox = host ? host.querySelector('#comp-err-box') : null;
          if (errBox) errBox.classList.add('d-none');

          if (!composer.invoiceIds || !composer.invoiceIds.length || !String(composer.subject || '').trim() || !String(composer.body || '').trim()) {
            const msg = (!composer.invoiceIds || !composer.invoiceIds.length)
              ? 'Vui lòng chọn ít nhất 1 hóa đơn cần nhắc thanh toán.'
              : 'Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo nhắc thanh toán.';
            if (errBox) {
              errBox.textContent = msg;
              errBox.classList.remove('d-none');
            }
            IP.UI.toast({ title: 'Thiếu thông tin bắt buộc', message: msg, type: 'warning' });
            return;
          }

          IP.UI.confirmModal({
            title: mode === 'sent' ? 'Xác nhận lưu & gửi thông báo nhắc ngay?' : (mode === 'scheduled' ? 'Xác nhận lưu & lên lịch gửi nhắc?' : 'Xác nhận lưu bản nháp nhắc thanh toán?'),
            message: 'Bạn có chắc chắn muốn ' + (mode === 'sent' ? 'gửi ngay thông báo nhắc thanh toán này' : (mode === 'scheduled' ? 'lên lịch gửi thông báo nhắc này' : 'lưu bản nháp thông báo nhắc này')) + ' và thoát khỏi cửa sổ soạn thảo không?',
            confirmText: 'Chắc chắn lưu & Thoát',
            cancelText: 'Kiểm tra lại',
            variant: 'primary',
            onConfirm: function () {
              let res;
              if (editingReminderId) {
                res = IP.DB.updateReminder(editingReminderId, Object.assign({}, composer, { status: mode }));
                if (res.ok && mode === 'sent') {
                  res = IP.DB.sendReminder(editingReminderId);
                }
              } else {
                res = IP.DB.createReminder(Object.assign({}, composer, { mode: mode }));
              }

              if (!res.ok) {
                if (errBox) {
                  errBox.textContent = res.error.message;
                  errBox.classList.remove('d-none');
                }
                return;
              }

              composerOpen = false;
              editingReminderId = null;
              if (host) host.innerHTML = '';
              IP.Utils.setQueryParams({ customerId: null, invoiceId: null, open: null });
              IP.UI.toast({
                title: mode === 'sent' ? 'Đã gửi thông báo nhắc thanh toán' : (mode === 'scheduled' ? 'Đã lên lịch gửi nhắc' : 'Đã lưu bản nháp'),
                message: res.data.subject,
                type: 'success'
              });
              render();
            }
          });
        } else if (action === 'retry-send' || action === 'send-now-row') {
          IP.UI.confirmModal({
            title: action === 'retry-send' ? 'Gửi lại thông báo nhắc này?' : 'Xác nhận gửi thông báo nhắc thanh toán ngay?',
            message: 'Hệ thống sẽ phát hành thông báo nhắc thanh toán và ghi nhận vào lịch sử hoạt động của các hóa đơn liên quan.',
            confirmText: 'Gửi ngay',
            onConfirm: function () {
              const res = IP.DB.sendReminder(id, false);
              if (!res.ok) {
                IP.UI.toast({ title: 'Không thể gửi', message: res.error.message, type: 'danger' });
                return;
              }
              IP.UI.toast({ title: 'Đã gửi thành công', message: 'Trạng thái bản nhắc đã chuyển sang Đã gửi.', type: 'success' });
              render();
            }
          });
        } else if (action === 'cancel-reminder') {
          IP.UI.confirmModal({
            title: 'Hủy lịch gửi bản nhắc này?',
            message: 'Bản nhắc sẽ chuyển sang trạng thái Đã hủy và không tự động gửi nữa.',
            confirmText: 'Hủy lịch gửi',
            variant: 'warning',
            onConfirm: function () {
              IP.DB.cancelReminder(id);
              IP.UI.toast({ title: 'Đã hủy lịch nhắc', message: 'Đã cập nhật trạng thái.', type: 'info' });
              render();
            }
          });
        } else if (action === 'delete-reminder') {
          IP.UI.confirmModal({
            title: 'Xóa bản nhắc thanh toán?',
            message: 'Bản nhắc này sẽ bị xóa khỏi danh sách.',
            confirmText: 'Xóa bản nhắc',
            variant: 'danger',
            onConfirm: function () {
              IP.DB.deleteReminder(id);
              IP.UI.toast({ title: 'Đã xóa bản nhắc', message: 'Danh sách đã được cập nhật.', type: 'success' });
              render();
            }
          });
        }
      });
    }
  });
})(window);
