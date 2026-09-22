import React, { useCallback, useEffect, useState } from 'react';
import * as observacionService from '../../services/observacionService';
import { Alert, Button, Spinner, Empty } from '../ui';
import { fmtFechaHora } from '../../utils/format';
import { getEtapa } from '../../utils/constants';

const leerComoDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// HU-25 · Timeline de observaciones de la orden + formulario para registrar una nueva.
export default function TabObservaciones({ orden }) {
  const [observaciones, setObservaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const etapasOpciones = (orden.etapasVisitadas || [])
    .map((id) => getEtapa(id))
    .filter(Boolean)
    .sort((a, b) => a.orden - b.orden);

  const [idEtapa, setIdEtapa] = useState(etapasOpciones[0] ? String(etapasOpciones[0].id) : '');
  const [texto, setTexto] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [notificar, setNotificar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await observacionService.getObservaciones(orden.id);
      setObservaciones(data);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las observaciones.');
    } finally {
      setCargando(false);
    }
  }, [orden.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hayEtapas = etapasOpciones.length > 0;

  const agregarImagenes = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const nuevas = await Promise.all(
      files.map(async (file) => ({ url: await leerComoDataUrl(file), nombre: file.name }))
    );
    setImagenes((prev) => [...prev, ...nuevas]);
  };

  const quitarImagen = (idx) => {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!hayEtapas) return;
    if (!texto.trim()) {
      setErrorForm('Escribe el texto de la observación.');
      return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      await observacionService.crearObservacion({
        idOrden: orden.id,
        idEtapa: Number(idEtapa),
        texto: texto.trim(),
        imagenes,
        notificar,
      });
      setTexto('');
      setImagenes([]);
      setNotificar(false);
      await cargar();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar la observación.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="ficha-obs-grid">
      <div className="grc-card">
        <div className="grc-card-header">
          <span className="grc-panel-title">Timeline de observaciones</span>
        </div>
        {cargando && <Spinner label="CARGANDO" />}
        {error && <Alert type="error">{error}</Alert>}
        {!cargando && !error && observaciones.length === 0 && <Empty>Esta orden aún no tiene observaciones.</Empty>}
        {!cargando &&
          observaciones.map((o) => (
            <div key={o.id} className="ficha-obs-item">
              <div className="ficha-obs-cabecera">
                <span className="ficha-obs-autor">{o.autor}</span>
                <span className="grc-mono grc-muted">{fmtFechaHora(o.fecha)}</span>
                <span className="ficha-obs-etapa">{o.etapa}</span>
                {o.visibleCliente && <span className="ficha-obs-badge">ENVIADA AL CLIENTE</span>}
              </div>
              <div className="ficha-obs-texto">{o.texto}</div>
              {o.imagenes && o.imagenes.length > 0 ? (
                <div className="ficha-obs-fotos">
                  <div className="ficha-obs-thumbs">
                    {o.imagenes.map((img) => (
                      <img key={img.id || img.url} src={img.url} alt={img.nombre || 'Foto adjunta'} className="ficha-obs-thumb" />
                    ))}
                  </div>
                  <span className="grc-mono grc-muted">
                    {o.imagenes.length} {o.imagenes.length === 1 ? 'FOTO ADJUNTA' : 'FOTOS ADJUNTAS'}
                  </span>
                </div>
              ) : (
                <div className="grc-mono grc-muted" style={{ marginTop: 8 }}>SIN FOTOS</div>
              )}
            </div>
          ))}
      </div>

      <form className="grc-card ficha-obs-form" onSubmit={guardar}>
        <div className="ficha-obs-form-header grc-panel-title">Nueva observación</div>

        {!hayEtapas && (
          <Alert type="info">
            Esta orden aún no ha entrado a ninguna etapa. Registra el ingreso al taller y asigna una etapa antes de
            crear observaciones.
          </Alert>
        )}

        <div>
          <label htmlFor="obs-etapa">ETAPA</label>
          <select id="obs-etapa" value={idEtapa} onChange={(e) => setIdEtapa(e.target.value)} disabled={!hayEtapas}>
            {etapasOpciones.map((et) => (
              <option key={et.id} value={et.id}>
                {et.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 13 }}>
          <label htmlFor="obs-texto">OBSERVACIÓN</label>
          <textarea
            id="obs-texto"
            rows={4}
            placeholder="Detalle para el cliente o para el taller"
            style={{ resize: 'vertical' }}
            value={texto}
            disabled={!hayEtapas}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>

        <label className="ficha-file-btn">
          ADJUNTAR FOTOS (SIN LÍMITE)
          <input type="file" accept="image/*" multiple disabled={!hayEtapas} onChange={agregarImagenes} className="grc-visually-hidden" />
        </label>

        {imagenes.length > 0 && (
          <div className="ficha-preview-grid">
            {imagenes.map((img, idx) => (
              <div key={img.url + idx} className="ficha-preview-item">
                <img src={img.url} alt={img.nombre} />
                <button type="button" className="ficha-preview-remove" aria-label={`Quitar ${img.nombre}`} onClick={() => quitarImagen(idx)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="ficha-checkbox">
          <input
            type="checkbox"
            checked={notificar}
            disabled={!hayEtapas}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>Notificar al cliente por WhatsApp</span>
        </label>

        {errorForm && <Alert type="error">{errorForm}</Alert>}

        <Button type="submit" block disabled={!hayEtapas || guardando} style={{ marginTop: 14 }}>
          {guardando ? 'GUARDANDO…' : 'GUARDAR OBSERVACIÓN'}
        </Button>
      </form>
    </div>
  );
}
