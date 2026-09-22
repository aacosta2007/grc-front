// Base de datos simulada en memoria (persistida en localStorage) para trabajar
// el front sin backend. Las fechas se generan relativas a "hoy" para que las
// alertas (críticos, vencidos, próximos a vencer) siempre tengan datos.
import { ETAPAS, UBICACION, ESTADO_ORDEN, ACCION_PIEZA } from '../../utils/constants';
import { placeholderFoto } from './placeholders';

const STORAGE_KEY = 'grc_mock_db_v1';
const MS_DIA = 24 * 60 * 60 * 1000;
const MS_HORA = 60 * 60 * 1000;

const hoy = () => new Date();
const haceDias = (n, hora = 9) => {
  const d = new Date(hoy().getTime() - n * MS_DIA);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
};
const haceHoras = (h) => new Date(hoy().getTime() - h * MS_HORA).toISOString();

const USUARIOS = [
  { id: 1, nombre: 'Andrés Villalba', correo: 'avillalba@servimacromotor.co', rol: 'ADMIN', activo: true, password: 'admin123' },
  { id: 2, nombre: 'Laura Beltrán Niño', correo: 'lbeltran@servimacromotor.co', rol: 'ASESOR', activo: true, password: 'asesor123' },
  { id: 3, nombre: 'Ricardo Peña Silva', correo: 'rpena@servimacromotor.co', rol: 'GERENTE', activo: true, password: 'gerente123' },
  { id: 4, nombre: 'Mónica Salazar', correo: 'msalazar@servimacromotor.co', rol: 'ASESOR', activo: true, password: 'asesor123' },
  { id: 5, nombre: 'Jorge Enrique Lara', correo: 'jlara@servimacromotor.co', rol: 'ASESOR', activo: false, password: 'asesor123' },
];

const TECNICOS = [
  { id: 1, nombre: 'Jhon Fredy Quintero', documento: '79452118', celular: '310 552 8841', correo: null, especialidad: 'LATONERO', activo: true },
  { id: 2, nombre: 'Wilmer Cárdenas Ruiz', documento: '1014778112', celular: '311 220 4471', correo: null, especialidad: 'PINTOR', activo: true },
  { id: 3, nombre: 'Édison Mosquera', documento: '80231774', celular: '320 771 1903', correo: null, especialidad: 'ARMADOR', activo: true },
  { id: 4, nombre: 'Néstor Julián Ávila', documento: '1032456789', celular: '315 448 0027', correo: null, especialidad: 'MECANICO', activo: true },
  { id: 5, nombre: 'Yeison Rodríguez', documento: '1098334512', celular: '301 664 7712', correo: null, especialidad: 'ALISTADOR', activo: true },
  { id: 6, nombre: 'Álvaro Peñaloza', documento: '19884120', celular: '313 900 5514', correo: null, especialidad: 'ARMADOR', activo: true },
  { id: 7, nombre: 'Carlos Mario Betancur', documento: '71554901', celular: '318 227 6640', correo: null, especialidad: 'CONTROL_CALIDAD', activo: true },
  { id: 8, nombre: 'Fredy Alonso Castaño', documento: '93112004', celular: '312 870 3321', correo: null, especialidad: 'LATONERO', activo: true },
];

const CLIENTES = [
  { id: 1, nombre: 'Diana Carolina Rojas', documento: '1032456789', celular: '310 445 2210', correo: 'diana.rojas@correo.com' },
  { id: 2, nombre: 'Óscar Iván Mahecha', documento: '80124567', celular: '311 208 9934', correo: 'oscar.mahecha@correo.com' },
  { id: 3, nombre: 'Luz Marina Pardo', documento: '52331890', celular: '316 774 1180', correo: 'luzmarina.pardo@correo.com' },
  { id: 4, nombre: 'Andrés Felipe Suárez', documento: '1019887456', celular: '300 512 6632', correo: 'afsuarez@correo.com' },
  { id: 5, nombre: 'Gustavo Adolfo Herrera', documento: '79880123', celular: '317 440 2291', correo: 'gherrera@correo.com' },
  { id: 6, nombre: 'Martha Lucía Guzmán', documento: '41778023', celular: '313 667 0045', correo: 'mlguzman@correo.com' },
  { id: 7, nombre: 'Hernán Darío Ospina', documento: '71223908', celular: '314 902 7781', correo: 'hdospina@correo.com' },
  { id: 8, nombre: 'Claudia Patricia León', documento: '52998741', celular: '310 330 1276', correo: 'cpleon@correo.com' },
  { id: 9, nombre: 'Julián Esteban Gómez', documento: '1020774512', celular: '321 448 9036', correo: 'jegomez@correo.com' },
  { id: 10, nombre: 'Rosa Elvira Cuadros', documento: '39667120', celular: '318 115 4402', correo: 'recuadros@correo.com' },
  { id: 11, nombre: 'Fabián Andrés Torres', documento: '1015442987', celular: '305 667 2310', correo: 'fatorres@correo.com' },
  { id: 12, nombre: 'Sandra Milena Acuña', documento: '52110943', celular: '311 874 5520', correo: 'smacuna@correo.com' },
  { id: 13, nombre: 'Camilo Ernesto Duque', documento: '1026553871', celular: '316 203 8847', correo: 'ceduque@correo.com' },
  { id: 14, nombre: 'Paola Andrea Ríos', documento: '1037665098', celular: '320 118 4476', correo: 'paola.rios@correo.com' },
  { id: 15, nombre: 'Mauricio Lozano Vega', documento: '79553210', celular: '315 776 0913', correo: 'mlozano@correo.com' },
];

