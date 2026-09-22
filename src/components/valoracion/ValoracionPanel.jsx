import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Spinner } from '../ui';
import * as ordenService from '../../services/ordenService';
import * as valoracionService from '../../services/valoracionService';
import HojaValoracion from './HojaValoracion';
import ValoracionPdfView from './ValoracionPdfView';

// Componente compartido del módulo Valoración: lo usan ValoracionOrdenPage (/valoracion/:idOrden)
// y la pestaña "Valoración" de la Ficha de la orden.
// Contrato: <ValoracionPanel idOrden={number} onBack={optionalFn} />
// - Sin valoración registrada -> hoja vacía para crear.
// - Con valoración registrada -> vista tipo PDF (con acción EDITAR que abre la hoja precargada).
// - Al guardar la hoja, vuelve a la vista PDF.
export default function ValoracionPanel({ idOrden, onBack }) {
  const [orden, setOrden] = useState(null);
  const [valoracion, setValoracion] = useState(null);
  const [modo, setModo] = useState('hoja'); // 'hoja' | 'pdf'
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [o, v] = await Promise.all([ordenService.getOrden(idOrden), valoracionService.getValoracion(idOrden)]);
      setOrden(o);
      setValoracion(v);
      setModo(v ? 'pdf' : 'hoja');
    } catch (e) {
      setError(e.message || 'No se pudo cargar la valoración de la orden.');
    } finally {
      setCargando(false);
    }
  }, [idOrden]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) return <Spinner label="CARGANDO VALORACIÓN" />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!orden) return <Alert type="error">No se encontró la orden solicitada.</Alert>;

  if (modo === 'hoja') {
    return (
      <HojaValoracion
        orden={orden}
        valoracion={valoracion}
        onSaved={(v) => {
          setValoracion(v);
          setModo('pdf');
        }}
        onCancel={valoracion ? () => setModo('pdf') : onBack}
      />
    );
  }

  return (
    <ValoracionPdfView
      orden={orden}
      valoracion={valoracion}
      onBack={onBack}
      onEditar={() => setModo('hoja')}
      onActualizado={setValoracion}
    />
  );
}
