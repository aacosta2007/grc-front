import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./httpClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  USE_MOCK: false,
}));

import http from './httpClient';
import * as valoracionService from './valoracionService';

// ValoracionResponseDto tal como lo devuelve el backend
const valoracionDto = (detalles) => ({
  idValoracion: 5,
  idOrdenReparacion: 17,
  descripcionGeneral: 'Golpe lateral',
  detalles,
  imagenes: [],
  cargadaCesvi: false,
  cargadaCesviAt: null,
  autor: 'Adrian Acosta',
  createAt: '2026-11-01T10:00:00',
  updateAt: null,
});

afterEach(() => vi.resetAllMocks());

describe('guardarValoracion', () => {
  it('manda cantidad y observación de cada pieza (crear con POST)', async () => {
    http.post.mockResolvedValue(valoracionDto([]));

    await valoracionService.guardarValoracion(
      17,
      {
        descripcion: 'Golpe lateral',
        detalles: [
          { pieza: 'Farola', accion: 'SUSTITUIR', gravedad: null, cantidad: 2, observacion: null },
          { pieza: 'Puerta', accion: 'REPARAR', gravedad: 'MEDIA', cantidad: 1, observacion: 'Abolladura' },
        ],
      },
      true
    );

    expect(http.post).toHaveBeenCalledWith('/orden/17/valoracion', {
      descripcionGeneral: 'Golpe lateral',
      detalles: [
        { pieza: 'Farola', accion: 'SUSTITUCION', gravedad: null, cantidad: 2, observacion: null },
        { pieza: 'Puerta', accion: 'REPARACION', gravedad: 'MEDIO', cantidad: 1, observacion: 'Abolladura' },
      ],
    });
  });

  it('al editar (PUT) conserva la cantidad; si una pieza no la trae manda 1', async () => {
    http.put.mockResolvedValue(valoracionDto([]));

    await valoracionService.guardarValoracion(
      17,
      { descripcion: '', detalles: [{ pieza: 'Capó', accion: 'PINTAR', gravedad: 'LEVE' }] },
      false
    );

    expect(http.put).toHaveBeenCalledWith('/orden/17/valoracion', {
      descripcionGeneral: '',
      detalles: [{ pieza: 'Capó', accion: 'PINTAR', gravedad: 'LEVE', cantidad: 1, observacion: null }],
    });
  });
});

describe('getValoracion', () => {
  it('trae la cantidad y la observación de cada pieza', async () => {
    http.get.mockResolvedValue(
      valoracionDto([
        { idValoracionDetalle: 1, pieza: 'Farola', accion: 'SUSTITUCION', gravedad: null, cantidad: 3, observacion: 'Izquierda' },
      ])
    );

    const v = await valoracionService.getValoracion(17);

    expect(v.detalles[0]).toEqual({
      id: 1,
      pieza: 'Farola',
      accion: 'SUSTITUIR',
      gravedad: null,
      cantidad: 3,
      observacion: 'Izquierda',
    });
  });
});
