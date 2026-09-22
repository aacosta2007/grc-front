import http from './httpClient';
import * as mock from './mock/mockApi';

// ─────────────────────────────────────────────────────────────────────────
// Técnicos es, por ahora, el único módulo conectado al backend real
// (Spring Boot · proyecto GestionReparabilidadColision, http://localhost:8080/api).
// El resto de la app sigue usando la API simulada (REACT_APP_USE_MOCK=true),
// así que estas funciones NO se gatean con USE_MOCK: hablan siempre contra
// /api/tecnico.
//
// El backend expone Tecnico así (hereda documento/celular/correo de Persona):
//   { idPersona, documento, nombreCompleto, celular, correo, especialidad,
//     activo, createAt, updateAt, usuario }
// con 5 endpoints: GET /tecnico, GET /tecnico/{id}, POST /tecnico,
// PUT /tecnico/{id} (reemplaza nombreCompleto/celular/correo/especialidad/activo;
// documento no se puede editar) y DELETE /tecnico/{id} (borrado físico).
// No hay endpoint de "desactivar/reactivar" ni filtro por especialidad: se
// resuelven aquí mismo. Este archivo adapta esa forma a la que ya usa el
// resto del front: { id, nombre, documento, celular, correo, especialidad, activo, enCurso }.
// ─────────────────────────────────────────────────────────────────────────

const desdeBackend = (t) => ({
  id: t.idPersona,
  nombre: t.nombreCompleto,
  documento: t.documento,
  celular: t.celular,
  correo: t.correo,
  especialidad: t.especialidad,
  activo: t.activo,
  // El backend todavía no expone historial de etapas: no hay forma de calcular
  // los trabajos en curso reales. Queda en 0 hasta que exista ese endpoint.
  enCurso: 0,
});

export async function getTecnicos({ incluirInactivos = false } = {}) {
  const lista = await http.get('/tecnico');
  const tecnicos = lista.map(desdeBackend);
  return incluirInactivos ? tecnicos : tecnicos.filter((t) => t.activo);
}

// Se mantiene en la API simulada a propósito: la usa el modal de cambio de
// etapa (Backlog/Ficha), que todavía trabaja con las órdenes y técnicos de
// ejemplo. Conectarla ya al backend real mezclaría IDs de dos fuentes de
// datos distintas (colisión entre ids 1-8 simulados y los reales) y podría
// asignar el técnico equivocado a una etapa. Se conecta cuando el módulo de
// Órdenes también hable con el backend real.
export const getTecnicosPorEspecialidad = (especialidad) => mock.getTecnicosPorEspecialidad(especialidad);

// { nombre, documento, celular, especialidad } (sin correo: no se pide en este formulario)
export async function crearTecnico(data) {
  const ahora = new Date().toISOString();
  const creado = await http.post('/tecnico', {
    documento: data.documento,
    nombreCompleto: data.nombre,
    celular: data.celular,
    correo: null,
    especialidad: data.especialidad,
    activo: true,
    // El backend declara createAt/updateAt NOT NULL pero no los rellena solo
    // (Tecnico.java no tiene @PrePersist/@PreUpdate): sin esto, el POST
    // responde 500. Ideal a futuro: que el backend los complete él mismo.
    createAt: ahora,
    updateAt: ahora,
  });
  return desdeBackend(creado);
}

export async function actualizarTecnico(id, data) {
  const actual = await http.get(`/tecnico/${id}`);
  const actualizado = await http.put(`/tecnico/${id}`, {
    nombreCompleto: data.nombre,
    celular: data.celular,
    correo: null,
    especialidad: data.especialidad,
    activo: actual.activo, // una edición normal no cambia el estado activo/inactivo
  });
  return desdeBackend(actualizado);
}

async function setActivo(id, activo) {
  const actual = await http.get(`/tecnico/${id}`);
  const actualizado = await http.put(`/tecnico/${id}`, {
    nombreCompleto: actual.nombreCompleto,
    celular: actual.celular,
    correo: actual.correo,
    especialidad: actual.especialidad,
    activo,
  });
  return desdeBackend(actualizado);
}

// "Eliminar" = desactivar. El backend solo ofrece borrado físico (DELETE);
// no lo usamos aquí para no perder el registro ni su historial.
export const desactivarTecnico = (id) => setActivo(id, false);
export const reactivarTecnico = (id) => setActivo(id, true);
