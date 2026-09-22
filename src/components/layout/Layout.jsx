import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { modulosPara, puedeEditarTecnicos } from '../../utils/permissions';
import { TIPOS_AVISO } from '../../utils/constants';
import { fmtFecha, fmtHora } from '../../utils/format';
import '../../styles/Layout.css';

// Título y subtítulo del encabezado según la ruta actual
function tituloPara(pathname, rol) {
  const hoy = fmtFecha(new Date());
  if (pathname.startsWith('/alertas/avisos/')) {
    const tipo = pathname.split('/')[3];
    return [(TIPOS_AVISO[tipo] || {}).titulo || 'Avisos', 'LISTA DE AVISOS · ALERTAS DE ENTREGA'];
  }
  if (pathname.startsWith('/alertas')) return ['Alertas', `PANEL OPERATIVO · ${hoy}`];
  if (pathname.startsWith('/backlog')) return ['Backlog', 'TABLERO DE ETAPAS'];
  if (pathname.startsWith('/ficha')) return ['Buscar placa', 'FICHA DE LA ORDEN DE TRABAJO'];
  if (pathname.startsWith('/nueva-orden')) return ['Nueva orden', 'REGISTRO DE CLIENTE, VEHÍCULO Y ORDEN'];
  if (pathname.startsWith('/valoracion')) return ['Valoración', 'HOJA DE PIEZAS · CESVI COLOMBIA'];
  if (pathname.startsWith('/tecnicos'))
    return ['Técnicos', puedeEditarTecnicos(rol) ? 'CATÁLOGO DE TÉCNICOS DEL TALLER' : 'CATÁLOGO DE TÉCNICOS · SOLO LECTURA'];
  if (pathname.startsWith('/usuarios')) return ['Usuarios', 'CUENTAS Y ROLES DEL SISTEMA'];
  return ['Servimacromotor', 'GRC'];
}

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const ahora = useReloj();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [titulo, subtitulo] = tituloPara(location.pathname, usuario.rol);
  const modulos = modulosPara(usuario.rol);

  useEffect(() => setMenuAbierto(false), [location.pathname]);

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="grc-shell">
      <aside className={`grc-sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <div className="grc-sidebar-brand">
          <div className="grc-brand-row">
            <div className="grc-brand-mark" />
            <div className="grc-brand-name">SERVIMACROMOTOR</div>
          </div>
          <div className="grc-brand-sub">GRC · COLISIÓN</div>
        </div>

        <nav className="grc-nav" aria-label="Módulos">
          {modulos.map((m) => (
            <NavLink key={m.id} to={m.path} className={({ isActive }) => `grc-nav-item ${isActive ? 'is-active' : ''}`}>
              <span>{m.label}</span>
              {m.id === 'tecnicos' && !puedeEditarTecnicos(usuario.rol) && <span className="grc-nav-note">LECTURA</span>}
            </NavLink>
          ))}
          <div className="grc-nav-item is-disabled" aria-disabled="true">
            <span>Clientes</span>
            <span className="grc-nav-note">PRÓXIMO</span>
          </div>
        </nav>

        <div className="grc-sidebar-user">
          <div className="grc-brand-sub">SESIÓN ACTIVA</div>
          <div className="grc-user-name">{usuario.nombre}</div>
          <div className="grc-user-mail">{usuario.correo}</div>
          <span className="grc-role-badge">{usuario.rol}</span>
        </div>
      </aside>
      {menuAbierto && <div className="grc-sidebar-scrim" onClick={() => setMenuAbierto(false)} />}

      <main className="grc-main">
        <header className="grc-header">
          <div className="grc-header-left">
            <button className="grc-menu-btn" aria-label="Abrir menú" onClick={() => setMenuAbierto((v) => !v)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <div className="grc-header-sub">{subtitulo}</div>
              <h1 className="grc-header-title">{titulo}</h1>
            </div>
          </div>
          <div className="grc-header-actions">
            <div className="grc-sync grc-hide-mobile">
              <span className="grc-dot" style={{ background: 'var(--green)', width: 7, height: 7 }} />
              <span>SINCRONIZADO · {fmtHora(ahora)}</span>
            </div>
            <button className="grc-btn grc-btn-primary" onClick={() => navigate('/nueva-orden')}>
              NUEVA ORDEN
            </button>
            <div className="grc-header-divider grc-hide-mobile" />
            <button className="grc-btn grc-btn-outline" onClick={salir}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span className="grc-hide-mobile">CERRAR SESIÓN</span>
            </button>
          </div>
        </header>

        <div className="grc-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
