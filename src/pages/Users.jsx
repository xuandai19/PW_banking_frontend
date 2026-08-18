import { useEffect, useState } from "react";
import { getUsers, createUser } from "../services/authApi";
import { getCreatableRoles, getCurrentUser, ROLES } from "../utils/auth";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [devLink, setDevLink] = useState("");
    const [emailPreview, setEmailPreview] = useState("");

    const creatableRoles = getCreatableRoles();
    const currentUser = getCurrentUser();

    const [form, setForm] = useState({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: creatableRoles[0] || ROLES.EMPLOYEE
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Không thể tải danh sách tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setForm({
            username: "",
            password: "",
            fullName: "",
            email: "",
            role: creatableRoles[0] || ROLES.EMPLOYEE
        });
        setError("");
        setSuccess("");
        setDevLink("");
        setEmailPreview("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setDevLink("");
        setEmailPreview("");

        if (
            !form.username.trim() ||
            !form.password ||
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.role
        ) {
            setError("Vui lòng điền đầy đủ thông tin (gồm email).");
            return;
        }

        if (form.password.length < 4) {
            setError("Mật khẩu phải có ít nhất 4 ký tự.");
            return;
        }

        try {
            const res = await createUser({
                username: form.username.trim(),
                password: form.password,
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                role: form.role
            });

            setSuccess(
                "Tạo tài khoản thành công! Đã gửi email xác thực. Tài khoản chỉ đăng nhập được sau khi xác thực email."
            );
            if (res.data?._devVerifyLink) {
                setDevLink(res.data._devVerifyLink);
            }
            if (res.data?._emailPreview) {
                setEmailPreview(res.data._emailPreview);
            }
            setShowModal(false);
            await loadUsers();
        } catch (err) {
            setError(err.response?.data?.message || "Tạo tài khoản thất bại.");
        }
    };

    const roleLabel = (role) => {
        switch (role) {
            case ROLES.ADMIN:
                return "Admin";
            case ROLES.SUBADMIN:
                return "Subadmin";
            case ROLES.EMPLOYEE:
                return "Employee";
            default:
                return role;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Quản lý tài khoản hệ thống</h2>
                {creatableRoles.length > 0 && (
                    <button
                        onClick={openCreateModal}
                        style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: 6,
                            background: "#1565c0",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: 600
                        }}
                    >
                        + Tạo tài khoản
                    </button>
                )}
            </div>

            {success && <p className="success-text">{success}</p>}
            {(devLink || emailPreview) && (
                <div className="dev-link-box" style={{ marginBottom: 16 }}>
                    {devLink && (
                        <>
                            <strong>Link xác thực email:</strong>
                            <a href={devLink} target="_blank" rel="noreferrer">{devLink}</a>
                        </>
                    )}
                    {emailPreview && (
                        <>
                            <strong style={{ display: "block", marginTop: 8 }}>Xem email trên Ethereal:</strong>
                            <a href={emailPreview} target="_blank" rel="noreferrer">{emailPreview}</a>
                        </>
                    )}
                </div>
            )}
            {error && !showModal && <p className="error-text">{error}</p>}

            <p className="muted-text" style={{ marginBottom: 16 }}>
                {currentUser?.role === ROLES.ADMIN
                    ? "Admin có thể tạo Subadmin và Employee. Tài khoản mới phải xác thực email trước khi đăng nhập."
                    : "Subadmin chỉ tạo Employee. Tài khoản mới phải xác thực email trước khi đăng nhập."}
            </p>

            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên đăng nhập</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Xác thực</th>
                            <th>Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="empty-cell">
                                    Chưa có tài khoản
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.fullName}</td>
                                    <td>{u.email || "-"}</td>
                                    <td>
                                        <span className="role-badge">{roleLabel(u.role)}</span>
                                    </td>
                                    <td>
                                        {u.emailVerified ? (
                                            <span className="status-pill approved">Đã xác thực</span>
                                        ) : (
                                            <span className="status-pill pending">Chưa xác thực</span>
                                        )}
                                    </td>
                                    <td>
                                        {u.createdAt
                                            ? new Date(u.createdAt).toLocaleString("vi-VN")
                                            : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {showModal && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Tạo tài khoản mới</h2>

                        <form onSubmit={handleSubmit}>
                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                placeholder="username"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                autoFocus
                            />

                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />

                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                placeholder="Ít nhất 4 ký tự"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />

                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                Họ tên
                            </label>
                            <input
                                type="text"
                                placeholder="Họ và tên"
                                value={form.fullName}
                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            />

                            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                Vai trò
                            </label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: 10,
                                    marginBottom: 15,
                                    border: "1px solid #ccc",
                                    borderRadius: 6,
                                    fontSize: 14
                                }}
                            >
                                {creatableRoles.map((r) => (
                                    <option key={r} value={r}>
                                        {roleLabel(r)}
                                    </option>
                                ))}
                            </select>

                            {error && <p className="error-text">{error}</p>}

                            <div className="modal-footer">
                                <button type="button" onClick={closeModal}>
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        background: "#1565c0",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        cursor: "pointer"
                                    }}
                                >
                                    Tạo & gửi email xác thực
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
