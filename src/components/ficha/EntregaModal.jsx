import React, { useState } from 'react';
import { Modal, Field, Alert, Button } from '../ui';
import * as ordenService from '../../services/ordenService';
import '../../styles/StageChangeModal.css';

// Entrega del vehículo: registra la fecha de entrega real (una sola vez). La orden sigue activa
// (columna "Entregado") pero ya no admite cambios de etapa ni de fechas.
export default function EntregaModal({ orden, onClose, onSaved }) {
  const [nota, setNota] = useState('');
  const [notificar, setNotificar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const res = await ordenService.entregarOrden({ idOrden: orden.id, nota: nota.trim(), notificar });
      onSaved(res);
    } catch (e) {
      setError(e.message || 'No se pudo registrar la entrega');
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      onClose={guardando ? undefined : onClose}
      title={`${orden.placa} → Entregado`}
      subtitle={`Desde ${orden.etapaActual || 'Asignado'} · la orden pasa a Entregado y no podrá editarse.`}
      labelledBy="entrega-title"
      width={430}
    >
      <div className="stagechange-body">
        <Field label="Nota de entrega · opcional" htmlFor="entrega-nota">
          <textarea
            id="entrega-nota"
            rows={3}
            maxLength={500}
            placeholder="Novedad de la entrega"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </Field>

        <label className="stagechange-check" htmlFor="entrega-notificar">
          <input
            id="entrega-notificar"
            type="checkbox"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>Notificar al cliente por WhatsApp</span>
        </label>
        <div className="stagechange-hint">La nota queda en Observaciones como "Entrega".</div>

        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>

        <div className="stagechange-actions">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'GUARDANDO…' : 'ENTREGAR VEHÍCULO'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
