import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSummary } from "../services/dashboardApi";
import { getTransactions } from "../services/transactionApi";
import { canApprove, canManageBank, canManageBranch } from "../utils/auth";

function BarChart({ title, items, color = "#1976d2" }) {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <div className="chart-card">
            <div className="chart-title">{title}</div>
            <div className="bar-chart">
                {items.map((item) => (
                    <div className="bar-item" key={item.label}>
                        <div className="bar-track">
                            <div
                                className="bar-fill"
                                style={{
                                    height: `${Math.max(8, (item.value / max) * 100)}%`,
                                    background: item.color || color
                                }}
                                title={`${item.label}: ${item.value.toLocaleString()}`}
                            >
                                <span className="bar-value">{item.value > 0 ? item.value.toLocaleString() : ""}</span>
                            </div>
                        </div>
                        <div className="bar-label">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        totalBanks: 0,
        totalBranches: 0,
        totalAccounts: 0,
        totalTransactions: 0,
        totalBalance: 0
    });
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        loadSummary();
        loadTransactions();
    }, []);

    const loadSummary = async () => {
        try {
            const response = await getSummary();
            const data = response.data || {};
            setSummary({
                totalBanks: Number(data.totalBanks ?? data.banks ?? 0),
                totalBranches: Number(data.totalBranches ?? data.branches ?? 0),
                totalAccounts: Number(data.totalAccounts ?? data.accounts ?? 0),
                totalTransactions: Number(data.totalTransactions ?? data.transactions ?? 0),
                totalBalance: Number(data.totalBalance ?? 0)
            });
        } catch (error) {
            console.error("Failed to load dashboard summary:", error);
        }
    };

    const loadTransactions = async () => {
        try {
            const res = await getTransactions();
            setTransactions(res.data || []);
        } catch (e) {
            console.error("Failed to load transactions for charts:", e);
        }
    };

    const typeStats = useMemo(() => {
        let deposit = 0, withdraw = 0, transfer = 0;
        let depositAmt = 0, withdrawAmt = 0, transferAmt = 0;
        transactions.forEach((t) => {
            const amt = Number(t.amount) || 0;
            if (t.type === "DEPOSIT") { deposit++; depositAmt += amt; }
            else if (t.type === "WITHDRAW") { withdraw++; withdrawAmt += amt; }
            else if (t.type === "TRANSFER" || String(t.type || "").includes("TRANSFER")) {
                transfer++; transferAmt += amt;
            }
        });
        return { deposit, withdraw, transfer, depositAmt, withdrawAmt, transferAmt };
    }, [transactions]);

    const last7Days = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days.map((d) => {
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            const count = transactions.filter((t) => {
                const td = new Date(t.createdAt);
                return td.getFullYear() === d.getFullYear()
                    && td.getMonth() === d.getMonth()
                    && td.getDate() === d.getDate();
            }).length;
            return { label, value: count };
        });
    }, [transactions]);

    return (
        <div className="page-shell">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p className="page-subtitle">Tổng quan hệ thống ngân hàng</p>
            </div>

            <div className="dashboard">
                {canManageBank() && (
                    <div className="dashboard-card card-bank" onClick={() => navigate("/banks")}>
                        <div className="card-icon">🏦</div>
                        <h3>Banks</h3>
                        <p>{summary.totalBanks}</p>
                        <button type="button">Manage</button>
                    </div>
                )}

                {canManageBranch() && (
                    <div className="dashboard-card card-branch" onClick={() => navigate("/branches")}>
                        <div className="card-icon">🏢</div>
                        <h3>Branches</h3>
                        <p>{summary.totalBranches}</p>
                        <button type="button">Manage</button>
                    </div>
                )}

                <div className="dashboard-card card-account" onClick={() => navigate("/accounts")}>
                    <div className="card-icon">👤</div>
                    <h3>Accounts</h3>
                    <p>{summary.totalAccounts}</p>
                    <button type="button">Manage</button>
                </div>

                <div className="dashboard-card card-tx" onClick={() => navigate("/transactions")}>
                    <div className="card-icon">💸</div>
                    <h3>Transactions</h3>
                    <p>{summary.totalTransactions}</p>
                    <button type="button">Manage</button>
                </div>

                {canApprove() && (
                    <div className="dashboard-card card-approval" onClick={() => navigate("/approvals")}>
                        <div className="card-icon">✅</div>
                        <h3>Approvals</h3>
                        <p>Review</p>
                        <button type="button">Open</button>
                    </div>
                )}

                <div className="dashboard-card total-balance-card">
                    <div className="card-icon">💰</div>
                    <h3>Total Balance</h3>
                    <p className="balance-text">{summary.totalBalance.toLocaleString()} VND</p>
                </div>
            </div>

            <div className="charts-grid">
                <BarChart
                    title="Giao dịch theo loại (số lượng)"
                    items={[
                        { label: "Deposit", value: typeStats.deposit, color: "linear-gradient(180deg,#43a047,#2e7d32)" },
                        { label: "Withdraw", value: typeStats.withdraw, color: "linear-gradient(180deg,#ef5350,#c62828)" },
                        { label: "Transfer", value: typeStats.transfer, color: "linear-gradient(180deg,#42a5f5,#1565c0)" }
                    ]}
                />
                <BarChart
                    title="Tổng tiền theo loại (VNĐ)"
                    items={[
                        { label: "Deposit", value: typeStats.depositAmt, color: "linear-gradient(180deg,#66bb6a,#388e3c)" },
                        { label: "Withdraw", value: typeStats.withdrawAmt, color: "linear-gradient(180deg,#ff7043,#d84315)" },
                        { label: "Transfer", value: typeStats.transferAmt, color: "linear-gradient(180deg,#5c6bc0,#283593)" }
                    ]}
                />
                <BarChart
                    title="Giao dịch 7 ngày gần nhất"
                    items={last7Days}
                    color="linear-gradient(180deg,#29b6f6,#0277bd)"
                />
            </div>
        </div>
    );
}

export default Dashboard;
