import React from 'react';
import { Spinner } from '../ui';
import { ACCION_PIEZA } from '../../utils/constants';
import { fmtFecha, fmtOrden, fmtPlaca } from '../../utils/format';
import { agruparBloques } from '../../utils/valoracionExport';
import '../../styles/HojaValoracionDocumento.css';

// Ajuste a una sola página carta: con muchas piezas las tablas pasan a 2 columnas y luego a modo denso.
const LIMITE_DOS_COLUMNAS = 14;
const LIMITE_DENSO = 36;

const BLOQUE_DOC = {
  [ACCION_PIEZA.SUSTITUIR]: { num: 'I', titulo: 'Sustitución', opHead: 'OPER.', opAncho: 38, resumen: 'Piezas a sustituir', vacio: 'Ninguna pieza por sustituir.' },
  [ACCION_PIEZA.REPARAR]: { num: 'II', titulo: 'Reparación', opHead: 'GRAVEDAD', opAncho: 62, resumen: 'Piezas a reparar', vacio: 'Ninguna pieza por reparar.' },
  [ACCION_PIEZA.PINTAR]: { num: 'III', titulo: 'Pintura', opHead: 'GRAVEDAD', opAncho: 62, resumen: 'Piezas a pintar', vacio: 'Ninguna pieza por pintar.' },
};

const val = (v) => (v === null || v === undefined || v === '' ? '—' : v);
const plural = (n) => `${n} ${n === 1 ? 'PIEZA' : 'PIEZAS'}`;
const operacion = (d) => (d.accion === ACCION_PIEZA.SUSTITUIR ? 'S' : val(d.gravedad));
const operacionLarga = (d) => (d.accion === ACCION_PIEZA.SUSTITUIR ? 'SUSTITUIR' : val(d.gravedad));

// Mitad (redondeada hacia arriba) a la izquierda y el resto a la derecha.
const dividir = (filas, dosColumnas) => {
  if (!dosColumnas || filas.length < 2) return [filas];
  const m = Math.ceil(filas.length / 2);
  return [filas.slice(0, m), filas.slice(m)];
};

