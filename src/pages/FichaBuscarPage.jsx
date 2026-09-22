import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as ordenService from '../services/ordenService';
import { PlacaSearch, Button, Spinner, Alert } from '../components/ui';
import { fmtPlaca, fmtOrden, fmtFecha, normalizarPlaca } from '../utils/format';
import '../styles/Ficha.css';

// HU-22 · Buscar una orden de trabajo por placa y ver su resumen antes de abrir la ficha completa.
export default function FichaBuscarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [placa, setPlaca] = useState('');
  const [buscada, setBuscada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [orden, setOrden] = useState(null);

  const buscar = useCallback(async (valor) => {
    const p = normalizarPlaca(valor);
    if (!p) return;
    setCargando(true);
    setError('');
    try {
      const res = await ordenService.buscarOrdenPorPlaca(p);
      setOrden(res);
      setBuscada(true);
      setSearchParams({ placa: p }, { replace: true });
    } catch (e) {
      setError(e.message || 'No se pudo buscar la placa.');
      setBuscada(false);
      setOrden(null);
    } finally {
      setCargando(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const p = searchParams.get('placa');
    if (p) {
      setPlaca(normalizarPlaca(p));
      buscar(p);
    }
    // Solo se ejecuta al montar: busca automáticamente si la URL trae ?placa=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alerta = orden ? orden.alerta : 'normal';
  const alertaLabel =
    alerta === 'vencido' ? 'ENTREGA VENCIDA' : alerta === 'critico' ? 'CRÍTICO' : alerta === 'proximo' ? 'PRÓXIMO A VENCER' : '';
  const alertaFg = alerta === 'proximo' ? 'var(--accent)' : 'var(--red)';
  const mostrarAlerta = alerta === 'vencido' || alerta === 'critico' || alerta === 'proximo';

  const diasEnTaller = orden ? orden.diasEnTaller : null;
  const totalDonut = orden && orden.diasEstimadoEntrega ? orden.diasEstimadoEntrega : 20;
  const pctDias = diasEnTaller != null ? Math.min(100, Math.round((diasEnTaller / totalDonut) * 100)) : 0;

  const campos = orden
    ? [
        {
          k: 'VEHÍCULO',
          v: `${orden.vehiculo.marca} ${orden.vehiculo.modelo}`.trim(),
          sub: [orden.vehiculo.anio, orden.vehiculo.color].filter(Boolean).join(' · '),
        },
        {
          k: 'ORDEN',
          v: fmtOrden(orden.numero ?? orden.id),
          sub: `Creada ${fmtFecha(orden.fechaCreacion)}`,
        },
        {
          k: 'ETAPA ACTUAL',
          v: orden.etapaActual || orden.columna || 'Sin ingreso al taller',
          sub: orden.fechaInicioEtapa ? `Desde ${fmtFecha(orden.fechaInicioEtapa)} · ${orden.diasEnEtapa} días` : '',
          fg: 'var(--accent)',
        },
        {
          k: 'CLIENTE',
          v: orden.cliente.nombre,
          sub: orden.cliente.celular,
        },
      ]
    : [];

  return (
    <div className="ficha-buscar">
      <PlacaSearch value={placa} onChange={setPlaca} onSearch={() => buscar(placa)} autoFocus />

      {cargando && <Spinner label="BUSCANDO" />}
      {error && <Alert type="error" style={{ marginTop: 16 }}>{error}</Alert>}

      {!cargando && buscada && !orden && (
        <div className="ficha-empty-card">
          <div className="ficha-empty-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="ficha-empty-titulo">SIN RESULTADOS</div>
          <div className="ficha-empty-texto">
            No existe una orden de trabajo para {fmtPlaca(placa)}. Verifica la placa o crea una nueva orden.
          </div>
          <Button onClick={() => navigate('/nueva-orden')} style={{ marginTop: 6 }}>
            CREAR NUEVA ORDEN
          </Button>
        </div>
      )}

      {!cargando && !buscada && !error && (
        <div className="ficha-empty-card ficha-empty-card-dashed">
          <div className="ficha-empty-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div className="ficha-empty-titulo">BUSCA UNA PLACA</div>
          <div className="ficha-empty-texto">
            Escribe la placa y presiona BUSCAR. El detalle de la orden —información, reparación, valoración,
            observaciones y fotografías— se muestra solo cuando hay un resultado.
          </div>
        </div>
      )}

      {!cargando && orden && (
        <div className="ficha-resumen">
          <div
            className="ficha-donut"
            style={{ background: `conic-gradient(var(--accent) 0% ${pctDias}%, var(--line-soft) ${pctDias}% 100%)` }}
          >
            <div className="ficha-donut-inner">
              <div className="ficha-donut-num">{diasEnTaller != null ? `${diasEnTaller}d` : '—'}</div>
              <div className="ficha-donut-label">EN TALLER</div>
            </div>
          </div>

          <div className="ficha-resumen-cuerpo">
            <div className="ficha-resumen-titulo">
              <span className="grc-placa" style={{ fontSize: 30 }}>{fmtPlaca(orden.placa)}</span>
              <span className="ficha-tag-outline">{orden.estado === 'ENTREGADA' ? 'ENTREGADO' : 'EN PROCESO'}</span>
              {mostrarAlerta && (
                <span className="ficha-tag-outline" style={{ color: alertaFg, borderColor: alertaFg }}>
                  {alertaLabel}
                </span>
              )}
            </div>

            <div className="ficha-resumen-campos">
              {campos.map((c) => (
                <div key={c.k}>
                  <div className="grc-mono grc-muted">{c.k}</div>
                  <div className="ficha-resumen-valor" style={{ color: c.fg || 'var(--text)' }}>{c.v}</div>
                  <div className="ficha-resumen-sub">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => navigate(`/ficha/${orden.id}`)} className="ficha-resumen-btn">
            VER FICHA COMPLETA →
          </Button>
        </div>
      )}
    </div>
  );
}
