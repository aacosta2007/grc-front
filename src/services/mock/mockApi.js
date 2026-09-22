// Implementación simulada de la API REST. Replica las reglas de negocio del
// análisis de requisitos para que el front pueda probarse sin backend.
import { db, persist, nextId, delay } from './db';
import {
  ETAPA_ENTREGADO_ID, UBICACION, ESTADO_ORDEN, ETAPAS_CARGA,
  DIAS_PROXIMO_A_VENCER, ACCION_PIEZA, FILTROS_VALORACION, ROLES_ASIGNABLES,
  getEtapa, etapaRequiereTecnico,
} from '../../utils/constants';
import { diffDias, addDias } from '../../utils/format';

const clone = (x) => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const usuarioPublico = ({ password, ...u }) => u;
const nombreUsuario = (id) => (db.usuarios.find((u) => u.id === id) || {}).nombre || '—';
const tecnicoMin = (id) => {
  const t = db.tecnicos.find((x) => x.id === id);
  return t ? { id: t.id, nombre: t.nombre, activo: t.activo, especialidad: t.especialidad } : null;
};

function registrarMovimiento(orden, tipo, texto) {
  const veh = db.vehiculos.find((v) => v.id === orden.idVehiculo);
  db.movimientos.unshift({
    id: nextId(db.movimientos), fecha: now(), idOrden: orden.id, placa: veh ? veh.placa : '', tipo, texto,
  });
}

function notificarCliente(orden, mensaje) {
  // Fase asíncrona simulada (@Async en el backend): un fallo no revierte el cambio.
  db.notificaciones.push({ id: nextId(db.notificaciones), idOrden: orden.id, mensaje, estado: 'ENVIADO', fecha: now() });
}

// ─────────────────────────── Vista enriquecida de orden ───────────────────────────

export function calcularAlertas(orden, etapaAbierta) {
  const entregado = orden.idEtapaActual === ETAPA_ENTREGADO_ID;
  const enReparacion = !!orden.fechaIngresoReparacion && !entregado && orden.estado === ESTADO_ORDEN.ACTIVA;
  const diasParaEntrega = orden.fechaEntregaEstimada ? diffDias(new Date(), orden.fechaEntregaEstimada) : null;
  const vencido = enReparacion && diasParaEntrega !== null && diasParaEntrega < 0;
  const etapa = getEtapa(orden.idEtapaActual);
  const diasEnEtapa = etapaAbierta ? diffDias(etapaAbierta.fechaInicio) : null;
  const superaLimite =
    enReparacion && etapa && etapa.diasLimiteCritico != null && diasEnEtapa != null && diasEnEtapa > etapa.diasLimiteCritico;
  const critico = superaLimite && !vencido; // Vencida prevalece sobre Crítica
  const proximo = enReparacion && diasParaEntrega !== null && diasParaEntrega >= 0 && diasParaEntrega <= DIAS_PROXIMO_A_VENCER;
  const proceso = enReparacion && !vencido;
  return {
    critico, vencido, proximo, proceso,
    enTaller: orden.ubicacionActual === UBICACION.EN_TALLER,
    fuera: orden.ubicacionActual === UBICACION.FUERA_DE_TALLER,
    diasParaEntrega,
  };
}

