import axios from "axios";

// 🌟 DYNAMIC PRODUCTION DETECTION
// If the browser address says "localhost", target your local backend.
// Otherwise, target your live Render server automatically!
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE_URL = isLocalhost
  ? "http://localhost:3000/api/v1"
  : "https://YOUR_RENDER_BACKEND_://onrender.com"; // ⚠️ PASTE YOUR ACTUAL LIVE RENDER SERVER URL HERE

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("zap_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("zap_token");
      localStorage.removeItem("zap_user");
    }
    return Promise.reject(error);
  },
);

export default api;
