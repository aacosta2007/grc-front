import React, { useState } from 'react';
import { Alert, Button, Card, ConfirmDialog, Mono } from '../ui';
import * as valoracionService from '../../services/valoracionService';
import { fmtFechaCorta, fmtOrden, fmtPlaca } from '../../utils/format';
import { estadoValoracionTag, generarPdfValoracion, generarZipFotos } from '../../utils/valoracionExport';
import { FILTROS_VALORACION } from '../../utils/constants';
import PdfViewerModal, { DocumentoValoracion } from './PdfViewerModal';
import '../../styles/Valoracion.css';

// Vista tipo PDF de la hoja de valoración ya guardada: previsualización + descargas + carga a CESVI.
export default function ValoracionPdfView({ orden, valoracion, onBack, onEditar, onActualizado }) {
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState('');

  const cargada = !!valoracion.cargadaCesvi;
  const tag = estadoValoracionTag(cargada ? FILTROS_VALORACION.CARGADAS : FILTROS_VALORACION.SIN_CARGAR);
  const estadoLabel = cargada ? `CARGADA A CESVI · ${fmtFechaCorta(valoracion.cargadaCesviAt)}` : 'PENDIENTE DE CARGA A CESVI';
  const detalles = valoracion.detalles || [];
  const imagenes = valoracion.imagenes || [];

  const descargarPdf = () => {
    setError('');
    try {
      generarPdfValoracion(orden, valoracion);
    } catch (e) {
      setError(e.message || 'No se pudo generar el PDF de la hoja.');
    }
  };

  const descargarZip = async () => {
    setError('');
    try {
      await generarZipFotos(orden, valoracion);
    } catch (e) {
      setError(e.message || 'No se pudo generar el ZIP de fotos.');
    }
  };

  const marcarCesvi = async () => {
    setMarcando(true);
    setError('');
    try {
      const v = await valoracionService.marcarCargadaCesvi(orden.id);
      onActualizado(v);
      setConfirmando(false);
    } catch (e) {
      setError(e.message || 'No se pudo marcar la hoja como cargada a CESVI.');
    } finally {
      setMarcando(false);
    }
  };

  const historial = [
    { fecha: fmtFechaCorta(valoracion.creadaAt), texto: `Hoja generada por ${valoracion.usuario || 'usuario desconocido'} · ${detalles.length} ${detalles.length === 1 ? 'pieza' : 'piezas'}` },
    { fecha: fmtFechaCorta(valoracion.actualizadaAt || valoracion.creadaAt), texto: `${imagenes.length} ${imagenes.length === 1 ? 'fotografía adjunta' : 'fotografías adjuntas'}` },
    {
      fecha: cargada ? fmtFechaCorta(valoracion.cargadaCesviAt) : '—',
      texto: cargada ? 'Marcada como cargada a CESVI Colombia' : 'Sin registro de carga a CESVI',
    },
  ];

  return (
    <div>
      <div className="val-pdfview-head">
        <div>
          <div className="val-pdfview-title">HOJA DE VALORACIÓN · {fmtPlaca(orden.placa)}</div>
          <Mono color={tag.color} style={{ marginTop: 6, display: 'inline-block' }}>
            {estadoLabel}
          </Mono>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← VOLVER ATRÁS
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>
      )}

      <div className="val-pdfview-grid">
        <div className="val-doc-card">
          <div className="val-doc-cardhead">
            <span className="grc-panel-title" style={{ fontSize: 15 }}>
              Previsualización · hoja.pdf
            </span>
            <Mono color="var(--sub)">
              {detalles.length} {detalles.length === 1 ? 'PIEZA' : 'PIEZAS'} · 1 PÁGINA
            </Mono>
          </div>
          <div className="val-doc-wrap">
            <DocumentoValoracion orden={orden} valoracion={valoracion} />
          </div>
        </div>

        <div className="val-side">
          <Card style={{ padding: 16 }}>
            <div className="grc-panel-title" style={{ fontSize: 15 }}>
              Descargas
            </div>
            <div className="val-side-actions">
              <Button variant="outline" block onClick={descargarPdf}>
                DESCARGAR PDF
              </Button>
              <Button variant="outline" block onClick={descargarZip} disabled={imagenes.length === 0}>
                DESCARGAR ZIP DE FOTOS ({imagenes.length})
              </Button>
              <Button variant="outline" block onClick={onEditar}>
                EDITAR HOJA
              </Button>
              <Button variant="outline" block onClick={() => setVisorAbierto(true)}>
                VER EN PANTALLA COMPLETA
              </Button>
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div className="grc-panel-title" style={{ fontSize: 15 }}>
              CESVI Colombia
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--sub)', marginTop: 8, lineHeight: 1.5 }}>
              {cargada
                ? 'Esta hoja ya fue cargada manualmente a la plataforma de la aseguradora. Si cambia el alcance, actualiza la hoja y vuelve a subirla.'
                : 'Descarga la hoja y el ZIP de fotos, súbelos a CESVI Colombia y luego marca la valoración como cargada.'}
            </div>
            {!cargada && (
              <div className="val-side-actions">
                <Button block onClick={() => setConfirmando(true)}>
                  MARCAR COMO CARGADA A CESVI
                </Button>
              </div>
            )}
          </Card>

          <Card style={{ padding: 16 }}>
            <Mono color="var(--line)">HISTORIAL</Mono>
            {historial.map((h, i) => (
              <div className="val-hist-row" key={i}>
                <Mono color="var(--line)" style={{ width: 52, flex: '0 0 52px' }}>
                  {h.fecha}
                </Mono>
                <div style={{ fontSize: 12.5, color: 'var(--sub)', lineHeight: 1.4 }}>{h.texto}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmando}
        title="Marcar como cargada a CESVI"
        message={`¿Confirmas que la hoja de valoración de ${fmtPlaca(orden.placa)} (${fmtOrden(orden.numero)}) ya fue cargada a la plataforma de CESVI Colombia?`}
        confirmLabel="MARCAR CARGADA"
        busy={marcando}
        onConfirm={marcarCesvi}
        onCancel={() => setConfirmando(false)}
      />

      {visorAbierto && <PdfViewerModal orden={orden} valoracion={valoracion} onClose={() => setVisorAbierto(false)} />}
    </div>
  );
}
