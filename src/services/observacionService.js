import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// Adapta ObservacionResponseDto del backend a lo que usa TabObservaciones.
// El backend todavía no guarda fotos (solo devuelve cantidadImagenes).
const observacionDesdeBackend = (o) => ({
  id: o.idObservacion,
  idOrden: o.idOrdenReparacion,
  idEtapa: o.idEtapa,
  etapa: o.nombreEtapa,
  autor: o.autor,
  fecha: o.createAt,
  texto: o.nota,
  visibleCliente: o.visibleCliente,
  imagenes: [],
});

// [{ id, idOrden, idEtapa, etapa, autor, fecha, texto, visibleCliente, imagenes:[{id,url,nombre}] }]
export const getObservaciones = (idOrden) =>
  USE_MOCK
    ? mock.getObservaciones(idOrden)
    : http.get(`/orden/${idOrden}/observaciones`).then((lista) => lista.map(observacionDesdeBackend));

// { idOrden, idEtapa (solo etapas visitadas), texto, imagenes:[{url,nombre}], notificar }
export const crearObservacion = (data) =>
  USE_MOCK
    ? mock.crearObservacion(data, getSessionUser())
    : http
        .post(`/orden/${data.idOrden}/observaciones`, {
          idEtapa: data.idEtapa,
          nota: data.texto,
          ubicacion: 'EN_TALLER',
          visibleCliente: data.notificar,
        })
        .then(observacionDesdeBackend);

// Galería consolidada de solo lectura:
// [{ id, url, nombre, origen ('Valoración' | nombre de etapa), fecha }]
export const getFotosOrden = (idOrden) =>
  USE_MOCK ? mock.getFotosOrden(idOrden) : http.get(`/ordenes/${idOrden}/fotos`);
