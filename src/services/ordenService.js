import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// Todas las funciones de órdenes devuelven la "vista de orden" enriquecida
// (ver src/services/README.md).

export const getOrdenes = () => (USE_MOCK ? mock.getOrdenes() : http.get('/ordenes'));

export const getOrden = (idOrden) => (USE_MOCK ? mock.getOrden(idOrden) : http.get(`/ordenes/${idOrden}`));

// Orden más reciente (activa si existe) de una placa, o null
export const buscarOrdenPorPlaca = (placa) =>
  USE_MOCK ? mock.buscarOrdenPorPlaca(placa) : http.get('/ordenes/buscar', { params: { placa } });

// Órdenes visibles en el tablero (columna Asignado + 10 etapas)
export const getOrdenesKanban = () => (USE_MOCK ? mock.getOrdenesKanban() : http.get('/ordenes/kanban'));

// [{ id, idOrden, idEtapa, etapa, tecnico:{id,nombre}|null, usuario, fechaInicio, fechaFin }]
export const getHistorialEtapas = (idOrden) =>
  USE_MOCK ? mock.getHistorialEtapas(idOrden) : http.get(`/ordenes/${idOrden}/historial`);

// { idOrden, idEtapa, idTecnico (null solo en etapas sin técnico), nota, notificar }
export const cambiarEtapa = (data) =>
  USE_MOCK ? mock.cambiarEtapa(data, getSessionUser()) : http.post(`/ordenes/${data.idOrden}/cambiar-etapa`, data);

export const marcarIngresoCotizar = (idOrden) =>
  USE_MOCK ? mock.marcarIngresoCotizar(idOrden) : http.post(`/ordenes/${idOrden}/ingreso-cotizar`);

export const marcarIngresoReparacion = (idOrden) =>
  USE_MOCK ? mock.marcarIngresoReparacion(idOrden) : http.post(`/ordenes/${idOrden}/ingreso-reparacion`);

export const marcarDiasEstimados = (idOrden, dias) =>
  USE_MOCK ? mock.marcarDiasEstimados(idOrden, dias) : http.post(`/ordenes/${idOrden}/dias-estimados`, { dias });

// ── Nueva orden ──

// { vehiculo:{id,placa,marca,modelo,anio,color,vin,idCliente}, cliente:{...} } | null
export const buscarVehiculoPorPlaca = (placa) =>
  USE_MOCK ? mock.buscarVehiculoPorPlaca(placa) : http.get(`/vehiculos/${placa}`);

// { id, nombre, documento, celular, correo } | null
export const buscarClientePorDocumento = (documento) =>
  USE_MOCK ? mock.buscarClientePorDocumento(documento) : http.get(`/clientes/${documento}`);

// { placa, idCliente?, cliente?: {documento,nombre,celular,correo}, vehiculo?: {marca,modelo,anio,color,vin} }
export const crearOrden = (payload) =>
  USE_MOCK ? mock.crearOrden(payload, getSessionUser()) : http.post('/ordenes', payload);
