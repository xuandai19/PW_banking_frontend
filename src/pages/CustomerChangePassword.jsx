import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerChangePassword } from "../services/customerApi";
import { getCurrentUser, clearAuth } from "../utils/auth";

function CustomerChangePassword() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }

        setLoading(true);
        try {
            await customerChangePassword(currentPassword, newPassword);
            // Cập nhật flag local
            if (user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify({ ...user, mustChangePassword: false })
                );
            }
            setSuccess("Đổi mật khẩu thành công. Đang chuyển...");
            setTimeout(() => navigate("/customer", { replace: true }), 800);
        } catch (err) {
            setError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        localStorage.removeItem("customerAccount");
        navigate("/customer/login", { replace: true });
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Đổi mật khẩu</h1>
                <p className="auth-subtitle">
                    {user?.mustChangePassword
                        ? "Bạn đang dùng mật khẩu mặc định. Vui lòng đặt mật khẩu mới trước khi tiếp tục."
                        : "Đặt mật khẩu mới cho tài khoản của bạn."}
                </p>

                <label>
                    Mật khẩu hiện tại
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </label>

                <label>
                    Mật khẩu mới
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                </label>

                <label>
                    Xác nhận mật khẩu mới
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                </label>

                {error && <p className="error-text">{error}</p>}
                {success && <p className="success-text">{success}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>

                <div className="auth-links">
                    <button type="button" className="link-btn" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CustomerChangePassword;