const VEHICULOS = [
  { id: 1, placa: 'ABC123', marca: 'Mazda', modelo: 'CX-5', anio: 2021, color: 'Gris meteoro', vin: null, idCliente: 1 },
  { id: 2, placa: 'GHT418', marca: 'Chevrolet', modelo: 'Onix', anio: 2022, color: 'Blanco', vin: null, idCliente: 2 },
  { id: 3, placa: 'CVX620', marca: 'Renault', modelo: 'Duster', anio: 2019, color: 'Rojo fuego', vin: null, idCliente: 3 },
  { id: 4, placa: 'KLP902', marca: 'Kia', modelo: 'Picanto', anio: 2023, color: 'Azul', vin: null, idCliente: 4 },
  { id: 5, placa: 'MTQ551', marca: 'Toyota', modelo: 'Hilux', anio: 2020, color: 'Plata', vin: null, idCliente: 5 },
  { id: 6, placa: 'FDR774', marca: 'Nissan', modelo: 'Versa', anio: 2018, color: 'Negro', vin: null, idCliente: 6 },
  { id: 7, placa: 'JRS330', marca: 'Volkswagen', modelo: 'Gol', anio: 2017, color: 'Gris', vin: null, idCliente: 7 },
  { id: 8, placa: 'BQW118', marca: 'Ford', modelo: 'Escape', anio: 2022, color: 'Blanco perla', vin: null, idCliente: 8 },
  { id: 9, placa: 'HSN205', marca: 'Chevrolet', modelo: 'Tracker', anio: 2021, color: 'Gris titanio', vin: null, idCliente: 9 },
  { id: 10, placa: 'LDV847', marca: 'Suzuki', modelo: 'Swift', anio: 2019, color: 'Rojo', vin: null, idCliente: 10 },
  { id: 11, placa: 'PTZ693', marca: 'Mazda', modelo: '3', anio: 2020, color: 'Azul profundo', vin: null, idCliente: 11 },
  { id: 12, placa: 'RNC012', marca: 'Hyundai', modelo: 'Tucson', anio: 2018, color: 'Negro', vin: null, idCliente: 12 },
  { id: 13, placa: 'WQA486', marca: 'Renault', modelo: 'Logan', anio: 2021, color: 'Beige', vin: null, idCliente: 13 },
  { id: 14, placa: 'NPQ447', marca: 'Kia', modelo: 'Sportage', anio: 2024, color: 'Verde', vin: null, idCliente: 14 },
  { id: 15, placa: 'TYU908', marca: 'Toyota', modelo: 'Corolla', anio: 2016, color: 'Plata', vin: null, idCliente: 15 },
];

