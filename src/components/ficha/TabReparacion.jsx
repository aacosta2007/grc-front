import React, { useCallback, useEffect, useState } from 'react';
import * as ordenService from '../../services/ordenService';
import { Button, ConfirmDialog, Alert, Spinner } from '../ui';
import { fmtFecha } from '../../utils/format';
import { ETAPAS, ETAPA_ENTREGADO_ID, etapaRequiereTecnico } from '../../utils/constants';
import StageChangeModal from '../StageChangeModal';

const IconCalendario = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const IconCandado = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconLapiz = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

// HU-23 / HU-24 · Fechas del ciclo de vida + historial de las 10 etapas de reparación.
export default function TabReparacion({ orden, onOrdenChange }) {
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState('');

  const [confirmAccion, setConfirmAccion] = useState(null); // 'cotizar' | 'taller' | null
  const [busyFecha, setBusyFecha] = useState(false);
  const [errorFecha, setErrorFecha] = useState('');

  const [diasEstimados, setDiasEstimados] = useState('');
  const [confirmDias, setConfirmDias] = useState(false);
  const [busyDias, setBusyDias] = useState(false);
  const [errorDias, setErrorDias] = useState('');

  const [etapaModal, setEtapaModal] = useState(null);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      const data = await ordenService.getHistorialEtapas(orden.id);
      setHistorial(data);
    } catch (e) {
      setErrorHistorial(e.message || 'No se pudo cargar el historial de etapas.');
    } finally {
      setCargandoHistorial(false);
    }
  }, [orden.id]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const confirmarFecha = async () => {
    setBusyFecha(true);
    setErrorFecha('');
    try {
      const fn = confirmAccion === 'cotizar' ? ordenService.marcarIngresoCotizar : ordenService.marcarIngresoReparacion;
      const actualizado = await fn(orden.id);
      onOrdenChange(actualizado);
      setConfirmAccion(null);
    } catch (e) {
      setErrorFecha(e.message || 'No se pudo registrar la fecha.');
    } finally {
      setBusyFecha(false);
    }
  };

  const nDias = Number(diasEstimados);
  const diasValidos = Number.isInteger(nDias) && nDias > 0;

  const confirmarDias = async () => {
    setBusyDias(true);
    setErrorDias('');
    try {
      const actualizado = await ordenService.marcarDiasEstimados(orden.id, nDias);
      onOrdenChange(actualizado);
      setConfirmDias(false);
    } catch (e) {
      setErrorDias(e.message || 'No se pudo registrar los días estimados.');
    } finally {
      setBusyDias(false);
    }
  };

  const entregada = orden.idEtapaActual === ETAPA_ENTREGADO_ID;
  const puedeCambiarEtapa = !!orden.fechaIngresoReparacion && !entregada;

  const etapasVisitadas = orden.etapasVisitadas || [];

  const fechasOrden = [
    {
      key: 'cotizar',
      label: 'Ingreso a cotizar',
      nota: 'Fecha de recepción para cotización',
      fecha: orden.fechaIngresoCotizar,
    },
    {
      key: 'taller',
      label: 'Ingreso al taller',
      nota: 'Inicia el conteo de días en taller',
      fecha: orden.fechaIngresoReparacion,
    },
  ];

  return (
    <div className="ficha-reparacion">
      {errorFecha && <Alert type="error">{errorFecha}</Alert>}

      <div className="ficha-fechas-grid">
        {fechasOrden.map((f) => (
          <div key={f.key} className="grc-card ficha-fecha-card">
            <div className="grc-mono grc-sub">{f.label.toUpperCase()}</div>
            <div className="ficha-fecha-valor">
              {f.fecha ? (
                <span className="ficha-fecha-mono">{fmtFecha(f.fecha)}</span>
              ) : (
                <span className="ficha-fecha-mono">—</span>
              )}
              {f.fecha ? (
                <span className="ficha-fecha-registrada">
                  <IconCandado /> REGISTRADA
                </span>
              ) : (
                <button
                  type="button"
                  className="ficha-icon-btn"
                  aria-label={`Marcar ${f.label.toLowerCase()} hoy`}
                  onClick={() => setConfirmAccion(f.key)}
                >
                  <IconCalendario />
                </button>
              )}
            </div>
            <div className="ficha-fecha-nota">{f.nota}</div>
          </div>
        ))}

        <div className="grc-card ficha-fecha-card">
          <div className="grc-mono grc-sub">DÍAS ESTIMADOS DE ENTREGA</div>
          {orden.diasEstimadoEntrega != null ? (
            <>
              <div className="ficha-fecha-valor">
                <span className="ficha-fecha-mono">
                  {orden.diasEstimadoEntrega} días · entrega {fmtFecha(orden.fechaEntregaEstimada)}
                </span>
                <span className="ficha-fecha-registrada">
                  <IconCandado /> REGISTRADA
                </span>
              </div>
              <div className="ficha-fecha-nota">Campo numérico · define las alertas</div>
            </>
          ) : (
            <>
              <div className="ficha-fecha-dias-form">
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label="Días estimados de entrega"
                  value={diasEstimados}
                  disabled={!orden.fechaIngresoReparacion}
                  onChange={(e) => setDiasEstimados(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!orden.fechaIngresoReparacion || !diasValidos}
                  onClick={() => setConfirmDias(true)}
                >
                  GUARDAR
                </Button>
              </div>
              <div className="ficha-fecha-nota">
                {orden.fechaIngresoReparacion
                  ? 'Campo numérico · define las alertas'
                  : 'Primero registra el ingreso al taller'}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ficha-etapas-encabezado">
        <div className="grc-section-title">Proceso de reparación</div>
        <div className="grc-sub" style={{ fontSize: 13 }}>El lápiz abre el modal de cambio de etapa</div>
      </div>

      {errorHistorial && <Alert type="error">{errorHistorial}</Alert>}
      {cargandoHistorial ? (
        <Spinner label="CARGANDO HISTORIAL" />
      ) : (
        <div className="ficha-etapas-grid">
          {ETAPAS.map((etapa) => {
            const histEntry = historial.find((h) => h.idEtapa === etapa.id) || null;
            const visitada = etapasVisitadas.includes(etapa.id);
            const enCurso = histEntry && histEntry.fechaFin === null;
            const estado = enCurso ? 'EN CURSO' : visitada ? 'COMPLETADA' : 'PENDIENTE';
            const color = enCurso ? 'var(--accent)' : visitada ? 'var(--green)' : 'var(--line)';
            const tecnicoTexto = !etapaRequiereTecnico(etapa.id)
              ? 'No requiere técnico'
              : histEntry && histEntry.tecnico
              ? histEntry.tecnico.nombre
              : 'Sin asignar';
            const fechaTexto = histEntry ? fmtFecha(histEntry.fechaInicio) : '—';
            const mostrarEdit = !visitada && puedeCambiarEtapa;

            return (
              <div key={etapa.id} className="grc-card ficha-etapa-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="ficha-etapa-top">
                  <div className="ficha-etapa-nombre">{etapa.nombre}</div>
                  {mostrarEdit && (
                    <button
                      type="button"
                      className="ficha-icon-btn"
                      aria-label={`Cambiar a ${etapa.nombre}`}
                      onClick={() => setEtapaModal(etapa)}
                    >
                      <IconLapiz />
                    </button>
                  )}
                </div>
                <div className="ficha-etapa-tecnico">{tecnicoTexto}</div>
                <div className="ficha-etapa-pie">
                  <span className="grc-mono" style={{ color }}>{estado}</span>
                  <span className="grc-mono grc-muted">{fechaTexto}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAccion}
        title="Registrar fecha"
        message="Esta fecha se registra una sola vez y no podrá editarse."
        confirmLabel="CONFIRMAR"
        busy={busyFecha}
        onConfirm={confirmarFecha}
        onCancel={() => (busyFecha ? null : setConfirmAccion(null))}
      />

      <ConfirmDialog
        open={confirmDias}
        title="Registrar días estimados"
        message={`¿Confirmas ${diasEstimados || 0} días estimados de entrega? No podrá editarse después.`}
        confirmLabel="CONFIRMAR"
        busy={busyDias}
        onConfirm={confirmarDias}
        onCancel={() => (busyDias ? null : setConfirmDias(false))}
      />
      {errorDias && <Alert type="error">{errorDias}</Alert>}

      {etapaModal && (
        <StageChangeModal
          orden={orden}
          etapaDestino={etapaModal}
          onClose={() => setEtapaModal(null)}
          onSaved={(ordenActualizada) => {
            onOrdenChange(ordenActualizada);
            setEtapaModal(null);
            cargarHistorial();
          }}
        />
      )}
    </div>
  );
}
