// Sesión del usuario autenticado (sessionStorage: se pierde al cerrar la pestaña)
const KEY = 'grc_session';

export function getSession() {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSession(session) {
  try {
    if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(KEY);
  } catch (e) {
    /* almacenamiento no disponible */
  }
}

export const getSessionUser = () => (getSession() || {}).usuario || null;
export const getToken = () => (getSession() || {}).token || null;
