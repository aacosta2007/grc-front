import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./httpClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  USE_MOCK: false,
}));

import http from './httpClient';
import * as observacionService from './observacionService';

// ObservacionResponseDto tal como lo devuelve el backend
const obsDto = (extra = {}) => ({
  idObservacion: 5,
  idOrdenReparacion: 17,
  idEtapa: 2,
  nombreEtapa: 'Latonería',
  autor: 'Adrian Acosta',
  nota: 'Se cambió el guardabarros',
  ubicacion: 'EN_TALLER',
  estadoRepuestos: null,
  visibleCliente: true,
  cantidadImagenes: 0,
  createAt: '2026-10-31T10:15:00',
  ...extra,
});

afterEach(() => vi.resetAllMocks());

describe('getObservaciones', () => {
  it('usa /orden/{id}/observaciones y adapta los campos', async () => {
    http.get.mockResolvedValue([obsDto(), obsDto({ idObservacion: 4, idEtapa: null, nombreEtapa: 'Entrega' })]);

    const lista = await observacionService.getObservaciones(17);

    expect(http.get).toHaveBeenCalledWith('/orden/17/observaciones');
    expect(lista[0]).toEqual({
      id: 5,
      idOrden: 17,
      idEtapa: 2,
      etapa: 'Latonería',
      autor: 'Adrian Acosta',
      fecha: '2026-10-31T10:15:00',
      texto: 'Se cambió el guardabarros',
      visibleCliente: true,
      imagenes: [],
    });
    expect(lista[1]).toMatchObject({ idEtapa: null, etapa: 'Entrega' });
  });
});

describe('crearObservacion', () => {
  it('manda el body que espera ObservacionRequestDto y devuelve la observación adaptada', async () => {
    http.post.mockResolvedValue(obsDto());

    const o = await observacionService.crearObservacion({
      idOrden: 17,
      idEtapa: 2,
      texto: 'Se cambió el guardabarros',
      imagenes: [{ url: 'data:image/png;base64,xx', nombre: 'a.png' }],
      notificar: true,
    });

    expect(http.post).toHaveBeenCalledWith('/orden/17/observaciones', {
      idEtapa: 2,
      nota: 'Se cambió el guardabarros',
      ubicacion: 'EN_TALLER',
      visibleCliente: true,
    });
    expect(o).toMatchObject({ id: 5, texto: 'Se cambió el guardabarros', etapa: 'Latonería' });
  });
});
