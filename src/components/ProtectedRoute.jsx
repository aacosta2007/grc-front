import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { puedeAcceder, tieneAccesoWeb } from '../utils/permissions';

// Sin sesión → /login. Con sesión pero sin permiso para el módulo → /no-autorizado.
export default function ProtectedRoute({ modulo, children }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!tieneAccesoWeb(usuario.rol)) return <Navigate to="/no-autorizado" replace />;
  if (modulo && !puedeAcceder(usuario.rol, modulo)) return <Navigate to="/no-autorizado" replace />;

  return children || <Outlet />;
}
