import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Field } from '../components/ui';
import '../styles/Login.css';

// HU-01 · Pantalla completa de inicio de sesión (sin Layout)
export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (usuario) navigate('/alertas', { replace: true });
  }, [usuario, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError('');
    setCargando(true);
    try {
      await login(correo, password);
      navigate('/alertas', { replace: true });
    } catch (err) {
      setError((err && err.message) || 'No se pudo iniciar sesión. Intenta de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-brand">
          <div className="login-mark" aria-hidden="true" />
          <div className="login-brand-name">SERVIMACROMOTOR</div>
        </div>
        <div className="login-brand-sub">GRC · GESTIÓN DE REPARACIÓN DE COLISIÓN</div>

        <div className="login-card">
          <div className="login-title">INICIAR SESIÓN</div>
          <div className="login-desc">Acceso para ADMIN, ASESOR y GERENTE. Los técnicos aún no tienen acceso web.</div>

          <form onSubmit={onSubmit} noValidate>
            <Field label="CORREO" htmlFor="login-correo" style={{ marginTop: 20 }}>
              <input
                id="login-correo"
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="avillalba@servimacromotor.co"
                disabled={cargando}
                required
              />
            </Field>
            <Field label="CONTRASEÑA" htmlFor="login-pass" style={{ marginTop: 14 }}>
              <input
                id="login-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={cargando}
                required
              />
            </Field>

            {error && <Alert type="error" style={{ marginTop: 14 }}>{error}</Alert>}

            <button type="submit" className="grc-btn grc-btn-primary grc-btn-block login-submit" disabled={cargando}>
              {cargando ? 'INGRESANDO…' : 'INICIAR SESIÓN'}
            </button>
          </form>
        </div>

        <div className="login-demo">
          DEMO · avillalba@servimacromotor.co / admin123 · lbeltran@servimacromotor.co / asesor123 · rpena@servimacromotor.co / gerente123
        </div>
        <div className="login-footer">SINCRONIZACIÓN MANUAL CON CESVI COLOMBIA</div>
      </div>
    </div>
  );
}
