import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as dashboardService from '../services/dashboardService';
import { Alert, Spinner } from '../components/ui';
import { ETAPAS_CARGA } from '../utils/constants';
import { fmtHora } from '../utils/format';
import '../styles/Alertas.css';

const TARJETAS_ALERTA = [
  { tipo: 'critico', label: 'Críticos', desc: 'Exceden el límite de días de su etapa', color: 'var(--red)', danger: true },
  { tipo: 'vencido', label: 'Vencidos', desc: 'Fecha de entrega ya superada', color: 'var(--red)', danger: false },
  { tipo: 'proximo', label: 'Próximos a vencer', desc: 'Entrega estimada en 3 días o menos', color: 'var(--accent)', danger: false },
  { tipo: 'proceso', label: 'En proceso', desc: 'Órdenes activas dentro del plazo', color: 'var(--sub)', danger: false },
];

const CAMPO_RESUMEN = { critico: 'criticos', vencido: 'vencidos', proximo: 'proximos', proceso: 'enProceso' };

const MOSTRAR_INICIAL = 5;

export default function AlertasPage() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [carga, setCarga] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [movsExpandido, setMovsExpandido] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([
      dashboardService.getResumenDashboard(),
      dashboardService.getMovimientosRecientes(),
      dashboardService.getCargaPorEtapa(),
    ])
      .then(([r, m, c]) => {
        if (!activo) return;
        setResumen(r);
        setMovimientos(m || []);
        setCarga(c || []);
      })
      .catch((err) => {
        if (activo) setError((err && err.message) || 'No se pudo cargar el panel de alertas.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const cargaMax = useMemo(() => carga.reduce((max, c) => Math.max(max, c.n), 0), [carga]);
  const cargaEtapaTop = useMemo(() => {
    if (cargaMax <= 0) return null;
    const top = carga.find((c) => c.n === cargaMax);
    return top ? top.etapa : null;
  }, [carga, cargaMax]);

  if (cargando) return <Spinner label="CARGANDO ALERTAS" />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!resumen) return null;

  const movsVisibles = movsExpandido ? movimientos : movimientos.slice(0, MOSTRAR_INICIAL);
  const hayMasMovs = movimientos.length > MOSTRAR_INICIAL;

  return (
    <div>
      <div className="alertas-top-grid">
        <button type="button" className="alertas-top-card" onClick={() => navigate('/alertas/avisos/taller')}>
          <div>
            <div className="alertas-top-label">VEHÍCULOS EN TALLER</div>
            <div className="alertas-top-value" style={{ color: 'var(--text)' }}>{resumen.enTaller}</div>
            <div className="alertas-top-hint">VER LISTA →</div>
          </div>
          <div className="alertas-top-side" style={{ color: 'var(--accent)' }}>
            +{resumen.ingresosHoy} INGRESOS
            <br />
            HOY
          </div>
        </button>

        <button type="button" className="alertas-top-card" onClick={() => navigate('/alertas/avisos/fuera')}>
          <div>
            <div className="alertas-top-label">FUERA DEL TALLER</div>
            <div className="alertas-top-value" style={{ color: 'var(--sub)' }}>{resumen.fuera}</div>
            <div className="alertas-top-hint">VER LISTA →</div>
          </div>
          <div className="alertas-top-side" style={{ color: 'var(--line)' }}>
            ENTREGADOS
            <br />O EN ESPERA
          </div>
        </button>
      </div>

      <div className="alertas-section-head">
        <div className="grc-section-title">Alertas de entrega</div>
        <div className="alertas-section-help">Clic en una tarjeta para abrir la lista de avisos</div>
      </div>

      <div className="alertas-cards-grid">
        {TARJETAS_ALERTA.map((a) => (
          <button
            key={a.tipo}
            type="button"
            className={`alertas-alert-card ${a.danger ? 'is-danger' : ''}`}
            onClick={() => navigate(`/alertas/avisos/${a.tipo}`)}
          >
            <div className="alertas-alert-head">
              <span className="grc-dot" style={{ background: a.color }} />
              <span className="alertas-alert-label">{a.label}</span>
            </div>
            <div className="alertas-alert-value" style={{ color: a.color }}>
              {resumen[CAMPO_RESUMEN[a.tipo]] ?? 0}
            </div>
            <div className="alertas-alert-desc">{a.desc}</div>
            <div className="alertas-alert-foot">VER LISTA →</div>
          </button>
        ))}
      </div>

      <div className="alertas-panels-grid">
        <div className="alertas-panel">
          <div className="alertas-panel-head">
            <span className="grc-panel-title">Movimientos recientes</span>
            {hayMasMovs && (
              <button type="button" className="grc-btn grc-btn-outline grc-btn-sm" onClick={() => setMovsExpandido((v) => !v)}>
                {movsExpandido ? 'VER MENOS' : 'VER MÁS'}
              </button>
            )}
          </div>
          <div className="alertas-mov-list" style={{ maxHeight: movsExpandido ? 420 : undefined }}>
            {movsVisibles.length === 0 && <div className="grc-empty">SIN MOVIMIENTOS EN LAS ÚLTIMAS 24 HORAS</div>}
            {movsVisibles.map((r) => (
              <div className="alertas-mov-row" key={r.id}>
                <div className="alertas-mov-hora">{fmtHora(r.fecha)}</div>
                <div style={{ minWidth: 0 }}>
                  {r.idOrden ? (
                    <button type="button" className="alertas-mov-placa" onClick={() => navigate(`/ficha/${r.idOrden}`)}>
                      {r.placa}
                    </button>
                  ) : (
                    <div className="alertas-mov-placa" style={{ cursor: 'default' }}>{r.placa}</div>
                  )}
                  <div className="alertas-mov-texto">{r.texto}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="alertas-mov-foot">
            {movsExpandido
              ? `ÚLTIMAS 24 HORAS · ${movimientos.length} MOVIMIENTOS`
              : `MOSTRANDO ${movsVisibles.length} DE ${movimientos.length} EN LAS ÚLTIMAS 24 HORAS`}
          </div>
        </div>

        <div className="alertas-panel">
          <div className="alertas-panel-head">
            <span className="grc-panel-title">Carga por etapa</span>
          </div>
          <div className="alertas-carga-body">
            {ETAPAS_CARGA.map((nombre) => {
              const c = carga.find((x) => x.etapa === nombre) || { etapa: nombre, n: 0 };
              const pct = cargaMax > 0 ? Math.round((c.n / cargaMax) * 100) : 0;
              const esTop = cargaMax > 0 && c.etapa === cargaEtapaTop;
              return (
                <div className="alertas-carga-row" key={nombre}>
                  <div className="alertas-carga-head">
                    <span className="alertas-carga-etapa">{nombre}</span>
                    <span className="alertas-carga-n">{c.n}</span>
                  </div>
                  <div className="alertas-carga-track">
                    <div
                      className="alertas-carga-fill"
                      style={{ width: `${pct}%`, background: esTop ? 'var(--accent)' : 'var(--sub)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
