import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// filtro: valor de FILTROS_VALORACION → vistas de orden
export const getOrdenesPorFiltro = (filtro) =>
  USE_MOCK ? mock.getOrdenesPorFiltroValoracion(filtro) : http.get('/valoraciones/ordenes', { params: { filtro } });

// { 'Sin valorar': n, 'Sin cargar a CESVI': n, 'Cargadas a CESVI': n }
export const getConteo = () => (USE_MOCK ? mock.getConteoValoracion() : http.get('/valoraciones/conteo'));

// { id, idOrden, descripcion, detalles:[{id,pieza,accion,gravedad}], imagenes:[{id,url,nombre}],
//   cargadaCesvi, cargadaCesviAt, usuario, creadaAt, actualizadaAt } | null
export const getValoracion = (idOrden) =>
  USE_MOCK ? mock.getValoracion(idOrden) : http.get(`/ordenes/${idOrden}/valoracion`);

// Guardado único: { descripcion, detalles:[{pieza,accion,gravedad}], imagenes:[{url,nombre}] }
export const guardarValoracion = (idOrden, data) =>
  USE_MOCK ? mock.guardarValoracion(idOrden, data, getSessionUser()) : http.put(`/ordenes/${idOrden}/valoracion`, data);

export const marcarCargadaCesvi = (idOrden) =>
  USE_MOCK ? mock.marcarCargadaCesvi(idOrden) : http.post(`/ordenes/${idOrden}/valoracion/cesvi`);
