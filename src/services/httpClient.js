import axios from 'axios';
import { getToken, setSession } from './session';

// Con REACT_APP_USE_MOCK=false las peticiones van al backend real (REACT_APP_API_URL).
export const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';

const http = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      setSession(null);
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
    }
    const msg = (error.response && error.response.data && error.response.data.message) || error.message;
    return Promise.reject(Object.assign(new Error(msg), { status: error.response && error.response.status }));
  }
);

export default http;
