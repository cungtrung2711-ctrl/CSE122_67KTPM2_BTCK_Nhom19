/**
 * @owner CORE
 * @spec §4.2, §9.1 Shared AI Assistant Framework (IP.AI)
 */
(function (window) {
  'use strict';
  const IP = (window.IP = window.IP || {});
  const _engines = {};

  IP.AI = {
    register: function (id, engine) {
      if (!id || !engine || typeof engine.run !== 'function') {
        throw new Error('[IP.AI] Đăng ký engine AI không hợp lệ: ' + id);
      }
      if (_engines[id]) {
        throw new Error('[IP.AI] Đã tồn tại engine AI: ' + id);
      }
      _engines[id] = engine;
    },

    getEngine: function (id) {
      return _engines[id] || null;
    },

    isEnabled: function (id) {
      const settings = IP.DB.getSettings();
      if (!settings || !settings.ai) return true;
      return Boolean(settings.ai[id]);
    },

    mountPanel: function (containerEl, opts) {
      if (!containerEl) return;
      const o = opts || {};
      const engineId = o.id;
      const engine = _engines[engineId];
      if (!engine) {
        containerEl.innerHTML = '<div class="ip-ai-panel small text-muted">Chưa nạp mô-đun AI (' + IP.Utils.escapeHtml(engineId) + ').</div>';
        return;
      }

      let scenarioMode = 'normal'; // 'normal' | 'insufficient' | 'error'
      let currentState = 'idle'; // 'idle' | 'loading' | 'result'
      let lastResult = null;
      let loadingStepText = 'Đang kiểm tra tính hợp lệ dữ liệu đầu vào...';

      function render() {
        const enabled = IP.AI.isEnabled(engineId);
        if (!enabled) {
          containerEl.innerHTML =
            '<div class="ip-ai-panel" role="region" aria-label="Trợ lý AI đang tắt">' +
              '<div class="ip-ai-header">' +
                '<span class="ip-ai-badge"><i class="bi bi-stars"></i> Trợ lý AI Phân tích Nghiệp vụ</span>' +
                '<span class="ip-badge ip-badge-disabled">Đang tắt</span>' +
              '</div>' +
              '<div class="fw-bold mb-1">AI đang tắt trong Cấu hình hóa đơn</div>' +
              '<p class="small text-muted mb-2">Tính năng <strong>' + IP.Utils.escapeHtml(engine.label || engineId) + '</strong> hiện đang được tắt bởi Quản trị viên. Bạn vẫn có thể thao tác thủ công bình thường.</p>' +
              '<div class="small text-muted">Hướng dẫn bật lại: Đăng nhập vai trò <strong>Quản trị viên</strong> → mở <code>Cấu hình hóa đơn</code> → tab <code>4. Trợ lý AI & Dữ liệu hệ thống</code>.</div>' +
            '</div>';
          return;
        }

        const headerHtml =
          '<div class="ip-ai-header">' +
            '<span class="ip-ai-badge"><i class="bi bi-stars"></i> Trợ lý AI Phân tích Nghiệp vụ</span>' +
            '<div class="d-flex align-items-center gap-1">' +
              '<label class="small text-muted me-1" for="ip-ai-mode-' + engineId + '">Kịch bản kiểm thử:</label>' +
              '<select id="ip-ai-mode-' + engineId + '" class="form-select form-select-sm py-0 px-2" style="width:auto;font-size:0.76rem;min-height:28px;">' +
                '<option value="normal" ' + (scenarioMode === 'normal' ? 'selected' : '') + '>Bình thường</option>' +
                '<option value="insufficient" ' + (scenarioMode === 'insufficient' ? 'selected' : '') + '>Thiếu dữ liệu</option>' +
                '<option value="error" ' + (scenarioMode === 'error' ? 'selected' : '') + '>Lỗi xử lý</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="ip-ai-disclaimer">Kết quả được phân tích từ sổ công nợ nội bộ, vui lòng đối chiếu chứng từ trước khi áp dụng.</div>';

        let bodyHtml = '';

        if (currentState === 'idle') {
          bodyHtml =
            '<div class="mb-2 fw-semibold">' + IP.Utils.escapeHtml(engine.label) + '</div>' +
            '<p class="small text-muted mb-3">' + IP.Utils.escapeHtml(engine.description || '') + '</p>' +
            '<button type="button" class="btn btn-primary btn-sm w-100" data-ai-cmd="run">' +
              '<i class="bi bi-stars"></i> ' + IP.Utils.escapeHtml(engine.ctaText || 'Chạy phân tích AI') +
            '</button>';
        } else if (currentState === 'loading') {
          bodyHtml =
            '<div class="py-2" aria-live="polite" aria-busy="true">' +
              '<div class="d-flex align-items-center gap-2 mb-2 fw-semibold small">' +
                '<span class="spinner-border spinner-border-sm text-warning" role="status" aria-hidden="true"></span>' +
                '<span id="ip-ai-step-' + engineId + '">' + IP.Utils.escapeHtml(loadingStepText) + '</span>' +
              '</div>' +
              '<div class="ip-skeleton mb-2" style="height: 22px; width: 75%;"></div>' +
              '<div class="ip-skeleton mb-2" style="height: 54px; width: 100%;"></div>' +
              '<div class="ip-skeleton" style="height: 32px; width: 60%;"></div>' +
            '</div>';
        } else if (currentState === 'result' && lastResult) {
          if (lastResult.status === 'insufficient') {
            bodyHtml =
              '<div class="alert alert-warning py-2 px-3 small mb-2" role="alert">' +
                '<div class="fw-bold mb-1"><i class="bi bi-exclamation-triangle me-1"></i>' + IP.Utils.escapeHtml(lastResult.title || 'Không đủ dữ liệu để đưa ra đề xuất') + '</div>' +
                '<div>' + IP.Utils.escapeHtml(lastResult.summary || 'Vui lòng bổ sung dữ liệu cần thiết rồi thử lại.') + '</div>' +
              '</div>' +
              '<div class="d-flex flex-wrap gap-2 mt-2">' +
                '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="run"><i class="bi bi-arrow-clockwise"></i> Thử lại</button>' +
                (o.manualActionLabel ? '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="manual">' + IP.Utils.escapeHtml(o.manualActionLabel) + '</button>' : '') +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="dismiss">Bỏ qua</button>' +
              '</div>';
          } else if (lastResult.status === 'error') {
            bodyHtml =
              '<div class="alert alert-danger py-2 px-3 small mb-2" role="alert">' +
                '<div class="fw-bold mb-1"><i class="bi bi-x-octagon me-1"></i>' + IP.Utils.escapeHtml(lastResult.title || 'Không thể xử lý yêu cầu lúc này') + '</div>' +
                '<div>' + IP.Utils.escapeHtml(lastResult.summary || 'Bộ xử lý phân tích tạm thời gián đoạn. Bạn có thể bấm Thử lại hoặc tiếp tục thao tác thủ công.') + '</div>' +
              '</div>' +
              '<div class="d-flex flex-wrap gap-2 mt-2">' +
                '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="run"><i class="bi bi-arrow-clockwise"></i> Thử lại</button>' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="manual">' + IP.Utils.escapeHtml(o.manualActionLabel || 'Tự kiểm tra thủ công') + '</button>' +
              '</div>';
          } else {
            const confLabel = IP.Fmt.statusLabel(lastResult.confidence || 'high');
            const customBody = typeof engine.renderResultBody === 'function'
              ? engine.renderResultBody(lastResult)
              : '<div class="small mb-2">' + IP.Utils.escapeHtml(lastResult.summary) + '</div>';

            const exp = lastResult.explanation || { dataUsed: [], rules: [], evidence: [] };
            const accId = 'ip-ai-exp-' + engineId;
            const explanationHtml =
              '<div class="accordion accordion-flush border rounded mb-3 bg-body" id="' + accId + '">' +
                '<div class="accordion-item">' +
                  '<h3 class="accordion-header">' +
                    '<button class="accordion-button collapsed py-2 px-3 small fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#' + accId + '-body" aria-expanded="false">' +
                      'Vì sao có kết quả này? (Độ tin cậy: ' + IP.Utils.escapeHtml(confLabel) + ')' +
                    '</button>' +
                  '</h3>' +
                  '<div id="' + accId + '-body" class="accordion-collapse collapse">' +
                    '<div class="accordion-body py-2 px-3 small">' +
                      '<div class="mb-1"><strong>Dữ liệu đã dùng:</strong> ' + (exp.dataUsed || []).map(IP.Utils.escapeHtml).join('; ') + '</div>' +
                      '<div class="mb-1"><strong>Quy tắc & Giả định:</strong> ' + (exp.rules || []).map(IP.Utils.escapeHtml).join('; ') + '</div>' +
                      '<div><strong>Bằng chứng số liệu:</strong> ' + (exp.evidence || []).map(IP.Utils.escapeHtml).join('; ') + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';

            const actionsHtml = typeof engine.renderActions === 'function'
              ? engine.renderActions(lastResult)
              : '<button type="button" class="btn btn-primary btn-sm" data-ai-cmd="accept">Áp dụng</button>' +
                '<button type="button" class="btn btn-outline-secondary btn-sm" data-ai-cmd="run">Kiểm tra lại</button>';

            bodyHtml =
              '<div class="d-flex justify-content-between align-items-center mb-2">' +
                '<span class="fw-bold small">' + IP.Utils.escapeHtml(lastResult.title || 'Kết quả phân tích') + '</span>' +
                '<span class="ip-badge ip-badge-' + IP.Utils.escapeHtml(lastResult.confidence || 'high') + '">Độ tin cậy: ' + IP.Utils.escapeHtml(confLabel) + '</span>' +
              '</div>' +
              customBody +
              explanationHtml +
              '<div class="d-flex flex-wrap gap-2">' + actionsHtml + '</div>';
          }
        }

        containerEl.innerHTML = '<div class="ip-ai-panel">' + headerHtml + bodyHtml + '</div>';

        const modeSelect = containerEl.querySelector('#ip-ai-mode-' + engineId);
        if (modeSelect) {
          modeSelect.addEventListener('change', function () {
            scenarioMode = modeSelect.value;
          });
        }
      }

      function triggerRun() {
        const ctx = typeof o.getContext === 'function' ? o.getContext() : (o.context || {});
        currentState = 'loading';
        loadingStepText = 'Đang đối chiếu dữ liệu đầu vào...';
        render();

        setTimeout(function () {
          const stepEl = containerEl.querySelector('#ip-ai-step-' + engineId);
          if (stepEl) stepEl.textContent = 'Đang tổng hợp bằng chứng số liệu & quy tắc...';
        }, 700);

        setTimeout(function () {
          lastResult = engine.run(ctx, scenarioMode);
          currentState = 'result';
          render();
          if (typeof o.onResult === 'function') {
            o.onResult(lastResult);
          }
        }, 1450);
      }

      containerEl.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-ai-cmd]');
        if (!btn) return;
        const cmd = btn.getAttribute('data-ai-cmd');
        const payload = btn.getAttribute('data-ai-payload') || '';

        if (cmd === 'run') {
          triggerRun();
        } else if (cmd === 'dismiss') {
          currentState = 'idle';
          lastResult = null;
          render();
          if (typeof o.onAction === 'function') o.onAction('dismiss', lastResult, payload);
        } else {
          if (typeof o.onAction === 'function') {
            o.onAction(cmd, lastResult, payload);
          }
        }
      });

      render();

      return {
        run: triggerRun,
        refresh: render,
        getLastResult: function () { return lastResult; }
      };
    }
  };
})(window);

