import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { setSession } from './session';

// El backend real devuelve { token, usuario: { idUsuario, nombre, email, rol, activo } }.
// Lo traducimos a la forma que usa el resto del front: { id, nombre, correo, rol, activo }.
const desdeBackend = ({ token, usuario: u }) => ({
  token,
  usuario: { id: u.idUsuario, nombre: u.nombre, correo: u.email, rol: u.rol, activo: u.activo },
});

// Devuelve { token, usuario }. Mensaje de error genérico ante credenciales incorrectas.
export async function login(correo, password) {
  const res = USE_MOCK
    ? await mock.login(correo, password)
    : desdeBackend(await http.post('/auth/login', { email: correo, password }));
  setSession(res);
  return res;
}

export function logout() {
  setSession(null);
}
