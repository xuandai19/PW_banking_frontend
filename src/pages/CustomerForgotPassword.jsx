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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setDevLink("");
        setEmailPreview("");
        setSentTo("");

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
            setMessage(res.data.message || "Đã gửi hướng dẫn đặt lại mật khẩu.");
            if (res.data._devResetLink) setDevLink(res.data._devResetLink);
            if (res.data._emailPreview) setEmailPreview(res.data._emailPreview);
            if (res.data._sentTo) setSentTo(res.data._sentTo);
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
                    />
                </label>

                {error && <p className="error-text">{error}</p>}
                {message && <p className="success-text">{message}</p>}
                {sentTo && (
                    <p className="muted" style={{ fontSize: 13 }}>
                        Đã gửi tới: <strong>{sentTo}</strong>
                    </p>
                )}
                {devLink && (
                    <p className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                        Dev link: <a href={devLink}>{devLink}</a>
                    </p>
                )}
                {emailPreview && (
                    <p className="muted" style={{ fontSize: 12 }}>
                        Preview mail:{" "}
                        <a href={emailPreview} target="_blank" rel="noreferrer">
                            {emailPreview}
                        </a>
                    </p>
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
