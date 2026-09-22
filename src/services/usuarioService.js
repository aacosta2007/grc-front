import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';

// [{ id, nombre, correo, rol, activo }]
export const getUsuarios = () => (USE_MOCK ? mock.getUsuarios() : http.get('/usuarios'));

// { nombre, correo, rol (ADMIN|ASESOR|GERENTE), password }
export const crearUsuario = (data) => (USE_MOCK ? mock.crearUsuario(data) : http.post('/usuarios', data));

// password opcional: vacío = no cambiar
export const actualizarUsuario = (id, data) =>
  USE_MOCK ? mock.actualizarUsuario(id, data) : http.put(`/usuarios/${id}`, data);

// "Eliminar" = desactivar
export const desactivarUsuario = (id) =>
  USE_MOCK ? mock.setUsuarioActivo(id, false) : http.patch(`/usuarios/${id}/desactivar`);

export const reactivarUsuario = (id) =>
  USE_MOCK ? mock.setUsuarioActivo(id, true) : http.patch(`/usuarios/${id}/reactivar`);
