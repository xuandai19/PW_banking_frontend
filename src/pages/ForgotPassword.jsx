import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authApi";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [devLink, setDevLink] = useState("");
    const [emailPreview, setEmailPreview] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setDevLink("");
        setEmailPreview("");

        if (!email.trim() && !username.trim()) {
            setError("Nhập email hoặc tên đăng nhập.");
            return;
        }

        setLoading(true);
        try {
            const payload = email.trim()
                ? { email: email.trim() }
                : { username: username.trim() };
            const res = await forgotPassword(payload);
            setMessage(res.data.message || "Đã gửi hướng dẫn đặt lại mật khẩu.");
            if (res.data._devResetLink) {
                setDevLink(res.data._devResetLink);
            }
            if (res.data._emailPreview) {
                setEmailPreview(res.data._emailPreview);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Quên mật khẩu</h2>
                <p className="muted-text" style={{ marginBottom: 16, textAlign: "center" }}>
                    Nhập email (hoặc username) đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu.
                </p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value) setUsername("");
                    }}
                />

                <div style={{ textAlign: "center", margin: "8px 0", color: "#999", fontSize: 13 }}>
                    — hoặc —
                </div>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (e.target.value) setEmail("");
                    }}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                </button>

                {message && <p className="success-text">{message}</p>}
                {error && <p className="error-text">{error}</p>}

                {(devLink || emailPreview) && (
                    <div className="dev-link-box">
                        {devLink && (
                            <>
                                <strong>Link trong app:</strong>
                                <a href={devLink}>{devLink}</a>
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

                <div className="auth-links">
                    <Link to="/login">← Quay lại đăng nhập</Link>
                </div>
            </form>
        </div>
    );
}

export default ForgotPassword;
