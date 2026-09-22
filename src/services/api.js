import axios from "axios";
import { clearAuth } from "../utils/auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true // gửi/nhận cookie (customer_token)
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = String(error.config?.url || "");
        const isLogin =
            url.includes("/auth/login") || url.includes("/customer/login");
        if (error.response?.status === 401 && !isLogin) {
            clearAuth();
            localStorage.removeItem("customerAccount");
            const path = window.location.pathname || "";
            if (path.startsWith("/customer")) {
                if (path !== "/customer/login") window.location.assign("/customer/login");
            } else if (path !== "/login") {
                window.location.assign("/login");
            }
        }
        return Promise.reject(error);
    }
);

export default api;
