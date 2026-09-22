import React, { useEffect, useState } from 'react';
import * as observacionService from '../../services/observacionService';
import { Alert, Spinner, Empty, Modal } from '../ui';

const IconFoto = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

// HU-26 · Galería consolidada de solo lectura (valoración + observaciones por etapa).
export default function TabFotografias({ orden }) {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [visorIdx, setVisorIdx] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    observacionService
      .getFotosOrden(orden.id)
      .then((data) => {
        if (activo) setFotos(data);
      })
      .catch((e) => {
        if (activo) setError(e.message || 'No se pudo cargar la galería.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [orden.id]);

  if (cargando) return <Spinner label="CARGANDO GALERÍA" />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (fotos.length === 0) return <Empty>ESTA ORDEN AÚN NO TIENE FOTOGRAFÍAS</Empty>;

  const foto = visorIdx != null ? fotos[visorIdx] : null;
  const irAnterior = () => setVisorIdx((i) => (i - 1 + fotos.length) % fotos.length);
  const irSiguiente = () => setVisorIdx((i) => (i + 1) % fotos.length);

  return (
    <div className="ficha-fotos">
      <div className="grc-sub" style={{ fontSize: 13, marginBottom: 13 }}>
        Galería de solo lectura · {fotos.length} {fotos.length === 1 ? 'fotografía' : 'fotografías'} de esta orden
      </div>
      <div className="ficha-fotos-grid">
        {fotos.map((f, idx) => {
          const esValoracion = f.origen === 'Valoración';
          return (
            <button key={f.id} type="button" className="ficha-foto-item" onClick={() => setVisorIdx(idx)}>
              <span className="ficha-foto-thumb" aria-hidden="true">
                {f.url ? <img src={f.url} alt={f.nombre || 'Fotografía de la orden'} /> : <IconFoto />}
              </span>
              <span className="ficha-foto-pie">
                <span className="grc-mono">{f.nombre || `FOTO ${String(idx + 1).padStart(2, '0')}`}</span>
                <span className="grc-mono" style={{ color: esValoracion ? 'var(--accent)' : 'var(--sub)' }}>
                  {esValoracion ? 'VALORACIÓN' : f.origen}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Modal open={!!foto} onClose={() => setVisorIdx(null)} width={720} labelledBy="ficha-visor-titulo">
        {foto && (
          <div className="ficha-visor">
            <div id="ficha-visor-titulo" className="grc-visually-hidden">
              {foto.nombre || 'Fotografía de la orden'}
            </div>
            <img src={foto.url} alt={foto.nombre || 'Fotografía de la orden'} className="ficha-visor-img" />
            <div className="ficha-visor-controles">
              <button type="button" className="grc-btn grc-btn-outline" aria-label="Foto anterior" onClick={irAnterior}>
                ← ANTERIOR
              </button>
              <span className="grc-mono grc-muted">
                {visorIdx + 1} / {fotos.length}
              </span>
              <button type="button" className="grc-btn grc-btn-outline" aria-label="Foto siguiente" onClick={irSiguiente}>
                SIGUIENTE →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