// Definición compacta de órdenes. etapa = nombre de la etapa actual (null = sin
// etapa: "Asignado" si tiene ingreso a reparación, o aún fuera del taller).
// diasEnEtapa = días desde que entró a la etapa actual.
// ingreso = días desde fechaIngresoReparacion. estimados = diasEstimadoEntrega.
const ORDENES_DEF = [
  { id: 2481, veh: 1, etapa: 'Latonería', diasEnEtapa: 6, ingreso: 9, estimados: 15, cotizar: 11, tecnico: 1, creador: 2 },
  { id: 2478, veh: 2, etapa: 'Pintura', diasEnEtapa: 3, ingreso: 14, estimados: 12, cotizar: 16, tecnico: 2, creador: 2 },
  { id: 2475, veh: 3, etapa: 'Armado', diasEnEtapa: 2, ingreso: 10, estimados: 12, cotizar: 12, tecnico: 6, creador: 4 },
  { id: 2489, veh: 4, etapa: null, diasEnEtapa: 1, ingreso: 1, estimados: 10, cotizar: 3, tecnico: null, creador: 1 },
  { id: 2487, veh: 5, etapa: 'Desarme', diasEnEtapa: 1, ingreso: 2, estimados: 14, cotizar: 4, tecnico: 3, creador: 4 },
  { id: 2470, veh: 6, etapa: 'Control de calidad', diasEnEtapa: 3, ingreso: 17, estimados: 20, cotizar: 19, tecnico: 7, creador: 2 },
  { id: 2483, veh: 7, etapa: 'Electromecánica', diasEnEtapa: 4, ingreso: 8, estimados: 11, cotizar: 9, tecnico: 4, creador: 1 },
  { id: 2491, veh: 8, etapa: null, diasEnEtapa: 0, ingreso: 0, estimados: null, cotizar: 2, tecnico: null, creador: 2 },
  { id: 2479, veh: 9, etapa: 'Alistamiento de superficies', diasEnEtapa: 1, ingreso: 9, estimados: 12, cotizar: 10, tecnico: 5, creador: 3 },
  { id: 2466, veh: 10, etapa: 'Bancada', diasEnEtapa: 7, ingreso: 16, estimados: 12, cotizar: 18, tecnico: null, creador: 2 },
  { id: 2462, veh: 11, etapa: 'Listo para entregar', diasEnEtapa: 1, ingreso: 13, estimados: 15, cotizar: 15, tecnico: null, creador: 4 },
  { id: 2455, veh: 12, etapa: 'Entregado', diasEnEtapa: 2, ingreso: 20, estimados: 18, cotizar: 22, tecnico: null, creador: 1 },
  { id: 2485, veh: 13, etapa: 'Latonería', diasEnEtapa: 2, ingreso: 5, estimados: 14, cotizar: 6, tecnico: 8, creador: 3 },
  // Órdenes sin ingreso al taller (fuera del taller, no aparecen en el Kanban)
  { id: 2492, veh: 14, etapa: undefined, cotizar: null, creador: 2 },
  { id: 2493, veh: 15, etapa: undefined, cotizar: 1, creador: 4 },
];

// Técnico por defecto (primer activo de la especialidad) para etapas ya completadas
const tecnicoPara = (etapa) => {
  if (!etapa.especialidad) return null;
  const t = TECNICOS.find((x) => x.especialidad === etapa.especialidad);
  return t ? t.id : null;
};

function construirOrdenes() {
  const ordenes = [];
  const historial = [];
  let hid = 1;

  ORDENES_DEF.forEach((def) => {
    const veh = VEHICULOS.find((v) => v.id === def.veh);
    const enTaller = def.etapa !== undefined;
    const entregado = def.etapa === 'Entregado';
    const fechaIngresoReparacion = enTaller ? haceDias(def.ingreso, 8) : null;
    const fechaEntregaEstimada =
      enTaller && def.estimados != null
        ? new Date(new Date(fechaIngresoReparacion).getTime() + def.estimados * MS_DIA).toISOString()
        : null;
    const etapaActual = def.etapa ? ETAPAS.find((e) => e.nombre === def.etapa) : null;

    const orden = {
      id: def.id,
      idVehiculo: veh.id,
      idCliente: veh.idCliente,
      estado: entregado ? ESTADO_ORDEN.ENTREGADA : ESTADO_ORDEN.ACTIVA,
      ubicacionActual: enTaller && !entregado ? UBICACION.EN_TALLER : UBICACION.FUERA_DE_TALLER,
      idEtapaActual: etapaActual ? etapaActual.id : null,
      fechaCreacion: haceDias(def.cotizar != null ? def.cotizar + 1 : 0, 7),
      fechaIngresoCotizar: def.cotizar != null ? haceDias(def.cotizar, 10) : null,
      fechaIngresoReparacion,
      diasEstimadoEntrega: enTaller ? def.estimados : null,
      fechaEntregaEstimada,
      idUsuarioCreador: def.creador,
      siniestro: `1563${String(def.id * 37).padStart(6, '0')}`,
    };
    ordenes.push(orden);

    if (etapaActual) {
      // Historial: todas las etapas previas en orden de flujo (se omite Bancada
      // en algunas órdenes para mostrar que se pueden saltar columnas).
      const saltarBancada = def.id % 2 === 0 && etapaActual.orden > 3;
      const previas = ETAPAS.filter(
        (e) => e.orden < etapaActual.orden && !(saltarBancada && e.nombre === 'Bancada')
      );
      const totalDias = Math.max(def.ingreso - def.diasEnEtapa, previas.length ? 1 : 0);
      const paso = previas.length ? totalDias / previas.length : 0;
      let cursor = new Date(fechaIngresoReparacion).getTime();
      previas.forEach((e) => {
        const inicio = cursor;
        const fin = cursor + Math.max(paso, 0.3) * MS_DIA;
        historial.push({
          id: hid++, idOrden: orden.id, idEtapa: e.id, idTecnico: tecnicoPara(e),
          idUsuario: def.creador, fechaInicio: new Date(inicio).toISOString(), fechaFin: new Date(fin).toISOString(),
        });
        cursor = fin;
      });
      historial.push({
        id: hid++, idOrden: orden.id, idEtapa: etapaActual.id,
        idTecnico: def.tecnico != null ? def.tecnico : tecnicoPara(etapaActual),
        idUsuario: def.creador, fechaInicio: haceDias(def.diasEnEtapa, 9), fechaFin: null,
      });
    }
  });
  return { ordenes, historial };
}

