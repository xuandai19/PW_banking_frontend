import api from "./api";

export const customerLogin = (data) => api.post("/customer/login", data);

export const customerLogout = () => api.post("/customer/logout");

export const customerMe = () => api.get("/customer/me");

export const customerBalance = () => api.get("/customer/balance");

export const customerBanks = () => api.get("/customer/banks");

export const customerLookupRecipient = (accountNumber, bankId) =>
    api.get("/customer/lookup-recipient", {
        params: { accountNumber, bankId }
    });

export const customerDeposit = (amount) =>
    api.post("/customer/deposit", { amount });

export const customerWithdraw = (amount) =>
    api.post("/customer/withdraw", { amount });

export const customerTransfer = ({ toAccountNumber, amount, description, otp, bankId }) =>
    api.post("/customer/transfer", { toAccountNumber, amount, description, otp, bankId });

export const customerTransactions = () => api.get("/customer/transactions");

export const customerChangePassword = (currentPassword, newPassword) =>
    api.post("/customer/change-password", { currentPassword, newPassword });

export const customerSetOtp = (otp, currentPassword) =>
    api.post("/customer/set-otp", { otp, currentPassword });

export const customerUpdateEmail = (email, currentPassword) =>
    api.post("/customer/update-email", { email, currentPassword });

export const customerForgotPassword = (data) =>
    api.post("/customer/forgot-password", data);

export const customerResetPassword = (token, newPassword) =>
    api.post("/customer/reset-password", { token, newPassword });
