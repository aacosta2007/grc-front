import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useFotosAdjuntas, { validarFotos } from './useFotosAdjuntas';

const MB = 1024 * 1024;

// File con el tamaño indicado sin reservar la memoria
const archivo = (nombre, tipo, bytes) => {
  const f = new File(['x'], nombre, { type: tipo });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
};

describe('validarFotos', () => {
  it('acepta JPEG y PNG de hasta 10 MB', () => {
    const r = validarFotos([archivo('a.jpg', 'image/jpeg', 10 * MB), archivo('b.png', 'image/png', MB)]);
    expect(r.aceptados.map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
    expect(r.error).toBe('');
  });

  it('rechaza otros tipos y fotos de más de 10 MB', () => {
    const r = validarFotos([
      archivo('a.gif', 'image/gif', MB),
      archivo('b.jpg', 'image/jpeg', 10 * MB + 1),
      archivo('c.png', 'image/png', MB),
    ]);
    expect(r.aceptados.map((f) => f.name)).toEqual(['c.png']);
    expect(r.error).toMatch(/JPEG o PNG: a\.gif/);
    expect(r.error).toMatch(/10 MB: b\.jpg/);
  });

  it('sin tipo decide por la extensión', () => {
    const r = validarFotos([archivo('a.JPEG', '', MB), archivo('b.webp', '', MB)]);
    expect(r.aceptados.map((f) => f.name)).toEqual(['a.JPEG']);
  });

  it('no deja pasar de 60 MB por envío contando lo ya adjunto', () => {
    const r = validarFotos([archivo('a.jpg', 'image/jpeg', 8 * MB), archivo('b.jpg', 'image/jpeg', 5 * MB)], 55 * MB);
    // 55 + 8 se pasa; 55 + 5 = 60 justo cabe
    expect(r.aceptados.map((f) => f.name)).toEqual(['b.jpg']);
    expect(r.error).toMatch(/60 MB por envío: a\.jpg\.$/);
  });
});

describe('useFotosAdjuntas', () => {
  let n;
  beforeEach(() => {
    n = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++n}`);
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('agrega, quita y limpia liberando los object URL', () => {
    const { result, unmount } = renderHook(() => useFotosAdjuntas());

    act(() => result.current.agregar([archivo('a.jpg', 'image/jpeg', MB), archivo('b.gif', 'image/gif', MB)]));
    expect(result.current.fotos.map((f) => f.nombre)).toEqual(['a.jpg']);
    expect(result.current.archivos.map((f) => f.name)).toEqual(['a.jpg']);
    expect(result.current.error).toMatch(/b\.gif/);

    act(() => result.current.agregar([archivo('c.png', 'image/png', MB)]));
    act(() => result.current.quitar(result.current.fotos[0].key));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(result.current.fotos.map((f) => f.nombre)).toEqual(['c.png']);
    expect(result.current.error).toBe('');

    act(() => result.current.limpiar());
    expect(result.current.fotos).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:2');

    act(() => result.current.agregar([archivo('d.png', 'image/png', MB)]));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:3');
  });

  it('el tope de 60 MB cuenta las fotos ya adjuntas', () => {
    const { result } = renderHook(() => useFotosAdjuntas());
    act(() => result.current.agregar(Array.from({ length: 6 }, (_, i) => archivo(`${i}.jpg`, 'image/jpeg', 10 * MB))));
    act(() => result.current.agregar([archivo('extra.jpg', 'image/jpeg', 1)]));
    expect(result.current.fotos).toHaveLength(6);
    expect(result.current.error).toMatch(/extra\.jpg/);
  });
});
