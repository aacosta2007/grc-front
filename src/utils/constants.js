// Constantes de negocio del MVP GRC (fuente: Analisis_Requisitos_Completo.pdf)

// Paleta del diseño "Servimacromotor GRC"
export const COLORS = {
  bg: '#0D0D0D',
  card: '#262626',
  line: '#595959',
  lineSoft: '#333333',
  text: '#F2F2F2',
  sub: '#BFBFBF',
  accent: '#FF6B1A',
  red: '#E5484D',
  green: '#3FB950',
  accentBgSoft: '#2b2119',
  lockedBg: '#141414',
};

export const FONTS = {
  body: "'Barlow', system-ui, sans-serif",
  condensed: "'Barlow Condensed', 'Barlow', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

export const ROLES = {
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  ASESOR: 'ASESOR',
  TECNICO: 'TECNICO',
};

// Roles que se pueden asignar desde el formulario de Usuarios (TECNICO oculto en el MVP)
export const ROLES_ASIGNABLES = [ROLES.ADMIN, ROLES.ASESOR, ROLES.GERENTE];

export const ESPECIALIDADES = [
  'ARMADOR',
  'LATONERO',
  'MECANICO',
  'ALISTADOR',
  'PINTOR',
  'CONTROL_CALIDAD',
];

export const ESPECIALIDAD_LABEL = {
  ARMADOR: 'Armador',
  LATONERO: 'Latonero',
  MECANICO: 'Mecánico',
  ALISTADOR: 'Alistador',
  PINTOR: 'Pintor',
  CONTROL_CALIDAD: 'Control de calidad',
};

// Catálogo de las 10 etapas reales, en orden de flujo.
// especialidad: null => la etapa no lleva técnico (Bancada) o no aplica.
// diasLimiteCritico: null => sin umbral (Entregado).
export const ETAPAS = [
  { id: 1, nombre: 'Desarme', orden: 1, especialidad: 'ARMADOR', diasLimiteCritico: 2 },
  { id: 2, nombre: 'Latonería', orden: 2, especialidad: 'LATONERO', diasLimiteCritico: 3 },
  { id: 3, nombre: 'Bancada', orden: 3, especialidad: null, diasLimiteCritico: 1 },
  { id: 4, nombre: 'Electromecánica', orden: 4, especialidad: 'MECANICO', diasLimiteCritico: 5 },
  { id: 5, nombre: 'Alistamiento de superficies', orden: 5, especialidad: 'ALISTADOR', diasLimiteCritico: 2 },
  { id: 6, nombre: 'Pintura', orden: 6, especialidad: 'PINTOR', diasLimiteCritico: 4 },
  { id: 7, nombre: 'Armado', orden: 7, especialidad: 'ARMADOR', diasLimiteCritico: 2 },
  { id: 8, nombre: 'Control de calidad', orden: 8, especialidad: 'CONTROL_CALIDAD', diasLimiteCritico: 1 },
  { id: 9, nombre: 'Listo para entregar', orden: 9, especialidad: null, diasLimiteCritico: 2 },
  { id: 10, nombre: 'Entregado', orden: 10, especialidad: null, diasLimiteCritico: null },
];

export const ETAPA_BANCADA_ID = 3;
export const ETAPA_ENTREGADO_ID = 10;

// Etapas en las que el modal de cambio de etapa exige técnico.
// Bancada no lleva técnico; "Listo para entregar" y "Entregado" no tienen especialidad asociada.
export const etapaRequiereTecnico = (idEtapa) => {
  const e = ETAPAS.find((x) => x.id === idEtapa);
  return !!(e && e.especialidad);
};

export const getEtapa = (idEtapa) => ETAPAS.find((e) => e.id === idEtapa) || null;

// Columna calculada del Kanban (no es etapa real del catálogo)
export const COLUMNA_ASIGNADO = { id: null, nombre: 'Asignado' };

// Etapas mostradas en el panel "Carga por etapa" del Dashboard
export const ETAPAS_CARGA = [
  'Latonería',
  'Pintura',
  'Desarme',
  'Electromecánica',
  'Armado',
  'Control de calidad',
  'Alistamiento de superficies',
];

export const DIAS_PROXIMO_A_VENCER = 3;

export const UBICACION = {
  EN_TALLER: 'EN_TALLER',
  FUERA_DE_TALLER: 'FUERA_DE_TALLER',
};

export const ESTADO_ORDEN = {
  ACTIVA: 'ACTIVA',
  ENTREGADA: 'ENTREGADA',
};

export const ACCION_PIEZA = {
  SUSTITUIR: 'SUSTITUIR',
  REPARAR: 'REPARAR',
};

export const GRAVEDADES = ['LEVE', 'MEDIA', 'GRAVE'];

// Tipos de alerta / listas filtradas desde el Dashboard
export const TIPOS_AVISO = {
  critico: { id: 'critico', label: 'Críticos', titulo: 'Órdenes críticas', dot: COLORS.red },
  vencido: { id: 'vencido', label: 'Vencidos', titulo: 'Órdenes vencidas', dot: COLORS.red },
  proximo: { id: 'proximo', label: 'Próximos a vencer', titulo: 'Próximas a vencer', dot: COLORS.accent },
  proceso: { id: 'proceso', label: 'En proceso', titulo: 'Órdenes en proceso', dot: COLORS.sub },
  taller: { id: 'taller', label: 'En taller', titulo: 'Vehículos en taller', dot: COLORS.text },
  fuera: { id: 'fuera', label: 'Fuera del taller', titulo: 'Fuera del taller', dot: COLORS.line },
};

// Filtros del módulo Valoración
export const FILTROS_VALORACION = {
  SIN_VALORAR: 'Sin valorar',
  SIN_CARGAR: 'Sin cargar a CESVI',
  CARGADAS: 'Cargadas a CESVI',
};
