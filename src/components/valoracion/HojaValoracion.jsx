import React, { useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Mono } from '../ui';
import * as valoracionService from '../../services/valoracionService';
import { ACCION_PIEZA, FILTROS_VALORACION, GRAVEDADES } from '../../utils/constants';
import { fmtOrden, fmtPlaca } from '../../utils/format';
import { agruparBloques, estadoValoracionTag } from '../../utils/valoracionExport';
import '../../styles/Valoracion.css';

let idSeq = 0;
const idLocal = (prefijo) => `${prefijo}-${Date.now()}-${idSeq++}`;

function leerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Crear/editar la hoja de valoración de una orden (HU-28). Guardado único: al confirmar
// se envía descripción + piezas + fotos y el backend genera el registro de valoración.
export default function HojaValoracion({ orden, valoracion, onSaved, onCancel }) {
  const [descripcion, setDescripcion] = useState((valoracion && valoracion.descripcion) || '');
  const [piezas, setPiezas] = useState(() =>
    ((valoracion && valoracion.detalles) || []).map((d) => ({ id: idLocal('p'), pieza: d.pieza, accion: d.accion, gravedad: d.gravedad || null }))
  );
  const [fotos, setFotos] = useState(() =>
    ((valoracion && valoracion.imagenes) || []).map((f) => ({ id: idLocal('f'), url: f.url, nombre: f.nombre }))
  );
  const [piezaNombre, setPiezaNombre] = useState('');
  const [piezaAccion, setPiezaAccion] = useState(ACCION_PIEZA.REPARAR);
  const [piezaGravedad, setPiezaGravedad] = useState(GRAVEDADES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const camaraRef = useRef(null);
  const archivosRef = useRef(null);

  const bloques = useMemo(() => agruparBloques(piezas), [piezas]);
  const puedeGuardar = piezas.length > 0 && !guardando;

  const estadoActual = !valoracion ? FILTROS_VALORACION.SIN_VALORAR : valoracion.cargadaCesvi ? FILTROS_VALORACION.CARGADAS : FILTROS_VALORACION.SIN_CARGAR;
  const tag = estadoValoracionTag(estadoActual);

  const agregarPieza = () => {
    const nombre = piezaNombre.trim();
    if (!nombre) return;
    setPiezas((prev) => [
      ...prev,
      { id: idLocal('p'), pieza: nombre, accion: piezaAccion, gravedad: piezaAccion === ACCION_PIEZA.REPARAR ? piezaGravedad : null },
    ]);
    setPiezaNombre('');
  };

  const onNombreKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarPieza();
    }
  };

  const eliminarPieza = (id) => setPiezas((prev) => prev.filter((p) => p.id !== id));

  const agregarArchivos = async (fileList) => {
    const archivos = Array.from(fileList || []);
    if (!archivos.length) return;
    const nuevas = await Promise.all(
      archivos.map(async (file) => ({ id: idLocal('f'), url: await leerComoDataUrl(file), nombre: file.name }))
    );
    setFotos((prev) => [...prev, ...nuevas]);
  };

  const eliminarFoto = (id) => setFotos((prev) => prev.filter((f) => f.id !== id));

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      const payload = {
        descripcion: descripcion.trim(),
        detalles: piezas.map((p) => ({ pieza: p.pieza, accion: p.accion, gravedad: p.accion === ACCION_PIEZA.REPARAR ? p.gravedad : null })),
        imagenes: fotos.map((f) => ({ url: f.url, nombre: f.nombre })),
      };
      const v = await valoracionService.guardarValoracion(orden.id, payload);
      onSaved(v);
    } catch (e) {
      setError(e.message || 'No se pudo guardar la hoja de valoración.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="hoja-head">
        <div>
          <div className="hoja-title">HOJA DE VALORACIÓN · {fmtPlaca(orden.placa)}</div>
          <Mono color={tag.color} style={{ marginTop: 6, display: 'inline-block' }}>
            {tag.label}
          </Mono>
          <div className="hoja-sub">
            {orden.vehiculoTexto} · {orden.cliente && orden.cliente.nombre} · {fmtOrden(orden.numero)}
          </div>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            ← VOLVER ATRÁS
          </Button>
        )}
      </div>

      {valoracion && valoracion.cargadaCesvi && (
        <Alert type="info" style={{ marginTop: 14 }}>
          Esta hoja ya fue cargada a CESVI; si cambias el alcance, vuelve a subirla.
        </Alert>
      )}
      {error && (
        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>
      )}

      <div className="hoja-grid">
        <div className="hoja-col">
          <Card style={{ padding: 16 }}>
            <label htmlFor="hoja-descripcion">DESCRIPCIÓN GENERAL DEL DAÑO</label>
            <textarea
              id="hoja-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Impacto lateral izquierdo a baja velocidad…"
              style={{ resize: 'vertical' }}
            />
          </Card>

          <Card style={{ padding: 16 }}>
            <div className="grc-panel-title" style={{ fontSize: 15 }}>
              Agregar pieza
            </div>
            <div style={{ marginTop: 13 }}>
              <label htmlFor="hoja-pieza-nombre">NOMBRE DE LA PIEZA</label>
              <input
                id="hoja-pieza-nombre"
                value={piezaNombre}
                onChange={(e) => setPiezaNombre(e.target.value)}
                onKeyDown={onNombreKeyDown}
                placeholder="Guardabarros delantero izquierdo"
              />
            </div>
            <div className="hoja-segmento" role="group" aria-label="Acción sobre la pieza">
              <button
                type="button"
                className={`hoja-seg-btn ${piezaAccion === ACCION_PIEZA.REPARAR ? 'is-active' : ''}`}
                aria-pressed={piezaAccion === ACCION_PIEZA.REPARAR}
                onClick={() => setPiezaAccion(ACCION_PIEZA.REPARAR)}
              >
                REPARAR
              </button>
              <button
                type="button"
                className={`hoja-seg-btn ${piezaAccion === ACCION_PIEZA.SUSTITUIR ? 'is-active' : ''}`}
                aria-pressed={piezaAccion === ACCION_PIEZA.SUSTITUIR}
                onClick={() => setPiezaAccion(ACCION_PIEZA.SUSTITUIR)}
              >
                SUSTITUIR
              </button>
            </div>
            {piezaAccion === ACCION_PIEZA.REPARAR && (
              <div style={{ marginTop: 13 }}>
                <label htmlFor="hoja-pieza-gravedad">GRAVEDAD</label>
                <select id="hoja-pieza-gravedad" value={piezaGravedad} onChange={(e) => setPiezaGravedad(e.target.value)}>
                  {GRAVEDADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button block style={{ marginTop: 14 }} onClick={agregarPieza} disabled={!piezaNombre.trim()}>
              AGREGAR A LA HOJA
            </Button>
          </Card>

          <Card style={{ overflow: 'hidden' }}>
            <div className="hoja-card-head">
              <span className="grc-panel-title" style={{ fontSize: 15 }}>
                Piezas
              </span>
              <Mono color="var(--sub)">
                {piezas.length} {piezas.length === 1 ? 'PIEZA' : 'PIEZAS'}
              </Mono>
            </div>
            {bloques.map((b) => (
              <div key={b.titulo}>
                <div className="hoja-bloque-titulo">{b.titulo}</div>
                {b.items.map((p) => (
                  <div className="hoja-pieza-row" key={p.id}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>{p.pieza}</div>
                      <Mono color="var(--line)" style={{ marginTop: 4, display: 'block' }}>
                        {p.gravedad ? `GRAVEDAD ${p.gravedad}` : 'SIN GRAVEDAD'}
                      </Mono>
                    </div>
                    <button type="button" className="hoja-pieza-del" aria-label={`Quitar ${p.pieza}`} onClick={() => eliminarPieza(p.id)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                ))}
                {!b.items.length && <div className="hoja-bloque-vacio">{b.vacio}</div>}
              </div>
            ))}
          </Card>
        </div>

        <div className="hoja-col">
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="grc-panel-title" style={{ fontSize: 15 }}>
                Fotografías
              </span>
              <Mono color="var(--sub)">
                {fotos.length} {fotos.length === 1 ? 'FOTO' : 'FOTOS'}
              </Mono>
            </div>
            <div className="hoja-fotos-botones">
              <Button variant="outline" onClick={() => camaraRef.current && camaraRef.current.click()}>
                TOMAR FOTO
              </Button>
              <Button variant="outline" onClick={() => archivosRef.current && archivosRef.current.click()}>
                SUBIR ARCHIVOS
              </Button>
              <input
                ref={camaraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  agregarArchivos(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={archivosRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  agregarArchivos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {fotos.length > 0 && (
              <div className="hoja-fotos-grid">
                {fotos.map((f) => (
                  <div className="hoja-foto-item" key={f.id}>
                    <img src={f.url} alt={f.nombre || 'Fotografía de la valoración'} />
                    <button type="button" className="hoja-foto-quitar" aria-label={`Quitar foto ${f.nombre || ''}`} onClick={() => eliminarFoto(f.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: 16 }}>
            <Button block onClick={guardar} disabled={!puedeGuardar}>
              {guardando ? 'GUARDANDO…' : 'GUARDAR VALORACIÓN'}
            </Button>
            <div className="hoja-guardar-nota">
              {piezas.length === 0
                ? 'Agrega al menos una pieza para poder guardar la hoja.'
                : 'Al guardar se genera el PDF de la hoja y el ZIP de fotografías.'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
