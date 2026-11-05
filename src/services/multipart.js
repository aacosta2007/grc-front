// Cuerpo multipart de las rutas que reciben nota + fotos en una sola petición:
//   parte "datos"    → el JSON del RequestDto (application/json)
//   parte "archivos" → 0..n fotos (se repite la parte por cada archivo)
// No se fija Content-Type: axios deja que el navegador ponga multipart/form-data con su boundary.
export function aFormData(datos, archivos = []) {
  const form = new FormData();
  form.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
  (archivos || []).forEach((archivo) => form.append('archivos', archivo));
  return form;
}
