import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui';
import StageChangeModal from '../components/StageChangeModal';
import * as ordenService from '../services/ordenService';
import { ETAPAS, ETAPA_BANCADA_ID, COLUMNA_ASIGNADO, getEtapa } from '../utils/constants';
import { fmtOrden, pluralDias } from '../utils/format';
import '../styles/Backlog.css';

const COLUMNAS_BASE = [
  { ...COLUMNA_ASIGNADO, nota: 'SIN TÉCNICO' },
  ...ETAPAS.map((e) => ({ id: e.id, nombre: e.nombre, nota: e.id === ETAPA_BANCADA_ID ? 'NO PIDE TÉCNICO' : '' })),
];

const COLOR_ALERTA = {
  vencido: 'var(--red)',
  critico: 'var(--red)',
  proximo: 'var(--accent)',
  completado: 'var(--green)',
  normal: 'var(--line)',
};
const colorDe = (alerta) => COLOR_ALERTA[alerta] || 'var(--line)';

// Una columna está bloqueada para `orden` si es "Asignado", es su columna actual
// o ya figura en su historial de etapas visitadas (HU-19).
function estaBloqueada(col, orden) {
  if (!orden) return false;
  if (col.id === null) return true;
  if (col.nombre === orden.columna) return true;
  return (orden.etapasVisitadas || []).includes(col.id);
}

