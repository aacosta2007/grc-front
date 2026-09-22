import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as ordenService from '../services/ordenService';
import { Spinner, Alert, Button } from '../components/ui';
import { fmtPlaca, fmtOrden } from '../utils/format';
import TabInformacion from '../components/ficha/TabInformacion';
import TabReparacion from '../components/ficha/TabReparacion';
import TabObservaciones from '../components/ficha/TabObservaciones';
import TabFotografias from '../components/ficha/TabFotografias';
import ValoracionPanel from '../components/valoracion/ValoracionPanel';
import '../styles/Ficha.css';

const TABS = [
  { id: 'info', label: 'Información' },
  { id: 'rep', label: 'Reparación' },
  { id: 'val', label: 'Valoración' },
  { id: 'obs', label: 'Observaciones' },
  { id: 'fotos', label: 'Fotografías' },
];

// Ficha completa de una orden: cabecera fija + 5 pestañas sincronizadas con ?tab=
export default function FichaOrdenPage() {
  const { idOrden } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab');
  const tabActual = TABS.some((t) => t.id === tabParam) ? tabParam : 'info';

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await ordenService.getOrden(idOrden);
      setOrden(data);
    } catch (e) {
      setError(e.message || 'No se pudo cargar la orden.');
      setOrden(null);
    } finally {
      setCargando(false);
    }
  }, [idOrden]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const irATab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  if (cargando) return <Spinner label="CARGANDO ORDEN" />;

  if (error || !orden) {
    return (
      <div className="ficha-page">
        <Alert type="error">{error || 'No se encontró la orden solicitada.'}</Alert>
        <Button variant="outline" onClick={() => navigate('/ficha')} style={{ marginTop: 16 }}>
          ← VOLVER A BUSCAR
        </Button>
      </div>
    );
  }

  return (
    <div className="ficha-page">
      <div className="ficha-cabecera">
        <div className="ficha-cabecera-info">
          <span className="grc-placa" style={{ fontSize: 24 }}>{fmtPlaca(orden.placa)}</span>
          <span className="ficha-cabecera-sub">
            {orden.vehiculoTexto} · {orden.cliente.nombre} · {fmtOrden(orden.numero ?? orden.id)}
          </span>
        </div>
        <Button variant="outline" onClick={() => navigate(`/ficha?placa=${orden.placa}`)}>
          ← VOLVER A BUSCAR
        </Button>
      </div>

      <div className="ficha-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tabActual === t.id}
            className={`ficha-tab ${tabActual === t.id ? 'is-active' : ''}`}
            onClick={() => irATab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ficha-tab-content">
        {tabActual === 'info' && <TabInformacion orden={orden} />}
        {tabActual === 'rep' && <TabReparacion orden={orden} onOrdenChange={setOrden} recargar={cargar} />}
        {tabActual === 'val' && <ValoracionPanel idOrden={orden.id} />}
        {tabActual === 'obs' && <TabObservaciones orden={orden} onOrdenChange={setOrden} recargar={cargar} />}
        {tabActual === 'fotos' && <TabFotografias orden={orden} />}
      </div>
    </div>
  );
}
