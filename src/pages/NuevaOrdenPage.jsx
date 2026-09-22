import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ordenService from '../services/ordenService';
import { Alert, Button, Field, Spinner } from '../components/ui';
import { esCedulaValida, fmtOrden, normalizarCedula, normalizarPlaca } from '../utils/format';
import '../styles/NuevaOrden.css';

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANIO_MIN = 1950;
const anioMax = () => new Date().getFullYear() + 1;

const ESTADO_INICIAL = {
  placa: '',
  buscandoVehiculo: false,
  vehiculoBuscado: false,
  vehiculoInfo: null, // { vehiculo, cliente } | null
  traeVehiculo: null, // null | 'si' | 'no'
  documento: '',
  buscandoCliente: false,
  clienteBuscado: false,
  clienteEncontrado: null,
  clienteNombre: '',
  clienteCelular: '',
  clienteCorreo: '',
  vehMarca: '',
  vehModelo: '',
  vehAnio: '',
  vehColor: '',
  vehVin: '',
};

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [s, setS] = useState(ESTADO_INICIAL);
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState(null);
  const placaBuscadaRef = useRef('');
  const docBuscadoRef = useRef('');

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));

  const placaLimpia = s.placa;
  const placaCompleta = placaLimpia.length === 6;
  const vehiculoConocido = s.vehiculoBuscado && !!s.vehiculoInfo;
  const vehiculoEsNuevo = s.vehiculoBuscado && !s.vehiculoInfo;
  const clienteVinculado = vehiculoConocido ? s.vehiculoInfo.cliente : null;

  const pideDocumento = (vehiculoConocido && s.traeVehiculo === 'no') || vehiculoEsNuevo;
  const documentoLimpio = s.documento;
  const documentoCompleto = esCedulaValida(documentoLimpio);
  const clienteConocido = s.clienteBuscado && !!s.clienteEncontrado;
  const pideCliente = pideDocumento && documentoCompleto && s.clienteBuscado && !clienteConocido;
  const pideVehiculo = vehiculoEsNuevo && documentoCompleto;

  // ── Búsqueda automática de vehículo por placa ──
  useEffect(() => {
    if (!placaCompleta) {
      placaBuscadaRef.current = '';
      return undefined;
    }
    if (placaBuscadaRef.current === placaLimpia) return undefined;
    placaBuscadaRef.current = placaLimpia;
    let cancelado = false;
    set({ buscandoVehiculo: true });
    ordenService
      .buscarVehiculoPorPlaca(placaLimpia)
      .then((res) => {
        if (cancelado) return;
        setS((prev) => ({ ...prev, vehiculoInfo: res, vehiculoBuscado: true, buscandoVehiculo: false }));
      })
      .catch((err) => {
        if (cancelado) return;
        setError(err.message);
        setS((prev) => ({ ...prev, buscandoVehiculo: false }));
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placaLimpia, placaCompleta]);

  // ── Búsqueda automática de cliente por documento (debounce 500ms) ──
  useEffect(() => {
    if (!pideDocumento || !documentoCompleto) {
      docBuscadoRef.current = '';
      return undefined;
    }
    if (docBuscadoRef.current === documentoLimpio) return undefined;
    const t = setTimeout(() => buscarCliente(documentoLimpio), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentoLimpio, pideDocumento, documentoCompleto]);

  function buscarCliente(doc) {
    if (docBuscadoRef.current === doc) return;
    docBuscadoRef.current = doc;
    set({ buscandoCliente: true });
    ordenService
      .buscarClientePorDocumento(doc)
      .then((res) => {
        setS((prev) => ({ ...prev, clienteEncontrado: res, clienteBuscado: true, buscandoCliente: false }));
      })
      .catch((err) => {
        setError(err.message);
        setS((prev) => ({ ...prev, buscandoCliente: false }));
      });
  }

  const handlePlacaChange = (v) => {
    setError(null);
    setS({ ...ESTADO_INICIAL, placa: normalizarPlaca(v) });
    placaBuscadaRef.current = '';
    docBuscadoRef.current = '';
  };

  const handleDocumentoChange = (v) => {
    const limpio = normalizarCedula(v);
    set({
      documento: limpio,
      clienteEncontrado: null,
      clienteBuscado: false,
      clienteNombre: '',
      clienteCelular: '',
      clienteCorreo: '',
    });
    docBuscadoRef.current = '';
  };

  const handleDocumentoBlur = () => {
    if (documentoCompleto) buscarCliente(documentoLimpio);
  };

  const correoValido = !s.clienteCorreo.trim() || CORREO_RE.test(s.clienteCorreo.trim());
  const clienteNuevoValido = !pideCliente || (s.clienteNombre.trim() && s.clienteCelular.trim() && correoValido);

  const anioNum = s.vehAnio.trim() ? Number(s.vehAnio) : null;
  const anioValido = anioNum === null || (Number.isInteger(anioNum) && anioNum >= ANIO_MIN && anioNum <= anioMax());
  const vehiculoNuevoValido =
    !pideVehiculo || (s.vehMarca.trim() && s.vehModelo.trim() && s.vehColor.trim() && anioValido);

  const listoCrear = !!(
    !s.buscandoVehiculo &&
    ((vehiculoConocido && s.traeVehiculo === 'si' && clienteVinculado) ||
      (pideDocumento &&
        documentoCompleto &&
        (clienteConocido || pideCliente) &&
        clienteNuevoValido &&
        (!pideVehiculo || vehiculoNuevoValido)))
  );

  let paso = 1;
  let pasoTitulo = 'Placa del vehículo';
  let pasoAyuda = 'Escribe la placa completa (6 caracteres); la búsqueda se dispara sola.';
  if (s.buscandoVehiculo) {
    pasoAyuda = 'Buscando el vehículo en el sistema…';
  } else if (vehiculoConocido && s.traeVehiculo === null) {
    paso = 2;
    pasoTitulo = 'Confirmar quién trae el vehículo';
    pasoAyuda = 'El vehículo ya existe en el sistema. Confirma si el propietario registrado es quien lo trae.';
  } else if (pideDocumento && !documentoCompleto) {
    paso = 2;
    pasoTitulo = 'Documento de quien trae el vehículo';
    pasoAyuda = 'Escribe la cédula (6 a 10 dígitos); al completarla se busca el cliente automáticamente.';
  } else if (listoCrear) {
    paso = 4;
    pasoTitulo = 'Todo listo';
    pasoAyuda = 'Revisa los datos y crea la orden.';
  } else if (pideDocumento && documentoCompleto) {
    paso = 3;
    pasoTitulo = clienteConocido ? 'Datos del vehículo nuevo' : 'Registrar cliente y vehículo';
    pasoAyuda = 'Solo se piden los campos que el sistema todavía no tiene.';
  }

  let docEstado = '';
  if (s.buscandoCliente) docEstado = 'BUSCANDO…';
  else if (!documentoCompleto) docEstado = 'Escribe el documento completo para buscar.';
  else if (clienteConocido) docEstado = `Cliente encontrado: ${s.clienteEncontrado.nombre}`;
  else if (s.clienteBuscado) docEstado = 'Documento no registrado · se creará el cliente.';

  const footerNota = listoCrear
    ? 'Se generará el número de orden y quedará en estado ACTIVA.'
    : 'Completa los pasos anteriores para habilitar la creación.';

  const resetTodo = () => {
    setS(ESTADO_INICIAL);
    setError(null);
    setOrdenCreada(null);
    placaBuscadaRef.current = '';
    docBuscadoRef.current = '';
  };

  const crear = async () => {
    if (!listoCrear || creando) return;
    setError(null);
    setCreando(true);
    try {
      const payload = { placa: placaLimpia };
      if (vehiculoConocido && s.traeVehiculo === 'si') {
        payload.idCliente = clienteVinculado.id;
      } else if (clienteConocido) {
        payload.idCliente = s.clienteEncontrado.id;
      } else {
        payload.cliente = {
          documento: documentoLimpio,
          nombre: s.clienteNombre.trim(),
          celular: s.clienteCelular.trim(),
          correo: s.clienteCorreo.trim() || undefined,
        };
      }
      if (pideVehiculo) {
        payload.vehiculo = {
          marca: s.vehMarca.trim(),
          modelo: s.vehModelo.trim(),
          color: s.vehColor.trim(),
          anio: anioNum || undefined,
          vin: s.vehVin.trim() || undefined,
        };
      }
      const orden = await ordenService.crearOrden(payload);
      setOrdenCreada(orden);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  };

  if (ordenCreada) {
    return (
      <div className="nueva-orden-page">
        <div className="grc-card nueva-orden-exito">
          <div className="grc-mono" style={{ color: 'var(--green)' }}>
            ORDEN CREADA
          </div>
          <div className="nueva-orden-exito-titulo">Orden {fmtOrden(ordenCreada.id)} creada · estado ACTIVA</div>
          <p className="nueva-orden-exito-nota">
            Las fechas de ingreso a cotizar, ingreso al taller y días estimados se marcan después desde la
            pestaña Reparación.
          </p>
          <div className="nueva-orden-exito-acciones">
            <Button onClick={() => navigate(`/ficha/${ordenCreada.id}?tab=rep`)}>VER FICHA</Button>
            <Button variant="outline" onClick={resetTodo}>
              CREAR OTRA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nueva-orden-page">
      <div className="grc-card nueva-orden-card">
        <div className="grc-mono" style={{ color: 'var(--accent)' }}>
          PASO {paso} DE 4
        </div>
        <div className="nueva-orden-titulo">{pasoTitulo}</div>
        <div className="nueva-orden-ayuda">{pasoAyuda}</div>

        <Field label="PLACA DEL VEHÍCULO" htmlFor="nv-placa" style={{ marginTop: 18 }}>
          <input
            id="nv-placa"
            className="nueva-orden-placa-input"
            value={s.placa}
            onChange={(e) => handlePlacaChange(e.target.value)}
            placeholder="ABC123"
            autoFocus
            maxLength={6}
          />
        </Field>

        {s.buscandoVehiculo && <Spinner label="BUSCANDO…" />}

        {vehiculoConocido && (
          <div className="nueva-orden-encontrado">
            <div className="grc-mono" style={{ color: 'var(--accent)' }}>
              VEHÍCULO ENCONTRADO EN EL SISTEMA
            </div>
            <div className="nueva-orden-encontrado-vehiculo">
              {s.vehiculoInfo.vehiculo.marca} {s.vehiculoInfo.vehiculo.modelo}
              {s.vehiculoInfo.vehiculo.anio ? ` · ${s.vehiculoInfo.vehiculo.anio}` : ''}
              {s.vehiculoInfo.vehiculo.color ? ` · ${s.vehiculoInfo.vehiculo.color}` : ''}
            </div>
            <div className="nueva-orden-encontrado-cliente">
              Propietario: {clienteVinculado ? clienteVinculado.nombre : 'Sin cliente vinculado'}
              {clienteVinculado ? ` · CC ${clienteVinculado.documento}` : ''}
            </div>
            <div className="nueva-orden-pregunta">¿Es quien trae el vehículo?</div>
            <div className="nueva-orden-si-no">
              <button
                type="button"
                className={`nueva-orden-toggle ${s.traeVehiculo === 'si' ? 'is-active' : ''}`}
                onClick={() => set({ traeVehiculo: 'si' })}
              >
                SÍ
              </button>
              <button
                type="button"
                className={`nueva-orden-toggle ${s.traeVehiculo === 'no' ? 'is-active' : ''}`}
                onClick={() => set({ traeVehiculo: 'no' })}
              >
                NO
              </button>
            </div>
          </div>
        )}

        {vehiculoEsNuevo && (
          <div className="nueva-orden-placa-nueva grc-mono">PLACA NO REGISTRADA · SE CREARÁ EL VEHÍCULO</div>
        )}

        {pideDocumento && (
          <Field label="DOCUMENTO DE QUIEN TRAE EL VEHÍCULO" htmlFor="nv-doc" style={{ marginTop: 16 }}>
            <input
              id="nv-doc"
              className="nueva-orden-doc-input"
              value={s.documento}
              onChange={(e) => handleDocumentoChange(e.target.value)}
              onBlur={handleDocumentoBlur}
              placeholder="1032456789"
              inputMode="numeric"
            />
            {docEstado && <div className="nueva-orden-doc-estado">{docEstado}</div>}
          </Field>
        )}

        {pideCliente && (
          <div className="nueva-orden-bloque">
            <div className="nueva-orden-bloque-titulo grc-mono">DATOS DEL CLIENTE NUEVO</div>
            <div className="nueva-orden-grid">
              <Field label="NOMBRE COMPLETO" htmlFor="nv-cli-nombre">
                <input
                  id="nv-cli-nombre"
                  value={s.clienteNombre}
                  onChange={(e) => set({ clienteNombre: e.target.value })}
                  placeholder="Diana Carolina Rojas"
                />
              </Field>
              <Field label="CELULAR" htmlFor="nv-cli-celular">
                <input
                  id="nv-cli-celular"
                  value={s.clienteCelular}
                  onChange={(e) => set({ clienteCelular: e.target.value })}
                  placeholder="310 445 2210"
                />
              </Field>
              <Field
                label="CORREO (OPCIONAL)"
                htmlFor="nv-cli-correo"
                hint={!correoValido ? 'Correo con formato inválido.' : ''}
              >
                <input
                  id="nv-cli-correo"
                  type="email"
                  value={s.clienteCorreo}
                  onChange={(e) => set({ clienteCorreo: e.target.value })}
                  placeholder="diana@correo.com"
                />
              </Field>
            </div>
          </div>
        )}

        {pideVehiculo && (
          <div className="nueva-orden-bloque">
            <div className="nueva-orden-bloque-titulo grc-mono">DATOS DEL VEHÍCULO NUEVO</div>
            <div className="nueva-orden-grid nueva-orden-grid-veh">
              <Field label="MARCA" htmlFor="nv-veh-marca">
                <input
                  id="nv-veh-marca"
                  value={s.vehMarca}
                  onChange={(e) => set({ vehMarca: e.target.value })}
                  placeholder="Chevrolet"
                />
              </Field>
              <Field label="MODELO" htmlFor="nv-veh-modelo">
                <input
                  id="nv-veh-modelo"
                  value={s.vehModelo}
                  onChange={(e) => set({ vehModelo: e.target.value })}
                  placeholder="Onix"
                />
              </Field>
              <Field
                label="AÑO (OPCIONAL)"
                htmlFor="nv-veh-anio"
                hint={!anioValido ? `Debe estar entre ${ANIO_MIN} y ${anioMax()}.` : ''}
              >
                <input
                  id="nv-veh-anio"
                  value={s.vehAnio}
                  onChange={(e) => set({ vehAnio: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="2021"
                  inputMode="numeric"
                />
              </Field>
              <Field label="COLOR" htmlFor="nv-veh-color">
                <input
                  id="nv-veh-color"
                  value={s.vehColor}
                  onChange={(e) => set({ vehColor: e.target.value })}
                  placeholder="Gris acero"
                />
              </Field>
              <Field label="VIN (OPCIONAL)" htmlFor="nv-veh-vin">
                <input
                  id="nv-veh-vin"
                  value={s.vehVin}
                  onChange={(e) => set({ vehVin: e.target.value.toUpperCase() })}
                  placeholder="9BGKS48T0MG..."
                />
              </Field>
            </div>
          </div>
        )}

        <div className="nueva-orden-footer">
          <Button onClick={crear} disabled={!listoCrear || creando}>
            {creando ? 'CREANDO…' : 'CREAR ORDEN'}
          </Button>
          <div className="nueva-orden-footer-nota">{footerNota}</div>
        </div>

        {error && (
          <Alert type="error" style={{ marginTop: 14 }}>
            {error}
          </Alert>
        )}
      </div>
    </div>
  );
}
