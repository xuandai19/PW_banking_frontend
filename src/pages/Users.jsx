import Pagination from "../components/Pagination";
import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/authApi";
import { getCreatableRoles, getCurrentUser, ROLES } from "../utils/auth";

const removeAccents = (str) => {
    if (!str) return "";

    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
};

function Users() {
    const [page, setPage] = useState(1);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [devLink, setDevLink] = useState("");
    const [emailPreview, setEmailPreview] = useState("");
    const [keyword, setKeyword] = useState("");

    const creatableRoles = getCreatableRoles();
    const currentUser = getCurrentUser();

    const emptyForm = { username: "", password: "", fullName: "", email: "", role: ROLES.EMPLOYEE };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể tải danh sách tài khoản.");
        } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditingUser(null);
        setForm({ ...emptyForm, role: creatableRoles[0] || ROLES.EMPLOYEE });
        setError(""); setSuccess(""); setDevLink(""); setEmailPreview("");
        setShowModal(true);
    };

    const openEdit = (user) => {
        // Admin / Bank / Branch không được sửa tại đây
        if ([ROLES.ADMIN, ROLES.BANK, ROLES.BRANCH].includes(user.role)) return;
        setEditingUser(user);
        setForm({ username: user.username, password: "", fullName: user.fullName, email: user.email || "", role: user.role });
        setError(""); setSuccess(""); setDevLink(""); setEmailPreview("");
        setShowModal(true);
    };

    const canEditUser = (user) =>
        currentUser?.role === ROLES.ADMIN &&
        ![ROLES.ADMIN, ROLES.BANK, ROLES.BRANCH].includes(user.role);

    // BANK/BRANCH chỉ xóa được khi Bank/Branch đã bị xóa (orphan) — backend sẽ kiểm tra
    const canDeleteUser = (user) => {
        if (currentUser?.role !== ROLES.ADMIN) return false;
        if (user.role === ROLES.ADMIN) return false;
        return true;
    };

    const closeModal = () => { setShowModal(false); setError(""); setEditingUser(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (!form.username.trim() || !form.fullName.trim() || !form.email.trim() || !form.role) {
            setError("Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (!editingUser && !form.password) {
            setError("Vui lòng nhập mật khẩu.");
            return;
        }
        if (form.password && form.password.length < 4) {
            setError("Mật khẩu phải có ít nhất 4 ký tự.");
            return;
        }
        try {
            if (editingUser) {
                const payload = { username: form.username.trim(), fullName: form.fullName.trim(), email: form.email.trim(), role: form.role };
                if (form.password) payload.password = form.password;
                const res = await updateUser(editingUser.id, payload);
                if (res.data?._devVerifyLink) setDevLink(res.data._devVerifyLink);
                setSuccess("Cập nhật tài khoản thành công.");
            } else {
                const res = await createUser({
                    username: form.username.trim(), password: form.password,
                    fullName: form.fullName.trim(), email: form.email.trim(), role: form.role
                });
                setSuccess("Tạo tài khoản thành công. Email xác thực đã được gửi.");
                setDevLink(res.data?._devVerifyLink || "");
                setEmailPreview(res.data?._emailPreview || "");
            }
            closeModal();
            await loadUsers();
        } catch (err) {
            setError(err.response?.data?.message || "Thao tác thất bại.");
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Xóa tài khoản "${user.username}"?`)) return;
        try {
            await deleteUser(user.id);
            setSuccess("Đã xóa tài khoản.");
            await loadUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Xóa tài khoản thất bại.");
        }
    };

    const roleLabel = (role) => ({
        ADMIN: "Admin", SUBADMIN: "Subadmin", EMPLOYEE: "Employee",
        BANK: "Bank Manager", BRANCH: "Branch Manager"
    }[role] || role);

    const filteredUsers = users.filter((user) => {
        const cleanKeyword = removeAccents(keyword.trim());
        if (!cleanKeyword) return true;

        const cleanUsername = removeAccents(user.username);
        const cleanFullName = removeAccents(user.fullName);
        const cleanEmail = removeAccents(user.email);
        const cleanRole = removeAccents(roleLabel(user.role));

        return (
            cleanUsername.includes(cleanKeyword) ||
            cleanFullName.includes(cleanKeyword) ||
            cleanEmail.includes(cleanKeyword) ||
            cleanRole.includes(cleanKeyword)
        );
    });

    const pagedUsers = filteredUsers.slice(
        (page - 1) * 10,
        page * 10
    );

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Quản lý tài khoản người dùng</h2>
                {creatableRoles.length > 0 && (
                    <button onClick={openCreate}>+ Tạo tài khoản</button>
                )}
            </div>

            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search"
                    value={keyword}
                    onChange={(e) => {
                        setKeyword(e.target.value);
                        setPage(1);
                    }}
                    style={{
                        width: "24%",
                        padding: "10px",
                        boxSizing: "border-box"
                    }}
                />
            </div>

            {success && <p className="success-text">{success}</p>}
            {error && !showModal && <p className="error-text">{error}</p>}
            {(devLink || emailPreview) && (
                <div className="dev-link-box" style={{ marginBottom: 16 }}>
                    {devLink && <><strong>Link xác thực:</strong> <a href={devLink} target="_blank" rel="noreferrer">{devLink}</a><br /></>}
                    {emailPreview && <><strong>Email preview:</strong> <a href={emailPreview} target="_blank" rel="noreferrer">{emailPreview}</a></>}
                </div>
            )}

            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Username</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái Email</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pagedUsers.map((u, index) => (
                                <tr key={u.id}>
                                    <td>{(page - 1) * 10 + index + 1}</td>
                                    <td>{u.username}</td>
                                    <td>{u.fullName}</td>
                                    <td>{u.email || "-"}</td>
                                    <td>
                                        <span className="role-badge">
                                            {roleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td>
                                        {u.emailVerified ? (
                                            <span className="status-pill approved">Đã xác thực</span>
                                        ) : (
                                            <span className="status-pill pending">Chưa xác thực</span>
                                        )}
                                    </td>
                                    <td>
                                        {canEditUser(u) && (
                                            <button onClick={() => openEdit(u)}>Edit</button>
                                        )}
                                        {canDeleteUser(u) && (
                                            <button onClick={() => handleDelete(u)}>
                                                {[ROLES.BANK, ROLES.BRANCH].includes(u.role)
                                                    ? "Xóa"
                                                    : "Delete"}
                                            </button>
                                        )}
                                        {u.role === ROLES.ADMIN && (
                                            <span className="muted-text">Không được sửa/xóa</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination
                        page={page}
                        pageSize={10}
                        total={filteredUsers.length}
                        onPageChange={setPage}
                    />
                </>
            )}

            {showModal && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}</h2>
                        <form onSubmit={handleSubmit}>
                            <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            <input type="password" placeholder={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            <input placeholder="Họ và tên" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                {creatableRoles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                            </select>
                            {editingUser && <p className="muted-text">Nếu đổi email, tài khoản sẽ phải xác thực email mới trước khi đăng nhập.</p>}
                            {error && <p className="error-text">{error}</p>}
                            <div className="modal-footer">
                                <button type="button" onClick={closeModal}>Hủy</button>
                                <button type="submit">{editingUser ? "Lưu thay đổi" : "Tạo & gửi email xác thực"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;