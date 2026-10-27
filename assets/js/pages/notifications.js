/**
 * @owner SV2
 * @spec §7.5 Notification Centre Page Script (notifications.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('notifications', {
    roles: ['accountant', 'sales', 'manager', 'admin'],
    init: function (ctx) {
      const root = document.getElementById('main-content');
      if (!root) return;

      const role = (ctx.session && ctx.session.role) ? ctx.session.role : 'accountant';
      const params = IP.Utils.getQueryParams();
      let currentTab = params.tab || 'all'; // 'all' | 'unread' | 'invoice' | 'payment' | 'reminder' | 'system'
      let readFilter = 'all'; // 'all' | 'unread' | 'read'
      let visibleCount = 10;

      const TYPE_ICONS = {
        invoice: 'bi-file-earmark-text text-primary',
        payment: 'bi-cash-coin text-success',
        reminder: 'bi-envelope-paper text-warning',
        system: 'bi-gear text-info'
      };

      function render() {
        const all = IP.DB.listNotifications({});
        const counts = {
          all: all.length,
          unread: all.filter(function (n) { return !n.read; }).length,
          invoice: all.filter(function (n) { return n.type === 'invoice'; }).length,
          payment: all.filter(function (n) { return n.type === 'payment'; }).length,
          reminder: all.filter(function (n) { return n.type === 'reminder'; }).length,
          system: all.filter(function (n) { return n.type === 'system'; }).length
        };

        const filtered = IP.DB.listNotifications({
          type: currentTab,
          readState: readFilter
        });
        const shown = filtered.slice(0, visibleCount);
        const readCount = all.filter(function (n) { return n.read; }).length;

        const tabs = [
          { id: 'all', label: 'Tất cả (' + counts.all + ')' },
          { id: 'unread', label: 'Chưa đọc (' + counts.unread + ')' },
          { id: 'invoice', label: 'Hóa đơn (' + counts.invoice + ')' },
          { id: 'payment', label: 'Thanh toán (' + counts.payment + ')' },
          { id: 'reminder', label: 'Nhắc hạn (' + counts.reminder + ')' },
          { id: 'system', label: 'Hệ thống (' + counts.system + ')' }
        ];

        const listHtml = shown.length
          ? shown.map(function (n) {
              const targetHref = n.link || IP.Routes.url(n.targetRouteKey || 'invoice.list', n.targetParams || {}, role);
              return (
                '<div class="sys-notif-item ' + (!n.read ? 'unread' : '') + '">' +
                  '<div class="d-flex align-items-start gap-3">' +
                    '<div class="sys-notif-icon"><i class="bi ' + (TYPE_ICONS[n.type] || TYPE_ICONS.system) + '"></i></div>' +
                    '<div>' +
                      '<div class="d-flex align-items-center gap-2 mb-1">' +
                        (!n.read ? '<span class="sys-unread-dot" title="Chưa đọc"></span>' : '') +
                        '<span class="fw-bold">' + IP.Utils.escapeHtml(n.title) + '</span>' +
                        '<span class="badge bg-secondary-subtle text-body-secondary">' + IP.Utils.escapeHtml(n.type.toUpperCase()) + '</span>' +
                      '</div>' +
                      '<p class="small text-muted mb-1">' + IP.Utils.escapeHtml(n.message) + '</p>' +
                      '<div class="small text-muted" style="font-size:0.76rem">' + IP.Fmt.relative(n.createdAt) + ' · ' + IP.Fmt.dateTime(n.createdAt) + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="d-flex align-items-center gap-2 flex-shrink-0">' +
                    (!n.read
                      ? '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="mark-one-read" data-id="' + n.id + '">Đánh dấu đã đọc</button>'
                      : '') +
                    '<a href="' + IP.Utils.escapeHtml(targetHref) + '" class="btn btn-sm btn-primary" data-action="open-notif" data-id="' + n.id + '">Mở <i class="bi bi-arrow-right"></i></a>' +
                  '</div>' +
                '</div>'
              );
            }).join('')
          : IP.UI.renderEmptyState({
              title: 'Không có thông báo nào trong mục này',
              description: 'Mọi sự kiện hóa đơn, thanh toán và nhắc hạn mới sẽ xuất hiện tại đây.',
              actionText: 'Về màn hình làm việc chính',
              actionAttr: 'go-role-home'
            });

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<h1 class="ip-h1">Trung tâm thông báo</h1>' +
              '<p class="ip-page-subtitle">Theo dõi các sự kiện phát hành hóa đơn, đối chiếu thanh toán, nhắc công nợ và cảnh báo hệ thống.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-outline-secondary" data-action="mark-all-read" ' + (counts.unread === 0 ? 'disabled title="Tất cả thông báo đều đã đọc"' : '') + '><i class="bi bi-check2-all"></i> Đánh dấu tất cả đã đọc</button>' +
              '<button type="button" class="btn btn-outline-danger" data-action="delete-read" ' + (readCount === 0 ? 'disabled title="Không có thông báo đã đọc để xóa"' : '') + '><i class="bi bi-trash"></i> Xóa thông báo đã đọc (' + readCount + ')</button>' +
            '</div>' +
          '</div>' +

          '<div class="ip-filter-bar d-flex justify-content-between align-items-center flex-wrap gap-2">' +
            '<div class="d-flex flex-wrap gap-1" role="tablist">' +
              tabs.map(function (t) {
                return '<button type="button" class="btn btn-sm ' + (currentTab === t.id ? 'btn-primary' : 'btn-outline-secondary') + '" data-action="switch-tab" data-tab="' + t.id + '">' + IP.Utils.escapeHtml(t.label) + '</button>';
              }).join('') +
            '</div>' +
            '<div class="d-flex align-items-center gap-2">' +
              '<label class="small text-muted" for="notif-read-filter">Trạng thái đọc:</label>' +
              '<select id="notif-read-filter" class="form-select form-select-sm" style="width:auto;">' +
                '<option value="all" ' + (readFilter === 'all' ? 'selected' : '') + '>Tất cả</option>' +
                '<option value="unread" ' + (readFilter === 'unread' ? 'selected' : '') + '>Chỉ chưa đọc</option>' +
                '<option value="read" ' + (readFilter === 'read' ? 'selected' : '') + '>Chỉ đã đọc</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div class="ip-table-wrap">' +
            listHtml +
            (filtered.length > visibleCount
              ? '<div class="p-3 text-center border-top"><button type="button" class="btn btn-outline-secondary btn-sm" data-action="load-more">Tải thêm thông báo (' + (filtered.length - visibleCount) + ')</button></div>'
              : '') +
          '</div>';

        const rfEl = root.querySelector('#notif-read-filter');
        if (rfEl) {
          rfEl.addEventListener('change', function () {
            readFilter = rfEl.value;
            render();
          });
        }
      }

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'switch-tab') {
          currentTab = btn.getAttribute('data-tab');
          render();
        } else if (action === 'mark-one-read') {
          IP.DB.markNotificationRead(id);
          IP.UI.toast({ title: 'Đã đánh dấu đã đọc', message: 'Trạng thái thông báo đã được cập nhật.', type: 'info' });
          render();
        } else if (action === 'open-notif') {
          IP.DB.markNotificationRead(id);
        } else if (action === 'mark-all-read') {
          IP.DB.markAllRead();
          IP.UI.toast({ title: 'Đã đọc tất cả', message: 'Mọi thông báo đã được đánh dấu đã đọc.', type: 'success' });
          render();
        } else if (action === 'delete-read') {
          IP.UI.confirmModal({
            title: 'Xóa tất cả thông báo đã đọc?',
            message: 'Các thông báo đã đọc sẽ bị xóa khỏi danh sách. Các thông báo chưa đọc vẫn được giữ lại.',
            confirmText: 'Xóa thông báo đã đọc',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.deleteReadNotifications();
              IP.UI.toast({ title: 'Đã dọn thông báo', message: 'Đã xóa ' + res.data.removed + ' thông báo đã đọc.', type: 'success' });
              render();
            }
          });
        } else if (action === 'load-more') {
          visibleCount += 10;
          render();
        } else if (action === 'go-role-home') {
          window.location.href = IP.Routes.homeForRole(role);
        }
      });
    }
  });
})(window);
