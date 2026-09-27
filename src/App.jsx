import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import LoginPage from './pages/LoginPage';
import AlertasPage from './pages/AlertasPage';
import AvisosPage from './pages/AvisosPage';
import BacklogPage from './pages/BacklogPage';
import FichaBuscarPage from './pages/FichaBuscarPage';
import FichaOrdenPage from './pages/FichaOrdenPage';
import NuevaOrdenPage from './pages/NuevaOrdenPage';
import ValoracionPage from './pages/ValoracionPage';
import ValoracionOrdenPage from './pages/ValoracionOrdenPage';
import TecnicosPage from './pages/TecnicosPage';
import UsuariosPage from './pages/UsuariosPage';
import NoAutorizadoPage from './pages/NoAutorizadoPage';

function RaizRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? '/alertas' : '/login'} replace />;
}

// Envuelve una página con el control de acceso de su módulo
const conAcceso = (modulo, element) => <ProtectedRoute modulo={modulo}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/alertas" element={conAcceso('alertas', <AlertasPage />)} />
              <Route path="/alertas/avisos/:tipo" element={conAcceso('alertas', <AvisosPage />)} />
              <Route path="/backlog" element={conAcceso('backlog', <BacklogPage />)} />
              <Route path="/ficha" element={conAcceso('ficha', <FichaBuscarPage />)} />
              <Route path="/ficha/:idOrden" element={conAcceso('ficha', <FichaOrdenPage />)} />
              <Route path="/nueva-orden" element={conAcceso('nueva', <NuevaOrdenPage />)} />
              <Route path="/valoracion" element={conAcceso('valoracion', <ValoracionPage />)} />
              <Route path="/valoracion/:idOrden" element={conAcceso('valoracion', <ValoracionOrdenPage />)} />
              <Route path="/tecnicos" element={conAcceso('tecnicos', <TecnicosPage />)} />
              <Route path="/usuarios" element={conAcceso('usuarios', <UsuariosPage />)} />
            </Route>
          </Route>

          <Route path="*" element={<RaizRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
