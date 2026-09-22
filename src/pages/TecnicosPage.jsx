import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { puedeEditarTecnicos } from '../utils/permissions';
import * as tecnicoService from '../services/tecnicoService';
import { Alert, Button, Card, CardHeader, ConfirmDialog, Empty, Field, Mono, Spinner, Tag } from '../components/ui';
import { ESPECIALIDAD_LABEL, ESPECIALIDADES } from '../utils/constants';
import { normalizarCedula } from '../utils/format';
import '../styles/Tecnicos.css';

const FORM_VACIO = { nombre: '', documento: '', celular: '', especialidad: ESPECIALIDADES[0] };

export default function TecnicosPage() {
  const { rol } = useAuth();
  const puedeEditar = puedeEditarTecnicos(rol);

  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [editando, setEditando] = useState(null); // técnico completo | null
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [confirmar, setConfirmar] = useState(null); // técnico a desactivar | null
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await tecnicoService.getTecnicos(puedeEditar ? { incluirInactivos: mostrarInactivos } : {});
      setTecnicos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  const cancelarEdicion = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
  };

  const onEditar = (t) => {
    setEditando(t);
    setForm({ nombre: t.nombre, documento: t.documento, celular: t.celular, especialidad: t.especialidad });
    setFormError(null);
    setSuccessMsg(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    const data = {
      nombre: form.nombre.trim(),
      documento: normalizarCedula(form.documento),
      celular: form.celular.trim(),
      especialidad: form.especialidad,
    };
    if (!data.nombre || !data.documento || !data.celular || !data.especialidad) {
      setFormError('Completa todos los campos.');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await tecnicoService.actualizarTecnico(editando.id, data);
        setSuccessMsg('Técnico actualizado correctamente.');
      } else {
        await tecnicoService.crearTecnico(data);
        setSuccessMsg('Técnico registrado correctamente.');
      }
      cancelarEdicion();
      await cargar();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const onConfirmarDesactivar = async () => {
    if (!confirmar) return;
    setProcesando(true);
    try {
      await tecnicoService.desactivarTecnico(confirmar.id);
      if (editando && editando.id === confirmar.id) cancelarEdicion();
      setConfirmar(null);
      await cargar();
    } catch (err) {
      setError(err.message);
      setConfirmar(null);
    } finally {
      setProcesando(false);
    }
  };

  const onReactivar = async (t) => {
    setError(null);
    try {
      await tecnicoService.reactivarTecnico(t.id);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`tecnicos-grid ${puedeEditar ? 'tecnicos-grid--split' : 'tecnicos-grid--single'}`}>
      <Card className="tecnicos-lista">
        <CardHeader
          title="Técnicos registrados"
          actions={
            <div className="tecnicos-header-actions">
              {puedeEditar && (
                <label className="tecnicos-toggle-inactivos">
                  <input
                    type="checkbox"
                    checked={mostrarInactivos}
                    onChange={(e) => setMostrarInactivos(e.target.checked)}
                  />
                  MOSTRAR INACTIVOS
                </label>
              )}
              <Mono color="var(--sub)">{tecnicos.length} REGISTRADOS</Mono>
            </div>
          }
        />

        {error && (
          <div style={{ padding: '12px 16px' }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {cargando ? (
          <div style={{ padding: '4px 16px' }}>
            <Spinner />
          </div>
        ) : tecnicos.length === 0 ? (
          <Empty>SIN TÉCNICOS REGISTRADOS</Empty>
        ) : (
          <div className="tecnicos-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Especialidad</th>
                  <th>Celular</th>
                  <th>En curso</th>
                  {puedeEditar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tecnicos.map((t) => (
                  <tr key={t.id} className={!t.activo ? 'tecnicos-fila-inactiva' : ''}>
                    <td>
                      <div className="tecnicos-nombre">{t.nombre}</div>
                      <div className="tecnicos-doc grc-mono">CC {t.documento}</div>
                    </td>
                    <td>
                      <Tag>{ESPECIALIDAD_LABEL[t.especialidad] || t.especialidad}</Tag>
                    </td>
                    <td className="grc-mono" style={{ color: 'var(--sub)' }}>
                      {t.celular}
                    </td>
                    <td className="grc-mono" style={{ fontWeight: 600 }}>
                      {t.enCurso}
                    </td>
                    {puedeEditar && (
                      <td>
                        <div className="tecnicos-acciones">
                          {t.activo ? (
                            <>
                              <button
                                type="button"
                                className="tecnicos-icon-btn"
                                aria-label={`Editar ${t.nombre}`}
                                onClick={() => onEditar(t)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="tecnicos-icon-btn"
                                aria-label={`Eliminar ${t.nombre}`}
                                onClick={() => setConfirmar(t)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onReactivar(t)}>
                              REACTIVAR
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {puedeEditar && (
        <Card className="tecnicos-form-card">
          <div className="grc-panel-title">{editando ? 'Editar técnico' : 'Registrar técnico'}</div>

          {successMsg && (
            <div style={{ marginTop: 12 }}>
              <Alert type="success">{successMsg}</Alert>
            </div>
          )}
          {formError && (
            <div style={{ marginTop: 12 }}>
              <Alert type="error">{formError}</Alert>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <Field label="NOMBRE COMPLETO" htmlFor="tec-nombre" style={{ marginTop: 14 }}>
              <input
                id="tec-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Wilmer Cárdenas"
                required
              />
            </Field>
            <Field label="DOCUMENTO" htmlFor="tec-doc" style={{ marginTop: 13 }}>
              <input
                id="tec-doc"
                value={form.documento}
                onChange={(e) => setForm((f) => ({ ...f, documento: normalizarCedula(e.target.value) }))}
                placeholder="1014778112"
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="CELULAR" htmlFor="tec-cel" style={{ marginTop: 13 }}>
              <input
                id="tec-cel"
                value={form.celular}
                onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
                placeholder="311 220 4471"
                required
              />
            </Field>
            <Field label="ESPECIALIDAD" htmlFor="tec-esp" style={{ marginTop: 13 }}>
              <select
                id="tec-esp"
                value={form.especialidad}
                onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
              >
                {ESPECIALIDADES.map((esp) => (
                  <option key={esp} value={esp}>
                    {ESPECIALIDAD_LABEL[esp] || esp}
                  </option>
                ))}
              </select>
            </Field>

            <div className="tecnicos-form-acciones">
              <Button type="submit" block disabled={guardando}>
                {guardando ? 'GUARDANDO…' : editando ? 'GUARDAR CAMBIOS' : 'REGISTRAR TÉCNICO'}
              </Button>
              {editando && (
                <Button type="button" variant="outline" onClick={cancelarEdicion} disabled={guardando}>
                  CANCELAR
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmar}
        title="Desactivar técnico"
        message="El técnico dejará de aparecer en la lista y en los selectores. Su historial se conserva y las etapas abiertas quedan con él hasta el próximo cambio de etapa."
        confirmLabel="DESACTIVAR"
        danger
        busy={procesando}
        onConfirm={onConfirmarDesactivar}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
