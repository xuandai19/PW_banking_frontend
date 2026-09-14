import api from "./api";

export const getBranches = (bankId) => {

    if (bankId) {
        return api.get(`/branches?bankId=${bankId}`);
    }

    return api.get("/branches");

};

export const createBranch = (data) =>
    api.post("/branches", data);

export const updateBranch = (id, data) =>
    api.put(`/branches/${id}`, data);

export const deleteBranch = (id) =>
    api.delete(`/branches/${id}`);

export const getBranchAccounts = (id)=>
    api.get(`/branches/${id}/accounts`);