import http from './httpClient';

// ─────────────────────────────────────────────────────────────────────────
// Usuarios está conectado al backend real (Spring Boot ·
// GestionReparabilidadColision, http://localhost:8080/api).
//
// El backend expone Usuario así:
//   { idUsuario, nombre, email, rol, activo }
// Endpoints:
//   GET    /usuario                → activos
//   GET    /usuario/desactivados   → inactivos
//   GET    /usuario/{id}
//   POST   /usuario
//   PUT    /usuario/{id}           → nombre/email/rol (+ password opcional)
//   DELETE /usuario/{id}           → desactivar (borrado lógico)
//   PATCH  /usuario/{id}/reactivar → reactivar
//
// Este archivo adapta esa forma a la que usa el resto del front:
//   { id, nombre, correo, rol, activo }
// ─────────────────────────────────────────────────────────────────────────

const desdeBackend = (u) => ({
  id: u.idUsuario,
  nombre: u.nombre,
  correo: u.email,
  rol: u.rol,
  activo: u.activo,
});

export async function getUsuarios({ incluirInactivos = false } = {}) {
  const activos = (await http.get('/usuario')).map(desdeBackend);
  if (!incluirInactivos) return activos;
  const inactivos = (await http.get('/usuario/desactivados')).map(desdeBackend);
  return [...activos, ...inactivos];
}

// { nombre, correo, rol, password }
export async function crearUsuario(data) {
  const creado = await http.post('/usuario', {
    nombre: data.nombre,
    email: data.correo,
    rol: data.rol,
    password: data.password,
  });
  return desdeBackend(creado);
}

// password opcional: si no viene, el backend conserva la actual.
export async function actualizarUsuario(id, data) {
  const body = {
    nombre: data.nombre,
    email: data.correo,
    rol: data.rol,
  };
  if (data.password) body.password = data.password;
  const actualizado = await http.put(`/usuario/${id}`, body);
  return desdeBackend(actualizado);
}

// "Eliminar" = desactivar (borrado lógico en el backend).
export const desactivarUsuario = (id) => http.delete(`/usuario/${id}`);

export const reactivarUsuario = (id) =>
  http.patch(`/usuario/${id}/reactivar`).then(desdeBackend);
