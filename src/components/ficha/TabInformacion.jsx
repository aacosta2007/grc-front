import React from 'react';
import { fmtPlaca, fmtFecha } from '../../utils/format';
import { getEtapa, etapaRequiereTecnico, UBICACION, ESTADO_ORDEN } from '../../utils/constants';

function Bloque({ titulo, filas }) {
  return (
    <div className="grc-card ficha-info-block">
      <div className="grc-card-header">
        <span className="grc-panel-title">{titulo}</span>
      </div>
      <div className="ficha-info-rows">
        {filas.map((f) => (
          <div key={f.k} className="ficha-info-row">
            <span className="grc-mono grc-muted">{f.k}</span>
            <span className="ficha-info-row-valor">{f.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// HU-22 (detalle) · Vista de solo lectura con los datos consolidados de la orden.
export default function TabInformacion({ orden }) {
  const etapa = getEtapa(orden.idEtapaActual);
  const tecnicoTexto = orden.tecnicoActual
    ? orden.tecnicoActual.nombre
    : etapa && !etapaRequiereTecnico(etapa.id)
    ? 'No requiere técnico'
    : 'Sin asignar';
  const diasAqui = orden.diasEnEtapa != null ? `${orden.diasEnEtapa} ${orden.diasEnEtapa === 1 ? 'día' : 'días'}` : '—';
  const diasEnTaller = orden.diasEnTaller != null ? `${orden.diasEnTaller} ${orden.diasEnTaller === 1 ? 'día' : 'días'}` : '—';
  const estadoTexto = orden.estado === ESTADO_ORDEN.ENTREGADA ? 'ENTREGADA' : 'EN PROCESO';
  const ubicacionTexto = orden.ubicacionActual === UBICACION.EN_TALLER ? 'EN TALLER' : 'FUERA DEL TALLER';

  const bloques = [
    {
      titulo: 'Vehículo',
      filas: [
        { k: 'Placa', v: fmtPlaca(orden.placa) },
        { k: 'Marca / Modelo', v: `${orden.vehiculo.marca} ${orden.vehiculo.modelo}`.trim() },
        { k: 'Año', v: orden.vehiculo.anio || '—' },
        { k: 'Color', v: orden.vehiculo.color || '—' },
        ...(orden.vehiculo.vin ? [{ k: 'VIN', v: orden.vehiculo.vin }] : []),
      ],
    },
    {
      titulo: 'Cliente',
      filas: [
        { k: 'Nombre', v: orden.cliente.nombre },
        { k: 'Documento', v: `CC ${orden.cliente.documento}` },
        { k: 'Celular', v: orden.cliente.celular },
        { k: 'Correo', v: orden.cliente.correo },
      ],
    },
    {
      titulo: 'Etapa actual',
      filas: [
        { k: 'Etapa', v: orden.etapaActual || orden.columna || 'Sin ingreso al taller' },
        { k: 'Técnico', v: tecnicoTexto },
        { k: 'Desde', v: fmtFecha(orden.fechaInicioEtapa) },
        { k: 'Asesor', v: orden.asesor || '—' },
        { k: 'Días aquí', v: diasAqui },
      ],
    },
    {
      titulo: 'Entrega',
      filas: [
        { k: 'Ingreso a cotizar', v: fmtFecha(orden.fechaIngresoCotizar) },
        { k: 'Ingreso al taller', v: fmtFecha(orden.fechaIngresoReparacion) },
        { k: 'Fecha estimada', v: fmtFecha(orden.fechaEntregaEstimada) },
        { k: 'Días estimados', v: orden.diasEstimadoEntrega != null ? String(orden.diasEstimadoEntrega) : '—' },
        { k: 'Días en taller', v: diasEnTaller },
        { k: 'Estado de la orden', v: estadoTexto },
        { k: 'Ubicación', v: ubicacionTexto },
      ],
    },
  ];

  return (
    <div className="ficha-info-grid">
      {bloques.map((b) => (
        <Bloque key={b.titulo} titulo={b.titulo} filas={b.filas} />
      ))}
    </div>
  );
}