function vistaOrden(orden) {
  const veh = db.vehiculos.find((v) => v.id === orden.idVehiculo) || {};
  const cli = db.clientes.find((c) => c.id === orden.idCliente) || {};
  const hist = db.historialEtapas
    .filter((h) => h.idOrden === orden.id)
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
  const abierta = hist.find((h) => h.fechaFin === null && h.idEtapa === orden.idEtapaActual) || null;
  const etapa = getEtapa(orden.idEtapaActual);
  const alertas = calcularAlertas(orden, abierta);
  const entregado = orden.idEtapaActual === ETAPA_ENTREGADO_ID;

  let columna = null;
  if (etapa) columna = etapa.nombre;
  else if (orden.fechaIngresoReparacion) columna = 'Asignado';

  const fechaInicioEtapa = abierta ? abierta.fechaInicio : (columna === 'Asignado' ? orden.fechaIngresoReparacion : null);

  let alerta = 'normal';
  if (entregado) alerta = 'completado';
  else if (alertas.vencido || alertas.critico) alerta = alertas.vencido ? 'vencido' : 'critico';
  else if (alertas.proximo) alerta = 'proximo';

  const ultimoHist = hist[hist.length - 1];
  const valoracion = db.valoraciones.find((v) => v.idOrden === orden.id);

  return {
    ...clone(orden),
    numero: orden.id,
    placa: veh.placa,
    vehiculo: { id: veh.id, marca: veh.marca, modelo: veh.modelo, anio: veh.anio, color: veh.color, vin: veh.vin },
    vehiculoTexto: `${veh.marca} ${veh.modelo}${veh.anio ? ` · ${veh.anio}` : ''}`,
    cliente: clone(cli),
    etapaActual: etapa ? etapa.nombre : null,
    columna,
    tecnicoActual: abierta ? tecnicoMin(abierta.idTecnico) : null,
    fechaInicioEtapa,
    diasEnEtapa: fechaInicioEtapa ? diffDias(fechaInicioEtapa) : null,
    diasEnTaller: orden.fechaIngresoReparacion ? diffDias(orden.fechaIngresoReparacion) : null,
    etapasVisitadas: [...new Set(hist.map((h) => h.idEtapa))],
    asesor: ultimoHist ? nombreUsuario(ultimoHist.idUsuario) : nombreUsuario(orden.idUsuarioCreador),
    creador: nombreUsuario(orden.idUsuarioCreador),
    alertas,
    alerta,
    estadoValoracion: !valoracion ? FILTROS_VALORACION.SIN_VALORAR : valoracion.cargadaCesvi ? FILTROS_VALORACION.CARGADAS : FILTROS_VALORACION.SIN_CARGAR,
  };
}

const getOrdenRaw = (idOrden) => {
  const o = db.ordenes.find((x) => x.id === Number(idOrden));
  if (!o) throw new ApiError('Orden no encontrada', 404);
  return o;
};

// ─────────────────────────── Autenticación ───────────────────────────

export async function login(correo, password) {
  await delay(350);
  const u = db.usuarios.find((x) => x.correo.toLowerCase() === String(correo).trim().toLowerCase());
  // Mensaje genérico: no revela si falló el correo o la contraseña.
  if (!u || u.password !== password || !u.activo || !ROLES_ASIGNABLES.includes(u.rol)) {
    throw new ApiError('Credenciales inválidas. Verifica tus datos e inténtalo de nuevo.', 401);
  }
  return { token: `mock-token-${u.id}-${Date.now()}`, usuario: usuarioPublico(u) };
}

// ─────────────────────────── Órdenes ───────────────────────────

export async function getOrdenes() {
  await delay();
  return db.ordenes.map(vistaOrden).sort((a, b) => b.id - a.id);
}

export async function getOrden(idOrden) {
  await delay();
  return vistaOrden(getOrdenRaw(idOrden));
}

// Orden más reciente de una placa (activa si existe)
export async function buscarOrdenPorPlaca(placa) {
  await delay();
  const veh = db.vehiculos.find((v) => v.placa === String(placa).toUpperCase());
  if (!veh) return null;
  const ordenes = db.ordenes.filter((o) => o.idVehiculo === veh.id).sort((a, b) => b.id - a.id);
  const activa = ordenes.find((o) => o.estado === ESTADO_ORDEN.ACTIVA) || ordenes[0];
  return activa ? vistaOrden(activa) : null;
}

export async function getOrdenesKanban() {
  await delay();
  return db.ordenes.map(vistaOrden).filter((o) => o.columna !== null);
}

export async function getHistorialEtapas(idOrden) {
  await delay();
  return db.historialEtapas
    .filter((h) => h.idOrden === Number(idOrden))
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .map((h) => ({ ...clone(h), etapa: getEtapa(h.idEtapa).nombre, tecnico: tecnicoMin(h.idTecnico), usuario: nombreUsuario(h.idUsuario) }));
}

