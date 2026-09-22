import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import * as dashboardService from '../services/dashboardService';
import { Alert, Empty, Spinner } from '../components/ui';
import { TIPOS_AVISO } from '../utils/constants';
import { fmtFechaNumerica, fmtPlaca, pluralDias } from '../utils/format';
import '../styles/Avisos.css';

const CAMPO_RESUMEN = {
  critico: 'criticos',
  vencido: 'vencidos',
  proximo: 'proximos',
  proceso: 'enProceso',
  taller: 'enTaller',
  fuera: 'fuera',
};

const TABS = Object.values(TIPOS_AVISO);

function colorFila(orden) {
  if (orden.alerta === 'vencido' || orden.alerta === 'critico') return 'var(--red)';
  if (orden.alerta === 'proximo') return 'var(--accent)';
  return 'var(--sub)';
}

export default function AvisosPage() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vistos, setVistos] = useState(() => new Set());

  const tipoValido = !!TIPOS_AVISO[tipo];

  useEffect(() => {
    let activo = true;
    dashboardService.getResumenDashboard().then((r) => {
      if (activo) setResumen(r);
    });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!tipoValido) return undefined;
    let activo = true;
    setCargando(true);
    setError('');
    dashboardService
      .getOrdenesPorAviso(tipo)
      .then((data) => {
        if (activo) setOrdenes(data || []);
      })
      .catch((err) => {
        if (activo) setError((err && err.message) || 'No se pudo cargar la lista de avisos.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [tipo, tipoValido]);

  if (!tipoValido) return <Navigate to="/alertas" replace />;

  const toggleVisto = (id) => {
    setVistos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="avisos-head">
        <div className="avisos-tabs">
          {TABS.map((t) => {
            const activa = t.id === tipo;
            const n = resumen ? resumen[CAMPO_RESUMEN[t.id]] ?? 0 : '—';
            return (
              <button
                key={t.id}
                type="button"
                className={`avisos-tab ${activa ? 'is-active' : ''}`}
                onClick={() => navigate(`/alertas/avisos/${t.id}`)}
              >
                <span className="grc-dot" style={{ background: t.dot }} />
                <span>{t.label} · {n}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="grc-btn grc-btn-outline" onClick={() => navigate('/alertas')}>
          ← VOLVER A ALERTAS
        </button>
      </div>

      {cargando && <Spinner label="CARGANDO AVISOS" />}
      {!cargando && error && <Alert type="error">{error}</Alert>}

      {!cargando && !error && (
        <div className="avisos-panel">
          <div className="avisos-panel-head">
            <span className="grc-panel-title">Total avisos</span>
            <span className="avisos-total-badge">{ordenes.length}</span>
          </div>

          <div className="avisos-list">
            {ordenes.length === 0 && <Empty>SIN AVISOS EN ESTE GRUPO</Empty>}
            {ordenes.map((orden) => {
              const color = colorFila(orden);
              const hito = orden.etapaActual || orden.columna || 'Sin ingreso al taller';
              const dias = orden.diasEnTaller != null ? pluralDias(orden.diasEnTaller, 'EN TALLER') : 'SIN INGRESO';
              const visto = vistos.has(orden.id);
              return (
                <div
                  key={orden.id}
                  className="avisos-row"
                  style={{ borderLeftColor: color }}
                  onClick={() => navigate(`/ficha/${orden.id}`)}
                >
                  <div className="avisos-cell">
                    <span className="avisos-cell-label">Placa</span>
                    <span className="avisos-placa-value">{fmtPlaca(orden.placa)}</span>
                  </div>
                  <div className="avisos-cell" style={{ minWidth: 230 }}>
                    <span className="avisos-cell-label">Siniestro</span>
                    <span className="avisos-cell-value">{orden.siniestro || '—'}</span>
                  </div>
                  <div className="avisos-cell avisos-cell-fecha">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                    <span className="avisos-cell-value">{fmtFechaNumerica(orden.fechaEntregaEstimada)}</span>
                  </div>
                  <div className="avisos-cell avisos-cell-hito">
                    <span className="avisos-hito-value" style={{ color }}>{hito}</span>
                  </div>
                  <div className="avisos-cell avisos-cell-dias" style={{ border: 'none' }}>
                    <span className="avisos-dias-value">{dias}</span>
                  </div>
                  <div className="avisos-actions">
                    <button
                      type="button"
                      className={`avisos-toggle ${visto ? 'is-on' : ''}`}
                      aria-pressed={visto}
                      aria-label={visto ? 'Marcar como no visto' : 'Marcar como visto'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisto(orden.id);
                      }}
                    >
                      <span className="avisos-toggle-dot" />
                    </button>
                    <button
                      type="button"
                      className="avisos-open-btn"
                      aria-label="Abrir ficha"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ficha/${orden.id}`);
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
