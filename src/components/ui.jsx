// Primitivas de interfaz reutilizables. Usan las clases grc-* de styles/global.css.
import React, { useEffect } from 'react';

export function Button({ variant = 'primary', size, block, className = '', type = 'button', ...props }) {
  const cls = [
    'grc-btn',
    `grc-btn-${variant}`,
    size === 'sm' ? 'grc-btn-sm' : '',
    block ? 'grc-btn-block' : '',
    className,
  ].join(' ').trim();
  return <button type={type} className={cls} {...props} />;
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`grc-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, actions, children }) {
  return (
    <div className="grc-card-header">
      {title ? <span className="grc-panel-title">{title}</span> : children}
      {actions}
    </div>
  );
}

// Texto monoespaciado en mayúsculas (etiquetas, metadatos)
export function Mono({ color, size = 10, style, children, ...props }) {
  return (
    <span className="grc-mono" style={{ color, fontSize: size, ...style }} {...props}>
      {children}
    </span>
  );
}

export function Tag({ color = 'var(--sub)', children }) {
  return (
    <span className="grc-tag" style={{ color }}>
      {children}
    </span>
  );
}

export function Dot({ color, size = 8 }) {
  return <span className="grc-dot" style={{ background: color, width: size, height: size }} />;
}

export function Field({ label, htmlFor, hint, children, style }) {
  return (
    <div style={style}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--line)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export function Alert({ type = 'info', children, style }) {
  if (!children) return null;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`grc-alert grc-alert-${type}`} style={style}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'CARGANDO' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 4px' }}>
      <div className="grc-spinner" aria-hidden="true" />
      <Mono color="var(--line)">{label}</Mono>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="grc-empty">{children}</div>;
}

// Modal accesible: cierra con Escape y clic en el fondo.
export function Modal({ open, onClose, title, subtitle, children, width = 460, labelledBy = 'grc-modal-title' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="grc-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="grc-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ maxWidth: width }}>
        {title && (
          <div style={{ marginBottom: 14 }}>
            <div
              id={labelledBy}
              style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 22, letterSpacing: '0.02em', textTransform: 'uppercase' }}
            >
              {title}
            </div>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 4, lineHeight: 1.45 }}>{subtitle}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Diálogo de confirmación simple (fechas de una sola vez, desactivar, etc.)
export function ConfirmDialog({ open, title, message, confirmLabel = 'CONFIRMAR', danger, busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={busy ? undefined : onCancel} title={title} labelledBy="grc-confirm-title">
      <div style={{ fontSize: 13.5, color: 'var(--sub)', lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          CANCELAR
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
          {busy ? 'PROCESANDO…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// Buscador de placa (usado en Ficha y Valoración)
export function PlacaSearch({ value, onChange, onSearch, placeholder = 'ABC123', buttonLabel = 'BUSCAR', autoFocus }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      style={{ display: 'flex', alignItems: 'stretch', maxWidth: 520, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--line)' }} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        aria-label="Placa del vehículo"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
        placeholder={placeholder}
        style={{ border: 'none', background: 'transparent', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', outlineOffset: -2 }}
      />
      <button
        type="submit"
        style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 0, padding: '0 20px', fontWeight: 700, fontSize: 13.5, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