// cambiarEtapa(idEtapa, idUsuario, idTecnico) — transaccional + notificación asíncrona
export async function cambiarEtapa({ idOrden, idEtapa, idTecnico = null, nota = '', notificar = false }, usuario) {
  await delay(300);
  const orden = getOrdenRaw(idOrden);
  const destino = getEtapa(idEtapa);
  if (!destino) throw new ApiError('Etapa destino inválida');
  if (!orden.fechaIngresoReparacion) throw new ApiError('La orden aún no tiene fecha de ingreso al taller');
  const visitadas = db.historialEtapas.filter((h) => h.idOrden === orden.id).map((h) => h.idEtapa);
  if (visitadas.includes(destino.id)) throw new ApiError('La orden ya pasó por esa etapa');
  if (etapaRequiereTecnico(destino.id)) {
    const t = db.tecnicos.find((x) => x.id === Number(idTecnico));
    if (!t || !t.activo) throw new ApiError('Selecciona un técnico activo');
    if (t.especialidad !== destino.especialidad) throw new ApiError('El técnico no corresponde a la especialidad de la etapa');
  }

  const anterior = getEtapa(orden.idEtapaActual);
  const ts = now();
  db.historialEtapas
    .filter((h) => h.idOrden === orden.id && h.fechaFin === null)
    .forEach((h) => { h.fechaFin = ts; });
  db.historialEtapas.push({
    id: nextId(db.historialEtapas), idOrden: orden.id, idEtapa: destino.id,
    idTecnico: etapaRequiereTecnico(destino.id) ? Number(idTecnico) : null,
    idUsuario: usuario ? usuario.id : null, fechaInicio: ts, fechaFin: null,
  });
  orden.idEtapaActual = destino.id;
  if (destino.id === ETAPA_ENTREGADO_ID) {
    orden.ubicacionActual = UBICACION.FUERA_DE_TALLER;
    orden.estado = ESTADO_ORDEN.ENTREGADA;
  }
  if (nota && nota.trim()) {
    db.observaciones.push({
      id: nextId(db.observaciones), idOrden: orden.id, idEtapa: destino.id, idUsuario: usuario ? usuario.id : null,
      fecha: ts, texto: nota.trim(), visibleCliente: !!notificar, ubicacion: UBICACION.EN_TALLER, imagenes: [],
    });
  }
  const tec = tecnicoMin(Number(idTecnico));
  registrarMovimiento(
    orden, 'CAMBIO_ETAPA',
    `Pasó de ${anterior ? anterior.nombre : 'Asignado'} a ${destino.nombre}` +
      (tec && etapaRequiereTecnico(destino.id) ? ` · técnico ${tec.nombre}` : '') +
      (notificar ? ' · cliente notificado por WhatsApp' : '')
  );
  persist();
  if (notificar) {
    setTimeout(() => {
      notificarCliente(orden, `Su vehículo pasó a ${destino.nombre}.${nota ? ` ${nota}` : ''}`);
      persist();
    }, 0);
  }
  return vistaOrden(orden);
}

export async function marcarIngresoCotizar(idOrden) {
  await delay();
  const orden = getOrdenRaw(idOrden);
  if (orden.fechaIngresoCotizar) throw new ApiError('La fecha de ingreso a cotizar ya fue marcada');
  orden.fechaIngresoCotizar = now();
  registrarMovimiento(orden, 'FECHA', 'Fecha de ingreso a cotizar marcada');
  persist();
  return vistaOrden(orden);
}

export async function marcarIngresoReparacion(idOrden) {
  await delay();
  const orden = getOrdenRaw(idOrden);
  if (orden.fechaIngresoReparacion) throw new ApiError('La fecha de ingreso al taller ya fue marcada');
  orden.fechaIngresoReparacion = now();
  orden.ubicacionActual = UBICACION.EN_TALLER;
  registrarMovimiento(orden, 'FECHA', 'Ingreso al taller registrado · queda en Asignado');
  persist();
  return vistaOrden(orden);
}

