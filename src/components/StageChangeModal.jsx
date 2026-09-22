import React, { useEffect, useState } from 'react';
import { Modal, Field, Alert, Button } from './ui';
import * as ordenService from '../services/ordenService';
import * as tecnicoService from '../services/tecnicoService';
import { etapaRequiereTecnico, ETAPA_BANCADA_ID } from '../utils/constants';
import '../styles/StageChangeModal.css';

// Modal compartido de cambio de etapa (Backlog y Ficha lo montan condicionalmente).
export default function StageChangeModal({ orden, etapaDestino, onClose, onSaved }) {
  const requiereTecnico = etapaRequiereTecnico(etapaDestino.id);
  const esBancada = etapaDestino.id === ETAPA_BANCADA_ID;

  const [tecnicos, setTecnicos] = useState([]);
  const [cargandoTecnicos, setCargandoTecnicos] = useState(requiereTecnico);
  const [idTecnico, setIdTecnico] = useState('');
  const [nota, setNota] = useState('');
  const [notificar, setNotificar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requiereTecnico) return undefined;
    let activo = true;
    setCargandoTecnicos(true);
    tecnicoService
      .getTecnicosPorEspecialidad(etapaDestino.especialidad)
      .then((lista) => {
        if (activo) setTecnicos(lista);
      })
      .catch((e) => {
        if (activo) setError(e.message || 'No se pudieron cargar los técnicos');
      })
      .finally(() => {
        if (activo) setCargandoTecnicos(false);
      });
    return () => {
      activo = false;
    };
  }, [requiereTecnico, etapaDestino.especialidad]);

  const puedeGuardar = !guardando && (!requiereTecnico || !!idTecnico);

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      const res = await ordenService.cambiarEtapa({
        idOrden: orden.id,
        idEtapa: etapaDestino.id,
        idTecnico: requiereTecnico ? Number(idTecnico) : null,
        nota: nota.trim(),
        notificar,
      });
      onSaved(res);
    } catch (e) {
      setError(e.message || 'No se pudo cambiar la etapa');
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      onClose={guardando ? undefined : onClose}
      title={`${orden.placa} → ${etapaDestino.nombre}`}
      subtitle={`Desde ${orden.etapaActual || 'Asignado'} · el cambio queda en el historial de la orden.`}
      labelledBy="stagechange-title"
      width={430}
    >
      <div className="stagechange-body">
        {requiereTecnico && (
          <Field label="Técnico responsable · obligatorio" htmlFor="stagechange-tecnico">
            <select
              id="stagechange-tecnico"
              value={idTecnico}
              onChange={(e) => setIdTecnico(e.target.value)}
              disabled={cargandoTecnicos}
            >
              <option value="">Seleccionar técnico…</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {t.enCurso} en curso
                </option>
              ))}
            </select>
            <div className="stagechange-hint">
              {cargandoTecnicos
                ? 'Cargando técnicos…'
                : tecnicos.length
                ? `Filtrado por especialidad · ${tecnicos.length} disponible${tecnicos.length === 1 ? '' : 's'}`
                : 'No hay técnicos activos con esta especialidad.'}
            </div>
          </Field>
        )}

        {esBancada && <div className="stagechange-aviso">Bancada no requiere técnico.</div>}

        <Field label="Nota · opcional" htmlFor="stagechange-nota" style={{ marginTop: 14 }}>
          <textarea
            id="stagechange-nota"
            rows={3}
            placeholder="Novedad del cambio de etapa"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </Field>

        <label className="stagechange-check" htmlFor="stagechange-notificar">
          <input
            id="stagechange-notificar"
            type="checkbox"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>Notificar al cliente por WhatsApp</span>
        </label>
        <div className="stagechange-hint">
          {nota.trim() && notificar
            ? 'Se enviará un solo mensaje de WhatsApp combinando la nota y el cambio de etapa.'
            : 'Si hay nota y está marcado se envía un solo mensaje combinado.'}
        </div>

        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>

        <div className="stagechange-actions">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!puedeGuardar}>
            {guardando ? 'GUARDANDO…' : 'GUARDAR CAMBIO'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
