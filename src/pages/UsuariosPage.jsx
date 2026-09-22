import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as usuarioService from '../services/usuarioService';
import { Alert, Button, Card, CardHeader, ConfirmDialog, Empty, Field, Mono, Spinner, Tag } from '../components/ui';
import { ROLES_ASIGNABLES } from '../utils/constants';
import '../styles/Usuarios.css';

const FORM_VACIO = { nombre: '', correo: '', rol: ROLES_ASIGNABLES[0], password: '', passwordConfirm: '' };

export default function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [editando, setEditando] = useState(null); // usuario | null
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [confirmar, setConfirmar] = useState(null); // usuario a desactivar | null
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await usuarioService.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const nuevoUsuario = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setSuccessMsg(null);
  };

  const onEditar = (u) => {
    setEditando(u);
    setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol, password: '', passwordConfirm: '' });
    setFormError(null);
    setSuccessMsg(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const nombre = form.nombre.trim();
    const correo = form.correo.trim();
    if (!nombre || !correo || !form.rol) {
      setFormError('Completa nombre, correo y rol.');
      return;
    }
    const cambiaPassword = !editando || form.password;
    if (cambiaPassword) {
      if (form.password.length < 6) {
        setFormError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setFormError('Las contraseñas no coinciden.');
        return;
      }
    }

    const data = { nombre, correo, rol: form.rol };
    if (cambiaPassword) data.password = form.password;

    setGuardando(true);
    try {
      if (editando) {
        await usuarioService.actualizarUsuario(editando.id, data);
        setSuccessMsg('Usuario actualizado correctamente.');
      } else {
        await usuarioService.crearUsuario(data);
        setSuccessMsg('Usuario registrado correctamente.');
      }
      nuevoUsuario();
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
      await usuarioService.desactivarUsuario(confirmar.id);
      if (editando && editando.id === confirmar.id) nuevoUsuario();
      setConfirmar(null);
      await cargar();
    } catch (err) {
      setError(err.message);
      setConfirmar(null);
    } finally {
      setProcesando(false);
    }
  };

  const onReactivar = async (u) => {
    setError(null);
    try {
      await usuarioService.reactivarUsuario(u.id);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="usuarios-grid">
      <Card className="usuarios-lista">
        <CardHeader title="Usuarios del sistema" actions={<Mono color="var(--sub)">{usuarios.length} CUENTAS</Mono>} />

        {error && (
          <div style={{ padding: '12px 16px' }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {cargando ? (
          <div style={{ padding: '4px 16px' }}>
            <Spinner />
          </div>
        ) : usuarios.length === 0 ? (
          <Empty>SIN USUARIOS REGISTRADOS</Empty>
        ) : (
          <div className="usuarios-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const esUno = usuarioActual && u.id === usuarioActual.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, fontSize: 13.5 }}>{u.nombre}</td>
                      <td style={{ color: 'var(--sub)', fontSize: 12.5 }}>{u.correo}</td>
                      <td>
                        <Tag>{u.rol}</Tag>
                      </td>
                      <td>
                        <Tag color={u.activo ? 'var(--green)' : 'var(--line)'}>{u.activo ? 'ACTIVO' : 'INACTIVO'}</Tag>
                      </td>
                      <td>
                        <div className="usuarios-acciones">
                          <button
                            type="button"
                            className="usuarios-icon-btn"
                            aria-label={`Editar ${u.nombre}`}
                            onClick={() => onEditar(u)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          {u.activo ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={esUno}
                              title={esUno ? 'No puedes desactivar tu propia cuenta' : undefined}
                              onClick={() => setConfirmar(u)}
                            >
                              DESACTIVAR
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onReactivar(u)}>
                              REACTIVAR
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="usuarios-form-card">
        <div className="usuarios-form-header">
          <span className="grc-panel-title">{editando ? 'Editar usuario' : 'Registrar usuario'}</span>
          {editando && (
            <button type="button" className="usuarios-nuevo-btn" onClick={nuevoUsuario}>
              + NUEVO
            </button>
          )}
        </div>

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
          <Field label="NOMBRE" htmlFor="usr-nombre" style={{ marginTop: 14 }}>
            <input
              id="usr-nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Laura Beltrán"
              required
            />
          </Field>
          <Field label="CORREO" htmlFor="usr-correo" style={{ marginTop: 13 }}>
            <input
              id="usr-correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              placeholder="laura@servimacromotor.co"
              required
            />
          </Field>
          <Field label="ROL" htmlFor="usr-rol" style={{ marginTop: 13 }}>
            <select id="usr-rol" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
              {ROLES_ASIGNABLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={editando ? 'NUEVA CONTRASEÑA (OPCIONAL)' : 'CONTRASEÑA'}
            htmlFor="usr-pass"
            style={{ marginTop: 13 }}
            hint={
              editando
                ? 'Déjala vacía para no cambiarla. La contraseña se guarda cifrada: no se puede consultar, solo reasignar.'
                : 'Mínimo 6 caracteres.'
            }
          >
            <input
              id="usr-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editando ? 'Dejar vacío para no cambiarla' : '••••••••'}
            />
          </Field>
          {(!editando || form.password) && (
            <Field label="CONFIRMAR CONTRASEÑA" htmlFor="usr-pass2" style={{ marginTop: 13 }}>
              <input
                id="usr-pass2"
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
                placeholder="••••••••"
              />
            </Field>
          )}

          <Button type="submit" block disabled={guardando} style={{ marginTop: 16 }}>
            {guardando ? 'GUARDANDO…' : editando ? 'GUARDAR CAMBIOS' : 'REGISTRAR USUARIO'}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={!!confirmar}
        title="Desactivar usuario"
        message="El usuario no podrá iniciar sesión mientras esté inactivo. Puedes reactivarlo cuando quieras desde esta misma pantalla."
        confirmLabel="DESACTIVAR"
        danger
        busy={procesando}
        onConfirm={onConfirmarDesactivar}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
