import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

const client = axios.create({
  baseURL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('autohelp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('autohelp_token');
      localStorage.removeItem('autohelp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
