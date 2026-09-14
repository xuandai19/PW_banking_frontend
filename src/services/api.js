import axios from "axios";
import { clearAuth } from "../utils/auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    timeout: 15000,
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !String(error.config?.url || "").includes("/auth/login")) {
            clearAuth();
            if (window.location.pathname !== "/login") window.location.assign("/login");
        }
        return Promise.reject(error);
    }
);

export default api;
