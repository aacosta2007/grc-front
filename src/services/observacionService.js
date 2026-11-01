import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// Adapta ObservacionResponseDto del backend a lo que usa TabObservaciones.
const observacionDesdeBackend = (o) => ({
  id: o.idObservacion,
  idOrden: o.idOrdenReparacion,
  idEtapa: o.idEtapa,
  etapa: o.nombreEtapa,
  autor: o.autor,
  fecha: o.createAt,
  texto: o.nota,
  visibleCliente: o.visibleCliente,
  imagenes: (o.imagenes || []).map((i) => ({ id: i.id, url: i.url, nombre: i.nombre || '' })),
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

// Sube fotos nuevas (multipart) a una observación ya creada y devuelve las imágenes guardadas.
export async function subirImagenes(idObservacion, archivos) {
  const form = new FormData();
  archivos.forEach((archivo) => form.append('archivos', archivo));
  const imagenes = await http.post(`/observacion/${idObservacion}/imagenes`, form);
  return imagenes.map((i) => ({ id: i.id, url: i.url, nombre: i.nombre || '' }));
}

// La descarga exige token, por eso se pide como blob y se previsualiza con un object URL.
export const getImagenBlob = (idImagen) =>
  http.get(`/observacion/imagenes/${idImagen}`, { responseType: 'blob' });

// Descarga una foto de la galería según su origen (valoración u observación).
export const getFotoBlob = (tipo, id) =>
  http.get(`${tipo === 'valoracion' ? '/valoracion' : '/observacion'}/imagenes/${id}`, { responseType: 'blob' });

// Galería consolidada de solo lectura:
// [{ id, tipo ('valoracion'|'observacion'), url, nombre, origen ('Valoración' | nombre de etapa), fecha }]
export const getFotosOrden = (idOrden) =>
  USE_MOCK
    ? mock.getFotosOrden(idOrden)
    : http.get(`/orden/${idOrden}/fotos`).then((lista) =>
        lista.map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: f.url,
          nombre: f.nombre || '',
          origen: f.origen,
          fecha: f.fecha,
        }))
      );