function construirValoraciones() {
  const mk = (id, idOrden, cargada, piezas, nFotos, descripcion, diasAtras) => ({
    id,
    idOrden,
    descripcion,
    detalles: piezas.map(([pieza, accion, gravedad], i) => ({ id: i + 1, pieza, accion, gravedad: gravedad || null })),
    imagenes: Array.from({ length: nFotos }, (_, i) => ({
      id: i + 1,
      url: placeholderFoto(`VAL ${String(i + 1).padStart(2, '0')}`, i),
      nombre: `valoracion_${idOrden}_${String(i + 1).padStart(2, '0')}.jpg`,
    })),
    cargadaCesvi: cargada,
    cargadaCesviAt: cargada ? haceDias(diasAtras - 1, 15) : null,
    idUsuario: 2,
    creadaAt: haceDias(diasAtras, 11),
    actualizadaAt: haceDias(diasAtras, 11),
  });
  const S = ACCION_PIEZA.SUSTITUIR;
  const R = ACCION_PIEZA.REPARAR;
  return [
    mk(1, 2481, false, [['Capó', S], ['Farola derecha', S], ['Guardabarros delantero derecho', R, 'MEDIA'], ['Absorbedor frontal', R, 'LEVE']], 10,
      'Impacto frontal lado derecho a baja velocidad. Se requiere sustitución de capó y farola derecha; reparación de guardabarros delantero derecho y absorbedor. Sin daño estructural en bancada.', 10),
    mk(2, 2479, false, [['Puerta trasera izquierda', R, 'GRAVE'], ['Espejo retrovisor izquierdo', S]], 6,
      'Rayón profundo y hundimiento en costado izquierdo por roce con columna.', 9),
    mk(3, 2475, true, [['Bómper trasero', S], ['Stop trasero derecho', S], ['Compuerta', R, 'MEDIA']], 8,
      'Colisión por alcance en parte trasera. Compuerta con deformación moderada.', 11),
    mk(4, 2478, true, [['Bómper delantero', S], ['Rejilla frontal', S], ['Guardafango izquierdo', R, 'LEVE'], ['Capó', R, 'MEDIA'], ['Farola izquierda', S], ['Radiador', S]], 12,
      'Impacto frontal izquierdo. Daño en sistema de enfriamiento.', 15),
    mk(5, 2470, true, [['Puerta delantera derecha', S], ['Paral central', R, 'GRAVE']], 7,
      'Impacto lateral derecho. Requiere revisión de paral central.', 18),
  ];
}

