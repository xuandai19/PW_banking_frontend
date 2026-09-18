import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authApi";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await login({ username, password });
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại");
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Banking Management</h2>

                <input
                    type="text"
                    placeholder="Username hoặc Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                />

                <div className="password-input-wrapper">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                <button type="submit">Đăng nhập</button>
                {error && <p className="error-text">{error}</p>}

                <div className="auth-links">
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
<<<<<<< HEAD
=======
                    <Link to="/customer/login">Đăng nhập khách hàng</Link>
>>>>>>> feature/v2_users
                </div>
            </form>
        </div>
    );
}

export default Login;