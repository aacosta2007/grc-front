import http from './httpClient';

// ─────────────────────────────────────────────────────────────────────────
// Técnicos está conectado al backend real (Spring Boot ·
// GestionReparabilidadColision, http://localhost:8080/api).
//
// El backend expone Tecnico así (hereda documento/celular/correo de Persona):
//   { idPersona, documento, nombreCompleto, celular, correo, especialidad,
//     activo, createAt, updateAt, enCurso }
// Endpoints:
//   GET    /tecnico                             → activos
//   GET    /tecnico/desactivados                → inactivos
//   GET    /tecnico/{id}
//   GET    /tecnico/especialidad/{especialidad} → activos por especialidad
//   POST   /tecnico
//   PUT    /tecnico/{id}                         → nombre/celular/correo/especialidad
//   DELETE /tecnico/{id}                         → desactivar (borrado lógico)
//   PATCH  /tecnico/{id}/reactivar               → reactivar
//
// Este archivo adapta esa forma a la que usa el resto del front:
//   { id, nombre, documento, celular, correo, especialidad, activo, enCurso }
// ─────────────────────────────────────────────────────────────────────────

const desdeBackend = (t) => ({
  id: t.idPersona,
  nombre: t.nombreCompleto,
  documento: t.documento,
  celular: t.celular,
  correo: t.correo,
  especialidad: t.especialidad,
  activo: t.activo,
  enCurso: t.enCurso ?? 0,
});

export async function getTecnicos({ incluirInactivos = false } = {}) {
  const activos = (await http.get('/tecnico')).map(desdeBackend);
  if (!incluirInactivos) return activos;
  const inactivos = (await http.get('/tecnico/desactivados')).map(desdeBackend);
  return [...activos, ...inactivos];
}

export async function getTecnicosPorEspecialidad(especialidad) {
  const lista = await http.get(`/tecnico/especialidad/${especialidad}`);
  return lista.map(desdeBackend);
}

// { nombre, documento, celular, especialidad } (sin correo: no se pide en este formulario)
export async function crearTecnico(data) {
  const creado = await http.post('/tecnico', {
    documento: data.documento,
    nombreCompleto: data.nombre,
    celular: data.celular,
    correo: null,
    especialidad: data.especialidad,
  });
  return desdeBackend(creado);
}

export async function actualizarTecnico(id, data) {
  const actual = await http.get(`/tecnico/${id}`);
  const actualizado = await http.put(`/tecnico/${id}`, {
    nombreCompleto: data.nombre,
    celular: data.celular,
    correo: actual.correo,
    especialidad: data.especialidad,
  });
  return desdeBackend(actualizado);
}

// "Eliminar" = desactivar (borrado lógico en el backend).
export const desactivarTecnico = (id) => http.delete(`/tecnico/${id}`);

export const reactivarTecnico = (id) =>
  http.patch(`/tecnico/${id}/reactivar`).then(desdeBackend);
