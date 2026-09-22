import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerLogin } from "../services/customerApi";
import { saveCustomerSession } from "../utils/auth";

function CustomerLogin() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mật khẩu"
                            required
                            autoComplete="current-password"
                        />

                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                </label>

                {error && <p className="error-text">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <div className="auth-links">
                    <Link to="/customer/forgot-password">
                        Quên mật khẩu?
                    </Link>

                    <Link to="/login">
                        Đăng nhập nhân viên / admin
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default CustomerLogin;
