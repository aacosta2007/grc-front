import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { setSession } from './session';

// Devuelve { token, usuario }. Mensaje de error genérico ante credenciales incorrectas.
export async function login(correo, password) {
  const res = USE_MOCK ? await mock.login(correo, password) : await http.post('/auth/login', { correo, password });
  setSession(res);
  return res;
}

export function logout() {
  setSession(null);
}
