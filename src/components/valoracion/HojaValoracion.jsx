import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Mono } from '../ui';
import * as valoracionService from '../../services/valoracionService';
import { ACCION_PIEZA, CANTIDAD_MAX, FILTROS_VALORACION, GRAVEDADES, accionLlevaGravedad, cantidadValida } from '../../utils/constants';
import { fmtOrden, fmtPlaca } from '../../utils/format';
import { agruparBloques, estadoValoracionTag } from '../../utils/valoracionExport';
import '../../styles/Valoracion.css';

const ACCIONES = [ACCION_PIEZA.REPARAR, ACCION_PIEZA.SUSTITUIR, ACCION_PIEZA.PINTAR];

let idSeq = 0;
const idLocal = (prefijo) => `${prefijo}-${Date.now()}-${idSeq++}`;
// Crear/editar la hoja de valoración de una orden (HU-28). Guardado único: al confirmar
// se envía descripción + piezas + fotos y el backend genera el registro de valoración.
export default function HojaValoracion({ orden, valoracion, onSaved, onCancel }) {
  const [descripcion, setDescripcion] = useState((valoracion && valoracion.descripcion) || '');
  const [piezas, setPiezas] = useState(() =>
    ((valoracion && valoracion.detalles) || []).map((d) => ({
      id: idLocal('p'),
      pieza: d.pieza,
      accion: d.accion,
      gravedad: d.gravedad || null,
      cantidad: d.cantidad ?? 1,
      observacion: d.observacion ?? null, // sin campo en pantalla, pero el PUT reemplaza la hoja: se conserva
    }))
  );
  const [fotos, setFotos] = useState([]);
  const [fotosEliminadas, setFotosEliminadas] = useState([]);
  const [piezaNombre, setPiezaNombre] = useState('');
  const [piezaCantidad, setPiezaCantidad] = useState('1');
  const [piezaAccion, setPiezaAccion] = useState(ACCION_PIEZA.REPARAR);
  const [piezaGravedad, setPiezaGravedad] = useState(GRAVEDADES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const camaraRef = useRef(null);
  const archivosRef = useRef(null);
  const urlsNuevasRef = useRef(new Set());

  useEffect(() => {
    let activo = true;
    const creadas = [];
    const existentes = (valoracion && valoracion.imagenes) || [];
    (async () => {
      const iniciales = await Promise.all(
        existentes.map(async (f) => {
          try {
            const blob = await valoracionService.getImagenBlob(f.id);
            const url = URL.createObjectURL(blob);
            creadas.push(url);
            return { key: idLocal('f'), id: f.id, file: null, url, nombre: f.nombre || '' };
          } catch {
            return { key: idLocal('f'), id: f.id, file: null, url: '', nombre: f.nombre || '' };
          }
        })
      );
      if (activo) setFotos(iniciales);
      else creadas.forEach((u) => URL.revokeObjectURL(u));
    })();
    return () => {
      activo = false;
      creadas.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [valoracion]);

  useEffect(
    () => () => {
      urlsNuevasRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsNuevasRef.current.clear();
    },
    []
  );

  const bloques = useMemo(() => agruparBloques(piezas), [piezas]);
  const cantidadesValidas = piezas.every((p) => cantidadValida(p.cantidad) !== null);
  const puedeGuardar = piezas.length > 0 && cantidadesValidas && !guardando;
  const puedeAgregar = piezaNombre.trim() !== '' && cantidadValida(piezaCantidad) !== null;

  const estadoActual = !valoracion ? FILTROS_VALORACION.SIN_VALORAR : valoracion.cargadaCesvi ? FILTROS_VALORACION.CARGADAS : FILTROS_VALORACION.SIN_CARGAR;
  const tag = estadoValoracionTag(estadoActual);

  const agregarPieza = () => {
    const nombre = piezaNombre.trim();
    const cantidad = cantidadValida(piezaCantidad);
    if (!nombre || cantidad === null) return;
    setPiezas((prev) => [
      ...prev,
      {
        id: idLocal('p'),
        pieza: nombre,
        accion: piezaAccion,
        gravedad: accionLlevaGravedad(piezaAccion) ? piezaGravedad : null,
        cantidad,
        observacion: null,
      },
    ]);
    setPiezaNombre('');
    setPiezaCantidad('1');
  };

  // Mientras se escribe se guarda el texto tal cual; se valida al guardar (y deshabilita el botón)
  const cambiarCantidad = (id, valor) => setPiezas((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: valor } : p)));

  const onNombreKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarPieza();
    }
  };

  const eliminarPieza = (id) => setPiezas((prev) => prev.filter((p) => p.id !== id));

  const agregarArchivos = (fileList) => {
    const archivos = Array.from(fileList || []);
    if (!archivos.length) return;
    const nuevas = archivos.map((file) => {
      const url = URL.createObjectURL(file);
      urlsNuevasRef.current.add(url);
      return { key: idLocal('f'), id: null, file, url, nombre: file.name };
    });
    setFotos((prev) => [...prev, ...nuevas]);
  };

  const eliminarFoto = (key) => {
    const foto = fotos.find((f) => f.key === key);
    if (!foto) return;
    if (foto.id) setFotosEliminadas((ids) => [...ids, foto.id]);
    if (foto.file && foto.url) {
      URL.revokeObjectURL(foto.url);
      urlsNuevasRef.current.delete(foto.url);
    }
    setFotos((prev) => prev.filter((f) => f.key !== key));
  };

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      const payload = {
        descripcion: descripcion.trim(),
        detalles: piezas.map((p) => ({
          pieza: p.pieza,
          accion: p.accion,
          gravedad: accionLlevaGravedad(p.accion) ? p.gravedad : null,
          cantidad: cantidadValida(p.cantidad),
          observacion: p.observacion ?? null,
        })),
      };
      const nuevas = fotos.filter((f) => f.file);
      const guardada = await valoracionService.guardarValoracion(orden.id, payload, !valoracion);
      if (nuevas.length) {
        await valoracionService.subirImagenes(guardada.id, nuevas.map((f) => f.file));
      }
      if (fotosEliminadas.length) {
        await Promise.all(fotosEliminadas.map((idImagen) => valoracionService.eliminarImagen(idImagen)));
      }
      const actualizada = await valoracionService.getValoracion(orden.id);
      onSaved(actualizada || guardada);
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
            <div className="hoja-pieza-campos">
              <div>
                <label htmlFor="hoja-pieza-nombre">NOMBRE DE LA PIEZA</label>
                <input
                  id="hoja-pieza-nombre"
                  value={piezaNombre}
                  onChange={(e) => setPiezaNombre(e.target.value)}
                  onKeyDown={onNombreKeyDown}
                  placeholder="Guardabarros delantero izquierdo"
                />
              </div>
              <div>
                <label htmlFor="hoja-pieza-cantidad">CANTIDAD</label>
                <input
                  id="hoja-pieza-cantidad"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={CANTIDAD_MAX}
                  step={1}
                  value={piezaCantidad}
                  onChange={(e) => setPiezaCantidad(e.target.value)}
                  onKeyDown={onNombreKeyDown}
                  aria-invalid={cantidadValida(piezaCantidad) === null}
                />
              </div>
            </div>
            <div className="hoja-segmento" role="group" aria-label="Acción sobre la pieza">
              {ACCIONES.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`hoja-seg-btn ${piezaAccion === a ? 'is-active' : ''}`}
                  aria-pressed={piezaAccion === a}
                  onClick={() => setPiezaAccion(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            {accionLlevaGravedad(piezaAccion) && (
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
            <Button block style={{ marginTop: 14 }} onClick={agregarPieza} disabled={!puedeAgregar}>
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
                    <div className="hoja-pieza-acciones">
                      <input
                        type="number"
                        className="hoja-pieza-cant"
                        inputMode="numeric"
                        min={1}
                        max={CANTIDAD_MAX}
                        step={1}
                        value={p.cantidad}
                        onChange={(e) => cambiarCantidad(p.id, e.target.value)}
                        aria-label={`Cantidad de ${p.pieza}`}
                        aria-invalid={cantidadValida(p.cantidad) === null}
                      />
                      <button type="button" className="hoja-pieza-del" aria-label={`Quitar ${p.pieza}`} onClick={() => eliminarPieza(p.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
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
                  <div className="hoja-foto-item" key={f.key}>
                    {f.url ? <img src={f.url} alt={f.nombre || 'Fotografía de la valoración'} /> : null}
                    <button type="button" className="hoja-foto-quitar" aria-label={`Quitar foto ${f.nombre || ''}`} onClick={() => eliminarFoto(f.key)}>
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
                : !cantidadesValidas
                  ? `Revisa las cantidades: deben ser números enteros entre 1 y ${CANTIDAD_MAX}.`
                  : 'Al guardar se genera el PDF de la hoja y el ZIP de fotografías.'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
