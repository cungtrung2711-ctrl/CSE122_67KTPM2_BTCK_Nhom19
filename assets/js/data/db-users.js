/**
 * @owner SV4
 * @spec §4, §8.4, §10.3, §10.4 User Domain Data API & Strict Admin-Only Guard Rules
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  function isCurrentActorAdmin() {
    if (IP.Auth && typeof IP.Auth.getSession === 'function') {
      const s = IP.Auth.getSession();
      if (s && s.role === 'admin') return true;
      if (s && s.role && s.role !== 'admin') return false;
    }
    const st = DB._rawState();
    const actor = st.users.find(function (u) { return u.id === DB.currentActorId(); });
    return Boolean(actor && actor.role === 'admin');
  }

  function requireAdminPermission() {
    if (!isCurrentActorAdmin()) {
      return DB.err('FORBIDDEN_NOT_ADMIN', 'Chỉ Quản trị viên (Admin) mới có quyền tạo, xóa hoặc điều chỉnh tài khoản của các nghiệp vụ khác.');
    }
    return null;
  }

  DB.extend('users', {
    listUsers: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.users.slice();
      if (f.role && f.role !== 'all') {
        list = list.filter(function (u) { return u.role === f.role; });
      }
      if (f.status && f.status !== 'all') {
        list = list.filter(function (u) { return u.status === f.status; });
      }
      if (f.q) {
        const q = String(f.q).trim().toLowerCase();
        list = list.filter(function (u) {
          return (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.title && u.title.toLowerCase().includes(q));
        });
      }
      return list;
    },

    getUser: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.users.find(function (u) { return u.id === id; }) || null;
    },

    createUser: function (data) {
      return DB.inviteUser(data);
    },

    inviteUser: function (data) {
      const permErr = requireAdminPermission();
      if (permErr) return permErr;

      const st = DB._rawState();
      const d = data || {};
      const name = String(d.name || '').trim();
      const email = String(d.email || '').trim().toLowerCase();
      const role = String(d.role || 'sales').trim();
      const title = String(d.title || '').trim();
      const phone = String(d.phone || '').trim();
      const password = String(d.password || 'Hoabinh@2026').trim();
      const initialStatus = ['active', 'invited'].includes(d.status) ? d.status : 'active';

      if (!name) return DB.err('VALIDATION', 'Vui lòng nhập họ và tên nhân sự.', 'name');
      if (!email || !IP.Utils.isValidEmail(email)) return DB.err('VALIDATION', 'Email công việc không đúng định dạng.', 'email');
      if (!['accountant', 'sales', 'manager', 'admin'].includes(role)) {
        return DB.err('VALIDATION', 'Vai trò nghiệp vụ được chọn không hợp lệ.', 'role');
      }
      if (password.length < 6) {
        return DB.err('VALIDATION', 'Mật khẩu khởi tạo phải có ít nhất 6 ký tự.', 'password');
      }
      if (st.users.some(function (u) { return u.email.toLowerCase() === email; })) {
        return DB.err('DUPLICATE_CODE', 'Email "' + email + '" đã được cấp tài khoản trong hệ thống.', 'email');
      }

      const user = {
        id: IP.Utils.uid('usr'),
        name: name,
        email: email,
        password: password,
        role: role,
        status: initialStatus,
        phone: phone || '0903000111',
        title: title || ('Chuyên viên ' + IP.Fmt.roleLabel(role)),
        lastLoginAt: null,
        isCoreAccount: false,
        createdAt: IP.Seed.todayISO()
      };

      st.users.push(user);
      if (DB.addNotification) {
        DB.addNotification({
          role: 'admin',
          type: 'system',
          title: 'Đã tạo tài khoản nghiệp vụ mới: ' + user.name,
          message: 'Đã cấp tài khoản ' + user.email + ' thuộc phân hệ ' + IP.Fmt.roleLabel(user.role) + '.',
          targetRouteKey: 'admin.users',
          targetParams: { q: user.email }
        });
      }
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: user.id,
          type: 'invite',
          message: 'Quản trị viên đã tạo tài khoản ' + user.name + ' (' + IP.Fmt.roleLabel(user.role) + ').'
        });
      }
      DB._commit();
      return DB.ok(user);
    },

    resendInvite: function (id) {
      const permErr = requireAdminPermission();
      if (permErr) return permErr;

      const st = DB._rawState();
      const u = st.users.find(function (x) { return x.id === id; });
      if (!u) return DB.err('NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
      u.updatedAt = new Date().toISOString();
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: u.id,
          type: 'invite',
          message: 'Đã gửi lại thông tin kích hoạt tài khoản cho ' + u.email + '.'
        });
      }
      DB._commit();
      return DB.ok(u);
    },

    updateUser: function (id, patch) {
      const st = DB._rawState();
      const u = st.users.find(function (x) { return x.id === id; });
      if (!u) return DB.err('NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
      const p = patch || {};
      const actorId = DB.currentActorId();
      const isAdmin = isCurrentActorAdmin();

      // Non-admin can only edit their own basic profile (not other users and not roles)
      if (!isAdmin && u.id !== actorId) {
        return DB.err('FORBIDDEN_NOT_ADMIN', 'Chỉ Quản trị viên (Admin) mới được phép điều chỉnh tài khoản của nhân sự khác.');
      }
      if (!isAdmin && p.role && p.role !== u.role) {
        return DB.err('FORBIDDEN_NOT_ADMIN', 'Chỉ Quản trị viên (Admin) mới được phép thay đổi phân quyền nghiệp vụ.');
      }

      if (p.role && p.role !== u.role) {
        if (u.id === actorId) {
          return DB.err('SELF_ACTION_FORBIDDEN', 'Bạn không thể tự hạ quyền hoặc đổi vai trò của chính tài khoản đang đăng nhập.', 'role');
        }
        if (u.role === 'admin' && u.status === 'active') {
          const activeAdmins = st.users.filter(function (x) { return x.role === 'admin' && x.status === 'active'; });
          if (activeAdmins.length <= 1) {
            return DB.err('LAST_ACTIVE_ADMIN', 'Hệ thống phải duy trì ít nhất 1 Quản trị viên đang hoạt động.', 'role');
          }
        }
      }

      if (p.email !== undefined && String(p.email).trim().toLowerCase() !== u.email.toLowerCase()) {
        if (!isAdmin) {
          return DB.err('FORBIDDEN_NOT_ADMIN', 'Chỉ Quản trị viên mới được phép điều chỉnh email đăng nhập.', 'email');
        }
        const nextEmail = String(p.email).trim().toLowerCase();
        if (!IP.Utils.isValidEmail(nextEmail)) {
          return DB.err('VALIDATION', 'Email mới không đúng định dạng.', 'email');
        }
        if (st.users.some(function (other) { return other.id !== id && other.email.toLowerCase() === nextEmail; })) {
          return DB.err('DUPLICATE_CODE', 'Email "' + nextEmail + '" đã được gán cho tài khoản khác.', 'email');
        }
        u.email = nextEmail;
      }

      if (p.password !== undefined && String(p.password).trim() !== '') {
        if (!isAdmin && u.id !== actorId) {
          return DB.err('FORBIDDEN_NOT_ADMIN', 'Chỉ Quản trị viên mới được đặt lại mật khẩu của tài khoản khác.', 'password');
        }
        if (String(p.password).trim().length < 6) {
          return DB.err('VALIDATION', 'Mật khẩu phải có tối thiểu 6 ký tự.', 'password');
        }
        u.password = String(p.password).trim();
      }

      const name = p.name !== undefined ? String(p.name).trim() : u.name;
      if (!name) return DB.err('VALIDATION', 'Họ và tên không được để trống.', 'name');
      if (p.phone && !IP.Utils.isValidPhone(p.phone)) {
        return DB.err('VALIDATION', 'Số điện thoại không đúng định dạng Việt Nam.', 'phone');
      }

      u.name = name;
      if (p.role) u.role = p.role;
      if (p.phone !== undefined) u.phone = String(p.phone).trim();
      if (p.title !== undefined) u.title = String(p.title).trim();
      u.updatedAt = new Date().toISOString();

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: u.id,
          type: 'update',
          message: 'Đã cập nhật thông tin tài khoản ' + u.name + ' (' + IP.Fmt.roleLabel(u.role) + ').'
        });
      }
      DB._commit();
      return DB.ok(u);
    },

    setUserStatus: function (id, status, reason) {
      const permErr = requireAdminPermission();
      if (permErr) return permErr;

      const st = DB._rawState();
      const u = st.users.find(function (x) { return x.id === id; });
      if (!u) return DB.err('NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
      const actorId = DB.currentActorId();

      if (status === 'disabled') {
        if (u.id === actorId) {
          return DB.err('SELF_ACTION_FORBIDDEN', 'Bạn không thể tự khóa tài khoản Quản trị viên đang đăng nhập của chính mình.');
        }
        if (u.role === 'admin' && u.status === 'active') {
          const activeAdmins = st.users.filter(function (x) { return x.role === 'admin' && x.status === 'active'; });
          if (activeAdmins.length <= 1) {
            return DB.err('LAST_ACTIVE_ADMIN', 'Không thể khóa Quản trị viên hoạt động cuối cùng của hệ thống.');
          }
        }
      }

      u.status = status;
      u.lockReason = status === 'disabled' ? String(reason || 'Tạm khóa bởi Quản trị viên').trim() : '';
      u.updatedAt = new Date().toISOString();

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: u.id,
          type: 'status',
          message: (status === 'disabled' ? 'Đã tạm khóa tài khoản ' : 'Đã mở khóa tài khoản ') + u.name + '.'
        });
      }
      DB._commit();
      return DB.ok(u);
    },

    deleteUser: function (id) {
      const permErr = requireAdminPermission();
      if (permErr) return permErr;

      const st = DB._rawState();
      const idx = st.users.findIndex(function (x) { return x.id === id; });
      if (idx < 0) return DB.err('NOT_FOUND', 'Không tìm thấy tài khoản cần xóa.');
      const u = st.users[idx];
      const actorId = DB.currentActorId();

      if (u.id === actorId) {
        return DB.err('SELF_ACTION_FORBIDDEN', 'Bạn không thể tự xóa tài khoản Quản trị viên đang đăng nhập của chính mình.');
      }
      if (u.role === 'admin' && u.status === 'active') {
        const activeAdmins = st.users.filter(function (x) { return x.role === 'admin' && x.status === 'active'; });
        if (activeAdmins.length <= 1) {
          return DB.err('LAST_ACTIVE_ADMIN', 'Không thể xóa Quản trị viên hoạt động cuối cùng của hệ thống.');
        }
      }

      // Reassign any customers or invoice follow-ups owned by this user to an active sales account
      const fallbackSales = st.users.find(function (x) { return x.id !== id && x.role === 'sales' && x.status === 'active'; });
      const fallbackId = fallbackSales ? fallbackSales.id : 'usr_sal';
      st.customers.forEach(function (c) {
        if (c.ownerId === id) c.ownerId = fallbackId;
      });
      st.invoices.forEach(function (inv) {
        if (inv.followUp && inv.followUp.assignedTo === id) {
          inv.followUp.assignedTo = fallbackId;
        }
      });

      st.users.splice(idx, 1);

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: id,
          type: 'delete',
          message: 'Quản trị viên đã xóa tài khoản ' + u.name + ' (' + u.email + ').'
        });
      }
      DB._commit();
      return DB.ok({ deletedId: id, deletedUser: u });
    },

    resetUserPassword: function (id) {
      const permErr = requireAdminPermission();
      if (permErr) return permErr;

      const st = DB._rawState();
      const u = st.users.find(function (x) { return x.id === id; });
      if (!u) return DB.err('NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');

      const tempPassword = 'HB@' + Math.random().toString(36).slice(2, 6).toUpperCase() + '2026';
      u.password = tempPassword;
      u.updatedAt = new Date().toISOString();

      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'user',
          entityId: u.id,
          type: 'security',
          message: 'Quản trị viên đã cấp mật khẩu khởi tạo mới cho ' + u.name + '.'
        });
      }
      DB._commit();
      return DB.ok({ user: u, tempPassword: tempPassword });
    },

    changeOwnPassword: function (userId, currentPassword, newPassword) {
      const st = DB._rawState();
      const u = st.users.find(function (x) { return x.id === userId; });
      if (!u) return DB.err('NOT_FOUND', 'Không tìm thấy phiên người dùng.');
      if (String(currentPassword || '') !== String(u.password || '')) {
        return DB.err('VALIDATION', 'Mật khẩu hiện tại không chính xác.', 'currentPassword');
      }
      if (!newPassword || String(newPassword).length < 6) {
        return DB.err('VALIDATION', 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'newPassword');
      }
      u.password = String(newPassword);
      u.updatedAt = new Date().toISOString();
      DB._commit();
      return DB.ok(u);
    }
  });
})(window);
