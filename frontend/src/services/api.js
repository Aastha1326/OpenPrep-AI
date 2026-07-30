import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let csrfToken = null;

// Function to fetch CSRF token if missing
const fetchCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  try {
    const response = await axios.get(`${API.defaults.baseURL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token', error);
    return null;
  }
};

// Attach access token and CSRF token to every request
API.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach CSRF token for non-GET requests
  if (config.method && config.method.toLowerCase() !== 'get') {
    const token = await fetchCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// ── Token refresh queue (prevents multiple simultaneous refresh calls) ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: on 401, attempt silent token refresh before failing
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (error.response?.status !== 401 || originalRequest?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        `${API.defaults.baseURL}/auth/refresh-token`,
        { refreshToken }
      );

      const { token: newToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      return API(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