function construirObservaciones(historial) {
  const obs = [];
  let id = 1;
  const add = (idOrden, nombreEtapa, idUsuario, horasAtras, texto, visibleCliente, nFotos) => {
    const etapa = ETAPAS.find((e) => e.nombre === nombreEtapa);
    obs.push({
      id: id++, idOrden, idEtapa: etapa.id, idUsuario, fecha: haceHoras(horasAtras), texto, visibleCliente,
      ubicacion: UBICACION.EN_TALLER,
      imagenes: Array.from({ length: nFotos }, (_, i) => ({
        id: i + 1, url: placeholderFoto(`OBS ${String(i + 1).padStart(2, '0')}`, i + 3), nombre: `obs_${idOrden}_${i + 1}.jpg`,
      })),
    });
  };
  add(2481, 'Latonería', 2, 20, 'Se detectó daño adicional en el travesaño frontal. Se solicita ampliación a la aseguradora.', true, 3);
  add(2481, 'Latonería', 4, 44, 'Enderezado de guardabarros terminado, pendiente masillado.', false, 2);
  add(2481, 'Desarme', 1, 150, 'Vehículo desarmado y valorado. Se confirma entrega estimada.', true, 4);
  add(2481, 'Desarme', 2, 200, 'Ingreso al taller registrado. Cliente entrega vehículo con 1/4 de tanque.', false, 0);
  add(2466, 'Bancada', 2, 3, 'Se solicita autorización de aseguradora para trabajo en bancada.', false, 1);
  add(2485, 'Latonería', 3, 5, 'Repuesto de farola en tránsito.', true, 0);
  add(2478, 'Pintura', 4, 30, 'Primera mano de pintura aplicada. Pendiente secado.', true, 2);
  return obs;
}

function construirMovimientos() {
  const m = [];
  let id = 1;
  const add = (horasAtras, idOrden, placa, tipo, texto) =>
    m.push({ id: id++, fecha: haceHoras(horasAtras), idOrden, placa, tipo, texto });
  add(0.4, 2475, 'CVX620', 'CAMBIO_ETAPA', 'Pasó de Pintura a Armado · cliente notificado por WhatsApp');
  add(0.9, 2491, 'BQW118', 'ORDEN_CREADA', 'Orden creada por Laura Beltrán Niño · queda en Asignado');
  add(1.3, 2481, 'ABC123', 'VALORACION', 'Valoración actualizada · 4 piezas, 10 fotos');
  add(2.8, 2466, 'LDV847', 'OBSERVACION', 'Observación en Bancada: se solicita autorización de aseguradora');
  add(3.4, 2462, 'PTZ693', 'CAMBIO_ETAPA', 'Pasó de Control de calidad a Listo para entregar');
  add(4.1, 2479, 'HSN205', 'CAMBIO_ETAPA', 'Pasó de Electromecánica a Alistamiento de superficies · técnico Yeison Rodríguez');
  add(5.2, 2485, 'WQA486', 'OBSERVACION', 'Observación en Latonería: repuesto de farola en tránsito');
  add(9.6, 2483, 'JRS330', 'FECHA', 'Días estimados de entrega marcados · 11 días');
  add(13.3, 2487, 'MTQ551', 'FECHA', 'Ingreso al taller registrado por Mónica Salazar');
  add(15.0, 2478, 'GHT418', 'OBSERVACION', 'Observación en Pintura: primera mano aplicada');
  add(17.5, 2493, 'TYU908', 'FECHA', 'Fecha de ingreso a cotizar marcada');
  add(19.1, 2470, 'FDR774', 'CESVI', 'Valoración marcada como cargada a CESVI Colombia');
  add(22.4, 2492, 'NPQ447', 'ORDEN_CREADA', 'Orden creada por Laura Beltrán Niño · pendiente de valoración');
  add(30, 2455, 'RNC012', 'CAMBIO_ETAPA', 'Vehículo entregado al cliente');
  return m;
}

function seed() {
  const { ordenes, historial } = construirOrdenes();
  return {
    usuarios: USUARIOS.map((u) => ({ ...u })),
    tecnicos: TECNICOS.map((t) => ({ ...t })),
    clientes: CLIENTES.map((c) => ({ ...c })),
    vehiculos: VEHICULOS.map((v) => ({ ...v })),
    ordenes,
    historialEtapas: historial,
    observaciones: construirObservaciones(historial),
    valoraciones: construirValoraciones(),
    movimientos: construirMovimientos(),
    notificaciones: [],
  };
}

function cargar() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* almacenamiento no disponible */
  }
  return seed();
}

export const db = cargar();

export function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    /* cuota excedida o almacenamiento bloqueado: se sigue solo en memoria */
  }
}

export function resetMockDb() {
  const fresh = seed();
  Object.keys(db).forEach((k) => delete db[k]);
  Object.assign(db, fresh);
  persist();
}

export const nextId = (arr) => arr.reduce((max, x) => Math.max(max, x.id), 0) + 1;

export const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));
