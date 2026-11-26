import axios from 'axios';

export const TOKEN_KEY = 'aptivelle_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.data = err.response?.data;
    if (status === 401) {
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/signup';
      if (!isAuthRoute) {
        setToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(wrapped);
  }
);

export default api;
