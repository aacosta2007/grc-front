import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tieneAccesoWeb } from '../utils/permissions';
import { Button, Mono } from '../components/ui';

export default function NoAutorizadoPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const sinAccesoWeb = usuario && !tieneAccesoWeb(usuario.rol);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div className="grc-card" style={{ maxWidth: 440, width: '100%', padding: '28px 24px' }}>
        <Mono color="var(--red)">ACCESO RESTRINGIDO</Mono>
        <div className="grc-section-title" style={{ fontSize: 26, marginTop: 8 }}>No autorizado</div>
        <p style={{ color: 'var(--sub)', fontSize: 13.5, lineHeight: 1.5 }}>
          {sinAccesoWeb
            ? 'Tu rol no tiene acceso web en esta versión del sistema.'
            : 'Tu rol no tiene permiso para abrir este módulo.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {usuario && !sinAccesoWeb && <Button onClick={() => navigate('/alertas')}>IR A ALERTAS</Button>}
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            {usuario ? 'CERRAR SESIÓN' : 'INICIAR SESIÓN'}
          </Button>
        </div>
      </div>
    </div>
  );
}
