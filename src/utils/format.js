const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MS_DIA = 24 * 60 * 60 * 1000;

const toDate = (d) => (d instanceof Date ? d : new Date(d));

export const startOfDay = (d) => {
  const x = toDate(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

// Días calendario completos entre dos fechas (b - a)
export const diffDias = (a, b = new Date()) =>
  Math.round((startOfDay(b) - startOfDay(a)) / MS_DIA);

export const addDias = (d, n) => {
  const x = toDate(d);
  return new Date(x.getTime() + n * MS_DIA);
};

// "24 AGO 2026"
export const fmtFecha = (d) => {
  if (!d) return '—';
  const x = toDate(d);
  return `${String(x.getDate()).padStart(2, '0')} ${MESES[x.getMonth()]} ${x.getFullYear()}`;
};

// "24 AGO"
export const fmtFechaCorta = (d) => {
  if (!d) return '—';
  const x = toDate(d);
  return `${String(x.getDate()).padStart(2, '0')} ${MESES[x.getMonth()]}`;
};

// "08:42"
export const fmtHora = (d) => {
  if (!d) return '';
  const x = toDate(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};

// "24 AGO · 09:12"
export const fmtFechaHora = (d) => (d ? `${fmtFechaCorta(d)} · ${fmtHora(d)}` : '—');

// "25/08/2026"
export const fmtFechaNumerica = (d) => {
  if (!d) return '—';
  const x = toDate(d);
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
};

// Número de orden: correlativo simple, sin prefijo "OT-"
export const fmtOrden = (id) => `N.º ${id}`;

// "ABC-123"
export const fmtPlaca = (placa = '') =>
  placa.length === 6 ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;

export const normalizarPlaca = (v = '') => v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

// Cédula colombiana: solo dígitos, máximo 10
export const normalizarCedula = (v = '') => v.replace(/\D/g, '').slice(0, 10);
export const esCedulaValida = (v = '') => /^\d{6,10}$/.test(v);

export const pluralDias = (n, sufijo = 'AQUÍ') => `${n} ${n === 1 ? 'DÍA' : 'DÍAS'} ${sufijo}`.trim();
