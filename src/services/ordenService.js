import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';

// Todas las funciones de órdenes devuelven la "vista de orden" enriquecida
// (ver src/services/README.md).

// Adapta OrdenReparacionResponseDto del backend a la vista de orden. Por ahora solo
// llena los campos que el backend ya da (sin alertas, técnico actual ni días en etapa).
export const ordenDesdeBackend = (o) => {
  const v = o.vehiculo || {};
  const c = o.cliente || {};
  return {
    id: o.idOrdenReparacion,
    numero: o.idOrdenReparacion,
    placa: v.placa,
    vehiculo: { id: v.idVehiculo, marca: v.marca, modelo: v.modelo, anio: v.anio, color: v.color, vin: v.vin },
    vehiculoTexto: [`${v.marca || ''} ${v.modelo || ''}`.trim(), v.anio].filter(Boolean).join(' · '),
    cliente: { id: c.idPersona, nombre: c.nombreCompleto, documento: c.documento, celular: c.celular, correo: c.correo },
    estado: o.estado,
    ubicacionActual: o.ubicacionActual,
    idEtapaActual: o.idEtapaActual,
    etapaActual: o.nombreEtapaActual,
    fechaCreacion: o.createAt,
    fechaIngresoCotizar: o.fechaIngresoCotizar,
    fechaIngresoReparacion: o.fechaIngresoReparacion,
    diasEstimadoEntrega: o.diasEstimadoEntrega,
    fechaEntregaEstimada: o.fechaDeEntregaEstimada,
    asesor: o.asesor,
    creador: o.usuarioCreador,
  };
};

export const getOrdenes = () => (USE_MOCK ? mock.getOrdenes() : http.get('/ordenes'));

export const getOrden = (idOrden) =>
  USE_MOCK ? mock.getOrden(idOrden) : http.get(`/orden/${idOrden}`).then(ordenDesdeBackend);

// Orden más reciente (activa si existe) de una placa, o null.
// El backend devuelve todas las órdenes de la placa (lista vacía si no hay).
export const buscarOrdenPorPlaca = async (placa) => {
  if (USE_MOCK) return mock.buscarOrdenPorPlaca(placa);
  const ordenes = await http.get(`/orden/placa/${encodeURIComponent(placa)}`);
  if (!ordenes.length) return null;
  const elegida = ordenes.find((o) => o.estado === 'ACTIVA') || ordenes[0];
  return ordenDesdeBackend(elegida);
};

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

// GET /vehiculo/placa/{placa} →
//   { vehiculo:{id,placa,marca,modelo,anio,color,vin}, cliente:{id,nombre,documento,celular,correo}|null } | null
export const buscarVehiculoPorPlaca = async (placa) => {
  try {
    const v = await http.get(`/vehiculo/placa/${placa}`);
    return {
      vehiculo: {
        id: v.idVehiculo,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        color: v.color,
        vin: v.vin,
      },
      cliente: v.cliente
        ? {
            id: v.cliente.idPersona,
            nombre: v.cliente.nombreCompleto,
            documento: v.cliente.documento,
            celular: v.cliente.celular,
            correo: v.cliente.correo,
          }
        : null,
    };
  } catch (err) {
    if (err.status === 404) return null; // placa no registrada → el wizard pide crearla
    throw err;
  }
};

// GET /cliente/documento/{documento} → { id, nombre, documento, celular, correo } | null
export const buscarClientePorDocumento = async (documento) => {
  try {
    const c = await http.get(`/cliente/documento/${documento}`);
    return {
      id: c.idPersona,
      nombre: c.nombreCompleto,
      documento: c.documento,
      celular: c.celular,
      correo: c.correo,
    };
  } catch (err) {
    if (err.status === 404) return null; // documento no registrado → el wizard pide crearlo
    throw err;
  }
};

// { placa, idCliente?, cliente?: {documento,nombre,celular,correo}, vehiculo?: {marca,modelo,anio,color,vin} }
// El backend crea el cliente y/o el vehículo si vienen en el payload, y luego la orden (transaccional).
export const crearOrden = async (payload) => {
  const body = { placa: payload.placa };
  if (payload.idCliente) body.idCliente = payload.idCliente;
  if (payload.cliente) {
    body.cliente = {
      documento: payload.cliente.documento,
      nombreCompleto: payload.cliente.nombre,
      celular: payload.cliente.celular,
      correo: payload.cliente.correo || null,
    };
  }
  if (payload.vehiculo) {
    body.vehiculo = {
      marca: payload.vehiculo.marca,
      modelo: payload.vehiculo.modelo,
      anio: payload.vehiculo.anio ?? null,
      color: payload.vehiculo.color,
      vin: payload.vehiculo.vin || null,
    };
  }
  const orden = await http.post('/orden/nueva', body);
  return { id: orden.idOrdenReparacion };
};
