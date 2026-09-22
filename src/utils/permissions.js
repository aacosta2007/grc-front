import { ROLES } from './constants';

const { ADMIN, GERENTE, ASESOR } = ROLES;

// Acceso por módulo (sección 1 del análisis de requisitos).
// TECNICO no tiene acceso web a ningún módulo en el MVP.
export const MODULOS = [
  { id: 'alertas', path: '/alertas', label: 'Alertas', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'backlog', path: '/backlog', label: 'Backlog', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'ficha', path: '/ficha', label: 'Buscar placa', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'nueva', path: '/nueva-orden', label: 'Nueva orden', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'valoracion', path: '/valoracion', label: 'Valoración', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'tecnicos', path: '/tecnicos', label: 'Técnicos', roles: [ADMIN, GERENTE, ASESOR] },
  { id: 'usuarios', path: '/usuarios', label: 'Usuarios', roles: [ADMIN, GERENTE] },
];

export const puedeAcceder = (rol, moduloId) => {
  const m = MODULOS.find((x) => x.id === moduloId);
  return !!(m && rol && m.roles.includes(rol));
};

export const modulosPara = (rol) => MODULOS.filter((m) => m.roles.includes(rol));

// Técnicos: ADMIN/GERENTE CRUD; ASESOR solo lectura
export const puedeEditarTecnicos = (rol) => rol === ADMIN || rol === GERENTE;

// Usuarios: solo ADMIN/GERENTE
export const puedeGestionarUsuarios = (rol) => rol === ADMIN || rol === GERENTE;

export const tieneAccesoWeb = (rol) => rol === ADMIN || rol === GERENTE || rol === ASESOR;
