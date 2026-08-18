import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSummary } from "../services/dashboardApi";
import { canApprove, canManageBank, canManageBranch } from "../utils/auth";

function Dashboard() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        totalBanks: 0,
        totalBranches: 0,
        totalAccounts: 0,
        totalTransactions: 0,
        totalBalance: 0
    });

    useEffect(() => {
        loadSummary();
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

    return (
        <>
            <h2>Dashboard</h2>

            <div className="dashboard">
                {canManageBank() && (
                    <div className="dashboard-card" onClick={() => navigate("/banks")}>
                        <h2>Bank</h2>
                        <h3>Banks</h3>
                        <p>{summary.totalBanks}</p>
                        <button>Manage</button>
                    </div>
                )}

                {canManageBranch() && (
                    <div className="dashboard-card" onClick={() => navigate("/branches")}>
                        <h2>Branch</h2>
                        <h3>Branches</h3>
                        <p>{summary.totalBranches}</p>
                        <button>Manage</button>
                    </div>
                )}

                <div className="dashboard-card" onClick={() => navigate("/accounts")}>
                    <h2>Account</h2>
                    <h3>Accounts</h3>
                    <p>{summary.totalAccounts}</p>
                    <button>Manage</button>
                </div>

                <div className="dashboard-card" onClick={() => navigate("/transactions")}>
                    <h2>Transaction</h2>
                    <h3>Transactions</h3>
                    <p>{summary.totalTransactions}</p>
                    <button>Manage</button>
                </div>

                {canApprove() && (
                    <div className="dashboard-card" onClick={() => navigate("/approvals")}>
                        <h2>Approval</h2>
                        <h3>Requests</h3>
                        <p>Review</p>
                        <button>Open</button>
                    </div>
                )}

                <div className="dashboard-card total-balance-card">
                    <h2>Balance</h2>
                    <h3>Total Balance</h3>
                    <p>{summary.totalBalance.toLocaleString()} VND</p>
                </div>
            </div>
        </>
    );
}

export default Dashboard;