/* ================================================================
   Floating Cross-Module AI Business Assistant (Role-Scoped)
   ================================================================ */
(function (window) {
  'use strict';

  function mountFloatingChatbot() {
    if (document.getElementById('ip-chatbot-root')) return;
    const wrap = document.createElement('div');
    wrap.id = 'ip-chatbot-root';
    wrap.className = 'ip-chatbot-root ip-no-print';
    wrap.innerHTML =
      '<section id="ip-chatbot-panel" class="ip-chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="ip-chatbot-title" aria-hidden="true" hidden>' +
        '<header class="ip-chatbot-head">' +
          '<div class="ip-chatbot-brand-mark" aria-hidden="true"><i class="bi bi-stars"></i></div>' +
          '<div class="ip-chatbot-title-wrap">' +
            '<strong id="ip-chatbot-title">InvoicePilot AI</strong>' +
            '<span id="ip-chatbot-status"><span class="ip-chatbot-status-dot"></span> Phân tích dữ liệu nội bộ</span>' +
          '</div>' +
          '<button type="button" id="ip-chatbot-clear" class="ip-chatbot-head-btn" aria-label="Xóa cuộc trò chuyện" title="Cuộc trò chuyện mới"><i class="bi bi-arrow-counterclockwise"></i></button>' +
          '<button type="button" id="ip-chatbot-close" class="ip-chatbot-head-btn" aria-label="Đóng trợ lý AI" title="Đóng"><i class="bi bi-x-lg"></i></button>' +
        '</header>' +
        '<div class="ip-chatbot-context" id="ip-chatbot-context">Trợ lý theo vai trò nghiệp vụ</div>' +
        '<div id="ip-chatbot-messages" class="ip-chatbot-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>' +
        '<div class="ip-chatbot-suggestions" id="ip-chatbot-suggestions" aria-label="Câu hỏi gợi ý theo vai trò"></div>' +
        '<form id="ip-chatbot-form" class="ip-chatbot-composer">' +
          '<label class="visually-hidden" for="ip-chatbot-input">Nhập câu hỏi nghiệp vụ</label>' +
          '<textarea id="ip-chatbot-input" rows="1" maxlength="2000" placeholder="Hỏi về công nợ, hóa đơn, dòng tiền…" autocomplete="off"></textarea>' +
          '<button type="submit" id="ip-chatbot-send" aria-label="Gửi câu hỏi" title="Gửi câu hỏi"><i class="bi bi-send-fill"></i></button>' +
        '</form>' +
        '<footer class="ip-chatbot-foot">Số liệu tổng hợp từ sổ kế toán nội bộ, vui lòng đối chiếu chứng từ gốc trước khi phê duyệt.</footer>' +
      '</section>' +
      '<button type="button" id="ip-chatbot-toggle" class="ip-chatbot-toggle" aria-label="Mở trợ lý AI InvoicePilot" aria-expanded="false" aria-controls="ip-chatbot-panel">' +
        '<i class="bi bi-stars ip-chatbot-toggle-icon" aria-hidden="true"></i><span>Trợ lý AI</span><span class="ip-chatbot-toggle-pulse" aria-hidden="true"></span>' +
      '</button>';

    document.body.appendChild(wrap);

    const panel = document.getElementById('ip-chatbot-panel');
    const toggle = document.getElementById('ip-chatbot-toggle');
    const closeBtn = document.getElementById('ip-chatbot-close');
    const clearBtn = document.getElementById('ip-chatbot-clear');
    const messagesEl = document.getElementById('ip-chatbot-messages');
    const form = document.getElementById('ip-chatbot-form');
    const input = document.getElementById('ip-chatbot-input');
    const sendBtn = document.getElementById('ip-chatbot-send');
    const contextEl = document.getElementById('ip-chatbot-context');
    const suggestionsEl = document.getElementById('ip-chatbot-suggestions');
    let activeRoleKey = null;

    function getIP() { return window.IP || null; }
    function roleKey() {
      try {
        const IP = getIP();
        const session = IP && IP.Auth && IP.Auth.getSession ? IP.Auth.getSession() : null;
        return session && session.role ? session.role : 'public';
      } catch (_) { return 'public'; }
    }
    function formatMoney(v) {
      const IP = getIP();
      return (IP && IP.Fmt && IP.Fmt.currency) ? IP.Fmt.currency(v) : (Math.round(Number(v || 0)).toLocaleString('vi-VN') + ' ₫');
    }
    function roleConfig(key) {
      const configs = {
        accountant: {
          title: 'Trợ lý Kế toán AI', buttonLabel: 'Trợ lý Kế toán', placeholder: 'Hỏi về hóa đơn, đối chiếu, công nợ…', context: 'Hóa đơn GTGT (1C26TAA) · Đối chiếu · Công nợ',
          welcome: 'Xin chào! Tôi là Trợ lý Kế toán. Tôi hỗ trợ rà soát hóa đơn GTGT, số dư phải thu, giao dịch chờ xác nhận và đối chiếu sao kê ngân hàng.',
          prompts: [
            ['Giao dịch chờ đối soát', 'Tổng hợp giao dịch thanh toán đang chờ xác nhận và cách xử lý.'],
            ['Hóa đơn quá hạn', 'Phân tích hóa đơn quá hạn và số dư cần rà soát.'],
            ['Kiểm tra số dư phải thu', 'Tổng hợp số dư phải thu còn mở và các điểm cần đối chiếu.']
          ]
        },
        sales: {
          title: 'Trợ lý Kinh doanh AI', buttonLabel: 'Trợ lý Kinh doanh', placeholder: 'Hỏi về khách hàng, nhắc hạn, thu hồi…', context: 'Khách hàng · Nhắc thanh toán · Thu hồi công nợ',
          welcome: 'Xin chào! Tôi là Trợ lý Kinh doanh. Tôi tập trung vào khách hàng cần chăm sóc, kế hoạch nhắc thanh toán và hiệu quả thu hồi công nợ.',
          prompts: [
            ['Khách hàng cần liên hệ', 'Xếp thứ tự khách hàng cần liên hệ dựa trên công nợ quá hạn.'],
            ['Lịch nhắc thanh toán', 'Đề xuất kế hoạch nhắc thanh toán cho các khoản đến hạn và quá hạn.'],
            ['Khoản đến hạn 30 ngày', 'Tóm tắt các khoản dự kiến đến hạn trong 30 ngày.']
          ]
        },
        manager: {
          title: 'Trợ lý Quản lý AI', buttonLabel: 'Trợ lý Quản lý', placeholder: 'Hỏi về rủi ro, dòng tiền, ưu tiên…', context: 'Rủi ro · Chỉ số DSO · Dự báo dòng tiền',
          welcome: 'Xin chào! Tôi là Trợ lý Quản lý. Tôi tổng hợp tình hình phải thu, rủi ro quá hạn và dự báo dòng tiền để hỗ trợ ra quyết định điều hành.',
          prompts: [
            ['Tổng quan công nợ', 'Lập báo cáo quản lý về công nợ hiện tại và các rủi ro chính.'],
            ['Dự báo dòng tiền', 'Dự báo khoản phải thu trong 30 ngày tới và các giả định cần lưu ý.'],
            ['Việc cần ưu tiên', 'Đề xuất ba hành động ưu tiên cho quản lý trong tuần này.']
          ]
        },
        admin: {
          title: 'Trợ lý Quản trị Hệ thống', buttonLabel: 'Trợ lý Quản trị', placeholder: 'Hỏi về người dùng, phân quyền, cấu hình…', context: 'Người dùng · Phân quyền · Cấu hình chuẩn thuế',
          welcome: 'Xin chào! Tôi là Trợ lý Quản trị. Tôi hỗ trợ kiểm tra trạng thái tài khoản các nghiệp vụ, phân quyền Admin và cấu hình hóa đơn điện tử.',
          prompts: [
            ['Tổng quan người dùng', 'Thống kê tài khoản theo vai trò và trạng thái hiện tại.'],
            ['Rà soát phân quyền', 'Đề xuất danh mục kiểm tra phân quyền an toàn cho hệ thống.']
          ]
        },
        public: {
          title: 'Trợ lý Nghiệp vụ InvoicePilot', buttonLabel: 'Trợ lý AI', placeholder: 'Đăng nhập tài khoản nghiệp vụ để bắt đầu…', context: 'Vui lòng đăng nhập tài khoản nghiệp vụ',
          welcome: 'Vui lòng đăng nhập một trong 4 tài khoản nghiệp vụ (Kế toán, Kinh doanh, Quản lý, Quản trị viên) trên hộp thoại Đăng nhập để sử dụng trợ lý phân tích chuyên biệt.',
          prompts: [['Mở hộp thoại Đăng nhập', 'Hướng dẫn đăng nhập hệ thống']]
        }
      };
      return configs[key] || configs.public;
    }

    function appendMessage(text, who) {
      const row = document.createElement('div');
      row.className = 'ip-chat-message ' + (who === 'user' ? 'is-user' : 'is-assistant');
      if (who !== 'user') {
        row.innerHTML = '<div class="ip-chat-avatar"><i class="bi bi-stars" aria-hidden="true"></i></div>';
      }
      const bubble = document.createElement('div');
      bubble.className = 'ip-chat-bubble';
      bubble.textContent = String(text || '');
      row.appendChild(bubble);
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function buildAnswer(question) {
      const IP = getIP();
      const key = roleKey();
      if (key === 'public') {
        if (IP && IP.Auth && IP.Auth.openLoginModal) IP.Auth.openLoginModal({ mandatory: true });
        return roleConfig('public').welcome;
      }
      if (!IP || !IP.DB) return 'Hệ thống đang đồng bộ dữ liệu.';
      if (key === 'admin') {
        const users = IP.DB.listUsers({});
        const active = users.filter(function (u) { return u.status === 'active'; }).length;
        const invited = users.filter(function (u) { return u.status === 'invited'; }).length;
        const disabled = users.filter(function (u) { return u.status === 'disabled'; }).length;
        return 'BÁO CÁO QUẢN TRỊ TÀI KHOẢN\n• Tổng số tài khoản: ' + users.length + ' (Hoạt động: ' + active + ', Đã mời: ' + invited + ', Tạm khóa: ' + disabled + ').\n• Chính sách phân quyền: Chỉ Quản trị viên (admin@hoabinhdigital.vn) được phép tạo mới, chỉnh sửa vai trò hoặc xóa tài khoản của các nghiệp vụ khác.';
      }
      const invs = IP.DB.listInvoices({ includeArchived: false });
      const ag = IP.Calc.aging(invs);
      const pendingPay = IP.DB.listPayments({ status: 'pending' }).length;
      return 'TỔNG HỢP SỐ LIỆU (' + IP.Fmt.roleLabel(key).toUpperCase() + ')\n• Tổng phải thu đang mở: ' + formatMoney(ag.totalReceivable) + '.\n• Tổng nợ quá hạn: ' + formatMoney(ag.totalOverdue) + ' (Trong đó >60 ngày: ' + formatMoney(ag.b61_90 + ag.b90plus) + ').\n• Giao dịch ngân hàng chờ đối chiếu: ' + pendingPay + ' giao dịch.\n• Khuyến nghị: Ưu tiên đối chiếu các khoản ủy nhiệm chi chờ xử lý và đôn đốc nhóm khách hàng quá hạn trên 60 ngày.';
    }

    function updateRoleContext() {
      const key = roleKey();
      const conf = roleConfig(key);
      const titleEl = document.getElementById('ip-chatbot-title');
      if (titleEl) titleEl.textContent = conf.title;
      const toggleLabel = toggle.querySelector('span:not(.ip-chatbot-toggle-pulse)');
      if (toggleLabel) toggleLabel.textContent = conf.buttonLabel || 'Trợ lý AI';
      input.placeholder = conf.placeholder;
      contextEl.textContent = conf.context;
      suggestionsEl.innerHTML = '';
      conf.prompts.forEach(function (item) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-ip-chat-prompt', item[1]);
        b.textContent = item[0];
        suggestionsEl.appendChild(b);
      });
      if (activeRoleKey !== key) {
        activeRoleKey = key;
        messagesEl.innerHTML = '';
        appendMessage(conf.welcome, 'assistant');
      }
    }

    toggle.addEventListener('click', function () {
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      panel.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden) {
        updateRoleContext();
        input.focus();
      }
    });
    closeBtn.addEventListener('click', function () {
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    });
    clearBtn.addEventListener('click', function () {
      messagesEl.innerHTML = '';
      appendMessage(roleConfig(roleKey()).welcome, 'assistant');
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const q = String(input.value || '').trim();
      if (!q) return;
      appendMessage(q, 'user');
      input.value = '';
      setTimeout(function () {
        appendMessage(buildAnswer(q), 'assistant');
      }, 220);
    });
    suggestionsEl.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-ip-chat-prompt]');
      if (!b) return;
      const q = b.getAttribute('data-ip-chat-prompt');
      appendMessage(q, 'user');
      setTimeout(function () {
        appendMessage(buildAnswer(q), 'assistant');
      }, 220);
    });
    window.addEventListener('ip:role-changed', updateRoleContext);
    updateRoleContext();
  }

  document.addEventListener('DOMContentLoaded', mountFloatingChatbot);
})(window);
