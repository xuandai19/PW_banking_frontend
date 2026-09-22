import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    customerMe,
    customerChangePassword,
    customerSetOtp
} from "../services/customerApi";
import { getCurrentUser, clearAuth, isTokenExpired } from "../utils/auth";

function CustomerVerify() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [profile, setProfile] = useState(null);
    const [step, setStep] = useState(1); // 1 password, 2 otp
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [pwdOk, setPwdOk] = useState("");

    const [otp, setOtp] = useState("");
    const [otpConfirm, setOtpConfirm] = useState("");
    const [otpPassword, setOtpPassword] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpOk, setOtpOk] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const me = await customerMe();
            const c = me.data.customer;
            setProfile(c);
            if (c?.isVerified) {
                navigate("/customer", { replace: true });
                return;
            }
            if (!c?.mustChangePassword && !c?.hasOtp) setStep(2);
            else if (!c?.mustChangePassword && c?.hasOtp) navigate("/customer", { replace: true });
            else setStep(1);
        } catch (err) {
            if (err.response?.status === 401) {
                clearAuth();
                navigate("/customer/login", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== "CUSTOMER") {
            navigate("/customer/login", { replace: true });
            return;
        }
        if (isTokenExpired()) {
            clearAuth();
            navigate("/customer/login", { replace: true });
            return;
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePassword = async (e) => {
        e.preventDefault();
        setPwdError("");
        setPwdOk("");
        if (newPassword.length < 6) {
            setPwdError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdError("Xác nhận mật khẩu không khớp.");
            return;
        }
        setSaving(true);
        try {
            await customerChangePassword(currentPassword, newPassword);
            localStorage.setItem(
                "user",
                JSON.stringify({ ...(user || {}), mustChangePassword: false })
            );
            setPwdOk("Đổi mật khẩu thành công.");
            setOtpPassword(newPassword);
            setStep(2);
            setProfile((p) => (p ? { ...p, mustChangePassword: false } : p));
        } catch (err) {
            setPwdError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const handleOtp = async (e) => {
        e.preventDefault();
        setOtpError("");
        setOtpOk("");
        if (!/^\d{6}$/.test(otp)) {
            setOtpError("OTP phải gồm đúng 6 chữ số.");
            return;
        }
        if (otp !== otpConfirm) {
            setOtpError("Xác nhận OTP không khớp.");
            return;
        }
        if (!otpPassword) {
            setOtpError("Nhập mật khẩu hiện tại để xác nhận.");
            return;
        }
        setSaving(true);
        try {
            await customerSetOtp(otp, otpPassword);
            setOtpOk("Đặt OTP thành công. Tài khoản đã được xác thực.");
            const me = await customerMe();
            localStorage.setItem(
                "user",
                JSON.stringify({ ...(me.data.customer || {}), role: "CUSTOMER" })
            );
            setTimeout(() => navigate("/customer", { replace: true }), 900);
        } catch (err) {
            setOtpError(err.response?.data?.message || "Không đặt được OTP.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="cp-shell">
                <div className="cp-card cp-center">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="cp-shell cp-verify-shell">
            <div className="cp-verify-card">
                <div className="cp-verify-brand">
                    <div className="cp-logo">₿</div>
                    <div>
                        <h1>Xác thực tài khoản</h1>
                        <p>Hoàn tất 2 bước để kích hoạt giao dịch</p>
                    </div>
                </div>

                <div className="cp-steps">
                    <div className={`cp-step ${step >= 1 ? "done" : ""} ${step === 1 ? "active" : ""}`}>
                        <span>1</span> Đổi mật khẩu
                    </div>
                    <div className="cp-step-line" />
                    <div className={`cp-step ${step >= 2 ? "active" : ""} ${profile?.hasOtp ? "done" : ""}`}>
                        <span>2</span> Đặt OTP 6 số
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handlePassword} className="cp-form">
                        <p className="cp-hint">
                            Bạn đang dùng mật khẩu mặc định. Đặt mật khẩu mới để bảo vệ tài khoản.
                        </p>
                        <label>
                            Mật khẩu hiện tại
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </label>
                        <label>
                            Mật khẩu mới
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </label>
                        <label>
                            Xác nhận mật khẩu mới
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </label>
                        {pwdError && <p className="cp-error">{pwdError}</p>}
                        {pwdOk && <p className="cp-success">{pwdOk}</p>}
                        <button type="submit" className="cp-btn-primary" disabled={saving}>
                            {saving ? "Đang lưu..." : "Tiếp tục"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleOtp} className="cp-form">
                        <p className="cp-hint">
                            OTP 6 số do bạn tự đặt — dùng mỗi khi chuyển khoản (giống mã PIN giao dịch).
                        </p>
                        <label>
                            OTP mới (6 chữ số)
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="••••••"
                                required
                                className="cp-otp-input"
                            />
                        </label>
                        <label>
                            Xác nhận OTP
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={otpConfirm}
                                onChange={(e) =>
                                    setOtpConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                placeholder="••••••"
                                required
                                className="cp-otp-input"
                            />
                        </label>
                        <label>
                            Mật khẩu hiện tại (xác nhận)
                            <input
                                type="password"
                                value={otpPassword}
                                onChange={(e) => setOtpPassword(e.target.value)}
                                required
                            />
                        </label>
                        {otpError && <p className="cp-error">{otpError}</p>}
                        {otpOk && <p className="cp-success">{otpOk}</p>}
                        <button type="submit" className="cp-btn-primary" disabled={saving}>
                            {saving ? "Đang lưu..." : "Hoàn tất xác thực"}
                        </button>
                        {!profile?.mustChangePassword && (
                            <button
                                type="button"
                                className="cp-btn-ghost"
                                onClick={() => navigate("/customer")}
                            >
                                Về portal (chỉ xem số dư)
                            </button>
                        )}
                    </form>
                )}

                <button
                    type="button"
                    className="cp-btn-ghost"
                    onClick={() => {
                        clearAuth();
                        navigate("/customer/login", { replace: true });
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

export default CustomerVerify;
