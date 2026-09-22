import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    customerBalance,
    customerDeposit,
    customerWithdraw,
    customerTransfer,
    customerTransactions,
    customerMe,
    customerBanks,
    customerLookupRecipient,
    customerChangePassword,
    customerSetOtp,
    customerLogout
} from "../services/customerApi";
import {
    getCurrentUser,
    clearAuth,
    getTokenExpiresAt,
    isTokenExpired
} from "../utils/auth";

function formatMoney(n) {
    return Number(n || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(d) {
    if (!d) return "";
    try {
        return new Date(d).toLocaleString("vi-VN");
    } catch {
        return String(d);
    }
}

/** Parse số tiền tự do — không ép step HTML */
function parseAmount(raw) {
    const cleaned = String(raw || "")
        .replace(/[^\d.,]/g, "")
        .replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
}

function renderTypeBadge(tType) {
    const t = String(tType || "").toUpperCase();
    if (t === "DEPOSIT") {
        return (
            <span className="cu-type-badge deposit" title="Nạp tiền">
                🟢 + Nạp tiền
            </span>
        );
    }
    if (t === "WITHDRAW") {
        return (
            <span className="cu-type-badge withdraw" title="Rút tiền">
                🔴 − Rút tiền
            </span>
        );
    }
    if (t.includes("TRANSFER")) {
        return (
            <span className="cu-type-badge transfer" title="Chuyển khoản">
                🔵 ⇄ Chuyển khoản
            </span>
        );
    }
    return <span className="status-pill">{tType || "—"}</span>;
}

function transferCounterparty(t, myAccountId) {
    const isOutgoing =
        t.fromAccountId != null && Number(t.fromAccountId) === Number(myAccountId);
    if (isOutgoing) {
        return {
            label: "Người nhận",
            name: t.toOwnerName || "—",
            account: t.toAccountNumber || "—"
        };
    }
    return {
        label: "Người gửi",
        name: t.fromOwnerName || "—",
        account: t.fromAccountNumber || "—"
    };
}

function CustomerPortal() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [account, setAccount] = useState(null);
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState([]);
    const [tab, setTab] = useState("home");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [hideBalance, setHideBalance] = useState(false);

    // Transfer
    const [bankId, setBankId] = useState("");
    const [toAccountNumber, setToAccountNumber] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferDesc, setTransferDesc] = useState("");
    const [recipient, setRecipient] = useState(null);
    const [lookupErr, setLookupErr] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);

    // Cash
    const [cashAction, setCashAction] = useState("deposit");
    const [cashAmount, setCashAmount] = useState("");

    // Change password
    const [pwdCurrent, setPwdCurrent] = useState("");
    const [pwdNew, setPwdNew] = useState("");
    const [pwdConfirm, setPwdConfirm] = useState("");
    const [pwdMsg, setPwdMsg] = useState("");
    const [pwdErr, setPwdErr] = useState("");

    // Manage OTP
    const [otpNew, setOtpNew] = useState("");
    const [otpConfirm, setOtpConfirm] = useState("");
    const [otpPassword, setOtpPassword] = useState("");
    const [otpMsg, setOtpMsg] = useState("");
    const [otpErr, setOtpErr] = useState("");
    const [otpSaving, setOtpSaving] = useState(false);

    const logoutTimerRef = useRef(null);
    const isVerified = Boolean(profile?.isVerified);

    const stats = useMemo(() => {
        let depositCount = 0;
        let withdrawCount = 0;
        let transferCount = 0;
        let depositSum = 0;
        let withdrawSum = 0;
        let transferSum = 0;
        for (const t of transactions) {
            const type = String(t.type || "").toUpperCase();
            const amt = Number(t.amount) || 0;
            if (type === "DEPOSIT") {
                depositCount++;
                depositSum += amt;
            } else if (type === "WITHDRAW") {
                withdrawCount++;
                withdrawSum += amt;
            } else if (type.includes("TRANSFER")) {
                transferCount++;
                transferSum += amt;
            }
        }
        return {
            depositCount,
            withdrawCount,
            transferCount,
            depositSum,
            withdrawSum,
            transferSum,
            total: transactions.length
        };
    }, [transactions]);

    const handleLogout = useCallback(async () => {
        try {
            await customerLogout();
        } catch {
            /* ignore */
        }
        clearAuth();
        navigate("/customer/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        const tick = () => {
            if (isTokenExpired()) {
                handleLogout();
                return;
            }
            const exp = getTokenExpiresAt();
            if (exp) {
                const left = Math.max(0, Math.ceil((exp - Date.now()) / 1000));
                setSecondsLeft(left);
                if (left <= 0) handleLogout();
            }
        };
        tick();
        logoutTimerRef.current = setInterval(tick, 500);
        return () => {
            if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
        };
    }, [handleLogout]);

    const load = async () => {
        try {
            const me = await customerMe();
            setAccount(me.data.account);
            setProfile(me.data.customer);
            if (me.data.customer?.isVerified) {
                try {
                    const [tx, bankRes] = await Promise.all([
                        customerTransactions(),
                        customerBanks()
                    ]);
                    setTransactions(Array.isArray(tx.data) ? tx.data : []);
                    setBanks(Array.isArray(bankRes.data) ? bankRes.data : []);
                } catch {
                    /* ignore */
                }
            } else {
                try {
                    const bankRes = await customerBanks();
                    setBanks(Array.isArray(bankRes.data) ? bankRes.data : []);
                } catch {
                    /* ignore */
                }
            }
        } catch (err) {
            if (err.response?.status === 401) {
                clearAuth();
                navigate("/customer/login", { replace: true });
            } else {
                setError(err.response?.data?.message || "Không tải được dữ liệu.");
            }
        }
    };

    useEffect(() => {
        if (!user || user.role !== "CUSTOMER") {
            navigate("/customer/login", { replace: true });
            return;
        }
        if (isTokenExpired()) {
            handleLogout();
            return;
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedBank = banks.find((b) => String(b.id) === String(bankId));

    const lockAction = (actionTab) => {
        if (!isVerified && actionTab !== "profile" && actionTab !== "password") {
            navigate("/customer/verify");
            return;
        }
        setTab(actionTab);
        setError("");
        setMessage("");
        setOtpMsg("");
        setOtpErr("");
    };

    const handleLookup = async () => {
        setLookupErr("");
        setRecipient(null);
        if (!bankId) {
            setLookupErr("Vui lòng chọn ngân hàng.");
            return;
        }
        if (!toAccountNumber.trim()) {
            setLookupErr("Vui lòng nhập số tài khoản nhận.");
            return;
        }
        try {
            const res = await customerLookupRecipient(toAccountNumber.trim(), bankId);
            setRecipient(res.data);
        } catch (err) {
            if (err.response?.status === 401) return handleLogout();
            if (err.response?.data?.isVerified === false) {
                navigate("/customer/verify", { replace: true });
                return;
            }
            setLookupErr(err.response?.data?.message || "Không tìm thấy tài khoản.");
        }
    };

    const openOtpModal = (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        if (!isVerified) {
            navigate("/customer/verify");
            return;
        }
        if (!bankId) {
            setError("Vui lòng chọn ngân hàng nhận.");
            return;
        }
        if (!toAccountNumber.trim()) {
            setError("Vui lòng nhập số tài khoản nhận.");
            return;
        }
        const val = parseAmount(transferAmount);
        if (!Number.isFinite(val) || val <= 0) {
            setError("Số tiền phải lớn hơn 0.");
            return;
        }
        if (!recipient) {
            setError("Hãy tra cứu tài khoản nhận trước khi xác nhận.");
            return;
        }
        setOtpDigits(["", "", "", "", "", ""]);
        setShowOtpModal(true);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
    };

    const onOtpChange = (index, value) => {
        const v = value.replace(/\D/g, "").slice(-1);
        const next = [...otpDigits];
        next[index] = v;
        setOtpDigits(next);
        if (v && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const onOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const onOtpPaste = (e) => {
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!text) return;
        e.preventDefault();
        const next = text.split("");
        while (next.length < 6) next.push("");
        setOtpDigits(next.slice(0, 6));
        otpRefs.current[Math.min(text.length, 5)]?.focus();
    };

    const confirmTransfer = async () => {
        const otp = otpDigits.join("");
        if (!/^\d{6}$/.test(otp)) {
            setError("Nhập đủ 6 số OTP.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await customerTransfer({
                toAccountNumber: toAccountNumber.trim(),
                amount: parseAmount(transferAmount),
                description: transferDesc || undefined,
                otp,
                bankId: Number(bankId)
            });
            setMessage(res.data.message || "Chuyển khoản thành công.");
            setShowOtpModal(false);
            setToAccountNumber("");
            setTransferAmount("");
            setTransferDesc("");
            setRecipient(null);
            setBankId("");
            setOtpDigits(["", "", "", "", "", ""]);
            const bal = await customerBalance();
            setAccount((prev) => ({ ...(prev || {}), ...bal.data }));
            const tx = await customerTransactions();
            setTransactions(Array.isArray(tx.data) ? tx.data : []);
            setTab("history");
        } catch (err) {
            if (err.response?.status === 401) return handleLogout();
            setError(err.response?.data?.message || "Chuyển khoản thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleCash = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        if (!isVerified) {
            navigate("/customer/verify");
            return;
        }
        const val = parseAmount(cashAmount);
        if (!Number.isFinite(val) || val <= 0) {
            setError("Số tiền phải lớn hơn 0.");
            return;
        }
        setLoading(true);
        try {
            const res =
                cashAction === "deposit"
                    ? await customerDeposit(val)
                    : await customerWithdraw(val);
            setMessage(res.data.message || "Thành công.");
            setCashAmount("");
            const bal = await customerBalance();
            setAccount((prev) => ({ ...(prev || {}), ...bal.data }));
            const tx = await customerTransactions();
            setTransactions(Array.isArray(tx.data) ? tx.data : []);
        } catch (err) {
            if (err.response?.status === 401) return handleLogout();
            if (err.response?.data?.isVerified === false) {
                navigate("/customer/verify");
                return;
            }
            setError(err.response?.data?.message || "Giao dịch thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwdMsg("");
        setPwdErr("");
        if (pwdNew.length < 6) {
            setPwdErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (pwdNew !== pwdConfirm) {
            setPwdErr("Xác nhận mật khẩu không khớp.");
            return;
        }
        try {
            const res = await customerChangePassword(pwdCurrent, pwdNew);
            setPwdMsg(res.data.message || "Đổi mật khẩu thành công.");
            setPwdCurrent("");
            setPwdNew("");
            setPwdConfirm("");
            const me = await customerMe();
            setProfile(me.data.customer);
            localStorage.setItem(
                "user",
                JSON.stringify({ ...(me.data.customer || {}), role: "CUSTOMER" })
            );
        } catch (err) {
            if (err.response?.status === 401) return handleLogout();
            setPwdErr(err.response?.data?.message || "Đổi mật khẩu thất bại.");
        }
    };

    const handleSetOtp = async (e) => {
        e.preventDefault();
        setOtpMsg("");
        setOtpErr("");
        if (!/^\d{6}$/.test(otpNew)) {
            setOtpErr("OTP phải gồm đúng 6 chữ số.");
            return;
        }
        if (otpNew !== otpConfirm) {
            setOtpErr("Xác nhận OTP không khớp.");
            return;
        }
        if (!otpPassword) {
            setOtpErr("Vui lòng nhập mật khẩu hiện tại để xác nhận.");
            return;
        }
        setOtpSaving(true);
        try {
            const res = await customerSetOtp(otpNew, otpPassword);
            setOtpMsg(res.data.message || "Đã cập nhật OTP thành công.");
            setOtpNew("");
            setOtpConfirm("");
            setOtpPassword("");
            const me = await customerMe();
            setProfile(me.data.customer);
            localStorage.setItem(
                "user",
                JSON.stringify({ ...(me.data.customer || {}), role: "CUSTOMER" })
            );
        } catch (err) {
            if (err.response?.status === 401) return handleLogout();
            setOtpErr(err.response?.data?.message || "Cập nhật OTP thất bại.");
        } finally {
            setOtpSaving(false);
        }
    };

    const navItems = [
        { id: "home", label: "Tổng quan"},
        { id: "transfer", label: "Chuyển khoản"},
        { id: "cash", label: "Nạp / Rút"},
        { id: "history", label: "Lịch sử"},
        { id: "profile", label: "Hồ sơ"},
        { id: "otp", label: "Quản lý OTP"},
        { id: "password", label: "Đổi mật khẩu"}
    ];

    const balanceDisplay = hideBalance
        ? "••••••••"
        : account
          ? formatMoney(account.balance)
          : "…";

    return (
        <div className="cu-layout">
            <aside className="cu-sidebar">
                <h2>Banking Portal</h2>
                <p className="cu-sidebar-sub">Khách hàng</p>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`cu-nav ${tab === item.id ? "active" : ""}`}
                        onClick={() =>
                            item.needVerify ? lockAction(item.id) : setTab(item.id)
                        }
                    >
                        <span className="cu-nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                {!isVerified && (
                    <button
                        type="button"
                        className="cu-nav cu-nav-verify"
                        onClick={() => navigate("/customer/verify")}
                    >
                        <span className="cu-nav-icon">✓</span>
                        Xác thực tài khoản
                    </button>
                )}
            </aside>

            <div className="cu-main">
                <header className="cu-header">
                    <h1>Portal khách hàng</h1>
                    <div className="cu-header-user">
                        <span className="cu-user-name">
                            {profile?.fullName || user?.fullName || user?.username}
                        </span>
                        <span className={`role-badge ${isVerified ? "ok" : "warn"}`}>
                            {isVerified ? "Đã xác thực" : "Tài khoản ngoại"}
                        </span>
                        <button type="button" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </div>
                </header>

                <div className="cu-content">
                    {message && <div className="cu-alert success">{message}</div>}
                    {error && tab !== "otp" && <div className="cu-alert error">{error}</div>}

                    {/* HOME */}
                    {tab === "home" && (
                        <>
                            <div className="cu-balance-hero">
                                <div>
                                    <p className="cu-muted">Số dư khả dụng</p>
                                    <p className="cu-balance-num cu-balance-with-eye">
                                        <span>{balanceDisplay}</span>
                                        <button
                                            type="button"
                                            className="cu-eye-btn"
                                            onClick={() => setHideBalance((v) => !v)}
                                            title={hideBalance ? "Hiện số dư" : "Ẩn số dư"}
                                            aria-label={hideBalance ? "Hiện số dư" : "Ẩn số dư"}
                                        >
                                            {hideBalance ? "👁" : "👁‍🗨"}
                                        </button>
                                    </p>
                                    <p className="cu-meta">
                                        STK <strong>{account?.accountNumber || "—"}</strong>
                                        {account?.ownerName ? ` · ${account.ownerName}` : ""}
                                    </p>
                                </div>
                                <div className="cu-balance-actions">
                                    <button
                                        type="button"
                                        className="cu-btn primary"
                                        onClick={() => lockAction("transfer")}
                                    >
                                        Chuyển khoản
                                    </button>
                                    <button
                                        type="button"
                                        className="cu-btn secondary"
                                        onClick={() => lockAction("cash")}
                                    >
                                        Nạp / Rút
                                    </button>
                                </div>
                            </div>

                            {!isVerified && (
                                <div className="cu-card cu-warn-card">
                                    <h3>Tài khoản ngoại</h3>
                                    <p>
                                        Bạn chỉ xem được số dư. Để giao dịch và xem lịch sử, hãy hoàn
                                        tất đổi mật khẩu và đặt OTP.
                                    </p>
                                    <button
                                        type="button"
                                        className="cu-btn primary"
                                        onClick={() => navigate("/customer/verify")}
                                    >
                                        Đi tới xác thực
                                    </button>
                                </div>
                            )}

                            {isVerified && (
                                <div className="cu-card">
                                    <h3>Thống kê giao dịch</h3>
                                    <div className="cu-stats-grid">
                                        <div className="cu-stat-card deposit">
                                            <div className="cu-stat-label">Nạp tiền</div>
                                            <div className="cu-stat-value">{stats.depositCount}</div>
                                            <div className="cu-stat-sub">
                                                {formatMoney(stats.depositSum)}
                                            </div>
                                        </div>
                                        <div className="cu-stat-card withdraw">
                                            <div className="cu-stat-label">Rút tiền</div>
                                            <div className="cu-stat-value">{stats.withdrawCount}</div>
                                            <div className="cu-stat-sub">
                                                {formatMoney(stats.withdrawSum)}
                                            </div>
                                        </div>
                                        <div className="cu-stat-card transfer">
                                            <div className="cu-stat-label">Chuyển khoản</div>
                                            <div className="cu-stat-value">{stats.transferCount}</div>
                                            <div className="cu-stat-sub">
                                                {formatMoney(stats.transferSum)}
                                            </div>
                                        </div>
                                        <div className="cu-stat-card total">
                                            <div className="cu-stat-label">Tổng giao dịch</div>
                                            <div className="cu-stat-value">{stats.total}</div>
                                            <div className="cu-stat-sub">Tất cả loại</div>
                                        </div>
                                    </div>
                                    {stats.total > 0 && (
                                        <div className="cu-stat-bars">
                                            <div className="cu-stat-bar-row">
                                                <span>Nạp</span>
                                                <div className="cu-stat-bar-track">
                                                    <div
                                                        className="cu-stat-bar-fill deposit"
                                                        style={{
                                                            width: `${Math.max(
                                                                2,
                                                                (stats.depositCount / stats.total) *
                                                                    100
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                                <span>
                                                    {Math.round(
                                                        (stats.depositCount / stats.total) * 100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <div className="cu-stat-bar-row">
                                                <span>Rút</span>
                                                <div className="cu-stat-bar-track">
                                                    <div
                                                        className="cu-stat-bar-fill withdraw"
                                                        style={{
                                                            width: `${Math.max(
                                                                2,
                                                                (stats.withdrawCount /
                                                                    stats.total) *
                                                                    100
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                                <span>
                                                    {Math.round(
                                                        (stats.withdrawCount / stats.total) * 100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <div className="cu-stat-bar-row">
                                                <span>CK</span>
                                                <div className="cu-stat-bar-track">
                                                    <div
                                                        className="cu-stat-bar-fill transfer"
                                                        style={{
                                                            width: `${Math.max(
                                                                2,
                                                                (stats.transferCount /
                                                                    stats.total) *
                                                                    100
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                                <span>
                                                    {Math.round(
                                                        (stats.transferCount / stats.total) * 100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {stats.total === 0 && (
                                        <p className="cu-muted" style={{ marginTop: 12 }}>
                                            Chưa có giao dịch nào để thống kê.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* TRANSFER */}
                    {tab === "transfer" && isVerified && (
                        <div className="cu-card">
                            <h3>Chuyển khoản</h3>
                            <p className="cu-muted" style={{ marginBottom: 14 }}>
                                Chọn ngân hàng → nhập STK → nội dung → xác nhận OTP
                            </p>
                            <form onSubmit={openOtpModal} className="cu-form">
                                <label>
                                    Ngân hàng nhận
                                    <select
                                        value={bankId}
                                        onChange={(e) => {
                                            setBankId(e.target.value);
                                            setRecipient(null);
                                        }}
                                        required
                                    >
                                        <option value="">— Chọn ngân hàng —</option>
                                        {banks.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.code ? `${b.code} – ` : ""}
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Số tài khoản nhận
                                    <div className="cu-row">
                                        <input
                                            type="text"
                                            value={toAccountNumber}
                                            onChange={(e) => {
                                                setToAccountNumber(e.target.value);
                                                setRecipient(null);
                                            }}
                                            placeholder="Nhập số tài khoản"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="cu-btn secondary"
                                            onClick={handleLookup}
                                        >
                                            Tra cứu
                                        </button>
                                    </div>
                                </label>
                                {lookupErr && <p className="error-text">{lookupErr}</p>}
                                {recipient && (
                                    <div className="cu-recipient">
                                        <div className="cu-avatar">
                                            {(recipient.ownerName || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <strong>{recipient.ownerName}</strong>
                                            <div className="cu-muted">
                                                {recipient.accountNumber}
                                                {recipient.bankName ? ` · ${recipient.bankName}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <label>
                                    Số tiền (VND)
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        placeholder="Nhập số tiền (ví dụ 150000)"
                                        required
                                    />
                                </label>
                                <label>
                                    Nội dung chuyển khoản
                                    <input
                                        type="text"
                                        value={transferDesc}
                                        onChange={(e) => setTransferDesc(e.target.value)}
                                        placeholder="VD: Thanh toan hoa don"
                                        maxLength={120}
                                    />
                                </label>
                                <button type="submit" className="cu-btn primary" disabled={loading}>
                                    Tiếp tục
                                </button>
                            </form>
                        </div>
                    )}

                    {/* CASH */}
                    {tab === "cash" && isVerified && (
                        <div className="cu-card">
                            <h3>Nạp / Rút tiền</h3>
                            <div className="cu-seg">
                                <button
                                    type="button"
                                    className={cashAction === "deposit" ? "active" : ""}
                                    onClick={() => setCashAction("deposit")}
                                >
                                    Nạp tiền
                                </button>
                                <button
                                    type="button"
                                    className={cashAction === "withdraw" ? "active" : ""}
                                    onClick={() => setCashAction("withdraw")}
                                >
                                    Rút tiền
                                </button>
                            </div>
                            <form onSubmit={handleCash} className="cu-form">
                                <label>
                                    Số tiền (VND)
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        placeholder="Nhập số tiền bất kỳ"
                                        required
                                    />
                                </label>
                                <button type="submit" className="cu-btn primary" disabled={loading}>
                                    {loading
                                        ? "Đang xử lý..."
                                        : cashAction === "deposit"
                                          ? "Nạp tiền"
                                          : "Rút tiền"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* HISTORY */}
                    {tab === "history" && isVerified && (
                        <div className="cu-card">
                            <h3>Lịch sử giao dịch</h3>
                            {transactions.length === 0 ? (
                                <p className="cu-muted">Chưa có giao dịch nào.</p>
                            ) : (
                                <div className="table-wrap">
                                    <table className="cu-table">
                                        <thead>
                                            <tr>
                                                <th>Thời gian</th>
                                                <th>Loại</th>
                                                <th>Số tiền</th>
                                                <th>Đối tác</th>
                                                <th>Mô tả</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((t) => {
                                                const type = String(t.type || "").toUpperCase();
                                                const isTransfer = type.includes("TRANSFER");
                                                const cp = isTransfer
                                                    ? transferCounterparty(t, account?.id)
                                                    : null;
                                                return (
                                                    <tr key={t.id}>
                                                        <td>
                                                            {formatDate(
                                                                t.createdAt || t.created_at
                                                            )}
                                                        </td>
                                                        <td>{renderTypeBadge(t.type)}</td>
                                                        <td>{formatMoney(t.amount)}</td>
                                                        <td>
                                                            {cp ? (
                                                                <div className="cu-tx-party">
                                                                    <span className="cu-muted">
                                                                        {cp.label}
                                                                    </span>
                                                                    <strong>{cp.name}</strong>
                                                                    <span className="cu-muted">
                                                                        {cp.account}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </td>
                                                        <td>{t.description || "—"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFILE */}
                    {tab === "profile" && (
                        <div className="cu-profile-page">

                            {/* PROFILE HEADER */}
                            <div className="cu-profile-header">
                                <div className="cu-profile-avatar">
                                    {profile?.fullName
                                        ? profile.fullName.charAt(0).toUpperCase()
                                        : "U"}
                                </div>

                                <div className="cu-profile-header-info">
                                    <h2>{profile?.fullName || "Khách hàng"}</h2>

                                    <span className="cu-account-number">
                                        Số tài khoản:{" "}
                                        <strong>
                                            {profile?.username ||
                                                account?.accountNumber ||
                                                "—"}
                                        </strong>
                                    </span>

                                    <div className="cu-profile-status">
                                        <span
                                            className={
                                                isVerified
                                                    ? "cu-status verified"
                                                    : "cu-status unverified"
                                            }
                                        >
                                            <span className="cu-status-dot"></span>

                                            {isVerified
                                                ? "Tài khoản đã xác thực"
                                                : "Chưa xác thực"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ACCOUNT INFORMATION */}
                            <div className="cu-card">
                                <div className="cu-section-title">
                                    <div>
                                        <h3>Thông tin tài khoản</h3>
                                        <p>Thông tin cơ bản của tài khoản ngân hàng</p>
                                    </div>
                                </div>

                                <div className="cu-profile-grid">

                                    <div className="cu-profile-item">
                                        <span className="cu-muted">Họ và tên</span>
                                        <strong>
                                            {profile?.fullName || "—"}
                                        </strong>
                                    </div>

                                    <div className="cu-profile-item">
                                        <span className="cu-muted">
                                            Số tài khoản
                                        </span>
                                        <strong>
                                            {profile?.username ||
                                                account?.accountNumber ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="cu-profile-item">
                                        <span className="cu-muted">
                                            Trạng thái tài khoản
                                        </span>

                                        <strong
                                            className={
                                                account?.status === "ACTIVE"
                                                    ? "cu-text-success"
                                                    : "cu-text-warning"
                                            }
                                        >
                                            {account?.status || "—"}
                                        </strong>
                                    </div>

                                    <div className="cu-profile-item">
                                        <span className="cu-muted">
                                            Trạng thái xác thực
                                        </span>

                                        <strong
                                            className={
                                                isVerified
                                                    ? "cu-text-success"
                                                    : "cu-text-warning"
                                            }
                                        >
                                            {isVerified
                                                ? "Đã xác thực"
                                                : "Chưa xác thực"}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* SECURITY */}
                            <div className="cu-card">
                                <div className="cu-section-title">
                                    <div>
                                        <h3>Bảo mật tài khoản</h3>
                                        <p>Quản lý các phương thức bảo mật giao dịch</p>
                                    </div>
                                </div>

                                <div className="cu-security-list">

                                    {/* OTP */}
                                    <div className="cu-security-item">
                                        <div className="cu-security-icon">
                                            🔐
                                        </div>

                                        <div className="cu-security-info">
                                            <strong>OTP giao dịch</strong>

                                            <span>
                                                {profile?.hasOtp
                                                    ? "OTP đã được thiết lập"
                                                    : "Bạn chưa thiết lập OTP"}
                                            </span>
                                        </div>

                                        <div
                                            className={
                                                profile?.hasOtp
                                                    ? "cu-security-status active"
                                                    : "cu-security-status"
                                            }
                                        >
                                            {profile?.hasOtp
                                                ? "Đã thiết lập"
                                                : "Chưa thiết lập"}
                                        </div>
                                    </div>

                                    {/* PASSWORD */}
                                    <div className="cu-security-item">
                                        <div className="cu-security-icon">
                                            🔑
                                        </div>

                                        <div className="cu-security-info">
                                            <strong>Mật khẩu</strong>

                                            <span>
                                                Bảo vệ tài khoản bằng mật khẩu đăng nhập
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="cu-security-action"
                                            onClick={() => setTab("password")}
                                        >
                                            Đổi mật khẩu
                                        </button>
                                    </div>

                                </div>
                            </div>

                            {/* VERIFICATION */}
                            {!isVerified && (
                                <div className="cu-verification-card">

                                    <div className="cu-verification-icon">
                                        !
                                    </div>

                                    <div className="cu-verification-content">
                                        <h3>Tài khoản chưa được xác thực</h3>

                                        <p>
                                            Vui lòng xác thực tài khoản để sử dụng
                                            các chức năng giao dịch như chuyển khoản,
                                            nạp/rút tiền và OTP.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="cu-btn primary"
                                        onClick={() =>
                                            navigate("/customer/verify")
                                        }
                                    >
                                        Xác thực ngay
                                    </button>

                                </div>
                            )}

                        </div>
                    )}

                    {/* OTP MANAGEMENT */}
                    {tab === "otp" && isVerified && (
                        <div className="cu-card">
                            <h3>Quản lý OTP</h3>
                            <p className="cu-muted" style={{ marginBottom: 14 }}>
                                OTP 6 số dùng để xác nhận chuyển khoản. Bạn có thể đặt mới hoặc đổi
                                lại bất cứ lúc nào (cần nhập mật khẩu hiện tại).
                            </p>
                            <div className="cu-profile-item" style={{ marginBottom: 16 }}>
                                <span className="cu-muted">Trạng thái OTP</span>
                                <strong>{profile?.hasOtp ? "Đã đặt" : "Chưa đặt"}</strong>
                            </div>
                            <form onSubmit={handleSetOtp} className="cu-form">
                                <label>
                                    OTP mới (6 số)
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        value={otpNew}
                                        onChange={(e) =>
                                            setOtpNew(e.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                        placeholder="••••••"
                                        maxLength={6}
                                        required
                                        autoComplete="off"
                                    />
                                </label>
                                <label>
                                    Xác nhận OTP mới
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        value={otpConfirm}
                                        onChange={(e) =>
                                            setOtpConfirm(
                                                e.target.value.replace(/\D/g, "").slice(0, 6)
                                            )
                                        }
                                        placeholder="••••••"
                                        maxLength={6}
                                        required
                                        autoComplete="off"
                                    />
                                </label>
                                <label>
                                    Mật khẩu hiện tại (xác nhận)
                                    <input
                                        type="password"
                                        value={otpPassword}
                                        onChange={(e) => setOtpPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                </label>
                                {otpErr && <p className="error-text">{otpErr}</p>}
                                {otpMsg && <p className="success-text">{otpMsg}</p>}
                                <button
                                    type="submit"
                                    className="cu-btn primary"
                                    disabled={otpSaving}
                                >
                                    {otpSaving
                                        ? "Đang lưu..."
                                        : profile?.hasOtp
                                          ? "Đổi OTP"
                                          : "Đặt OTP"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* PASSWORD */}
                    {tab === "password" && (
                        <div className="cu-card">
                            <h3>Đổi mật khẩu</h3>
                            <p className="cu-muted" style={{ marginBottom: 14 }}>
                                Khi quên mật khẩu, hệ thống gửi link đặt lại tới email đã gắn với tài
                                khoản của bạn.
                            </p>
                            <form onSubmit={handleChangePassword} className="cu-form">
                                <label>
                                    Mật khẩu hiện tại
                                    <input
                                        type="password"
                                        value={pwdCurrent}
                                        onChange={(e) => setPwdCurrent(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                </label>
                                <label>
                                    Mật khẩu mới
                                    <input
                                        type="password"
                                        value={pwdNew}
                                        onChange={(e) => setPwdNew(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </label>
                                <label>
                                    Xác nhận mật khẩu mới
                                    <input
                                        type="password"
                                        value={pwdConfirm}
                                        onChange={(e) => setPwdConfirm(e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </label>
                                {pwdErr && <p className="error-text">{pwdErr}</p>}
                                {pwdMsg && <p className="success-text">{pwdMsg}</p>}
                                <button type="submit" className="cu-btn primary">
                                    Lưu mật khẩu mới
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {showOtpModal && (
                <div
                    className="cu-modal-backdrop"
                    onClick={() => !loading && setShowOtpModal(false)}
                >
                    <div className="cu-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận OTP</h3>
                        <p className="cu-muted">
                            Nhập OTP 6 số để xác nhận chuyển{" "}
                            <strong>{formatMoney(parseAmount(transferAmount))}</strong> tới{" "}
                            <strong>{recipient?.ownerName}</strong> ({toAccountNumber}
                            {selectedBank ? ` · ${selectedBank.name}` : ""}).
                        </p>
                        {transferDesc && (
                            <p className="cu-muted" style={{ marginTop: 6 }}>
                                Nội dung: {transferDesc}
                            </p>
                        )}
                        <div className="cu-otp-boxes" onPaste={onOtpPaste}>
                            {otpDigits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={(e) => onOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                                    className="cu-otp-box"
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <div className="cu-modal-actions">
                            <button
                                type="button"
                                className="cu-btn secondary"
                                disabled={loading}
                                onClick={() => setShowOtpModal(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="cu-btn primary"
                                disabled={loading}
                                onClick={confirmTransfer}
                            >
                                {loading ? "Đang chuyển..." : "Xác nhận chuyển"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerPortal;