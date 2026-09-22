import React, { useEffect, useState } from 'react';
import { Mono } from '../ui';
import { fmtFecha, fmtOrden, fmtPlaca } from '../../utils/format';
import { detalleTexto, estadoValoracionTag, ordenarDetalles } from '../../utils/valoracionExport';
import { FILTROS_VALORACION } from '../../utils/constants';
import '../../styles/Valoracion.css';

// Render de la "hoja" en papel, compartido entre ValoracionPdfView (embebido) y este visor
// a pantalla completa. Vive aquí porque este es el componente dedicado a "ver el PDF".
export function DocumentoValoracion({ orden, valoracion }) {
  const filas = ordenarDetalles(valoracion.detalles || []);
  return (
    <div className="val-doc">
      <div className="val-doc-header">
        <div>
          <div className="val-doc-brand">SERVIMACROMOTOR</div>
          <div className="val-doc-brandsub">HOJA DE VALORACIÓN DE DAÑOS</div>
        </div>
        <div className="val-doc-meta">
          <div>{fmtOrden(orden.numero)}</div>
          <div>{fmtFecha(valoracion.actualizadaAt || valoracion.creadaAt)}</div>
        </div>
      </div>
      <div className="val-doc-rule" />
      <div className="val-doc-cabecera">
        <div>
          <div className="val-doc-k">PLACA</div>
          <div className="val-doc-v">{fmtPlaca(orden.placa)}</div>
        </div>
        <div>
          <div className="val-doc-k">VEHÍCULO</div>
          <div className="val-doc-v">{orden.vehiculoTexto}</div>
        </div>
        <div>
          <div className="val-doc-k">CLIENTE</div>
          <div className="val-doc-v">{orden.cliente && orden.cliente.nombre}</div>
        </div>
      </div>
      <div className="val-doc-desc">
        <div className="val-doc-k">DESCRIPCIÓN GENERAL DEL DAÑO</div>
        <div className="val-doc-desctext">{valoracion.descripcion || 'Sin descripción registrada.'}</div>
      </div>
      <div className="val-doc-tabla">
        <div className="val-doc-tablahead">
          <span>PIEZA</span>
          <span>ACCIÓN · GRAVEDAD</span>
        </div>
        {filas.length === 0 && <div className="val-doc-vacio">Sin piezas registradas.</div>}
        {filas.map((f) => (
          <div className="val-doc-fila" key={f.id ?? f.pieza}>
            <span className="val-doc-pieza">{f.pieza}</span>
            <span className="val-doc-detalle">{detalleTexto(f)}</span>
          </div>
        ))}
      </div>
      <div className="val-doc-footer">
        <span>VALORÓ: {(valoracion.usuario || '—').toUpperCase()}</span>
        <span>PÁGINA 1 DE 1</span>
      </div>
    </div>
  );
}

// Visor a pantalla completa con zoom (50%–250%, pasos de 25). Cierra con Escape.
export default function PdfViewerModal({ orden, valoracion, onClose }) {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const cargada = !!valoracion.cargadaCesvi;
  const tag = estadoValoracionTag(cargada ? FILTROS_VALORACION.CARGADAS : FILTROS_VALORACION.SIN_CARGAR);
  const estadoLabel = cargada ? `CARGADA A CESVI · ${fmtFecha(valoracion.cargadaCesviAt)}` : 'PENDIENTE DE CARGA A CESVI';
  const ancho = Math.round((816 * zoom) / 100);

  return (
    <div className="val-visor" role="dialog" aria-modal="true" aria-label={`Hoja de valoración ${fmtPlaca(orden.placa)} en pantalla completa`}>
      <div className="val-visor-bar">
        <div className="val-visor-titlewrap">
          <span className="val-visor-title">HOJA DE VALORACIÓN · {fmtPlaca(orden.placa)}</span>
          <Mono color={tag.color}>{estadoLabel}</Mono>
        </div>
        <div className="val-visor-controls">
          <div className="val-visor-zoom">
            <button type="button" aria-label="Reducir zoom" onClick={() => setZoom((z) => Math.max(50, z - 25))} disabled={zoom <= 50}>
              −
            </button>
            <span>{zoom}%</span>
            <button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(250, z + 25))} disabled={zoom >= 250}>
              +
            </button>
          </div>
          <button type="button" className="grc-btn grc-btn-outline" onClick={() => setZoom(100)}>
            RESTABLECER
          </button>
          <button type="button" className="grc-btn grc-btn-primary" onClick={onClose} aria-label="Cerrar visor de pantalla completa">
            CERRAR
          </button>
        </div>
      </div>
      <div className="val-visor-body">
        <div style={{ width: ancho, margin: '0 auto' }}>
          <DocumentoValoracion orden={orden} valoracion={valoracion} />
        </div>
      </div>
    </div>
  );
}
