import { describe, expect, it } from 'vitest';
import { addDias, diffDias, fmtFecha, fmtFechaCorta } from './format';

describe('fechas LocalDate del backend ("YYYY-MM-DD")', () => {
  it('se muestran en el día correcto (no el anterior por UTC)', () => {
    expect(fmtFecha('2026-10-31')).toBe('31 OCT 2026');
    expect(fmtFecha('2026-01-01')).toBe('01 ENE 2026');
    expect(fmtFechaCorta('2026-11-15')).toBe('15 NOV');
  });

  it('cuentan días calendario completos', () => {
    expect(diffDias('2026-10-31', new Date(2026, 9, 31, 23, 59))).toBe(0);
    expect(diffDias('2026-10-29', new Date(2026, 9, 31, 8, 0))).toBe(2);
    expect(diffDias(new Date(2026, 9, 31), '2026-11-15')).toBe(15);
  });

  it('addDias parte de la medianoche local', () => {
    expect(fmtFecha(addDias('2026-10-31', 15))).toBe('15 NOV 2026');
  });
});

describe('otros formatos se siguen leyendo igual', () => {
  it('LocalDateTime sin zona y objetos Date', () => {
    expect(fmtFecha('2026-10-31T10:15:00')).toBe('31 OCT 2026');
    expect(fmtFecha(new Date(2026, 9, 31))).toBe('31 OCT 2026');
  });

  it('valores vacíos', () => {
    expect(fmtFecha(null)).toBe('—');
    expect(fmtFecha('')).toBe('—');
  });
});
