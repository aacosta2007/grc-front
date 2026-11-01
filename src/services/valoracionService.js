import http from './httpClient';
import { ordenDesdeBackend } from './ordenService';
import { ACCION_PIEZA, FILTROS_VALORACION, accionLlevaGravedad } from '../utils/constants';

const ACCION_A_BACK = { [ACCION_PIEZA.REPARAR]: 'REPARACION', [ACCION_PIEZA.SUSTITUIR]: 'SUSTITUCION', [ACCION_PIEZA.PINTAR]: 'PINTAR' };
const ACCION_DESDE_BACK = { REPARACION: ACCION_PIEZA.REPARAR, SUSTITUCION: ACCION_PIEZA.SUSTITUIR, PINTAR: ACCION_PIEZA.PINTAR };

const GRAVEDAD_A_BACK = { LEVE: 'LEVE', MEDIA: 'MEDIO', GRAVE: 'FUERTE' };
const GRAVEDAD_DESDE_BACK = { LEVE: 'LEVE', MEDIO: 'MEDIA', FUERTE: 'GRAVE' };

const FILTRO_A_BACK = {
  [FILTROS_VALORACION.SIN_VALORAR]: 'SIN_VALORAR',
  [FILTROS_VALORACION.SIN_CARGAR]: 'SIN_CARGAR',
  [FILTROS_VALORACION.CARGADAS]: 'CARGADAS',
};

const desdeBackend = (v) => ({
  id: v.idValoracion,
  idOrden: v.idOrdenReparacion,
  descripcion: v.descripcionGeneral || '',
  detalles: (v.detalles || []).map((d) => ({
    id: d.idValoracionDetalle,
    pieza: d.pieza,
    accion: ACCION_DESDE_BACK[d.accion],
    gravedad: d.gravedad ? GRAVEDAD_DESDE_BACK[d.gravedad] : null,
    cantidad: d.cantidad,
    observacion: d.observacion,
  })),
  imagenes: (v.imagenes || []).map((i) => ({
    id: i.id,
    url: i.url,
    nombre: i.descripcion || '',
  })),
  cargadaCesvi: v.cargadaCesvi,
  cargadaCesviAt: v.cargadaCesviAt,
  usuario: v.autor,
  creadaAt: v.createAt,
  actualizadaAt: v.updateAt,
});

const aBackend = (data) => ({
  descripcionGeneral: data.descripcion,
  detalles: data.detalles.map((d) => ({
    pieza: d.pieza,
    accion: ACCION_A_BACK[d.accion],
    gravedad: accionLlevaGravedad(d.accion) ? GRAVEDAD_A_BACK[d.gravedad] : null,
    // El PUT reemplaza la hoja completa: si no se mandan, la cantidad vuelve a 1 y la observación se pierde
    cantidad: d.cantidad ?? 1,
    observacion: d.observacion ?? null,
  })),
});

// filtro: valor de FILTROS_VALORACION → vistas de orden
export async function getOrdenesPorFiltro(filtro) {
  const ordenes = await http.get('/valoracion/ordenes', { params: { filtro: FILTRO_A_BACK[filtro] } });
  // El backend no manda el estado de valoración, pero es justo el filtro pedido.
  return ordenes.map((o) => ({ ...ordenDesdeBackend(o), estadoValoracion: filtro }));
}

// { 'Sin valorar': n, 'Sin cargar a CESVI': n, 'Cargadas a CESVI': n }
export async function getConteo() {
  const c = await http.get('/valoracion/conteo');
  return {
    [FILTROS_VALORACION.SIN_VALORAR]: c.sinValorar,
    [FILTROS_VALORACION.SIN_CARGAR]: c.sinCargar,
    [FILTROS_VALORACION.CARGADAS]: c.cargadas,
  };
}

// Valoración de la orden, o null si todavía no tiene (el backend responde 404).
export async function getValoracion(idOrden) {
  try {
    return desdeBackend(await http.get(`/orden/${idOrden}/valoracion`));
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// { descripcion, detalles:[{pieza,accion,gravedad}], imagenes } — esNueva decide POST (crear) o PUT (editar).
// El PUT reemplaza la hoja completa: hay que mandar todas las piezas, no solo las nuevas.
export async function guardarValoracion(idOrden, data, esNueva) {
  const url = `/orden/${idOrden}/valoracion`;
  const guardada = esNueva ? await http.post(url, aBackend(data)) : await http.put(url, aBackend(data));
  return desdeBackend(guardada);
}

export const marcarCargadaCesvi = (idOrden) =>
  http.patch(`/orden/${idOrden}/valoracion/cesvi`).then(desdeBackend);

// Sube fotos nuevas (multipart) a una valoración ya creada y devuelve las imágenes guardadas.
export async function subirImagenes(idValoracion, archivos) {
  const form = new FormData();
  archivos.forEach((archivo) => form.append('archivos', archivo));
  const imagenes = await http.post(`/valoracion/${idValoracion}/imagenes`, form);
  return imagenes.map((i) => ({ id: i.id, url: i.url, nombre: i.descripcion || '' }));
}

export const eliminarImagen = (idImagen) => http.delete(`/valoracion/imagenes/${idImagen}`);

// La descarga exige token, por eso se pide como blob y se previsualiza con un object URL.
export const getImagenBlob = (idImagen) =>
  http.get(`/valoracion/imagenes/${idImagen}`, { responseType: 'blob' });