function TablaPiezas({ bloque, filas }) {
  return (
    <table className="hvd-tabla">
      <thead>
        <tr>
          <th scope="col" className="hvd-col-n">#</th>
          <th scope="col">PIEZA</th>
          <th scope="col" style={{ width: bloque.opAncho }}>
            {bloque.opHead}
          </th>
          <th scope="col" className="hvd-col-cant">CANT.</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.id ?? `${f.n}-${f.pieza}`}>
            <td className="hvd-td-n">{f.n}</td>
            <td className="hvd-td-pieza">{f.pieza}</td>
            <td className="hvd-td-op">{operacion(f)}</td>
            <td className="hvd-td-cant">{val(f.cantidad)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Hoja de valoración en papel (vista previa, impresión y visor a pantalla completa).
// Siempre ocupa una sola página carta; por debajo de 640 px se muestra como tarjetas.
export default function HojaValoracionDocumento({ valoracion, orden }) {
  if (!valoracion || !orden) return <Spinner label="CARGANDO VALORACIÓN" />;

  const cliente = orden.cliente || {};
  const vehiculo = orden.vehiculo || {};
  const cargada = !!valoracion.cargadaCesvi;
  const placa = orden.placa ? fmtPlaca(orden.placa) : '—';

  const bloques = agruparBloques(valoracion.detalles || []).map((b) => ({
    ...BLOQUE_DOC[b.accion],
    accion: b.accion,
    items: b.items.map((d, i) => ({ ...d, n: String(i + 1).padStart(2, '0') })),
  }));
  const total = bloques.reduce((acc, b) => acc + b.items.length, 0);
  const dosColumnas = total > LIMITE_DOS_COLUMNAS;
  const denso = total > LIMITE_DENSO;

  const grupos = [
    {
      titulo: 'Datos generales',
      campos: [
        { k: 'CLIENTE', v: cliente.nombre },
        { k: 'DOCUMENTO', v: cliente.documento },
        { k: 'CELULAR', v: cliente.celular },
        { k: 'CORREO', v: cliente.correo },
        { k: 'VALORÓ', v: valoracion.usuario },
        { k: 'ASESOR', v: orden.asesor },
      ],
    },
    {
      titulo: 'Vehículo',
      campos: [
        { k: 'PLACA', v: orden.placa && placa, mono: true },
        { k: 'MARCA', v: vehiculo.marca },
        { k: 'MODELO', v: vehiculo.modelo },
        { k: 'AÑO', v: vehiculo.anio },
        { k: 'COLOR', v: vehiculo.color },
        { k: 'VIN', v: vehiculo.vin, mono: true },
      ],
    },
    {
      titulo: 'Siniestro y aseguradora',
      campos: [
        // El número de siniestro es el número de la orden de reparación.
        { k: 'N.º SINIESTRO', v: orden.numero, mono: true },
        { k: 'ESTADO CESVI', v: cargada ? 'Cargada' : 'Pendiente de carga' },
        { k: 'FECHA CARGA', v: cargada ? fmtFecha(valoracion.cargadaCesviAt) : null },
        { k: 'REG. ORDEN', v: orden.fechaCreacion ? fmtFecha(orden.fechaCreacion) : null },
      ],
    },
  ];

  const descripcion = valoracion.descripcion || 'Sin descripción registrada.';
  const resumen = bloques.map((b) => ({ k: b.resumen, v: b.items.length }));

  return (
    <>
      <article className={`hvd-sheet ${denso ? 'is-denso' : ''}`} aria-label="Hoja de valoración">
        <div className="hvd-header">
          <div>
            <div className="hvd-brand">
              <span className="hvd-brand-mark" />
              <span className="hvd-brand-name">SERVIMACROMOTOR</span>
            </div>
            <div className="hvd-brand-sub">HOJA DE VALORACIÓN DE DAÑOS</div>
          </div>
          <div className="hvd-meta">
            <span>
              <span className="hvd-meta-k">ORDEN </span>
              <b>{orden.numero ? fmtOrden(orden.numero) : '—'}</b>
            </span>
            <span>
              <span className="hvd-meta-k">FECHA </span>
              <b>{fmtFecha(valoracion.actualizadaAt || valoracion.creadaAt)}</b>
            </span>
            <span className="hvd-pill">
              <span className={`hvd-pill-dot ${cargada ? 'is-ok' : ''}`} />
              {cargada ? 'EN CESVI' : 'PENDIENTE CESVI'}
            </span>
          </div>
        </div>
        <div className="hvd-rule" />

        <div className="hvd-datos">
          {grupos.map((g) => (
            <div key={g.titulo} className="hvd-grupo">
              <div className="hvd-grupo-titulo">{g.titulo}</div>
              {g.campos.map((c) => (
                <div key={c.k} className="hvd-campo">
                  <span className="hvd-k">{c.k}</span>
                  <span className={`hvd-v ${c.mono ? 'is-mono' : ''}`}>{val(c.v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="hvd-desc">
          <span className="hvd-k">DESCRIPCIÓN</span>
          <span className="hvd-desc-texto">{descripcion}</span>
        </div>

        <div className="hvd-bloques">
          {bloques.map((b) => {
            const columnas = dividir(b.items, dosColumnas);
            return (
              <section key={b.accion} aria-label={b.titulo}>
                <div className="hvd-bloque-head">
                  <span />
                  <h2 className="hvd-bloque-titulo">
                    {b.num} · {b.titulo}
                  </h2>
                  <span className="hvd-bloque-conteo">{plural(b.items.length)}</span>
                </div>
                <div className={`hvd-columnas ${columnas.length === 2 ? 'is-dos' : ''}`}>
                  {columnas.map((filas, i) => (
                    <TablaPiezas key={i} bloque={b} filas={filas} />
                  ))}
                </div>
                {!b.items.length && <div className="hvd-vacio">{b.vacio}</div>}
              </section>
            );
          })}
        </div>

        <div className="hvd-resumen-wrap">
          <div className="hvd-resumen" aria-label="Resumen de la valoración">
            {resumen.map((r) => (
              <div key={r.k} className="hvd-resumen-fila">
                <span>{r.k}</span>
                <b>{r.v}</b>
              </div>
            ))}
            <div className="hvd-resumen-total">
              <span>TOTAL PIEZAS</span>
              <b>{total}</b>
            </div>
          </div>
        </div>

        <div className="hvd-footer">
          <span>
            VALORÓ: {val(valoracion.usuario).toUpperCase()} · {placa}
          </span>
          <span>PÁGINA 1 DE 1</span>
        </div>
      </article>

      <div className="hvd-movil">
        {grupos.map((g) => (
          <div key={g.titulo} className="hvd-card">
            <div className="hvd-card-head">{g.titulo}</div>
            <div className="hvd-card-campos">
              {g.campos.map((c) => (
                <div key={c.k} className="hvd-card-campo">
                  <div className="hvd-card-k">{c.k}</div>
                  <div className="hvd-card-v">{val(c.v)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="hvd-card hvd-card-pad">
          <div className="hvd-card-k">DESCRIPCIÓN GENERAL DEL DAÑO</div>
          <div className="hvd-card-desc">{descripcion}</div>
        </div>

        {bloques.map((b) => (
          <div key={b.accion} className="hvd-card">
            <div className="hvd-card-head hvd-card-head-split">
              <span>
                {b.num} · {b.titulo}
              </span>
              <span className="hvd-card-conteo">{plural(b.items.length)}</span>
            </div>
            {b.items.map((p) => (
              <div key={p.id ?? `${p.n}-${p.pieza}`} className="hvd-card-pieza">
                <div style={{ minWidth: 0 }}>
                  <div className="hvd-card-pieza-nombre">{p.pieza}</div>
                  <div className="hvd-card-pieza-op">{operacionLarga(p)}</div>
                </div>
                <span className="hvd-card-cant">× {val(p.cantidad)}</span>
              </div>
            ))}
            {!b.items.length && <div className="hvd-card-vacio">{b.vacio}</div>}
          </div>
        ))}

        <div className="hvd-card hvd-card-resumen">
          {resumen.map((r) => (
            <div key={r.k} className="hvd-card-resumen-fila">
              <span>{r.k}</span>
              <b>{r.v}</b>
            </div>
          ))}
          <div className="hvd-card-resumen-total">
            <span>TOTAL PIEZAS</span>
            <b>{total}</b>
          </div>
        </div>
      </div>
    </>
  );
}
