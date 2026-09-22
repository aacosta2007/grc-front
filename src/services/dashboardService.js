import http, { USE_MOCK } from './httpClient';
import * as mock from './mock/mockApi';

// { enTaller, ingresosHoy, fuera, criticos, vencidos, proximos, enProceso }
export const getResumenDashboard = () => (USE_MOCK ? mock.getResumenDashboard() : http.get('/dashboard/resumen'));

// tipo: 'critico' | 'vencido' | 'proximo' | 'proceso' | 'taller' | 'fuera' → vistas de orden
export const getOrdenesPorAviso = (tipo) =>
  USE_MOCK ? mock.getOrdenesPorAviso(tipo) : http.get('/dashboard/avisos', { params: { tipo } });

// [{ id, fecha, idOrden, placa, tipo, texto }] de las últimas 24 h, más recientes primero
export const getMovimientosRecientes = () =>
  USE_MOCK ? mock.getMovimientosRecientes() : http.get('/dashboard/movimientos');

// [{ etapa, n }] para las 7 etapas del panel
export const getCargaPorEtapa = () => (USE_MOCK ? mock.getCargaPorEtapa() : http.get('/dashboard/carga-etapas'));
