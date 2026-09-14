import Pagination from "../components/Pagination";
import { useEffect, useMemo, useState } from "react";
import { approveRequest, getApprovals, rejectRequest } from "../services/approvalApi";

const statusLabels = { PENDING:"Pending", APPROVED:"Approved", REJECTED:"Rejected" };

function Approval() {
    const [page, setPage] = useState(1);

    const [approvals,setApprovals]=useState([]);
    const [filter,setFilter]=useState("PENDING");
    const [rejecting,setRejecting]=useState(null);
    const [reason,setReason]=useState("");
    const [loading,setLoading]=useState(false);

    useEffect(()=>{ loadApprovals(); },[]);
    const loadApprovals=async()=>{ try { const response=await getApprovals(); setApprovals(response.data||[]); } catch(e){ alert(e.response?.data?.message||"Không tải được yêu cầu."); } };
    const filtered=useMemo(()=>filter?approvals.filter(x=>x.status===filter):approvals,[approvals,filter]);

    const handleApprove=async(id)=>{
        if(!window.confirm("Bạn có chắc muốn approve yêu cầu này?")) return;
        try { setLoading(true); await approveRequest(id); await loadApprovals(); }
        catch(e){ alert(e.response?.data?.message||"Approve thất bại. Dữ liệu chưa được thay đổi."); }
        finally{ setLoading(false); }
    };
    const openReject=(item)=>{ setRejecting(item); setReason(""); };
    const handleReject=async()=>{
        if(!reason.trim()){ alert("Vui lòng nhập lý do từ chối."); return; }
        try { setLoading(true); await rejectRequest(rejecting.id,reason.trim()); setRejecting(null); setReason(""); await loadApprovals(); }
        catch(e){ alert(e.response?.data?.message||"Reject thất bại."); }
        finally{ setLoading(false); }
    };

    const pagedFiltered = filtered.slice((page - 1) * 10, page * 10);

    return <>
        <h2>Approval Requests</h2>
        <div className="toolbar">
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="">All</option>
            </select>
        </div>
        <table>
            <thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Requested By</th><th>Status</th><th>Created At</th><th>Action</th></tr></thead>
            <tbody>
                {filtered.length===0 ? <tr><td colSpan="7" className="empty-cell">No approval requests found.</td></tr> :
                pagedFiltered.map((item, index)=><tr key={item.id}>
                    <td>{(page - 1) * 10 + index + 1}</td><td>{item.type}</td><td>{item.description||item.note}</td>
                    <td>{item.requestedBy} <span className="muted-text">({item.requestedRole})</span></td>
                    <td><span className={`status-pill ${item.status.toLowerCase()}`}>{statusLabels[item.status]||item.status}</span></td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{item.status==="PENDING" ?
                        <><button disabled={loading} onClick={()=>handleApprove(item.id)}>Approve</button><button disabled={loading} onClick={()=>openReject(item)}>Reject</button></> :
                        <span>{item.note||item.reason||"-"}</span>}
                    </td>
                </tr>)}
            </tbody>
        </table>
            <Pagination page={page} pageSize={10} total={filtered.length} onPageChange={setPage} />

        {rejecting && <div className="modal" onClick={()=>setRejecting(null)}>
            <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <h3>Từ chối yêu cầu #{rejecting.id}</h3>
                <p>{rejecting.description}</p>
                <textarea rows="5" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Nhập lý do từ chối..." style={{width:"100%"}}/>
                <div className="modal-footer">
                    <button onClick={()=>setRejecting(null)}>Hủy</button>
                    <button disabled={loading} onClick={handleReject}>Xác nhận từ chối</button>
                </div>
            </div>
        </div>}
    </>;
}
export default Approval;

