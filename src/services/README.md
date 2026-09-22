# Capa de servicios

Cada servicio (`*Service.js`) expone funciones `async`. Con `REACT_APP_USE_MOCK` distinto de `false`
(por defecto) usan la API simulada de `mock/mockApi.js` (datos en memoria + localStorage);
con `REACT_APP_USE_MOCK=false` llaman al backend vía axios (`httpClient.js`, `REACT_APP_API_URL`).

Los errores se lanzan como `Error` con `message` en español listo para mostrar al usuario.

El usuario autenticado se obtiene de la sesión (`session.js`); las páginas NO lo pasan a los servicios.

## Vista de orden (lo que devuelven ordenService, dashboardService y valoracionService)

```js
{
  id, numero,                 // número correlativo sin prefijo (mostrar con fmtOrden → "N.º 2481")
  placa,                      // "ABC123"
  vehiculo: { id, marca, modelo, anio, color, vin },
  vehiculoTexto,              // "Mazda CX-5 · 2021"
  cliente: { id, nombre, documento, celular, correo },   // cliente de ESTA orden
  estado,                     // 'ACTIVA' | 'ENTREGADA'
  ubicacionActual,            // 'EN_TALLER' | 'FUERA_DE_TALLER'
  idEtapaActual,              // id del catálogo ETAPAS o null
  etapaActual,                // nombre de etapa o null
  columna,                    // 'Asignado' | nombre de etapa | null (no está en el tablero)
  tecnicoActual,              // { id, nombre, activo, especialidad } | null
  fechaInicioEtapa, diasEnEtapa,
  fechaCreacion, fechaIngresoCotizar, fechaIngresoReparacion,
  diasEstimadoEntrega, fechaEntregaEstimada, diasEnTaller,
  etapasVisitadas,            // [idEtapa] según HistorialEtapas (bloqueo por historial)
  asesor,                     // nombre del usuario del último cambio de etapa
  creador,                    // nombre del usuario que creó la orden
  siniestro,                  // string | null
  alertas: { critico, vencido, proximo, proceso, enTaller, fuera, diasParaEntrega },
  alerta,                     // 'vencido' | 'critico' | 'proximo' | 'completado' | 'normal' (para color)
  estadoValoracion,           // 'Sin valorar' | 'Sin cargar a CESVI' | 'Cargadas a CESVI'
}
```

Color por `alerta`: vencido/critico → `--red`, proximo → `--accent`, completado → `--green`, normal → `--line`.
