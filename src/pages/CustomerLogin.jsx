import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerLogin } from "../services/customerApi";
import { saveCustomerSession } from "../utils/auth";

function CustomerLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await customerLogin({ username, password });

            const {
                token,
                user,
                account,
                mustChangePassword,
                expiresAt,
                expiresIn
            } = res.data;

            saveCustomerSession({
                token,
                user,
                account,
                expiresAt,
                expiresIn
            });

            const verified = Boolean(
                res.data.isVerified ?? user?.isVerified
            );

            if (!verified) {
                navigate("/customer/verify", { replace: true });
            } else {
                navigate("/customer", { replace: true });
            }

        } catch (err) {
            setError(
                err.response?.data?.message || "Đăng nhập thất bại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Đăng nhập khách hàng</h1>
                <p className="auth-subtitle">
                    Sử dụng số tài khoản và mật khẩu được cấp
                </p>
                <p className="auth-subtitle" style={{ fontSize: 12, color: "#888" }}>
                    Phiên đăng nhập hết hạn sau 15 giây (token lưu cookie).
                </p>

                <label>
                    Số tài khoản (username)
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Số tài khoản"
                        required
                        autoComplete="username"
                    />
                </label>

                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        required
                        autoComplete="current-password"
                    />
                </label>

                {error && <p className="error-text">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <div className="auth-links">
                    <Link to="/customer/forgot-password">Quên mật khẩu?</Link>
                    <Link to="/login">Đăng nhập nhân viên / admin</Link>
                </div>
            </form>
        </div>
    );
}

export default CustomerLogin;
