import { describe, expect, it } from 'vitest';
import { aFormData } from './multipart';

describe('aFormData', () => {
  it('pone los datos como parte JSON "datos" y repite "archivos" por cada foto', async () => {
    const a = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });

    const form = aFormData({ nota: 'Hola', idEtapa: null }, [a, b]);

    const datos = form.get('datos');
    expect(datos.type).toBe('application/json');
    expect(JSON.parse(await datos.text())).toEqual({ nota: 'Hola', idEtapa: null });
    expect(form.getAll('archivos').map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
  });

  it('sin archivos solo lleva la parte "datos"', () => {
    expect(aFormData({ x: 1 }).getAll('archivos')).toEqual([]);
    expect(aFormData({ x: 1 }, null).getAll('archivos')).toEqual([]);
  });
});
