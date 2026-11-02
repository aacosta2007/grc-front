import { describe, expect, it } from 'vitest';
import { crearErrorApi } from './httpClient';

const errorAxios = (status, data) => ({ message: 'Request failed', response: { status, data } });

describe('crearErrorApi', () => {
  it('usa data.error como mensaje y adjunta status y campos de un 400 de validación', () => {
    const err = crearErrorApi(
      errorAxios(400, {
        error: 'Datos inválidos: La placa es obligatoria',
        campos: { placa: 'La placa es obligatoria', 'cliente.documento': 'El documento es obligatorio' },
      })
    );
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Datos inválidos: La placa es obligatoria');
    expect(err.status).toBe(400);
    expect(err.campos).toEqual({
      placa: 'La placa es obligatoria',
      'cliente.documento': 'El documento es obligatorio',
    });
  });

  it('sin campos en la respuesta deja campos indefinido', () => {
    const err = crearErrorApi(errorAxios(409, { error: 'La orden no está activa' }));
    expect(err.message).toBe('La orden no está activa');
    expect(err.status).toBe(409);
    expect(err.campos).toBeUndefined();
  });

  it('sin respuesta del servidor usa el mensaje de axios', () => {
    const err = crearErrorApi({ message: 'Network Error' });
    expect(err.message).toBe('Network Error');
    expect(err.status).toBeUndefined();
    expect(err.campos).toBeUndefined();
  });
});
