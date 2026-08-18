import { useState } from "react";
import { Link } from "react-router-dom";
import { resendVerification } from "../services/authApi";

function ResendVerification() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
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

        if (!username.trim() && !email.trim()) {
            setError("Nhập username hoặc email.");
            return;
        }

        setLoading(true);
        try {
            const payload = email.trim()
                ? { email: email.trim() }
                : { username: username.trim() };
            const res = await resendVerification(payload);
            setMessage(res.data.message || "Đã gửi email xác thực.");
            if (res.data._devVerifyLink) {
                setDevLink(res.data._devVerifyLink);
            }
            if (res.data._emailPreview) {
                setEmailPreview(res.data._emailPreview);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Không thể gửi lại email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Gửi lại email xác thực</h2>
                <p className="muted-text" style={{ marginBottom: 16, textAlign: "center" }}>
                    Nhập username hoặc email của tài khoản chưa xác thực.
                </p>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (e.target.value) setEmail("");
                    }}
                />

                <div style={{ textAlign: "center", margin: "8px 0", color: "#999", fontSize: 13 }}>
                    — hoặc —
                </div>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value) setUsername("");
                    }}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi lại email"}
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

export default ResendVerification;
