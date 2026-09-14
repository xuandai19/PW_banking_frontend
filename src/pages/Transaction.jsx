import Pagination from "../components/Pagination";
import React, { useEffect, useState, useMemo } from "react";
import {
    deposit,
    withdraw,
    transfer,
    getTransactions
} from "../services/transactionApi";
import { getAccounts } from "../services/accountApi";
import { getBanks } from "../services/bankApi";
import { getBranches } from "../services/branchApi";
import { getCurrentUser, canExecuteTransaction } from "../utils/auth";

function Transaction() {
    const currentUser = getCurrentUser();
    const readOnly = !canExecuteTransaction();
    const [page, setPage] = useState(1);

    // Master data từ API
    const [banks, setBanks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // State điều khiển Modal
    const [showModal, setShowModal] = useState(false);

    // States chọn lọc Cascading trong Modal (Deposit / Withdraw)
    const [selectedBank, setSelectedBank] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");

    // States chọn lọc Cascading cho Transfer (Nguồn & Đích)
    const [fromBank, setFromBank] = useState("");
    const [fromBranch, setFromBranch] = useState("");
    const [toBank, setToBank] = useState("");
    const [toBranch, setToBranch] = useState("");

    // Form Dữ liệu chính
    const [type, setType] = useState("DEPOSIT");
    const [formData, setFormData] = useState({
        accountId: "",
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        description: ""
    });

    // States cho Bộ lọc chính trên màn hình
    const [filterKeyword, setFilterKeyword] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterBank, setFilterBank] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterAccount, setFilterAccount] = useState("");

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [banksRes, branchesRes, accountsRes, transactionsRes] = await Promise.all([
                getBanks(),
                getBranches(),
                getAccounts(),
                getTransactions()
            ]);
            setBanks(banksRes.data || []);
            setBranches(branchesRes.data || []);
            setAccounts(accountsRes.data || []);
            setTransactions(transactionsRes.data || []);
        } catch (e) {
            console.error("Lỗi khi tải dữ liệu ban đầu:", e);
        }
    };

    const loadAccounts = async () => {
        try {
            const res = await getAccounts();
            setAccounts(res.data || []);
        } catch (e) {
            console.error("Lỗi khi tải danh sách tài khoản:", e);
        }
    };

    const loadTransactions = async () => {
        try {
            const res = await getTransactions();
            setTransactions(res.data || []);
        } catch (e) {
            console.error("Lỗi khi tải danh sách giao dịch:", e);
        }
    };

    // Card Account Info
    const selectedAccountInfo = useMemo(() => {
        const targetId = filterAccount || formData.accountId || formData.fromAccountId;
        return accounts.find((acc) => acc.id === Number(targetId)) || null;
    }, [accounts, filterAccount, formData.accountId, formData.fromAccountId]);

    // Thống kê Today's Summary
    const todaySummary = useMemo(() => {
        const todayStr = new Date().toDateString();
        const todayTxs = transactions.filter(
            (t) => new Date(t.createdAt).toDateString() === todayStr
        );

        let depositCount = 0;
        let withdrawCount = 0;
        let transferCount = 0;
        let totalAmount = 0;

        todayTxs.forEach((t) => {
            const amt = Number(t.amount) || 0;
            totalAmount += amt;
            if (t.type === "DEPOSIT") depositCount++;
            else if (t.type === "WITHDRAW") withdrawCount++;
            else if (t.type === "TRANSFER" || t.type?.includes("TRANSFER")) transferCount++;
        });

        return { depositCount, withdrawCount, transferCount, totalAmount };
    }, [transactions]);

    // Lọc Chi nhánh theo Ngân hàng trong Filter Bar
    const filteredBranchesForFilter = useMemo(() => {
        return filterBank ? branches.filter((b) => b.bankId === Number(filterBank) || b.bankId === filterBank) : branches;
    }, [branches, filterBank]);

    // Lọc Tài khoản theo Ngân hàng & Chi nhánh trong Filter Bar
    const filteredAccountsForFilter = useMemo(() => {
        return accounts.filter((acc) => {
            const matchBank = !filterBank || acc.bankId === Number(filterBank) || acc.bankId === filterBank;
            const matchBranch = !filterBranch || acc.branchId === Number(filterBranch) || acc.branchId === filterBranch;
            return matchBank && matchBranch;
        });
    }, [accounts, filterBank, filterBranch]);

    // Danh sách giao dịch được lọc
    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const cleanKw = filterKeyword.trim().toLowerCase();
            const fromAcc = accounts.find((a) => a.id === t.fromAccountId || a.id === t.accountId);
            const toAcc = accounts.find((a) => a.id === t.toAccountId);

            const matchKw =
                !cleanKw ||
                fromAcc?.accountNumber?.toString().includes(cleanKw) ||
                fromAcc?.ownerName?.toLowerCase().includes(cleanKw) ||
                toAcc?.accountNumber?.toString().includes(cleanKw) ||
                toAcc?.ownerName?.toLowerCase().includes(cleanKw) ||
                t.description?.toLowerCase().includes(cleanKw);

            const matchType =
                !filterType ||
                t.type === filterType ||
                (filterType === "TRANSFER" && t.type?.includes("TRANSFER"));

            const matchBank = !filterBank || t.bankId === Number(filterBank);
            const matchBranch = !filterBranch || t.branchId === Number(filterBranch);
            const matchAcc =
                !filterAccount ||
                t.accountId === Number(filterAccount) ||
                t.fromAccountId === Number(filterAccount) ||
                t.toAccountId === Number(filterAccount);

            return matchKw && matchType && matchBank && matchBranch && matchAcc;
        });
    }, [transactions, accounts, filterKeyword, filterType, filterBank, filterBranch, filterAccount]);

    // Thực thi Giao dịch
    const handleExecute = async () => {
        if (!formData.amount || Number(formData.amount) <= 0) {
            alert("Vui lòng nhập số tiền hợp lệ");
            return;
        }

        try {
            let feedbackMessage = "Giao dịch đã được xử lý.";

            if (type === "DEPOSIT") {
                if (!formData.accountId) return alert("Vui lòng chọn tài khoản");
                const response = await deposit({
                    accountId: formData.accountId,
                    amount: Number(formData.amount),
                    description: formData.description
                });
                if (response.status === 202) {
                    feedbackMessage = response.data.message;
                }
            } else if (type === "WITHDRAW") {
                if (!formData.accountId) return alert("Vui lòng chọn tài khoản");
                const response = await withdraw({
                    accountId: formData.accountId,
                    amount: Number(formData.amount),
                    description: formData.description
                });
                if (response.status === 202) {
                    feedbackMessage = response.data.message;
                }
            } else if (type === "TRANSFER") {
                if (!formData.fromAccountId || !formData.toAccountId) {
                    return alert("Vui lòng chọn đủ tài khoản nguồn và đích");
                }
                if (formData.fromAccountId === formData.toAccountId) {
                    return alert("Tài khoản đích không được trùng tài khoản nguồn");
                }
                const response = await transfer({
                    fromAccountId: formData.fromAccountId,
                    toAccountId: formData.toAccountId,
                    amount: Number(formData.amount),
                    description: formData.description
                });
                if (response.status === 202) {
                    feedbackMessage = response.data.message;
                }
            }

            alert(feedbackMessage);
            await Promise.all([loadTransactions(), loadAccounts()]);
            resetModalForm();
        } catch (e) {
            alert(e.response?.data?.message || "Giao dịch thất bại");
        }
    };

    const resetModalForm = () => {
        setShowModal(false);
        setSelectedBank("");
        setSelectedBranch("");
        setFromBank("");
        setFromBranch("");
        setToBank("");
        setToBranch("");
        setFormData({
            accountId: "",
            fromAccountId: "",
            toAccountId: "",
            amount: "",
            description: ""
        });
    };

    const getAccountDisplay = (accId) => {
        const acc = accounts.find((a) => a.id === accId);
        return acc ? `${acc.accountNumber} - ${acc.ownerName}` : "-";
    };

    const pagedFilteredtransactions = filteredTransactions.slice((page - 1) * 10, page * 10);

    const renderTypeBadge = (tType) => {
        if (tType === "DEPOSIT") return <span style={{ color: "#2e7d32", fontWeight: "bold" }}>🟢 + Deposit</span>;
        if (tType === "WITHDRAW") return <span style={{ color: "#c62828", fontWeight: "bold" }}>🔴 - Withdraw</span>;
        return <span style={{ color: "#1565c0", fontWeight: "bold" }}>🔵 ⇄ Transfer</span>;
    };


    return (
        <div className="page-shell" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            {/* Header + Action Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexShrink: 0
                }}
            >
                <h2 style={{ margin: 0 }}>
                    Transaction Management
                </h2>

                {!readOnly && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        + Execute Transaction
                    </button>
                )}
            </div>

            {/* Quick Cards Top Area */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px", marginBottom: "15px" }}>
                <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "12px", fontSize: "14px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#555" }}>ACCOUNT INFORMATION</div>
                    {selectedAccountInfo ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                            <div><strong>Owner:</strong> {selectedAccountInfo.ownerName}</div>
                            <div><strong>Account:</strong> {selectedAccountInfo.accountNumber}</div>
                            <div><strong>Balance:</strong> <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{Number(selectedAccountInfo.balance || 0).toLocaleString()} VNĐ</span></div>
                        </div>
                    ) : (
                        <span style={{ color: "#888" }}>Chọn tài khoản từ bộ lọc để xem chi tiết.</span>
                    )}
                </div>

                <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "12px", fontSize: "14px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#555" }}>TODAY'S SUMMARY</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Deposit: <strong>{todaySummary.depositCount}</strong></span>
                        <span>Withdraw: <strong>{todaySummary.withdrawCount}</strong></span>
                        <span>Transfer: <strong>{todaySummary.transferCount}</strong></span>
                        <span style={{ borderLeft: "1px solid #ccc", paddingLeft: "10px" }}>Total: <strong style={{ color: "#007bff" }}>{todaySummary.totalAmount.toLocaleString()} VNĐ</strong></span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}>
                <input
                    type="text"
                    placeholder="Search..."
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    style={{ padding: "6px 10px", width: "180px", border: "1px solid #ccc", borderRadius: "4px" }}
                />

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}>
                    <option value="">Type: All</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                    <option value="TRANSFER">Transfer</option>
                </select>

                <select value={filterBank} onChange={(e) => { setFilterBank(e.target.value); setFilterBranch(""); setFilterAccount(""); }} style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}>
                    <option value="">Bank: All</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select value={filterBranch} onChange={(e) => { setFilterBranch(e.target.value); setFilterAccount(""); }} style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}>
                    <option value="">Branch: All</option>
                    {filteredBranchesForFilter.map((br) => <option key={br.id} value={br.id}>{br.name}</option>)}
                </select>

                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}>
                    <option value="">Account: All</option>
                    {filteredAccountsForFilter.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.accountNumber} - {acc.ownerName}</option>
                    ))}
                </select>
            </div>

            {/* Recent Transactions Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ddd", fontSize: "14px" }}>
                <thead>
                    <tr style={{ background: "#f2f2f2", textAlign: "left" }}>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>ID</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Type</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Amount</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>From Account</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>To Account</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Description</th>
                        <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#888" }}>Không tìm thấy giao dịch nào</td>
                        </tr>
                    ) : (
                        pagedFilteredtransactions.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "10px" }}>{(page - 1) * 10 + index + 1}</td>
                                <td style={{ padding: "10px" }}>{renderTypeBadge(item.type)}</td>
                                <td style={{ padding: "10px" }}><strong>{Number(item.amount).toLocaleString()} VNĐ</strong></td>
                                <td style={{ padding: "10px" }}>{getAccountDisplay(item.fromAccountId || item.accountId)}</td>
                                <td style={{ padding: "10px" }}>{getAccountDisplay(item.toAccountId)}</td>
                                <td style={{ padding: "10px" }}>{item.description || "-"}</td>
                                <td style={{ padding: "10px", color: "#666" }}>{new Date(item.createdAt || Date.now()).toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <Pagination page={page} pageSize={10} total={filteredTransactions.length} onPageChange={setPage} />

            {/* MODAL GIAO DỊCH */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: "8px",
                        width: "520px",
                        maxWidth: "90%",
                        padding: "20px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h3 style={{ margin: 0 }}>Thực hiện Giao dịch</h3>
                            <button onClick={resetModalForm} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
                        </div>

                        {/* Select Type */}
                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold", fontSize: "13px" }}>Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                            >
                                <option value="DEPOSIT">Deposit</option>
                                <option value="WITHDRAW">Withdraw</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>
                        </div>

                        {/* Deposit & Withdraw Form */}
                        {type !== "TRANSFER" ? (
                            <>
                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Bank</label>
                                    <select value={selectedBank} onChange={(e) => { setSelectedBank(e.target.value); setSelectedBranch(""); setFormData({ ...formData, accountId: "" }); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
                                        <option value="">▼ Select Bank</option>
                                        {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Branch</label>
                                    <select value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setFormData({ ...formData, accountId: "" }); }} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
                                        <option value="">▼ Select Branch</option>
                                        {branches.filter((br) => !selectedBank || br.bankId === Number(selectedBank) || br.bankId === selectedBank).map((br) => (
                                            <option key={br.id} value={br.id}>{br.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: "12px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Account</label>
                                    <select
                                        value={formData.accountId}
                                        onChange={(e) => setFormData({ ...formData, accountId: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                    >
                                        <option value="">▼ Select Account</option>
                                        {accounts
                                            .filter((acc) => (!selectedBank || acc.bankId === Number(selectedBank) || acc.bankId === selectedBank) && (!selectedBranch || acc.branchId === Number(selectedBranch) || acc.branchId === selectedBranch))
                                            .map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.accountNumber} - {acc.ownerName}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            /* Transfer Form Cascading */
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                                {/* FROM ACCOUNT */}
                                <div style={{ background: "#f9f9f9", padding: "8px", borderRadius: "4px" }}>
                                    <strong style={{ fontSize: "12px", display: "block", marginBottom: "6px" }}>FROM ACCOUNT</strong>
                                    <select value={fromBank} onChange={(e) => { setFromBank(e.target.value); setFromBranch(""); setFormData({ ...formData, fromAccountId: "" }); }} style={{ width: "100%", padding: "6px", marginBottom: "6px", fontSize: "12px" }}>
                                        <option value="">Bank</option>
                                        {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <select value={fromBranch} onChange={(e) => { setFromBranch(e.target.value); setFormData({ ...formData, fromAccountId: "" }); }} style={{ width: "100%", padding: "6px", marginBottom: "6px", fontSize: "12px" }}>
                                        <option value="">Branch</option>
                                        {branches.filter((br) => !fromBank || br.bankId === Number(fromBank) || br.bankId === fromBank).map((br) => (
                                            <option key={br.id} value={br.id}>{br.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={formData.fromAccountId}
                                        onChange={(e) => setFormData({ ...formData, fromAccountId: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                                    >
                                        <option value="">Account</option>
                                        {accounts
                                            .filter((acc) => (!fromBank || acc.bankId === Number(fromBank) || acc.bankId === fromBank) && (!fromBranch || acc.branchId === Number(fromBranch) || acc.branchId === fromBranch))
                                            .map((acc) => (
                                                <option key={acc.id} value={acc.id}>{acc.accountNumber} - {acc.ownerName}</option>
                                            ))}
                                    </select>
                                </div>

                                {/* TO ACCOUNT */}
                                <div style={{ background: "#f9f9f9", padding: "8px", borderRadius: "4px" }}>
                                    <strong style={{ fontSize: "12px", display: "block", marginBottom: "6px" }}>TO ACCOUNT</strong>
                                    <select value={toBank} onChange={(e) => { setToBank(e.target.value); setToBranch(""); setFormData({ ...formData, toAccountId: "" }); }} style={{ width: "100%", padding: "6px", marginBottom: "6px", fontSize: "12px" }}>
                                        <option value="">Bank</option>
                                        {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <select value={toBranch} onChange={(e) => { setToBranch(e.target.value); setFormData({ ...formData, toAccountId: "" }); }} style={{ width: "100%", padding: "6px", marginBottom: "6px", fontSize: "12px" }}>
                                        <option value="">Branch</option>
                                        {branches.filter((br) => !toBank || br.bankId === Number(toBank) || br.bankId === toBank).map((br) => (
                                            <option key={br.id} value={br.id}>{br.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={formData.toAccountId}
                                        onChange={(e) => setFormData({ ...formData, toAccountId: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                                    >
                                        <option value="">Account</option>
                                        {accounts
                                            .filter((acc) => (!toBank || acc.bankId === Number(toBank) || acc.bankId === toBank) && (!toBranch || acc.branchId === Number(toBranch) || acc.branchId === toBranch))
                                            .map((acc) => (
                                                <option key={acc.id} value={acc.id}>{acc.accountNumber} - {acc.ownerName}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Amount</label>
                            <input
                                type="number"
                                placeholder="500000"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Description</label>
                            <input
                                type="text"
                                placeholder="Nội dung giao dịch"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                                onClick={resetModalForm}
                                style={{ padding: "8px 15px", background: "#eee", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleExecute}
                                style={{ padding: "8px 15px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                {type === "TRANSFER" ? "Transfer" : "Execute"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Transaction;