export async function marcarDiasEstimados(idOrden, dias) {
  await delay();
  const orden = getOrdenRaw(idOrden);
  const n = Number(dias);
  if (!orden.fechaIngresoReparacion) throw new ApiError('Primero marca la fecha de ingreso al taller');
  if (orden.diasEstimadoEntrega != null) throw new ApiError('Los días estimados ya fueron definidos');
  if (!Number.isInteger(n) || n <= 0) throw new ApiError('Ingresa un número de días válido');
  orden.diasEstimadoEntrega = n;
  orden.fechaEntregaEstimada = addDias(orden.fechaIngresoReparacion, n).toISOString();
  registrarMovimiento(orden, 'FECHA', `Días estimados de entrega marcados · ${n} días`);
  persist();
  return vistaOrden(orden);
}

// ─────────────────────────── Dashboard ───────────────────────────

export async function getResumenDashboard() {
  await delay();
  const vistas = db.ordenes.map(vistaOrden);
  const hoy = new Date().toDateString();
  return {
    enTaller: vistas.filter((o) => o.alertas.enTaller).length,
    ingresosHoy: vistas.filter((o) => o.fechaIngresoReparacion && new Date(o.fechaIngresoReparacion).toDateString() === hoy).length,
    fuera: vistas.filter((o) => o.alertas.fuera).length,
    criticos: vistas.filter((o) => o.alertas.critico).length,
    vencidos: vistas.filter((o) => o.alertas.vencido).length,
    proximos: vistas.filter((o) => o.alertas.proximo).length,
    enProceso: vistas.filter((o) => o.alertas.proceso).length,
  };
}

// tipo: 'critico' | 'vencido' | 'proximo' | 'proceso' | 'taller' | 'fuera'
export async function getOrdenesPorAviso(tipo) {
  await delay();
  const key = { taller: 'enTaller', fuera: 'fuera' }[tipo] || tipo;
  return db.ordenes.map(vistaOrden).filter((o) => o.alertas[key]);
}

