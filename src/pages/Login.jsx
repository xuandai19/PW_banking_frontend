import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authApi";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const fillRole = (nextUsername) => {
        setUsername(nextUsername);
        setPassword("123456");
        setError("");
    };

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

                <div className="role-hints">
                    <button type="button" onClick={() => fillRole("admin")}>
                        Admin
                    </button>
                    <button type="button" onClick={() => fillRole("subadmin")}>
                        Subadmin
                    </button>
                    <button type="button" onClick={() => fillRole("employee")}>
                        Employee
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />

                <button type="submit">Đăng nhập</button>
                {error && <p className="error-text">{error}</p>}

                <div className="auth-links">
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                    <Link to="/resend-verification">Gửi lại email xác thực</Link>
                </div>
            </form>
        </div>
    );
}

export default Login;
