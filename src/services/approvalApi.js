import api from "./api";

export const getApprovals = () => api.get("/approvals");

export const approveRequest = (id) => api.post(`/approvals/${id}/approve`);

export const rejectRequest = (id, reason) =>
    api.post(`/approvals/${id}/reject`, { reason });
