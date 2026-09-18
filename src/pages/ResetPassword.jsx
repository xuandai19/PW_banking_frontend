import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authApi";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("Thiếu token. Hãy mở link từ email.");
            return;
        }

        if (password.length < 4) {
            setError("Mật khẩu phải có ít nhất 4 ký tự.");
            return;
        }

        if (password !== confirm) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);
        try {
            const res = await resetPassword({ token, newPassword: password });
            setMessage(res.data.message || "Đổi mật khẩu thành công.");
            setTimeout(() => navigate("/login", { replace: true }), 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Đặt lại mật khẩu</h2>

                {!token && (
                    <p className="error-text">Link không hợp lệ. Vui lòng yêu cầu lại từ trang Quên mật khẩu.</p>
                )}

                <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!token}
                />

                <input
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={!token}
                />

                <button type="submit" disabled={loading || !token}>
                    {loading ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>

                {message && <p className="success-text">{message}</p>}
                {error && <p className="error-text">{error}</p>}

                <div className="auth-links">
                    <Link to="/login">← Quay lại đăng nhập</Link>
                    <Link to="/forgot-password">Gửi lại link</Link>
                </div>
            </form>
        </div>
    );
}

export default ResetPassword;
