import axios from 'axios';
import { getToken, setSession } from './session';

// Con REACT_APP_USE_MOCK=false las peticiones van al backend real (REACT_APP_API_URL).
export const USE_MOCK = import.meta.env.REACT_APP_USE_MOCK !== 'false';

const http = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:8080/api',
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
    return Promise.reject(crearErrorApi(error));
  }
);

// Error del backend: { error, campos? } → Error(msg) con status y, en los 400 de validación,
// campos ({ "<campo>": "<mensaje>" }, con rutas como "cliente.documento").
export function crearErrorApi(error) {
  const data = error.response && error.response.data;
  const msg = (data && (data.message || data.error)) || error.message;
  const campos = data && data.campos && typeof data.campos === 'object' ? data.campos : undefined;
  return Object.assign(new Error(msg), { status: error.response && error.response.status, campos });
}

export default http;