export async function getMovimientosRecientes() {
  await delay();
  const limite = Date.now() - 24 * 60 * 60 * 1000;
  return clone(db.movimientos)
    .filter((m) => new Date(m.fecha).getTime() >= limite)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export async function getCargaPorEtapa() {
  await delay();
  const vistas = db.ordenes.map(vistaOrden).filter((o) => o.estado === ESTADO_ORDEN.ACTIVA);
  return ETAPAS_CARGA.map((nombre) => ({ etapa: nombre, n: vistas.filter((o) => o.etapaActual === nombre).length }));
}

// ─────────────────────────── Nueva orden ───────────────────────────

export async function buscarVehiculoPorPlaca(placa) {
  await delay();
  const veh = db.vehiculos.find((v) => v.placa === String(placa).toUpperCase());
  if (!veh) return null;
  // Cliente de la última orden (cliente real); si no hay, el registrado al crear el vehículo
  const ultima = db.ordenes.filter((o) => o.idVehiculo === veh.id).sort((a, b) => b.id - a.id)[0];
  const cli = db.clientes.find((c) => c.id === (ultima ? ultima.idCliente : veh.idCliente));
  return { vehiculo: clone(veh), cliente: cli ? clone(cli) : null };
}

export async function buscarClientePorDocumento(documento) {
  await delay();
  const cli = db.clientes.find((c) => c.documento === String(documento));
  return cli ? clone(cli) : null;
}

// payload: { placa, idVehiculo?, vehiculo?: {marca, modelo, anio, color, vin},
//            idCliente?, cliente?: {documento, nombre, celular, correo} }
export async function crearOrden(payload, usuario) {
  await delay(350);
  const placa = String(payload.placa || '').toUpperCase();
  let veh = db.vehiculos.find((v) => v.placa === placa);
  let idCliente = payload.idCliente || null;

  if (!idCliente) {
    const c = payload.cliente || {};
    if (!/^\d{6,10}$/.test(c.documento || '')) throw new ApiError('Documento inválido (solo cédula colombiana)');
    if (!c.nombre || !c.celular) throw new ApiError('Nombre y celular del cliente son obligatorios');
    if (db.clientes.some((x) => x.documento === c.documento)) throw new ApiError('Ya existe un cliente con ese documento');
    const nuevo = { id: nextId(db.clientes), nombre: c.nombre.trim(), documento: c.documento, celular: c.celular.trim(), correo: (c.correo || '').trim() || null };
    db.clientes.push(nuevo);
    idCliente = nuevo.id;
  }

  if (!veh) {
    const v = payload.vehiculo || {};
    if (placa.length !== 6) throw new ApiError('La placa debe tener 6 caracteres');
    if (!v.marca || !v.modelo || !v.color) throw new ApiError('Marca, modelo y color son obligatorios');
    veh = {
      id: nextId(db.vehiculos), placa, marca: v.marca.trim(), modelo: v.modelo.trim(),
      anio: v.anio ? Number(v.anio) : null, color: v.color.trim(), vin: v.vin || null,
      idCliente, // una sola escritura
    };
    db.vehiculos.push(veh);
  }

  const orden = {
    id: nextId(db.ordenes), idVehiculo: veh.id, idCliente, estado: ESTADO_ORDEN.ACTIVA,
    ubicacionActual: UBICACION.FUERA_DE_TALLER, idEtapaActual: null, fechaCreacion: now(),
    fechaIngresoCotizar: null, fechaIngresoReparacion: null, diasEstimadoEntrega: null, fechaEntregaEstimada: null,
    idUsuarioCreador: usuario ? usuario.id : null, siniestro: null,
  };
  db.ordenes.push(orden);
  registrarMovimiento(orden, 'ORDEN_CREADA', `Orden creada por ${usuario ? usuario.nombre : '—'}`);
  persist();
  return vistaOrden(orden);
}

// ─────────────────────────── Observaciones y fotos ───────────────────────────

export async function getObservaciones(idOrden) {
  await delay();
  return db.observaciones
    .filter((o) => o.idOrden === Number(idOrden))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .map((o) => ({ ...clone(o), autor: nombreUsuario(o.idUsuario), etapa: getEtapa(o.idEtapa).nombre }));
}

// imagenes: [{ url (dataURL), nombre }]
export async function crearObservacion({ idOrden, idEtapa, texto, imagenes = [], notificar = false }, usuario) {
  await delay(300);
  const orden = getOrdenRaw(idOrden);
  const visitadas = db.historialEtapas.filter((h) => h.idOrden === orden.id).map((h) => h.idEtapa);
  if (!visitadas.includes(Number(idEtapa))) throw new ApiError('Solo se puede registrar en etapas ya visitadas');
  if (!texto || !texto.trim()) throw new ApiError('Escribe la nota de la observación');
  const obs = {
    id: nextId(db.observaciones), idOrden: orden.id, idEtapa: Number(idEtapa), idUsuario: usuario ? usuario.id : null,
    fecha: now(), texto: texto.trim(), visibleCliente: !!notificar, ubicacion: UBICACION.EN_TALLER,
    imagenes: imagenes.map((img, i) => ({ id: i + 1, url: img.url, nombre: img.nombre || `obs_${orden.id}_${i + 1}.jpg` })),
  };
  db.observaciones.push(obs);
  orden.ubicacionActual = UBICACION.EN_TALLER;
  registrarMovimiento(orden, 'OBSERVACION', `Observación en ${getEtapa(obs.idEtapa).nombre}: ${obs.texto.slice(0, 60)}`);
  persist();
  if (notificar) setTimeout(() => { notificarCliente(orden, obs.texto); persist(); }, 0);
  return { ...clone(obs), autor: nombreUsuario(obs.idUsuario), etapa: getEtapa(obs.idEtapa).nombre };
}

// Vista consolidada de solo lectura: fotos de valoración + observaciones
export async function getFotosOrden(idOrden) {
  await delay();
  const id = Number(idOrden);
  const fotos = [];
  const val = db.valoraciones.find((v) => v.idOrden === id);
  if (val) val.imagenes.forEach((img) => fotos.push({ id: `val-${img.id}`, url: img.url, nombre: img.nombre, origen: 'Valoración', fecha: val.actualizadaAt }));
  db.observaciones
    .filter((o) => o.idOrden === id)
    .forEach((o) => o.imagenes.forEach((img) => fotos.push({ id: `obs-${o.id}-${img.id}`, url: img.url, nombre: img.nombre, origen: getEtapa(o.idEtapa).nombre, fecha: o.fecha })));
  return fotos;
}

// ─────────────────────────── Valoración ───────────────────────────

export async function getOrdenesPorFiltroValoracion(filtro) {
  await delay();
  return db.ordenes.map(vistaOrden).filter((o) => o.estadoValoracion === filtro);
}

export async function getConteoValoracion() {
  await delay();
  const vistas = db.ordenes.map(vistaOrden);
  return Object.values(FILTROS_VALORACION).reduce((acc, f) => ({ ...acc, [f]: vistas.filter((o) => o.estadoValoracion === f).length }), {});
}

export async function getValoracion(idOrden) {
  await delay();
  const v = db.valoraciones.find((x) => x.idOrden === Number(idOrden));
  return v ? { ...clone(v), usuario: nombreUsuario(v.idUsuario) } : null;
}

// data: { descripcion, detalles: [{pieza, accion, gravedad}], imagenes: [{url, nombre}] }
export async function guardarValoracion(idOrden, data, usuario) {
  await delay(400);
  const orden = getOrdenRaw(idOrden);
  const detalles = (data.detalles || []).filter((d) => d.pieza && d.pieza.trim());
  if (!detalles.length) throw new ApiError('No se puede guardar una valoración vacía: agrega al menos una pieza');
  const norm = detalles.map((d, i) => ({
    id: i + 1, pieza: d.pieza.trim(), accion: d.accion,
    gravedad: d.accion === ACCION_PIEZA.REPARAR ? d.gravedad || null : null,
  }));
  const imagenes = (data.imagenes || []).map((img, i) => ({ id: i + 1, url: img.url, nombre: img.nombre || `valoracion_${orden.id}_${i + 1}.jpg` }));
  let v = db.valoraciones.find((x) => x.idOrden === orden.id);
  const ts = now();
  if (v) {
    // Editar no afecta el estado "cargada a CESVI"
    Object.assign(v, { descripcion: data.descripcion || '', detalles: norm, imagenes, actualizadaAt: ts });
    registrarMovimiento(orden, 'VALORACION', `Hoja de valoración actualizada · ${norm.length} piezas`);
  } else {
    v = {
      id: nextId(db.valoraciones), idOrden: orden.id, descripcion: data.descripcion || '', detalles: norm, imagenes,
      cargadaCesvi: false, cargadaCesviAt: null, idUsuario: usuario ? usuario.id : null, creadaAt: ts, actualizadaAt: ts,
    };
    db.valoraciones.push(v);
    if (!orden.fechaIngresoCotizar) orden.fechaIngresoCotizar = ts; // se marca automáticamente
    registrarMovimiento(orden, 'VALORACION', `Valoración creada · ${norm.length} piezas, ${imagenes.length} fotos`);
  }
  persist();
  return { ...clone(v), usuario: nombreUsuario(v.idUsuario) };
}

export async function marcarCargadaCesvi(idOrden) {
  await delay();
  const orden = getOrdenRaw(idOrden);
  const v = db.valoraciones.find((x) => x.idOrden === orden.id);
  if (!v) throw new ApiError('La orden no tiene valoración');
  v.cargadaCesvi = true;
  v.cargadaCesviAt = now();
  registrarMovimiento(orden, 'CESVI', 'Valoración marcada como cargada a CESVI Colombia');
  persist();
  return { ...clone(v), usuario: nombreUsuario(v.idUsuario) };
}

// ─────────────────────────── Técnicos ───────────────────────────

const enCursoDe = (idTecnico) =>
  db.historialEtapas.filter((h) => h.idTecnico === idTecnico && h.fechaFin === null).length;

export async function getTecnicos({ incluirInactivos = false } = {}) {
  await delay();
  return db.tecnicos
    .filter((t) => incluirInactivos || t.activo)
    .map((t) => ({ ...clone(t), enCurso: enCursoDe(t.id) }));
}

export async function getTecnicosPorEspecialidad(especialidad) {
  await delay(80);
  return db.tecnicos
    .filter((t) => t.activo && t.especialidad === especialidad)
    .map((t) => ({ ...clone(t), enCurso: enCursoDe(t.id) }));
}

const validarTecnico = (t, idActual = null) => {
  if (!t.nombre || !t.nombre.trim()) throw new ApiError('El nombre es obligatorio');
  if (!/^\d{6,10}$/.test(t.documento || '')) throw new ApiError('Documento inválido');
  if (!t.celular || !t.celular.trim()) throw new ApiError('El celular es obligatorio');
  if (!t.especialidad) throw new ApiError('Selecciona la especialidad');
  if (db.tecnicos.some((x) => x.documento === t.documento && x.id !== idActual)) throw new ApiError('Ya existe un técnico con ese documento');
};

export async function crearTecnico(data) {
  await delay();
  validarTecnico(data);
  const t = { id: nextId(db.tecnicos), nombre: data.nombre.trim(), documento: data.documento, celular: data.celular.trim(), correo: null, especialidad: data.especialidad, activo: true };
  db.tecnicos.push(t);
  persist();
  return { ...clone(t), enCurso: 0 };
}

export async function actualizarTecnico(id, data) {
  await delay();
  const t = db.tecnicos.find((x) => x.id === Number(id));
  if (!t) throw new ApiError('Técnico no encontrado', 404);
  validarTecnico(data, t.id);
  Object.assign(t, { nombre: data.nombre.trim(), documento: data.documento, celular: data.celular.trim(), especialidad: data.especialidad });
  persist();
  return { ...clone(t), enCurso: enCursoDe(t.id) };
}

export async function setTecnicoActivo(id, activo) {
  await delay();
  const t = db.tecnicos.find((x) => x.id === Number(id));
  if (!t) throw new ApiError('Técnico no encontrado', 404);
  t.activo = !!activo;
  persist();
  return { ...clone(t), enCurso: enCursoDe(t.id) };
}

// ─────────────────────────── Usuarios ───────────────────────────

export async function getUsuarios() {
  await delay();
  return db.usuarios.map(usuarioPublico).map(clone);
}

const validarUsuario = (u, idActual = null, requierePassword = true) => {
  if (!u.nombre || !u.nombre.trim()) throw new ApiError('El nombre es obligatorio');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.correo || '')) throw new ApiError('Correo inválido');
  if (!ROLES_ASIGNABLES.includes(u.rol)) throw new ApiError('Rol no permitido');
  if (db.usuarios.some((x) => x.correo.toLowerCase() === u.correo.toLowerCase() && x.id !== idActual)) throw new ApiError('El correo ya está registrado');
  if (requierePassword && (!u.password || u.password.length < 6)) throw new ApiError('La contraseña debe tener al menos 6 caracteres');
  if (!requierePassword && u.password && u.password.length < 6) throw new ApiError('La contraseña debe tener al menos 6 caracteres');
};

export async function crearUsuario(data) {
  await delay();
  validarUsuario(data);
  const u = { id: nextId(db.usuarios), nombre: data.nombre.trim(), correo: data.correo.trim().toLowerCase(), rol: data.rol, activo: true, password: data.password };
  db.usuarios.push(u);
  persist();
  return usuarioPublico(clone(u));
}

// password opcional: vacío = no cambiar
export async function actualizarUsuario(id, data) {
  await delay();
  const u = db.usuarios.find((x) => x.id === Number(id));
  if (!u) throw new ApiError('Usuario no encontrado', 404);
  validarUsuario(data, u.id, false);
  Object.assign(u, { nombre: data.nombre.trim(), correo: data.correo.trim().toLowerCase(), rol: data.rol });
  if (data.password) u.password = data.password;
  persist();
  return usuarioPublico(clone(u));
}

export async function setUsuarioActivo(id, activo) {
  await delay();
  const u = db.usuarios.find((x) => x.id === Number(id));
  if (!u) throw new ApiError('Usuario no encontrado', 404);
  u.activo = !!activo;
  persist();
  return usuarioPublico(clone(u));
}
