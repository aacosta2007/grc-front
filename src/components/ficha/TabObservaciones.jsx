import React, { useCallback, useEffect, useState } from 'react';
import * as observacionService from '../../services/observacionService';
import { Alert, Button, Spinner, Empty } from '../ui';
import AdjuntarFotos from '../AdjuntarFotos';
import useFotosAdjuntas from '../../hooks/useFotosAdjuntas';
import { fmtFechaHora } from '../../utils/format';
import {
  ESTADO_ORDEN,
  ETAPA_ENTREGADO_ID,
  NOTA_MAX,
  TIPO_OBSERVACION,
  TIPO_OBSERVACION_LABEL,
  getEtapa,
} from '../../utils/constants';

// Opciones del selector que no son etapas (se envían con idEtapa = null)
const OPCION_COTIZAR = 'cotizar';
const OPCION_TALLER = 'taller';
const OPCION_ENTREGA = 'entrega';
const valorEtapa = (idEtapa) => `etapa-${idEtapa}`;

// Imagen de una observación ya guardada: se descarga con token y se muestra con object URL.
function ImagenAdjunta({ imagen }) {
  // En modo mock la imagen ya viene como data-URL
  const esDataUrl = !!imagen.url && imagen.url.startsWith('data:');
  const [url, setUrl] = useState(esDataUrl ? imagen.url : '');
  useEffect(() => {
    if (esDataUrl) return undefined;
    let activo = true;
    let objectUrl;
    observacionService
      .getImagenBlob(imagen.id)
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagen.id, esDataUrl]);
  if (!url) return null;
  return <img src={url} alt={imagen.nombre || 'Foto adjunta'} className="ficha-obs-thumb" />;
}

// HU-25 · Timeline de observaciones de la orden + formulario para registrar una nueva.
export default function TabObservaciones({ orden }) {
  const [observaciones, setObservaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Entregada = tiene fecha de entrega real (la orden sigue ACTIVA). Las CERRADA antiguas tampoco llevan ubicación.
  const entregada = !!orden.fechaEntregaReal;
  const sinUbicacion = entregada || orden.estado === ESTADO_ORDEN.ENTREGADA;
  const etapasOpciones = (orden.etapasVisitadas || [])
    .filter((id) => id !== ETAPA_ENTREGADO_ID)
    .map((id) => getEtapa(id))
    .filter(Boolean)
    .sort((a, b) => a.orden - b.orden);

  // En orden cronológico: ingresos, etapas visitadas y entrega
  const opciones = [
    ...(orden.fechaIngresoCotizar
      ? [{ value: OPCION_COTIZAR, label: TIPO_OBSERVACION_LABEL.INGRESO_COTIZAR, tipo: TIPO_OBSERVACION.INGRESO_COTIZAR, idEtapa: null }]
      : []),
    ...(orden.fechaIngresoReparacion
      ? [{ value: OPCION_TALLER, label: TIPO_OBSERVACION_LABEL.INGRESO_TALLER, tipo: TIPO_OBSERVACION.INGRESO_TALLER, idEtapa: null }]
      : []),
    ...etapasOpciones.map((et) => ({ value: valorEtapa(et.id), label: et.nombre, tipo: TIPO_OBSERVACION.ETAPA, idEtapa: et.id })),
    ...(entregada ? [{ value: OPCION_ENTREGA, label: TIPO_OBSERVACION_LABEL.ENTREGA, tipo: TIPO_OBSERVACION.ENTREGA, idEtapa: null }] : []),
  ];
  const hayOpciones = opciones.length > 0;

  // Por defecto: "Entrega" si está entregada; si no, la etapa actual; si no, la última opción
  const valorPorDefecto = entregada
    ? OPCION_ENTREGA
    : opciones.some((op) => op.value === valorEtapa(orden.idEtapaActual))
    ? valorEtapa(orden.idEtapaActual)
    : hayOpciones
    ? opciones[opciones.length - 1].value
    : '';
  const [seleccion, setSeleccion] = useState('');
  // Si la orden cambia (p. ej. se registra una fecha) y la selección ya no existe, vuelve al valor por defecto
  const valor = opciones.some((op) => op.value === seleccion) ? seleccion : valorPorDefecto;
  const opcion = opciones.find((op) => op.value === valor) || null;

  const [texto, setTexto] = useState('');
  const adjuntos = useFotosAdjuntas();
  const [notificar, setNotificar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const fotosSinNota = adjuntos.fotos.length > 0 && !texto.trim();

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

  // Nota y fotos en una sola petición: si falla no se guarda nada y se conservan texto y fotos para reintentar.
  const guardar = async (e) => {
    e.preventDefault();
    if (!opcion || guardando) return;
    if (!texto.trim()) {
      setErrorForm(fotosSinNota ? 'Para adjuntar fotos escribe una nota.' : 'Escribe el texto de la observación.');
      return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      await observacionService.crearObservacion({
        idOrden: orden.id,
        tipo: opcion.tipo,
        idEtapa: opcion.idEtapa,
        entregada: sinUbicacion,
        texto: texto.trim(),
        notificar,
        archivos: adjuntos.archivos,
      });
      setTexto('');
      adjuntos.limpiar();
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
                      <ImagenAdjunta key={img.id} imagen={img} />
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

        {!hayOpciones && (
          <Alert type="info">
            Esta orden aún no tiene ingreso a cotizar, ingreso al taller ni etapas. Registra una fecha de ingreso en la
            pestaña Reparación antes de crear observaciones.
          </Alert>
        )}

        <div>
          <label htmlFor="obs-etapa">ETAPA</label>
          <select id="obs-etapa" value={valor} onChange={(e) => setSeleccion(e.target.value)} disabled={!hayOpciones}>
            {opciones.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 13 }}>
          <label htmlFor="obs-texto">OBSERVACIÓN</label>
          <textarea
            id="obs-texto"
            rows={4}
            maxLength={NOTA_MAX}
            placeholder="Detalle para el cliente o para el taller"
            style={{ resize: 'vertical' }}
            value={texto}
            disabled={!hayOpciones}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>

        <AdjuntarFotos adjuntos={adjuntos} disabled={!hayOpciones || guardando} sinNota={!texto.trim()} />

        <label className="ficha-checkbox">
          <input
            type="checkbox"
            checked={notificar}
            disabled={!hayOpciones}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>Notificar al cliente por WhatsApp</span>
        </label>

        {errorForm && <Alert type="error">{errorForm}</Alert>}

        <Button type="submit" block disabled={!hayOpciones || guardando || fotosSinNota} style={{ marginTop: 14 }}>
          {guardando ? 'GUARDANDO…' : 'GUARDAR OBSERVACIÓN'}
        </Button>
      </form>
    </div>
  );
}
