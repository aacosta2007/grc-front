import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';
import { getSessionUser } from './session';
import { COLUMNA_ASIGNADO, ESTADO_ORDEN, ETAPA_ENTREGADO_ID, getEtapa } from '../utils/constants';
import { diffDias } from '../utils/format';

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
    estado: o.estado === 'CERRADA' ? ESTADO_ORDEN.ENTREGADA : o.estado, // el backend la llama CERRADA
    ubicacionActual: o.ubicacionActual,
    idEtapaActual: o.idEtapaActual,
    etapaActual: o.nombreEtapaActual,
    fechaCreacion: o.createAt,
    fechaIngresoCotizar: o.fechaIngresoCotizar,
    fechaIngresoReparacion: o.fechaIngresoReparacion,
    diasEstimadoEntrega: o.diasEstimadoEntrega,
    fechaEntregaEstimada: o.fechaDeEntregaEstimada,
    fechaEntregaReal: o.fechaDeEntregaReal,
    asesor: o.asesor,
    creador: o.usuarioCreador,
  };
};

// LocalDate de hoy en hora local ("YYYY-MM-DD"). toISOString() está en UTC: después de
// las 7 p. m. en Colombia ya sería "mañana" y el backend la rechaza por futura.
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const etapasVisitadasDe = (historial) => [...new Set(historial.map((h) => h.idEtapa))];

export const getOrdenes = () => (USE_MOCK ? mock.getOrdenes() : http.get('/ordenes'));

// La orden del backend + etapasVisitadas (sale del historial; el backend no la da).
export const getOrden = async (idOrden) => {
  if (USE_MOCK) return mock.getOrden(idOrden);
  const [orden, historial] = await Promise.all([http.get(`/orden/${idOrden}`), getHistorialEtapas(idOrden)]);
  return { ...ordenDesdeBackend(orden), etapasVisitadas: etapasVisitadasDe(historial) };
};

// Orden más reciente (activa si existe) de una placa, o null.
// El backend devuelve todas las órdenes de la placa (lista vacía si no hay).
export const buscarOrdenPorPlaca = async (placa) => {
  if (USE_MOCK) return mock.buscarOrdenPorPlaca(placa);
  const ordenes = await http.get(`/orden/placa/${encodeURIComponent(placa)}`);
  if (!ordenes.length) return null;
  const elegida = ordenes.find((o) => o.estado === 'ACTIVA') || ordenes[0];
  return ordenDesdeBackend(elegida);
};

// Tablero: órdenes activas con ingreso al taller (columna "Asignado" o la de su etapa).
export const getOrdenesKanban = async () => {
  if (USE_MOCK) return mock.getOrdenesKanban();
  const activas = await http.get('/orden');
  const enTaller = activas.filter((o) => o.fechaIngresoReparacion);
  return Promise.all(
    enTaller.map(async (o) => {
      const orden = ordenDesdeBackend(o);
      const historial = await getHistorialEtapas(orden.id);
      const ultima = historial[historial.length - 1] || null;
      const fechaInicioEtapa = ultima ? ultima.fechaInicio : orden.fechaIngresoReparacion;
      const alertas = mock.calcularAlertas(orden, ultima);
      return {
        ...orden,
        columna: orden.idEtapaActual ? getEtapa(orden.idEtapaActual)?.nombre : COLUMNA_ASIGNADO.nombre,
        etapasVisitadas: etapasVisitadasDe(historial),
        tecnicoActual: ultima && ultima.fechaFin === null ? ultima.tecnico : null,
        fechaInicioEtapa,
        diasEnEtapa: diffDias(fechaInicioEtapa),
        alertas,
        alerta: alertas.vencido ? 'vencido' : alertas.critico ? 'critico' : alertas.proximo ? 'proximo' : 'normal',
      };
    })
  );
};

// [{ id, idOrden, idEtapa, etapa, tecnico:{id,nombre}|null, usuario, fechaInicio, fechaFin }]
// Sale de OrdenEtapaFecha (GET /orden/{id}/etapas): trae el técnico y la fecha de fin reales.
export const getHistorialEtapas = async (idOrden) => {
  if (USE_MOCK) return mock.getHistorialEtapas(idOrden);
  const lista = await http.get(`/orden/${idOrden}/etapas`);
  return lista.map((e) => ({
    id: e.idOrdenEtapaFecha,
    idOrden: e.idOrdenReparacion,
    idEtapa: e.idEtapa,
    etapa: e.nombreEtapa,
    tecnico: e.idTecnico ? { id: e.idTecnico, nombre: e.nombreTecnico } : null,
    usuario: null,
    fechaInicio: e.fechaInicio,
    fechaFin: e.fechaFin,
  }));
};

// Las acciones de la ficha devuelven la orden completa (con etapasVisitadas): la respuesta
// del PATCH no la trae y, si se usara tal cual, las etapas visitadas volverían a PENDIENTE.
const patchYRecargar = async (idOrden, ruta, body) => {
  await http.patch(`/orden/${idOrden}/${ruta}`, body);
  return getOrden(idOrden);
};

// { idOrden, idEtapa, idTecnico (null solo en etapas sin técnico), nota, notificar }
export const cambiarEtapa = (data) =>
  USE_MOCK
    ? mock.cambiarEtapa(data, getSessionUser())
    : patchYRecargar(data.idOrden, 'etapa', {
        idEtapaDestino: data.idEtapa,
        idTecnico: data.idTecnico,
        nota: data.nota,
        visibleCliente: data.notificar,
      });

export const marcarIngresoCotizar = (idOrden) =>
  USE_MOCK ? mock.marcarIngresoCotizar(idOrden) : patchYRecargar(idOrden, 'ingreso-cotizar', { fecha: hoyLocal() });

export const marcarIngresoReparacion = (idOrden) =>
  USE_MOCK ? mock.marcarIngresoReparacion(idOrden) : patchYRecargar(idOrden, 'ingreso-reparacion', { fecha: hoyLocal() });

export const marcarDiasEstimados = (idOrden, dias) =>
  USE_MOCK ? mock.marcarDiasEstimados(idOrden, dias) : patchYRecargar(idOrden, 'dias-estimados', { dias });

// { idOrden, nota, notificar } · cierra la orden (CERRADA), marca la fecha de entrega real y la
// deja fuera del taller. La nota, si viene, queda como observación de "Entrega".
export const entregarOrden = (data) =>
  USE_MOCK
    ? mock.cambiarEtapa({ ...data, idEtapa: ETAPA_ENTREGADO_ID, idTecnico: null }, getSessionUser())
    : patchYRecargar(data.idOrden, 'entregar-orden', { nota: data.nota, visibleCliente: data.notificar });

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
