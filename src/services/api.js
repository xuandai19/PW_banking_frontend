import axios from "axios";
import { clearAuth } from "../utils/auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    timeout: 15000,
<<<<<<< HEAD
    headers: { "Content-Type": "application/json" }
=======
    headers: { "Content-Type": "application/json" },
    withCredentials: true // gửi/nhận cookie (customer_token)
>>>>>>> feature/v2_users
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
<<<<<<< HEAD
        if (error.response?.status === 401 && !String(error.config?.url || "").includes("/auth/login")) {
            clearAuth();
            if (window.location.pathname !== "/login") window.location.assign("/login");
=======
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
>>>>>>> feature/v2_users
        }
        return Promise.reject(error);
    }
);

export default api;
