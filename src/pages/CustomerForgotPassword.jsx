import { useState } from "react";
import { Link } from "react-router-dom";
import { customerForgotPassword } from "../services/customerApi";

function CustomerForgotPassword() {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [devLink, setDevLink] = useState("");
    const [emailPreview, setEmailPreview] = useState("");
    const [sentTo, setSentTo] = useState("");
    const [emailMode, setEmailMode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setDevLink("");
        setEmailPreview("");
        setSentTo("");
        setEmailMode("");

        if (!email.trim() && !username.trim()) {
            setError("Nhập email hoặc số tài khoản (username).");
            return;
        }

        setLoading(true);
        try {
            const payload = email.trim()
                ? { email: email.trim() }
                : { username: username.trim() };
            const res = await customerForgotPassword(payload);
            const data = res.data || {};
            setMessage(data.message || "Đã gửi hướng dẫn đặt lại mật khẩu.");
            if (data._devResetLink) {
                setDevLink(data._devResetLink);
            }
            if (data._emailPreview) {
                setEmailPreview(data._emailPreview);
            }
            if (data._sentTo) {
                setSentTo(data._sentTo);
            }
            if (data._emailMode) {
                setEmailMode(data._emailMode);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Quên mật khẩu khách hàng</h1>
                <p className="auth-subtitle">
                    Nhập email đã đăng ký (hoặc số tài khoản). Hệ thống gửi link đặt lại
                    mật khẩu tới đúng email của bạn.
                </p>

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (e.target.value) setUsername("");
                        }}
                        placeholder="email@example.com"
                        autoComplete="email"
                    />
                </label>

                <div style={{ textAlign: "center", margin: "8px 0", color: "#999", fontSize: 13 }}>
                    — hoặc —
                </div>

                <label>
                    Số tài khoản (username)
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (e.target.value) setEmail("");
                        }}
                        placeholder="Số tài khoản"
                        autoComplete="username"
                    />
                </label>

                {error && <p className="error-text">{error}</p>}
                {message && <p className="success-text">{message}</p>}
                {sentTo && (
                    <p className="success-text" style={{ fontSize: 13 }}>
                        Đã gửi tới: <strong>{sentTo}</strong>
                    </p>
                )}

                {(devLink || emailPreview) && (
                    <div className="dev-link-box">
                        <strong style={{ display: "block", marginBottom: 6 }}>
                            Link đặt lại mật khẩu
                            {emailMode ? ` (${emailMode})` : ""}:
                        </strong>
                        {devLink && (
                            <a href={devLink} style={{ wordBreak: "break-all" }}>
                                {devLink}
                            </a>
                        )}
                        {emailPreview && (
                            <>
                                <strong style={{ display: "block", marginTop: 10 }}>
                                    Xem email trên Ethereal:
                                </strong>
                                <a href={emailPreview} target="_blank" rel="noreferrer">
                                    {emailPreview}
                                </a>
                            </>
                        )}
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                </button>

                <div className="auth-links">
                    <Link to="/customer/login">Quay lại đăng nhập</Link>
                </div>
            </form>
        </div>
    );
}

export default CustomerForgotPassword;
