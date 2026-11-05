import React, { useState } from 'react';
import { Modal, Field, Alert, Button } from '../ui';
import AdjuntarFotos from '../AdjuntarFotos';
import useFotosAdjuntas from '../../hooks/useFotosAdjuntas';
import * as observacionService from '../../services/observacionService';
import { NOTA_MAX, TIPO_OBSERVACION, TIPO_OBSERVACION_LABEL } from '../../utils/constants';
import '../../styles/StageChangeModal.css';

// Observación (nota + fotos, en una sola petición) desde una tarjeta de la pestaña Reparación.
// tipo: TIPO_OBSERVACION.* · etapa: { id, nombre } solo con tipo ETAPA.
export default function ObservacionModal({ orden, tipo, etapa = null, entregada = false, onClose, onSaved }) {
  const titulo = tipo === TIPO_OBSERVACION.ETAPA ? etapa.nombre : TIPO_OBSERVACION_LABEL[tipo];
  const [nota, setNota] = useState('');
  const adjuntos = useFotosAdjuntas();
  const [notificar, setNotificar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const puedeGuardar = !guardando && !!nota.trim();

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    try {
      const creada = await observacionService.crearObservacion({
        idOrden: orden.id,
        tipo,
        idEtapa: etapa ? etapa.id : null,
        entregada,
        texto: nota.trim(),
        notificar,
        archivos: adjuntos.archivos,
      });
      adjuntos.limpiar();
      onSaved(creada);
    } catch (e) {
      // No se guardó nada: se conservan la nota y las fotos para reintentar
      setError(e.message || 'No se pudo guardar la observación.');
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      onClose={guardando ? undefined : onClose}
      title={`${orden.placa} · Observación`}
      subtitle={`${titulo} · queda en la pestaña Observaciones.`}
      labelledBy="observacionmodal-title"
      width={430}
    >
      <div className="stagechange-body">
        <Field label="Nota · obligatoria" htmlFor="observacionmodal-nota">
          <textarea
            id="observacionmodal-nota"
            rows={3}
            maxLength={NOTA_MAX}
            placeholder="Detalle para el cliente o para el taller"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </Field>

        <AdjuntarFotos adjuntos={adjuntos} disabled={guardando} sinNota={!nota.trim()} />

        <label className="stagechange-check" htmlFor="observacionmodal-notificar">
          <input
            id="observacionmodal-notificar"
            type="checkbox"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>Notificar al cliente por WhatsApp</span>
        </label>

        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>

        <div className="stagechange-actions">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!puedeGuardar}>
            {guardando ? 'GUARDANDO…' : 'GUARDAR OBSERVACIÓN'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
