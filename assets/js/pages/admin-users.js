/**
 * @owner SV4
 * @spec §8.4 Admin User Management Page Script — Exclusive Admin CRUD for All Business Roles (admin-users.js)
 */
(function (window) {
  'use strict';
  const IP = window.IP;

  IP.Pages.register('admin-user-management', {
    roles: ['admin'],
    init: function (ctx) {
      const root = document.getElementById('main-content');
      if (!root) return;

      const params = IP.Utils.getQueryParams();
      const filterState = {
        q: params.q || '',
        role: params.role || 'all',
        status: params.status || 'all'
      };

      function render() {
        const allUsers = IP.DB.listUsers({});
        const activeCount = allUsers.filter(function (u) { return u.status === 'active'; }).length;
        const invitedCount = allUsers.filter(function (u) { return u.status === 'invited'; }).length;
        const activeAdmins = allUsers.filter(function (u) { return u.role === 'admin' && u.status === 'active'; }).length;
        const currentUserId = (ctx.session && ctx.session.userId) ? ctx.session.userId : IP.DB.currentActorId();

        const filtered = IP.DB.listUsers(filterState);

        const rowsHtml = filtered.map(function (u) {
          const isSelf = u.id === currentUserId;
          const isLastAdmin = u.role === 'admin' && u.status === 'active' && activeAdmins <= 1;
          const selfOrLastAdminBlocked = isSelf || isLastAdmin;
          let blockReasonTip = '';
          if (isSelf) blockReasonTip = 'Bạn không thể tự khóa, xóa hoặc hạ quyền tài khoản Quản trị viên đang đăng nhập của chính mình';
          else if (isLastAdmin) blockReasonTip = 'Hệ thống phải duy trì ít nhất 1 Quản trị viên đang hoạt động';

          return (
            '<tr>' +
              '<td data-label="Nhân sự">' +
                '<div class="d-flex align-items-center gap-2">' +
                  '<span class="ip-avatar">' + IP.Utils.escapeHtml(IP.Utils.initials(u.name)) + '</span>' +
                  '<div>' +
                    '<div class="fw-bold">' + IP.Utils.escapeHtml(u.name) +
                      (u.isCoreAccount ? ' <span class="badge bg-primary-subtle text-primary-emphasis ms-1" title="Tài khoản chuẩn của phân hệ nghiệp vụ">TK Nghiệp vụ chính</span>' : '') +
                      (isSelf ? ' <span class="badge bg-success-subtle text-success-emphasis ms-1">Đang đăng nhập (Admin)</span>' : '') +
                    '</div>' +
                    '<div class="small text-muted">' + IP.Utils.escapeHtml(u.title || '') + ' · ĐT: ' + IP.Utils.escapeHtml(u.phone || '—') + '</div>' +
                  '</div>' +
                '</div>' +
              '</td>' +
              '<td data-label="Email & Mật khẩu">' +
                '<div class="font-monospace small fw-semibold text-primary">' + IP.Utils.escapeHtml(u.email) + '</div>' +
                '<div class="font-monospace small text-muted" style="font-size:0.75rem;">MK: ' + IP.Utils.escapeHtml(u.password || '******') + '</div>' +
              '</td>' +
              '<td data-label="Nghiệp vụ">' + IP.UI.roleBadge(u.role) + '</td>' +
              '<td data-label="Trạng thái">' +
                IP.UI.statusBadge(u.status) +
                (u.lockReason ? '<div class="small text-danger mt-1">' + IP.Utils.escapeHtml(u.lockReason) + '</div>' : '') +
              '</td>' +
              '<td data-label="Đăng nhập gần nhất">' + (u.lastLoginAt ? IP.Fmt.relative(u.lastLoginAt) : '<span class="text-muted">Chưa đăng nhập</span>') + '</td>' +
              '<td data-label="Ngày cấp">' + IP.Fmt.date(u.createdAt) + '</td>' +
              '<td data-label="Thao tác Admin" class="text-end">' +
                '<div class="btn-group">' +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-user" data-id="' + u.id + '" title="Điều chỉnh thông tin, email, mật khẩu & vai trò nghiệp vụ"><i class="bi bi-pencil"></i> Sửa</button>' +
                  (u.status === 'invited'
                    ? '<button type="button" class="btn btn-sm btn-outline-primary" data-action="resend-invite" data-id="' + u.id + '" title="Gửi lại thông báo kích hoạt"><i class="bi bi-send"></i></button>'
                    : '') +
                  '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="reset-pass" data-id="' + u.id + '" title="Cấp mật khẩu mới"><i class="bi bi-key"></i></button>' +
                  (u.status === 'disabled'
                    ? '<button type="button" class="btn btn-sm btn-outline-success" data-action="unlock-user" data-id="' + u.id + '" title="Mở khóa tài khoản"><i class="bi bi-unlock"></i> Mở khóa</button>'
                    : '<button type="button" class="btn btn-sm btn-outline-warning" data-action="lock-user" data-id="' + u.id + '" ' +
                        (selfOrLastAdminBlocked ? ('disabled title="' + IP.Utils.escapeHtml(blockReasonTip) + '"') : 'title="Tạm khóa tài khoản"') + '>' +
                        '<i class="bi bi-lock"></i>' +
                      '</button>') +
                  '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-user" data-id="' + u.id + '" ' +
                    (selfOrLastAdminBlocked ? ('disabled title="' + IP.Utils.escapeHtml(blockReasonTip) + '"') : 'title="Xóa tài khoản khỏi hệ thống"') + '>' +
                    '<i class="bi bi-trash"></i> Xóa' +
                  '</button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          );
        }).join('');

        root.innerHTML =
          '<div class="ip-page-header">' +
            '<div>' +
              '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                '<h1 class="ip-h1 mb-0">Quản lý người dùng & Phân quyền nghiệp vụ</h1>' +
                '<span class="badge bg-danger-subtle text-danger-emphasis"><i class="bi bi-shield-lock me-1"></i>Đặc quyền duy nhất của Quản trị viên (Admin)</span>' +
              '</div>' +
              '<p class="ip-page-subtitle">Chỉ Quản trị viên mới có quyền tạo mới, điều chỉnh thông tin/vai trò, khóa hoặc xóa tài khoản của các nghiệp vụ Kế toán, Kinh doanh, Quản lý.</p>' +
            '</div>' +
            '<div class="ip-page-actions">' +
              '<button type="button" class="btn btn-primary" data-action="invite-user"><i class="bi bi-person-plus"></i> Tạo tài khoản nghiệp vụ mới</button>' +
            '</div>' +
          '</div>' +

          '<section class="ip-kpi-grid">' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Tổng số tài khoản</div><div class="ip-kpi-value mt-1">' + allUsers.length + ' tài khoản</div><div class="ip-kpi-sub">Đang lưu trong hệ thống</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Đang hoạt động</div><div class="ip-kpi-value mt-1 text-success">' + activeCount + ' tài khoản</div><div class="ip-kpi-sub">Được phép đăng nhập</div></div>' +
            '<div class="ip-kpi-card"><div class="ip-kpi-label">Chờ kích hoạt</div><div class="ip-kpi-value mt-1 text-warning">' + invitedCount + ' tài khoản</div><div class="ip-kpi-sub">Kích hoạt ngay khi đăng nhập</div></div>' +
            '<div class="ip-kpi-card">' +
              '<div class="ip-kpi-label mb-2">Phân bổ 4 nghiệp vụ</div>' +
              '<div class="d-flex flex-wrap gap-1">' +
                ['accountant', 'sales', 'manager', 'admin'].map(function (r) {
                  const cnt = allUsers.filter(function (u) { return u.role === r; }).length;
                  return '<span class="ip-chip">' + IP.Fmt.roleLabel(r) + ': ' + cnt + '</span>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</section>' +

          '<section class="ip-filter-bar">' +
            '<div class="row g-2 align-items-end">' +
              '<div class="col-md-5">' +
                '<label class="form-label" for="usr-q">Tìm theo họ tên, email hoặc chức danh</label>' +
                '<input type="search" id="usr-q" class="form-control" value="' + IP.Utils.escapeHtml(filterState.q) + '" placeholder="Nhập họ tên hoặc email (@hoabinhdigital.vn)...">' +
              '</div>' +
              '<div class="col-sm-6 col-md-4">' +
                '<label class="form-label" for="usr-role">Vai trò nghiệp vụ</label>' +
                '<select id="usr-role" class="form-select">' +
                  '<option value="all">Tất cả vai trò</option>' +
                  '<option value="accountant" ' + (filterState.role === 'accountant' ? 'selected' : '') + '>Kế toán</option>' +
                  '<option value="sales" ' + (filterState.role === 'sales' ? 'selected' : '') + '>Kinh doanh</option>' +
                  '<option value="manager" ' + (filterState.role === 'manager' ? 'selected' : '') + '>Quản lý</option>' +
                  '<option value="admin" ' + (filterState.role === 'admin' ? 'selected' : '') + '>Quản trị viên</option>' +
                '</select>' +
              '</div>' +
              '<div class="col-sm-6 col-md-3">' +
                '<label class="form-label" for="usr-status">Trạng thái</label>' +
                '<select id="usr-status" class="form-select">' +
                  '<option value="all">Tất cả trạng thái</option>' +
                  '<option value="active" ' + (filterState.status === 'active' ? 'selected' : '') + '>Hoạt động</option>' +
                  '<option value="invited" ' + (filterState.status === 'invited' ? 'selected' : '') + '>Đã mời</option>' +
                  '<option value="disabled" ' + (filterState.status === 'disabled' ? 'selected' : '') + '>Tạm khóa</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<div class="ip-table-wrap">' +
            '<div class="table-responsive">' +
              '<table class="table ip-table-responsive-cards align-middle">' +
                '<thead><tr><th>Nhân sự</th><th>Email & Mật khẩu</th><th>Nghiệp vụ</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th>Ngày cấp</th><th class="text-end">Thao tác Admin</th></tr></thead>' +
                '<tbody>' + rowsHtml + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>';

        const qEl = root.querySelector('#usr-q');
        if (qEl) {
          qEl.addEventListener('input', IP.Utils.debounce(function () {
            filterState.q = qEl.value;
            render();
          }, 200));
        }
        const roleEl = root.querySelector('#usr-role');
        if (roleEl) {
          roleEl.addEventListener('change', function () {
            filterState.role = roleEl.value;
            render();
          });
        }
        const stEl = root.querySelector('#usr-status');
        if (stEl) {
          stEl.addEventListener('change', function () {
            filterState.status = stEl.value;
            render();
          });
        }
      }

      function openUserModal(editId) {
        const existing = editId ? IP.DB.getUser(editId) : null;
        const mId = 'adm-user-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();

        const isSelf = existing && existing.id === IP.DB.currentActorId();

        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<form id="adm-user-form" novalidate>' +
                '<div class="modal-header">' +
                  '<h2 class="modal-title fs-5 fw-bold">' + (existing ? ('Điều chỉnh tài khoản · ' + IP.Utils.escapeHtml(existing.name)) : 'Tạo tài khoản nghiệp vụ mới') + '</h2>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
                '</div>' +
                '<div class="modal-body">' +
                  '<div id="adm-usr-err" class="alert alert-danger py-2 small d-none" role="alert"></div>' +
                  '<div class="mb-3">' +
                    '<label class="form-label" for="uf-name">Họ và tên nhân sự <span class="text-danger">*</span></label>' +
                    '<input type="text" id="uf-name" class="form-control" value="' + IP.Utils.escapeHtml(existing ? existing.name : '') + '" required placeholder="VD: Nguyễn Văn Minh">' +
                  '</div>' +
                  '<div class="row g-2 mb-3">' +
                    '<div class="col-sm-7">' +
                      '<label class="form-label" for="uf-email">Email đăng nhập <span class="text-danger">*</span></label>' +
                      '<input type="email" id="uf-email" class="form-control font-monospace" value="' + IP.Utils.escapeHtml(existing ? existing.email : '') + '" required placeholder="minh.nguyen@hoabinhdigital.vn">' +
                    '</div>' +
                    '<div class="col-sm-5">' +
                      '<label class="form-label" for="uf-password">Mật khẩu <span class="text-danger">*</span></label>' +
                      '<input type="text" id="uf-password" class="form-control font-monospace" value="' + IP.Utils.escapeHtml(existing ? (existing.password || 'Hoabinh@2026') : 'Hoabinh@2026') + '" required minlength="6">' +
                    '</div>' +
                  '</div>' +
                  '<div class="row g-2 mb-3">' +
                    '<div class="col-sm-6">' +
                      '<label class="form-label" for="uf-role">Phân quyền nghiệp vụ</label>' +
                      '<select id="uf-role" class="form-select" ' + (isSelf ? 'disabled' : '') + '>' +
                        ['accountant', 'sales', 'manager', 'admin'].map(function (r) {
                          return '<option value="' + r + '" ' + (existing && existing.role === r ? 'selected' : '') + '>' + IP.Fmt.roleLabel(r) + '</option>';
                        }).join('') +
                      '</select>' +
                    '</div>' +
                    '<div class="col-sm-6">' +
                      '<label class="form-label" for="uf-phone">Số điện thoại</label>' +
                      '<input type="tel" id="uf-phone" class="form-control" value="' + IP.Utils.escapeHtml(existing ? (existing.phone || '0903112233') : '0903112233') + '">' +
                    '</div>' +
                  '</div>' +
                  (isSelf ? '<div class="small text-warning mb-2">Bạn đang đăng nhập bằng tài khoản Admin này nên không thể tự hạ quyền của chính mình.</div>' : '') +
                  '<div class="mb-1">' +
                    '<label class="form-label" for="uf-title">Chức danh / Bộ phận</label>' +
                    '<input type="text" id="uf-title" class="form-control" value="' + IP.Utils.escapeHtml(existing ? (existing.title || '') : '') + '" placeholder="VD: Chuyên viên Kế toán công nợ">' +
                  '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="submit" class="btn btn-primary" id="adm-user-submit-btn"><i class="bi bi-check2-circle"></i> ' + (existing ? 'Lưu điều chỉnh' : 'Tạo tài khoản') + '</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#adm-user-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          const errEl = mEl.querySelector('#adm-usr-err');
          errEl.classList.add('d-none');
          const payload = {
            name: mEl.querySelector('#uf-name').value,
            email: mEl.querySelector('#uf-email').value,
            password: mEl.querySelector('#uf-password').value,
            role: mEl.querySelector('#uf-role').value,
            phone: mEl.querySelector('#uf-phone').value,
            title: mEl.querySelector('#uf-title').value,
            status: 'active'
          };
          const res = existing ? IP.DB.updateUser(existing.id, payload) : IP.DB.createUser(payload);
          if (!res.ok) {
            errEl.textContent = res.error.message;
            errEl.classList.remove('d-none');
            return;
          }
          if (bsModal) bsModal.hide();
          else mEl.remove();
          IP.UI.toast({
            title: existing ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản mới',
            message: res.data.name + ' (' + IP.Fmt.roleLabel(res.data.role) + ' · ' + res.data.email + ')',
            type: 'success'
          });
          render();
        });
        if (bsModal) bsModal.show();
      }

      function openTempPasswordModal(user, tempPass) {
        const mId = 'adm-temp-pass-modal';
        let mEl = document.getElementById(mId);
        if (mEl) mEl.remove();
        mEl = document.createElement('div');
        mEl.id = mId;
        mEl.className = 'modal fade';
        mEl.tabIndex = -1;
        mEl.innerHTML =
          '<div class="modal-dialog modal-dialog-centered">' +
            '<div class="modal-content">' +
              '<div class="modal-header">' +
                '<h2 class="modal-title fs-5 fw-bold">Mật khẩu khởi tạo mới (Hiển thị 1 lần)</h2>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
              '</div>' +
              '<div class="modal-body">' +
                '<p class="small text-muted mb-2">Đã cấp mật khẩu mới cho <strong>' + IP.Utils.escapeHtml(user.name) + '</strong> (' + IP.Utils.escapeHtml(user.email) + '). Vui lòng sao chép và bàn giao cho nhân sự:</p>' +
                '<div class="input-group">' +
                  '<input type="text" id="temp-pass-val" class="form-control font-monospace fw-bold text-center" value="' + IP.Utils.escapeHtml(tempPass) + '" readonly>' +
                  '<button type="button" class="btn btn-primary" id="copy-temp-pass-btn"><i class="bi bi-clipboard"></i> Sao chép</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(mEl);
        const bsModal = window.bootstrap && window.bootstrap.Modal ? new window.bootstrap.Modal(mEl) : null;
        mEl.querySelector('#copy-temp-pass-btn').addEventListener('click', function () {
          IP.Utils.copyText(tempPass).then(function () {
            IP.UI.toast({ title: 'Đã sao chép mật khẩu', message: 'Đã lưu "' + tempPass + '" vào bộ nhớ tạm.', type: 'success' });
          });
        });
        if (bsModal) bsModal.show();
      }

      IP.UI.withLoading(root, render);

      root.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'invite-user') {
          openUserModal(null);
        } else if (action === 'edit-user') {
          openUserModal(id);
        } else if (action === 'resend-invite') {
          const res = IP.DB.resendInvite(id);
          if (res.ok) {
            IP.UI.toast({ title: 'Đã gửi lại thông tin kích hoạt', message: 'Đã làm mới thông báo kích hoạt cho ' + res.data.email + '.', type: 'info' });
          }
        } else if (action === 'lock-user') {
          IP.UI.confirmModal({
            title: 'Tạm khóa tài khoản nhân sự này?',
            message: 'Tài khoản bị tạm khóa sẽ không thể đăng nhập vào hệ thống cho đến khi được Quản trị viên mở khóa lại.',
            requireReason: true,
            reasonLabel: 'Lý do tạm khóa tài khoản (bắt buộc)',
            confirmText: 'Tạm khóa tài khoản',
            variant: 'warning',
            onConfirm: function (reason) {
              const res = IP.DB.setUserStatus(id, 'disabled', reason);
              if (!res.ok) {
                IP.UI.toast({ title: 'Không thể khóa tài khoản', message: res.error.message, type: 'danger' });
                return;
              }
              IP.UI.toast({ title: 'Đã tạm khóa tài khoản', message: res.data.name, type: 'warning' });
              render();
            }
          });
        } else if (action === 'unlock-user') {
          const res = IP.DB.setUserStatus(id, 'active', '');
          if (res.ok) {
            IP.UI.toast({ title: 'Đã mở khóa tài khoản', message: res.data.name + ' đã hoạt động trở lại.', type: 'success' });
            render();
          }
        } else if (action === 'reset-pass') {
          IP.UI.confirmModal({
            title: 'Cấp lại mật khẩu mới?',
            message: 'Hệ thống sẽ sinh một mật khẩu mới cho tài khoản này.',
            confirmText: 'Cấp mật khẩu mới',
            onConfirm: function () {
              const res = IP.DB.resetUserPassword(id);
              if (res.ok) {
                render();
                openTempPasswordModal(res.data.user, res.data.tempPassword);
              }
            }
          });
        } else if (action === 'delete-user') {
          const targetUser = IP.DB.getUser(id);
          if (!targetUser) return;
          IP.UI.confirmModal({
            title: 'Xóa vĩnh viễn tài khoản ' + targetUser.name + '?',
            message: 'Tài khoản "' + targetUser.email + '" (' + IP.Fmt.roleLabel(targetUser.role) + ') sẽ bị xóa khỏi hệ thống và các khách hàng đang phụ trách (nếu có) sẽ được bàn giao lại cho nhóm Kinh doanh.',
            confirmText: 'Xác nhận xóa tài khoản',
            variant: 'danger',
            onConfirm: function () {
              const res = IP.DB.deleteUser(id);
              if (!res.ok) {
                IP.UI.toast({ title: 'Không thể xóa tài khoản', message: res.error.message, type: 'danger' });
                return;
              }
              IP.UI.toast({
                title: 'Đã xóa tài khoản',
                message: 'Đã xóa tài khoản ' + res.data.deletedUser.name + ' (' + res.data.deletedUser.email + ').',
                type: 'success'
              });
              render();
            }
          });
        }
      });
    }
  });
})(window);
