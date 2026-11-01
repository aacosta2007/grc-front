import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./httpClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  USE_MOCK: false,
}));

import http from './httpClient';
import * as ordenService from './ordenService';

// OrdenReparacionResponseDto tal como lo devuelve el backend
const ordenDto = (extra = {}) => ({
  idOrdenReparacion: 17,
  vehiculo: { idVehiculo: 3, placa: 'XXX123', marca: 'Toyota', modelo: 'Supra', anio: 1986, color: 'Rojo', vin: null },
  cliente: { idPersona: 4, nombreCompleto: 'Adrian Acosta', documento: '123', celular: '300', correo: null },
  usuarioCreador: 'Adrian Acosta',
  asesor: null,
  idEtapaActual: null,
  nombreEtapaActual: null,
  idTecnicoActual: null,
  nombreTecnicoActual: null,
  fechaInicioEtapa: null,
  diasEnEtapa: 0,
  diasEnTaller: 0,
  etapasVisitadas: [],
  alertas: { critico: false, vencido: false, proximo: false, proceso: true, diasParaEntrega: 15 },
  alerta: 'NORMAL',
  estado: 'ACTIVA',
  ubicacionActual: 'EN_TALLER',
  fechaIngresoCotizar: '2026-10-31',
  fechaIngresoReparacion: '2026-10-31',
  fechaDeEntregaEstimada: '2026-11-15',
  fechaDeEntregaReal: null,
  diasEstimadoEntrega: 15,
  createAt: '2026-10-31T09:00:00',
  updateAt: '2026-10-31T09:00:00',
  ...extra,
});

// OrdenEtapaFechaResponseDto (por fechaInicio)
const hist = (idEtapa, fechaInicio, { fechaFin = null, tecnico = null } = {}) => ({
  idOrdenEtapaFecha: idEtapa,
  idOrdenReparacion: 17,
  idEtapa,
  nombreEtapa: `Etapa ${idEtapa}`,
  idTecnico: tecnico ? tecnico.id : null,
  nombreTecnico: tecnico ? tecnico.nombre : null,
  fechaInicio,
  fechaFin,
  completada: fechaFin !== null,
});

const PEDRO = { id: 14, nombre: 'Pedro Pablo Arango' };

// Responde GET según la ruta: { '/orden/17': dto, '/orden/17/etapas': [...] }
const rutasGet = (rutas) =>
  http.get.mockImplementation((url) =>
    url in rutas ? Promise.resolve(rutas[url]) : Promise.reject(new Error(`GET inesperado: ${url}`))
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 31, 12, 0, 0)); // 31 oct 2026, mediodía local
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('getHistorialEtapas', () => {
  it('usa la ruta /orden/{id}/etapas y adapta técnico y fechas', async () => {
    rutasGet({
      '/orden/17/etapas': [
        hist(1, '2026-10-31T08:00:00', { fechaFin: '2026-10-31T09:00:00', tecnico: PEDRO }),
        hist(3, '2026-10-31T09:00:00'), // Bancada: sin técnico, en curso
      ],
    });

    const h = await ordenService.getHistorialEtapas(17);

    expect(http.get).toHaveBeenCalledWith('/orden/17/etapas');
    expect(h[0]).toEqual({
      id: 1,
      idOrden: 17,
      idEtapa: 1,
      etapa: 'Etapa 1',
      tecnico: { id: 14, nombre: 'Pedro Pablo Arango' },
      usuario: null,
      fechaInicio: '2026-10-31T08:00:00',
      fechaFin: '2026-10-31T09:00:00',
    });
    expect(h[1]).toMatchObject({ idEtapa: 3, tecnico: null, fechaFin: null });
  });

  it('devuelve [] si la orden nunca entró a una etapa', async () => {
    rutasGet({ '/orden/17/etapas': [] });
    expect(await ordenService.getHistorialEtapas(17)).toEqual([]);
  });
});

describe('getOrden', () => {
  it('adapta el DTO con los campos calculados en una sola petición', async () => {
    rutasGet({
      '/orden/17': ordenDto({
        idEtapaActual: 2,
        nombreEtapaActual: 'Latonería',
        idTecnicoActual: 16,
        nombreTecnicoActual: 'Luis Latonero',
        fechaInicioEtapa: '2026-10-28T08:00:00',
        diasEnEtapa: 3,
        diasEnTaller: 5,
        etapasVisitadas: [1, 2],
        alertas: { critico: false, vencido: false, proximo: true, proceso: true, diasParaEntrega: 2 },
        alerta: 'PROXIMO',
      }),
    });

    const o = await ordenService.getOrden(17);

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(o).toMatchObject({
      id: 17,
      placa: 'XXX123',
      cliente: { id: 4, nombre: 'Adrian Acosta' },
      idEtapaActual: 2,
      columna: 'Latonería',
      tecnicoActual: { id: 16, nombre: 'Luis Latonero' },
      fechaInicioEtapa: '2026-10-28T08:00:00',
      diasEnEtapa: 3,
      diasEnTaller: 5,
      etapasVisitadas: [1, 2],
      alertas: { proximo: true, diasParaEntrega: 2 },
      alerta: 'proximo',
      fechaEntregaEstimada: '2026-11-15',
      diasEstimadoEntrega: 15,
    });
  });

  it('una orden entregada no va al tablero y conserva sus etapas visitadas', async () => {
    rutasGet({
      '/orden/17': ordenDto({ estado: 'CERRADA', idEtapaActual: 9, etapasVisitadas: [1, 9], alerta: 'NORMAL' }),
    });

    const o = await ordenService.getOrden(17);

    expect(o).toMatchObject({ estado: 'ENTREGADA', columna: null, etapasVisitadas: [1, 9], alerta: 'normal' });
  });
});

