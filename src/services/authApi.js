import api from "./api";

export const login = (data) => api.post("/auth/login", data);

export const logout = () => api.post("/auth/logout");

export const getMe = () => api.get("/auth/me");

export const getUsers = () => api.get("/auth/users");

export const createUser = (data) => api.post("/auth/users", data);

export const verifyEmail = (token) =>
    api.post("/auth/verify-email", { token });


export const forgotPassword = (data) =>
    api.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
    api.post("/auth/reset-password", data);

export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
