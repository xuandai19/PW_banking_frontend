import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { customerResetPassword } from "../services/customerApi";

function CustomerResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromUrl = searchParams.get("token") || "";
    const [token, setToken] = useState(tokenFromUrl);
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (!token.trim()) {
            setError("Thiếu token đặt lại mật khẩu.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirm) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }
        setLoading(true);
        try {
            const res = await customerResetPassword(token.trim(), newPassword);
            setMessage(res.data.message || "Đổi mật khẩu thành công.");
            setTimeout(() => navigate("/customer/login", { replace: true }), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể đặt lại mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Đặt lại mật khẩu khách hàng</h1>
                <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                {!tokenFromUrl && (
                    <label>
                        Token
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Token từ email"
                            required
                        />
                    </label>
                )}

                <label>
                    Mật khẩu mới
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        required
                        minLength={6}
                    />
                </label>

                <label>
                    Xác nhận mật khẩu
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                    />
                </label>

                {error && <p className="error-text">{error}</p>}
                {message && <p className="success-text">{message}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>

                <div className="auth-links">
                    <Link to="/customer/login">Đăng nhập</Link>
                </div>
            </form>
        </div>
    );
}

export default CustomerResetPassword;
