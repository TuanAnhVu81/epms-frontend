import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Create axios instance with base URL from environment variable
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token to every outgoing request
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally → logout and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized → logout and redirect to login
    // BUT: don't redirect if it's the login request itself failing!
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
