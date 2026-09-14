import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/authApi";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Thiếu token xác thực.");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const res = await verifyEmail(token);
                if (cancelled) return;
                setStatus("success");
                setMessage(res.data.message || "Xác thực email thành công.");
            } catch (err) {
                if (cancelled) return;
                setStatus("error");
                setMessage(err.response?.data?.message || "Xác thực thất bại.");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <div className="login-container">
            <div className="login-form" style={{ textAlign: "center" }}>
                <h2>Xác thực email</h2>

                {status === "loading" && <p>Đang xác thực...</p>}
                {status === "success" && <p className="success-text">{message}</p>}
                {status === "error" && <p className="error-text">{message}</p>}

                <div className="auth-links" style={{ marginTop: 20 }}>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
