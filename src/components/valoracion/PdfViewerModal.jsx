import React, { useEffect, useState } from 'react';
import { Mono } from '../ui';
import { fmtFecha, fmtPlaca } from '../../utils/format';
import { estadoValoracionTag } from '../../utils/valoracionExport';
import { FILTROS_VALORACION } from '../../utils/constants';
import HojaValoracionDocumento from './HojaValoracionDocumento';
import '../../styles/Valoracion.css';

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
        {/* La hoja tiene tamaño fijo de carta: el zoom escala el bloque completo */}
        <div className="val-visor-hoja" style={{ zoom: zoom / 100 }}>
          <HojaValoracionDocumento orden={orden} valoracion={valoracion} />
        </div>
      </div>
    </div>
  );
}
