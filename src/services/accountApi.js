import api from "./api";

export const getAccounts = (branchId) => {

    if (branchId) {
        return api.get(`/accounts?branchId=${branchId}`);
    }

    return api.get("/accounts");

};

export const createAccount = (data) =>
    api.post("/accounts", data);

export const updateAccount = (id, data) =>
    api.put(`/accounts/${id}`, data);

export const deleteAccount = (id) =>
    api.delete(`/accounts/${id}`);