import api from "./api";

export const getTransactions = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.bankId) params.append("bankId", filters.bankId);
    if (filters.branchId) params.append("branchId", filters.branchId);
    if (filters.accountId) params.append("accountId", filters.accountId);

    const query = params.toString();
    return api.get(`/transactions${query ? `?${query}` : ""}`);
};

export const deposit = (data) =>
    api.post("/transactions/deposit", data);

export const withdraw = (data) =>
    api.post("/transactions/withdraw", data);

export const transfer = (data) =>
    api.post("/transactions/transfer", data);