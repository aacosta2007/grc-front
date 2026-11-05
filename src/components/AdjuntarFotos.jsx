import React from 'react';
import { FOTO_TIPOS, MSG_FOTOS_SIN_NOTA } from '../utils/constants';
import '../styles/AdjuntarFotos.css';

// Selector de fotos con preview, compartido por observaciones, cambio de etapa, entrega e ingresos.
// adjuntos: el resultado de useFotosAdjuntas(). sinNota: la nota está vacía (fotos sin nota → aviso).
export default function AdjuntarFotos({ adjuntos, disabled = false, sinNota = false }) {
  const { fotos, agregar, quitar, error } = adjuntos;

  const onChange = (e) => {
    const files = e.target.files;
    agregar(files);
    e.target.value = '';
  };

  return (
    <div className="adjfotos">
      <label className={`adjfotos-btn${disabled ? ' is-disabled' : ''}`}>
        ADJUNTAR FOTOS · JPEG/PNG, MÁX. 10 MB C/U
        <input
          type="file"
          accept={FOTO_TIPOS.join(',')}
          multiple
          disabled={disabled}
          onChange={onChange}
          className="grc-visually-hidden"
        />
      </label>

      {fotos.length > 0 && (
        <div className="adjfotos-grid">
          {fotos.map((f) => (
            <div key={f.key} className="adjfotos-item">
              <img src={f.url} alt={f.nombre} />
              <button
                type="button"
                className="adjfotos-remove"
                aria-label={`Quitar ${f.nombre}`}
                disabled={disabled}
                onClick={() => quitar(f.key)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="adjfotos-error" role="alert">
          {error}
        </div>
      )}
      {fotos.length > 0 && sinNota && <div className="adjfotos-aviso">{MSG_FOTOS_SIN_NOTA}</div>}
    </div>
  );
}
