import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Card, Empty, Mono, PlacaSearch, Spinner } from '../components/ui';
import * as ordenService from '../services/ordenService';
import * as valoracionService from '../services/valoracionService';
import { FILTROS_VALORACION } from '../utils/constants';
import { fmtOrden, fmtPlaca } from '../utils/format';
import { estadoValoracionTag } from '../utils/valoracionExport';
import '../styles/Valoracion.css';

const FILTROS = [FILTROS_VALORACION.SIN_VALORAR, FILTROS_VALORACION.SIN_CARGAR, FILTROS_VALORACION.CARGADAS];

function ResumenValoracion({ orden, valoracion, onAbrir, onCerrar }) {
  const tag = estadoValoracionTag(orden.estadoValoracion);
  const nPiezas = valoracion ? (valoracion.detalles || []).length : 0;
  const nFotos = valoracion ? (valoracion.imagenes || []).length : 0;
  return (
    <Card className="val-resumen">
      <div className="val-resumen-main">
        <div className="val-resumen-placa-row">
          <span className="grc-placa" style={{ fontSize: 28 }}>
            {fmtPlaca(orden.placa)}
          </span>
          <span className="grc-tag" style={{ color: tag.color }}>
            {tag.label}
          </span>
        </div>
        <div className="val-resumen-campos">
          <div>
            <Mono color="var(--line)">VEHÍCULO</Mono>
            <div className="val-resumen-v">{orden.vehiculoTexto}</div>
          </div>
          <div>
            <Mono color="var(--line)">ORDEN</Mono>
            <div className="val-resumen-v">{fmtOrden(orden.numero)}</div>
          </div>
          <div>
            <Mono color="var(--line)">VALORACIÓN</Mono>
            <div className="val-resumen-v">
              {nPiezas} {nPiezas === 1 ? 'pieza' : 'piezas'} · {nFotos} {nFotos === 1 ? 'foto' : 'fotos'}
            </div>
          </div>
          <div>
            <Mono color="var(--line)">CLIENTE</Mono>
            <div className="val-resumen-v">{orden.cliente && orden.cliente.nombre}</div>
          </div>
        </div>
      </div>
      <div className="val-resumen-acciones">
        <button type="button" className="grc-btn grc-btn-primary" onClick={onAbrir}>
          ABRIR HOJA (.PDF)
        </button>
        <button type="button" className="grc-btn grc-btn-outline" onClick={onCerrar}>
          ← VOLVER A BUSCAR
        </button>
      </div>
    </Card>
  );
}

export default function ValoracionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroUrl = searchParams.get('filtro');
  const filtro = FILTROS.includes(filtroUrl) ? filtroUrl : FILTROS_VALORACION.SIN_VALORAR;

  const [conteo, setConteo] = useState({});
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [placa, setPlaca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null); // null | 'sinresultado' | { orden, valoracion }

  useEffect(() => {
    if (!filtroUrl) setSearchParams({ filtro: FILTROS_VALORACION.SIN_VALORAR }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarLista = useCallback(async (f) => {
    setCargando(true);
    setError('');
    try {
      const [c, fl] = await Promise.all([valoracionService.getConteo(), valoracionService.getOrdenesPorFiltro(f)]);
      setConteo(c);
      setFilas(fl);
    } catch (e) {
      setError(e.message || 'No se pudo cargar el listado de valoración.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLista(filtro);
  }, [filtro, cargarLista]);

  const irAFiltro = (f) => {
    setResultado(null);
    setSearchParams({ filtro: f });
  };

  const buscar = async () => {
    const p = placa.trim();
    if (!p) return;
    setBuscando(true);
    setError('');
    setResultado(null);
    try {
      const orden = await ordenService.buscarOrdenPorPlaca(p);
      if (!orden) {
        setResultado('sinresultado');
        return;
      }
      if (orden.estadoValoracion === FILTROS_VALORACION.SIN_VALORAR) {
        navigate(`/valoracion/${orden.id}`);
        return;
      }
      const val = await valoracionService.getValoracion(orden.id);
      setResultado({ orden, valoracion: val });
    } catch (e) {
      setError(e.message || 'No se pudo buscar la placa.');
    } finally {
      setBuscando(false);
    }
  };

  const filtros = useMemo(() => FILTROS.map((f) => ({ id: f, label: f, n: conteo[f] ?? 0 })), [conteo]);

  return (
    <div>
      <div className="val-page-toolbar">
        <PlacaSearch
          value={placa}
          onChange={(v) => {
            setPlaca(v);
            setResultado(null);
          }}
          onSearch={buscar}
        />
        <div className="val-page-filtros">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`val-filtro-btn ${filtro === f.id && !resultado ? 'is-active' : ''}`}
              onClick={() => irAFiltro(f.id)}
            >
              {f.label} · {f.n}
            </button>
          ))}
        </div>
      </div>

      {buscando && <Spinner label="BUSCANDO PLACA" />}
      {error && (
        <Alert type="error" style={{ marginTop: 14 }}>
          {error}
        </Alert>
      )}

      {resultado === 'sinresultado' && (
        <div className="val-sinresultado">
          <div className="val-sinresultado-title">SIN RESULTADOS</div>
          <div className="val-sinresultado-texto">No existe una orden activa para esa placa. Verifica la placa o créala desde Nueva orden.</div>
        </div>
      )}

      {resultado && resultado !== 'sinresultado' && (
        <ResumenValoracion
          orden={resultado.orden}
          valoracion={resultado.valoracion}
          onAbrir={() => navigate(`/valoracion/${resultado.orden.id}`)}
          onCerrar={() => setResultado(null)}
        />
      )}

      {!resultado &&
        !buscando &&
        (cargando ? (
          <Spinner label="CARGANDO ÓRDENES" />
        ) : filas.length === 0 ? (
          <Empty>No hay órdenes en este filtro.</Empty>
        ) : (
          <div className="val-tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>PLACA</th>
                  <th>VEHÍCULO</th>
                  <th>CLIENTE</th>
                  <th>ORDEN</th>
                  <th>ESTADO</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((v) => {
                  const tag = estadoValoracionTag(v.estadoValoracion);
                  return (
                    <tr key={v.id}>
                      <td className="grc-placa">{fmtPlaca(v.placa)}</td>
                      <td>{v.vehiculoTexto}</td>
                      <td style={{ color: 'var(--sub)' }}>{v.cliente && v.cliente.nombre}</td>
                      <td>
                        <Mono color="var(--line)">{fmtOrden(v.numero)}</Mono>
                      </td>
                      <td>
                        <span className="grc-tag" style={{ color: tag.color }}>
                          {tag.label}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="val-abrir-btn" onClick={() => navigate(`/valoracion/${v.id}`)}>
                          {v.estadoValoracion === FILTROS_VALORACION.SIN_VALORAR ? 'CREAR HOJA →' : 'ABRIR HOJA →'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
