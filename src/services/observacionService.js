import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';
import { aFormData } from './multipart';
import { TIPO_OBSERVACION } from '../utils/constants';

// Adapta ObservacionResponseDto del backend a lo que usa TabObservaciones.
const observacionDesdeBackend = (o) => ({
  id: o.idObservacion,
  idOrden: o.idOrdenReparacion,
  idEtapa: o.idEtapa,
  etapa: o.nombreEtapa || 'Entrega', // ya viene la etiqueta: etapa, "Ingreso a cotizar", "Ingreso al taller" o "Entrega"
  tipo: o.tipo || (o.idEtapa ? TIPO_OBSERVACION.ETAPA : TIPO_OBSERVACION.ENTREGA),
  autor: o.autor,
  fecha: o.createAt,
  texto: o.nota,
  visibleCliente: o.visibleCliente,
  imagenes: (o.imagenes || []).map((i) => ({ id: i.id, url: i.url, nombre: i.nombre || '' })),
});

// [{ id, idOrden, idEtapa, etapa, tipo, autor, fecha, texto, visibleCliente, imagenes:[{id,url,nombre}] }]
export const getObservaciones = (idOrden) =>
  USE_MOCK
    ? mock.getObservaciones(idOrden)
    : http.get(`/orden/${idOrden}/observaciones`).then((lista) => lista.map(observacionDesdeBackend));

// { idOrden, tipo (TIPO_OBSERVACION), idEtapa (solo con tipo ETAPA), texto, notificar, entregada, archivos:[File] }
// Nota y fotos van en una sola petición multipart: si algo falla no se guarda nada.
// La ubicación (EN_TALLER) solo va con tipo ETAPA en una orden sin entregar: en una entregada el backend la rechaza (409).
export const crearObservacion = (data) => {
  const tipo = data.tipo || TIPO_OBSERVACION.ETAPA;
  const datos = {
    tipo,
    idEtapa: tipo === TIPO_OBSERVACION.ETAPA ? data.idEtapa : null,
    nota: data.texto,
    ...(tipo === TIPO_OBSERVACION.ETAPA && !data.entregada ? { ubicacion: 'EN_TALLER' } : {}),
    visibleCliente: !!data.notificar,
  };
  return USE_MOCK
    ? mock.crearObservacion({ ...data, tipo, idEtapa: datos.idEtapa }, getSessionUser())
    : http.post(`/orden/${data.idOrden}/observaciones`, aFormData(datos, data.archivos)).then(observacionDesdeBackend);
};

// Ya no se usa al crear una observación (las fotos viajan con la nota); se conserva porque el backend mantiene la ruta.
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
// [{ id, tipo ('valoracion'|'observacion'), url, nombre, origen ('Valoración' | nombre de etapa | 'Ingreso a cotizar' | 'Ingreso al taller' | 'Entrega'), fecha }]
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
          autor: f.autor || '',
          rol: f.rol || '',
          fecha: f.fecha,
        }))
      );