describe('acciones de la ficha (devuelven la orden completa)', () => {
  beforeEach(() => {
    // La respuesta del PATCH ya trae los campos calculados
    http.patch.mockResolvedValue(ordenDto({ idEtapaActual: 6, etapasVisitadas: [1, 6] }));
  });

  it('cambiarEtapa manda el body que espera CambioEtapaRequestDto', async () => {
    const o = await ordenService.cambiarEtapa({ idOrden: 17, idEtapa: 6, idTecnico: 20, nota: 'Listo', notificar: true });

    expect(http.patch).toHaveBeenCalledWith('/orden/17/etapa', {
      idEtapaDestino: 6,
      idTecnico: 20,
      nota: 'Listo',
      visibleCliente: true,
    });
    expect(o.etapasVisitadas).toEqual([1, 6]);
    expect(http.get).not.toHaveBeenCalled(); // ya no recarga la orden
  });

  it('marcarIngresoCotizar manda la fecha local de hoy', async () => {
    const o = await ordenService.marcarIngresoCotizar(17);

    expect(http.patch).toHaveBeenCalledWith('/orden/17/ingreso-cotizar', { fecha: '2026-10-31' });
    expect(o.etapasVisitadas).toEqual([1, 6]);
  });

  it('marcarIngresoReparacion usa la fecha local aunque en UTC ya sea mañana', async () => {
    vi.setSystemTime(new Date(2026, 9, 31, 23, 30, 0)); // 11:30 p. m. local

    await ordenService.marcarIngresoReparacion(17);

    expect(http.patch).toHaveBeenCalledWith('/orden/17/ingreso-reparacion', { fecha: '2026-10-31' });
  });

  it('marcarDiasEstimados manda { dias } y conserva etapasVisitadas', async () => {
    const o = await ordenService.marcarDiasEstimados(17, 15);

    expect(http.patch).toHaveBeenCalledWith('/orden/17/dias-estimados', { dias: 15 });
    expect(o.id).toBe(17);
    expect(o.etapasVisitadas).toEqual([1, 6]);
  });

  it('entregarOrden manda el body que espera EntregaRequestDto', async () => {
    http.patch.mockResolvedValue(
      ordenDto({
        idEtapaActual: 9,
        estado: 'CERRADA',
        fechaDeEntregaReal: '2026-10-31',
        ubicacionActual: 'FUERA_DE_TALLER',
        etapasVisitadas: [1, 9],
      })
    );

    const o = await ordenService.entregarOrden({ idOrden: 17, nota: 'Entregado sin novedad', notificar: false });

    expect(http.patch).toHaveBeenCalledWith('/orden/17/entregar-orden', { nota: 'Entregado sin novedad', visibleCliente: false });
    expect(o).toMatchObject({ estado: 'ENTREGADA', fechaEntregaReal: '2026-10-31', ubicacionActual: 'FUERA_DE_TALLER' });
    expect(o.etapasVisitadas).toEqual([1, 9]);
  });

  it('si el PATCH falla, propaga el error y no recarga la orden', async () => {
    http.patch.mockRejectedValue(Object.assign(new Error('La orden 17 ya pasó por la etapa Desarme'), { status: 409 }));

    await expect(ordenService.cambiarEtapa({ idOrden: 17, idEtapa: 1, idTecnico: 14 })).rejects.toThrow('ya pasó por la etapa');
    expect(http.get).not.toHaveBeenCalled();
  });
});

describe('getOrdenesKanban', () => {
  it('hace una sola petición y deja solo las órdenes con ingreso al taller', async () => {
    rutasGet({
      '/orden': [
        ordenDto({ idOrdenReparacion: 1, fechaIngresoReparacion: null, fechaDeEntregaEstimada: null, diasEnEtapa: null }), // solo cotización
        ordenDto({ idOrdenReparacion: 2, fechaIngresoReparacion: '2026-10-29', fechaDeEntregaEstimada: null, diasEnEtapa: 2 }), // Asignado
        ordenDto({
          idOrdenReparacion: 17,
          idEtapaActual: 2,
          nombreEtapaActual: 'Latonería',
          idTecnicoActual: 16,
          nombreTecnicoActual: 'Luis Latonero',
          etapasVisitadas: [1, 2],
          diasEnEtapa: 0,
        }),
      ],
    });

    const tablero = await ordenService.getOrdenesKanban();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/orden');
    expect(tablero.map((o) => o.id)).toEqual([2, 17]);

    const asignada = tablero.find((o) => o.id === 2);
    expect(asignada).toMatchObject({ columna: 'Asignado', etapasVisitadas: [], diasEnEtapa: 2, tecnicoActual: null });

    const enLatoneria = tablero.find((o) => o.id === 17);
    expect(enLatoneria).toMatchObject({
      columna: 'Latonería',
      etapasVisitadas: [1, 2],
      diasEnEtapa: 0,
      alerta: 'normal',
      tecnicoActual: { id: 16, nombre: 'Luis Latonero' },
    });
  });

  it('usa la alerta que calcula el backend (en minúsculas)', async () => {
    rutasGet({
      '/orden': [
        ordenDto({ idOrdenReparacion: 1, idEtapaActual: 2, alerta: 'VENCIDO' }),
        ordenDto({ idOrdenReparacion: 2, idEtapaActual: 1, alerta: 'CRITICO' }),
        ordenDto({ idOrdenReparacion: 3, idEtapaActual: 5, alerta: 'PROXIMO' }),
      ],
    });

    const tablero = await ordenService.getOrdenesKanban();

    expect(tablero.map((o) => o.alerta)).toEqual(['vencido', 'critico', 'proximo']);
  });
});
