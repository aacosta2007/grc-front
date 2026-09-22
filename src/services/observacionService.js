import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// [{ id, idOrden, idEtapa, etapa, autor, fecha, texto, visibleCliente, imagenes:[{id,url,nombre}] }]
export const getObservaciones = (idOrden) =>
  USE_MOCK ? mock.getObservaciones(idOrden) : http.get(`/ordenes/${idOrden}/observaciones`);

// { idOrden, idEtapa (solo etapas visitadas), texto, imagenes:[{url,nombre}], notificar }
export const crearObservacion = (data) =>
  USE_MOCK ? mock.crearObservacion(data, getSessionUser()) : http.post(`/ordenes/${data.idOrden}/observaciones`, data);

// Galería consolidada de solo lectura:
// [{ id, url, nombre, origen ('Valoración' | nombre de etapa), fecha }]
export const getFotosOrden = (idOrden) =>
  USE_MOCK ? mock.getFotosOrden(idOrden) : http.get(`/ordenes/${idOrden}/fotos`);
