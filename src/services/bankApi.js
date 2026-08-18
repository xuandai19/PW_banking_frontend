import api from "./api";

export const getBanks = () => api.get("/banks");

export const createBank = (data) => api.post("/banks", data);

export const getBankBranches = (id) =>
    api.get(`/banks/${id}/branches`);

export const updateBank = (id, data) =>
    api.put(`/banks/${id}`, data);

export const deleteBank = (id) =>
    api.delete(`/banks/${id}`);