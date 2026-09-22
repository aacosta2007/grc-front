import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { getSession } from '../services/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (getSession() || {}).usuario || null);

  const login = useCallback(async (correo, password) => {
    const { usuario: u } = await authService.login(correo, password);
    setUsuario(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
  }, []);

  const value = useMemo(() => ({ usuario, rol: usuario ? usuario.rol : null, login, logout }), [usuario, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// { usuario: {id,nombre,correo,rol,activo} | null, rol, login(correo, password), logout() }
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
