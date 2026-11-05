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
      tipo: 'ETAPA',
    });
    expect(lista[1]).toMatchObject({ idEtapa: null, etapa: 'Entrega', tipo: 'ENTREGA' });
  });
});

const leerDatos = async (form) => JSON.parse(await form.get('datos').text());

describe('crearObservacion', () => {
  it('manda nota y fotos en una sola petición multipart y devuelve la observación adaptada', async () => {
    http.post.mockResolvedValue(obsDto({ tipo: 'ETAPA', imagenes: [{ id: 9, url: '/x', nombre: 'a.png' }] }));
    const foto = new File(['png'], 'a.png', { type: 'image/png' });

    const o = await observacionService.crearObservacion({
      idOrden: 17,
      tipo: 'ETAPA',
      idEtapa: 2,
      texto: 'Se cambió el guardabarros',
      notificar: true,
      archivos: [foto],
    });

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, form] = http.post.mock.calls[0];
    expect(url).toBe('/orden/17/observaciones');
    expect(form).toBeInstanceOf(FormData);
    expect(await leerDatos(form)).toEqual({
      tipo: 'ETAPA',
      idEtapa: 2,
      nota: 'Se cambió el guardabarros',
      ubicacion: 'EN_TALLER',
      visibleCliente: true,
    });
    expect(form.getAll('archivos').map((f) => f.name)).toEqual(['a.png']);
    expect(o).toMatchObject({ id: 5, tipo: 'ETAPA', etapa: 'Latonería', imagenes: [{ id: 9, nombre: 'a.png' }] });
  });

  it('en una orden entregada no manda ubicación', async () => {
    http.post.mockResolvedValue(obsDto());

    await observacionService.crearObservacion({ idOrden: 17, tipo: 'ETAPA', idEtapa: 2, texto: 'x', entregada: true });

    expect(await leerDatos(http.post.mock.calls[0][1])).not.toHaveProperty('ubicacion');
  });

  it.each(['INGRESO_COTIZAR', 'INGRESO_TALLER', 'ENTREGA'])('con tipo %s manda idEtapa null y sin ubicación', async (tipo) => {
    http.post.mockResolvedValue(obsDto({ idEtapa: null, nombreEtapa: 'Ingreso a cotizar', tipo }));

    const o = await observacionService.crearObservacion({ idOrden: 17, tipo, idEtapa: 3, texto: 'Nota', notificar: false });

    const form = http.post.mock.calls[0][1];
    expect(await leerDatos(form)).toEqual({ tipo, idEtapa: null, nota: 'Nota', visibleCliente: false });
    expect(form.getAll('archivos')).toEqual([]);
    expect(o).toMatchObject({ tipo, idEtapa: null });
  });

  it('no usa la ruta de subir imágenes aparte', async () => {
    http.post.mockResolvedValue(obsDto());
    await observacionService.crearObservacion({
      idOrden: 17,
      tipo: 'ETAPA',
      idEtapa: 2,
      texto: 'x',
      archivos: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })],
    });
    expect(http.post.mock.calls.map((c) => c[0])).toEqual(['/orden/17/observaciones']);
  });
});
