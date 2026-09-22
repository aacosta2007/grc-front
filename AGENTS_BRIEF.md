# Brief común para los agentes que escriben pantallas

Proyecto: `C:\Users\Acosta\Documents\servimacromotor-grc-front` (Create React App, React 19, react-router-dom v7, axios, jszip, jspdf).
Sistema GRC de un taller de colisión (Servimacromotor). Todo el texto de la interfaz va en **español**.

## Fuentes de verdad
1. **Diseño visual**: `diseno-referencia/servimacromotor-grc.template.html` (template del prototipo de Claude Design,
   con sintaxis `{{ }}`, `<sc-if>`, `<sc-for>`, `sc-camel-on-click`). Reproduce fielmente estructura, colores, tamaños,
   tipografías, espaciados y textos. Líneas 1666-2266 del mismo archivo = lógica/datos del prototipo (solo orientativa).
   `diseno-referencia/HojaValoracion.template.html` = sub-pantalla "Hoja de valoración".
2. **Reglas de negocio** (prevalecen sobre el prototipo cuando difieren):
   - Numeración de órdenes sin prefijo "OT-": usa `fmtOrden(id)` → "N.º 2481".
   - Especialidades reales: ARMADOR, LATONERO, MECANICO, ALISTADOR, PINTOR, CONTROL_CALIDAD (ver `utils/constants.js`).
   - 10 etapas reales + columna calculada "Asignado". Bancada no lleva técnico.
   - Rol TECNICO sin acceso web; el selector de rol de usuarios solo ofrece ADMIN, ASESOR, GERENTE.
   - Ignora del prototipo: el conmutador de roles de la barra lateral, los botones "ENTRAR COMO" del login.

## Base ya escrita (NO la modifiques; si necesitas algo nuevo, créalo en tus propios archivos)
- `src/styles/global.css`: variables CSS (`--bg --card --line --line-soft --text --sub --accent --red --green
  --accent-bg-soft --locked-bg --font-body --font-condensed --font-mono`) y clases `grc-*`
  (grc-card, grc-card-header, grc-panel-title, grc-section-title, grc-mono, grc-placa, grc-btn + grc-btn-primary|outline|ghost|danger|sm|block,
  grc-tag, grc-dot, grc-alert(-error|-success|-info), grc-empty, grc-modal-backdrop, grc-modal, grc-spinner).
- `src/components/ui.jsx`: `Button, Card, CardHeader, Mono, Tag, Dot, Field, Alert, Spinner, Empty, Modal, ConfirmDialog, PlacaSearch`.
- `src/utils/constants.js` (COLORS, ETAPAS, getEtapa, etapaRequiereTecnico, COLUMNA_ASIGNADO, ESPECIALIDADES,
  ESPECIALIDAD_LABEL, ROLES, ROLES_ASIGNABLES, TIPOS_AVISO, FILTROS_VALORACION, ACCION_PIEZA, GRAVEDADES, ...),
  `src/utils/format.js` (fmtFecha, fmtFechaCorta, fmtHora, fmtFechaHora, fmtFechaNumerica, fmtOrden, fmtPlaca,
  normalizarPlaca, normalizarCedula, esCedulaValida, pluralDias, diffDias), `src/utils/permissions.js`.
- `src/context/AuthContext.jsx`: `useAuth()` → `{ usuario, rol, login(correo, password), logout() }`.
- `src/services/*Service.js` + `src/services/README.md` (forma de la "vista de orden"). Lee el README y los
  comentarios de cada servicio antes de usarlos. Nunca importes `services/mock/*` desde páginas o componentes.
- `src/components/layout/Layout.jsx` ya pinta barra lateral + encabezado (título/subtítulo por ruta) y el botón NUEVA ORDEN.
  Tus páginas solo pintan el contenido del área principal (lo que en el template está dentro de `<div style="padding:22px 26px 52px">`).
- Rutas (`src/App.js`): /login, /alertas, /alertas/avisos/:tipo, /backlog, /ficha, /ficha/:idOrden (acepta `?tab=info|rep|val|obs|fotos`),
  /nueva-orden, /valoracion, /valoracion/:idOrden, /tecnicos, /usuarios.

## Convenciones
- Componentes funcionales con hooks, archivos `.jsx`. Un archivo CSS por página/componente en `src/styles/` (prefija las clases
  con el nombre del módulo para evitar colisiones, p. ej. `.backlog-col`). Puedes usar estilos en línea donde el template los usa,
  pero prefiere clases.
- Maneja estados de carga (`<Spinner/>`), error (`<Alert type="error">`) y vacío (`<Empty>`).
- Accesibilidad: botones reales para acciones, `label`/`htmlFor` en campos, `aria-label` en botones solo-icono.
- Responsive: debe verse bien desde 360 px de ancho (grids con `auto-fit/minmax`, `flex-wrap`, tablas con scroll horizontal).
- No instales dependencias nuevas. No ejecutes `npm start` ni `npm run build` (otros agentes trabajan en paralelo).
  Para verificar tu código ejecuta: `npx eslint <tus archivos>` desde la raíz del proyecto y corrige todo error/warning.
- Escribe SOLO los archivos que se te asignan. Al terminar, responde con la lista de archivos creados y cualquier
  decisión o limitación relevante (breve).