function TarjetaOrden({ orden, arrastrando, onDragStart, onDragEnd, onOpen, menuAbierto, onToggleMenu, onElegirDestino, destinos }) {
  const arrastrable = orden.columna !== 'Entregado';
  const color = colorDe(orden.alerta);

  return (
    <div
      className="backlog-card"
      style={{ borderLeftColor: color, opacity: arrastrando ? 0.4 : 1 }}
      draggable={arrastrable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <button type="button" className="backlog-card-open" onClick={onOpen}>
        <div className="backlog-card-top">
          <span className="backlog-card-placa">{orden.placa}</span>
          <span className="backlog-card-ot">{fmtOrden(orden.numero)}</span>
        </div>
        <div className="backlog-card-vehiculo">{orden.vehiculoTexto}</div>
        <div className="backlog-card-cliente">{orden.cliente?.nombre}</div>
        <div className="backlog-card-footer">
          <span className="backlog-card-dias" style={{ color }}>
            {pluralDias(orden.diasEnEtapa ?? 0)}
          </span>
          <span className="backlog-card-tecnico">{orden.tecnicoActual?.nombre || 'Sin técnico'}</span>
        </div>
      </button>

      {arrastrable && (
        <div className="backlog-card-mover">
          <button
            type="button"
            className="backlog-mover-btn"
            aria-label={`Mover ${orden.placa} a otra etapa`}
            onClick={onToggleMenu}
          >
            MOVER
          </button>
          {menuAbierto && (
            <select
              autoFocus
              aria-label={`Elegir etapa destino para ${orden.placa}`}
              className="backlog-mover-select"
              defaultValue=""
              onChange={(e) => {
                const idEtapa = Number(e.target.value);
                if (idEtapa) onElegirDestino(idEtapa);
              }}
            >
              <option value="">Elegir etapa…</option>
              {destinos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

export default function BacklogPage() {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [dragOrdenId, setDragOrdenId] = useState(null);
  const [modal, setModal] = useState(null); // { orden, etapaDestino }
  const [menuMoverId, setMenuMoverId] = useState(null);

  const cargar = useCallback(
    () =>
      ordenService
        .getOrdenesKanban()
        .then((data) => {
          setOrdenes(data);
          setError('');
        })
        .catch((e) => setError(e.message || 'No se pudieron cargar las órdenes del tablero'))
        .finally(() => setCargando(false)),
    []
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(''), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const draggingOrden = useMemo(() => ordenes.find((o) => o.id === dragOrdenId) || null, [ordenes, dragOrdenId]);

  const columnas = useMemo(
    () =>
      COLUMNAS_BASE.map((col) => ({
        ...col,
        cards: ordenes.filter((o) => o.columna === col.nombre),
      })),
    [ordenes]
  );

  const abrirModalPara = (orden, idEtapa) => {
    const etapa = getEtapa(idEtapa);
    if (!etapa) return;
    setMenuMoverId(null);
    setModal({ orden, etapaDestino: etapa });
  };

  const onDragStartCard = (orden) => (e) => {
    setDragOrdenId(orden.id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(orden.id));
    } catch {
      // Firefox exige setData; se ignora si el navegador no lo permite.
    }
  };
  const onDragEndCard = () => setDragOrdenId(null);

  const onDragOverCol = (col) => (e) => {
    if (draggingOrden && !estaBloqueada(col, draggingOrden)) e.preventDefault();
  };
  const onDropCol = (col) => (e) => {
    e.preventDefault();
    if (!draggingOrden || estaBloqueada(col, draggingOrden)) return;
    abrirModalPara(draggingOrden, col.id);
  };

  const onSavedModal = (ordenActualizada) => {
    const etapaNombre = modal ? modal.etapaDestino.nombre : '';
    setModal(null);
    cargar().then(() => setAviso(`${ordenActualizada.placa} pasó a ${etapaNombre}`));
  };

  const destinosValidos = (orden) => ETAPAS.filter((e) => !estaBloqueada({ id: e.id, nombre: e.nombre }, orden));

  if (cargando) return <Spinner label="CARGANDO TABLERO" />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div>
      {aviso && (
        <Alert type="success" style={{ marginBottom: 16 }}>
          {aviso}
        </Alert>
      )}

      <div className="backlog-toolbar">
        <span className="backlog-draghint">
          {draggingOrden ? `ARRASTRANDO ${draggingOrden.placa}` : 'TABLERO DE ETAPAS'}
        </span>
        <span className="backlog-draghelp">Arrastra una tarjeta a otra etapa. Las etapas ya visitadas quedan bloqueadas.</span>
      </div>

      <div className="backlog-board">
        {columnas.map((col) => {
          const bloqueada = draggingOrden ? estaBloqueada(col, draggingOrden) : false;
          const estadoCol = draggingOrden ? (bloqueada ? 'bloqueada' : 'valida') : 'normal';
          return (
            <div
              key={col.nombre}
              className={`backlog-col backlog-col--${estadoCol}`}
              onDragOver={onDragOverCol(col)}
              onDrop={onDropCol(col)}
            >
              <div className="backlog-col-header">
                <div>
                  <div className="backlog-col-title">{col.nombre}</div>
                  {col.nota && <div className="backlog-col-nota">{col.nota}</div>}
                </div>
                <div className="backlog-col-count">{col.cards.length}</div>
              </div>
              <div className="backlog-col-body">
                {col.cards.map((orden) => (
                  <TarjetaOrden
                    key={orden.id}
                    orden={orden}
                    arrastrando={dragOrdenId === orden.id}
                    onDragStart={onDragStartCard(orden)}
                    onDragEnd={onDragEndCard}
                    onOpen={() => navigate(`/ficha/${orden.id}`)}
                    menuAbierto={menuMoverId === orden.id}
                    onToggleMenu={() => setMenuMoverId((v) => (v === orden.id ? null : orden.id))}
                    onElegirDestino={(idEtapa) => abrirModalPara(orden, idEtapa)}
                    destinos={destinosValidos(orden)}
                  />
                ))}
                {!col.cards.length && (
                  <div className="backlog-col-empty">{bloqueada ? 'ETAPA VISITADA · BLOQUEADA' : 'SIN ÓRDENES'}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <StageChangeModal
          orden={modal.orden}
          etapaDestino={modal.etapaDestino}
          onClose={() => setModal(null)}
          onSaved={onSavedModal}
        />
      )}
    </div>
  );
}
