import { useEffect, useMemo, useState } from "react";
import { approveRequest, getApprovals, rejectRequest } from "../services/approvalApi";

const statusLabels = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected"
};

function Approval() {
    const [approvals, setApprovals] = useState([]);
    const [filter, setFilter] = useState("PENDING");
    const [reason, setReason] = useState("");

    useEffect(() => {
        loadApprovals();
    }, []);

    const loadApprovals = async () => {
        const response = await getApprovals();
        setApprovals(response.data || []);
    };

    const filteredApprovals = useMemo(() => {
        if (!filter) {
            return approvals;
        }

        return approvals.filter(item => item.status === filter);
    }, [approvals, filter]);

    const handleApprove = async (id) => {
        try {
            await approveRequest(id);
            await loadApprovals();
        } catch (error) {
            alert(error.response?.data?.message || "Approve failed");
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectRequest(id, reason || "Từ chối");
            setReason("");
            await loadApprovals();
        } catch (error) {
            alert(error.response?.data?.message || "Reject failed");
        }
    };

    return (
        <>
            <h2>Approval Requests</h2>

            <div className="toolbar">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="">All</option>
                </select>

                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reject reason"
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Requested By</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredApprovals.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="empty-cell">
                                No approval requests found.
                            </td>
                        </tr>
                    ) : (
                        filteredApprovals.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.type}</td>
                                <td>{item.description || item.note}</td>
                                <td>
                                    {item.requestedBy}
                                    <span className="muted-text"> ({item.requestedRole})</span>
                                </td>
                                <td>
                                    <span className={`status-pill ${item.status.toLowerCase()}`}>
                                        {statusLabels[item.status] || item.status}
                                    </span>
                                </td>
                                <td>{new Date(item.createdAt).toLocaleString()}</td>
                                <td>
                                    {item.status === "PENDING" ? (
                                        <>
                                            <button onClick={() => handleApprove(item.id)}>Approve</button>
                                            <button onClick={() => handleReject(item.id)}>Reject</button>
                                        </>
                                    ) : (
                                        item.note || "-"
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </>
    );
}

export default Approval;
