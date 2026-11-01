import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../services/valoracionService', () => ({
  guardarValoracion: vi.fn(),
  getValoracion: vi.fn(),
  subirImagenes: vi.fn(),
  eliminarImagen: vi.fn(),
  getImagenBlob: vi.fn(),
}));

import * as valoracionService from '../../services/valoracionService';
import HojaValoracion from './HojaValoracion';
import { cantidadValida } from '../../utils/constants';

const orden = { id: 17, numero: 17, placa: 'XXX123', vehiculoTexto: 'Toyota Supra · 1986', cliente: { nombre: 'Adrian Acosta' } };

// Valoración ya guardada: una pieza con cantidad 3 y observación (sin campo en pantalla)
const valoracion = {
  id: 5,
  idOrden: 17,
  descripcion: 'Golpe lateral',
  detalles: [{ id: 1, pieza: 'Farola', accion: 'SUSTITUIR', gravedad: null, cantidad: 3, observacion: 'Izquierda' }],
  imagenes: [],
  cargadaCesvi: false,
};

const botonGuardar = () => screen.getByRole('button', { name: 'GUARDAR VALORACIÓN' });

afterEach(() => vi.resetAllMocks());

describe('cantidadValida', () => {
  it('acepta enteros de 1 a 999 y rechaza lo demás', () => {
    expect(cantidadValida('1')).toBe(1);
    expect(cantidadValida(999)).toBe(999);
    expect(cantidadValida('0')).toBeNull();
    expect(cantidadValida('1000')).toBeNull();
    expect(cantidadValida('2.5')).toBeNull();
    expect(cantidadValida('')).toBeNull();
  });
});

describe('HojaValoracion · cantidad de piezas', () => {
  it('carga la cantidad guardada, permite editarla y agregar piezas con cantidad', async () => {
    valoracionService.guardarValoracion.mockResolvedValue({ id: 5 });
    valoracionService.getValoracion.mockResolvedValue(valoracion);
    const onSaved = vi.fn();

    render(<HojaValoracion orden={orden} valoracion={valoracion} onSaved={onSaved} />);

    // La pieza existente muestra su cantidad
    const cantFarola = screen.getByLabelText('Cantidad de Farola');
    expect(cantFarola).toHaveValue(3);
    fireEvent.change(cantFarola, { target: { value: '4' } });

    // Pieza nueva con cantidad 2
    fireEvent.change(screen.getByLabelText('NOMBRE DE LA PIEZA'), { target: { value: 'Rin' } });
    fireEvent.change(screen.getByLabelText('CANTIDAD'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'SUSTITUIR' }));
    fireEvent.click(screen.getByRole('button', { name: 'AGREGAR A LA HOJA' }));
    expect(screen.getByLabelText('Cantidad de Rin')).toHaveValue(2);
    expect(screen.getByLabelText('CANTIDAD')).toHaveValue(1); // se reinicia para la siguiente pieza

    fireEvent.click(botonGuardar());

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [idOrden, payload, esNueva] = valoracionService.guardarValoracion.mock.calls[0];
    expect(idOrden).toBe(17);
    expect(esNueva).toBe(false);
    expect(payload.detalles).toEqual([
      { pieza: 'Farola', accion: 'SUSTITUIR', gravedad: null, cantidad: 4, observacion: 'Izquierda' },
      { pieza: 'Rin', accion: 'SUSTITUIR', gravedad: null, cantidad: 2, observacion: null },
    ]);
  });

  it('no deja guardar ni agregar con una cantidad inválida', () => {
    render(<HojaValoracion orden={orden} valoracion={valoracion} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Cantidad de Farola'), { target: { value: '0' } });
    expect(botonGuardar()).toBeDisabled();
    expect(screen.getByText(/Revisa las cantidades/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('NOMBRE DE LA PIEZA'), { target: { value: 'Rin' } });
    fireEvent.change(screen.getByLabelText('CANTIDAD'), { target: { value: '1000' } });
    expect(screen.getByRole('button', { name: 'AGREGAR A LA HOJA' })).toBeDisabled();
  });
});
