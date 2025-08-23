import axios from 'axios';

// Centralized Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: false,
});

// Attach Authorization header from localStorage token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Basic response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: handle 401 globally
    if (error?.response?.status === 401) {
      // Could emit an event or redirect to login page as needed
      // For now, just propagate the error
    }
    return Promise.reject(error);
  }
);

export default api;
