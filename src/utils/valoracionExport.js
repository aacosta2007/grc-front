// Generación de archivos para la hoja de valoración: PDF (jspdf) y ZIP de fotos (jszip),
// más helpers de orden/agrupación de piezas y de estado visual compartidos por los
// componentes de src/components/valoracion.
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ACCION_PIEZA, FILTROS_VALORACION } from './constants';
import { fmtFecha, fmtOrden, fmtPlaca } from './format';

// ── Estado visual del módulo de valoración (lista, resumen, hoja, vista PDF) ──
const ESTADO_TAG = {
  [FILTROS_VALORACION.SIN_VALORAR]: { label: 'SIN VALORAR', color: 'var(--red)' },
  [FILTROS_VALORACION.SIN_CARGAR]: { label: 'PENDIENTE CESVI', color: 'var(--accent)' },
  [FILTROS_VALORACION.CARGADAS]: { label: 'EN CESVI', color: 'var(--green)' },
};

export const estadoValoracionTag = (estado) => ESTADO_TAG[estado] || { label: estado || '—', color: 'var(--sub)' };

// ── Orden de piezas: bloque SUSTITUIR arriba, REPARAR abajo; alfabético dentro de cada bloque ──
export function agruparBloques(detalles = []) {
  const sust = detalles
    .filter((d) => d.accion === ACCION_PIEZA.SUSTITUIR)
    .sort((a, b) => a.pieza.localeCompare(b.pieza, 'es'));
  const rep = detalles
    .filter((d) => d.accion === ACCION_PIEZA.REPARAR)
    .sort((a, b) => a.pieza.localeCompare(b.pieza, 'es'));
  return [
    { titulo: 'SUSTITUIR', items: sust, vacio: 'Ninguna pieza por sustituir' },
    { titulo: 'REPARAR', items: rep, vacio: 'Ninguna pieza por reparar' },
  ];
}

export const ordenarDetalles = (detalles = []) => agruparBloques(detalles).flatMap((b) => b.items);

export const detalleTexto = (d) => {
  if (d.accion === ACCION_PIEZA.SUSTITUIR) return 'SUSTITUIR';
  return d.gravedad ? `REPARAR · ${d.gravedad}` : 'REPARAR';
};

// ── Descarga de un blob generado en memoria ──
function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── PDF de la hoja de valoración: texto simple bien maquetado, sin dependencias de imágenes ──
export function generarPdfValoracion(orden, valoracion) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const left = 48;
  const right = 564;
  let y = 54;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(13, 13, 13);
  doc.text('SERVIMACROMOTOR', left, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(89, 89, 89);
  doc.text(fmtOrden(orden.numero), right, y - 10, { align: 'right' });
  doc.text(fmtFecha(valoracion.actualizadaAt || valoracion.creadaAt || new Date()), right, y + 4, { align: 'right' });

  y += 12;
  doc.setFontSize(9.5);
  doc.text('HOJA DE VALORACIÓN DE DAÑOS', left, y);

  y += 12;
  doc.setDrawColor(13, 13, 13);
  doc.setLineWidth(2);
  doc.line(left, y, right, y);

  y += 26;
  const cols = [left, left + 176, left + 352];
  const cabecera = [
    ['PLACA', fmtPlaca(orden.placa)],
    ['VEHÍCULO', orden.vehiculoTexto || '—'],
    ['CLIENTE', (orden.cliente && orden.cliente.nombre) || '—'],
  ];
  cabecera.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text(k, cols[i], y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), cols[i], y + 15, { maxWidth: 168 });
  });

  y += 40;
  doc.setDrawColor(191, 191, 191);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text('DESCRIPCIÓN GENERAL DEL DAÑO', left, y);

  y += 14;
  doc.setFontSize(10.5);
  doc.setTextColor(38, 38, 38);
  const descLineas = doc.splitTextToSize(valoracion.descripcion || 'Sin descripción registrada.', right - left);
  doc.text(descLineas, left, y);
  y += descLineas.length * 13 + 14;

  const filas = ordenarDetalles(valoracion.detalles || []);

  const asegurarEspacio = (alturaNecesaria) => {
    if (y + alturaNecesaria > 730) {
      doc.addPage();
      y = 54;
    }
  };

  asegurarEspacio(30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(89, 89, 89);
  doc.text('PIEZA', left, y);
  doc.text('ACCIÓN · GRAVEDAD', right, y, { align: 'right' });
  y += 6;
  doc.setDrawColor(13, 13, 13);
  doc.setLineWidth(1.4);
  doc.line(left, y, right, y);
  y += 18;

  if (!filas.length) {
    doc.setFontSize(10.5);
    doc.setTextColor(89, 89, 89);
    doc.text('Sin piezas registradas.', left, y);
    y += 18;
  }

  filas.forEach((f) => {
    asegurarEspacio(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(f.pieza, left, y, { maxWidth: 280 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(89, 89, 89);
    doc.text(detalleTexto(f), right, y, { align: 'right' });
    y += 8;
    doc.setDrawColor(217, 217, 217);
    doc.setLineWidth(0.6);
    doc.line(left, y, right, y);
    y += 18;
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(89, 89, 89);
    doc.text(`VALORÓ: ${(valoracion.usuario || '—').toUpperCase()}`, left, 780);
    doc.text(`PÁGINA ${p} DE ${totalPaginas}`, right, 780, { align: 'right' });
  }

  doc.save(`valoracion_${orden.placa}.pdf`);
}

// ── Decodifica una data URL (base64 o URL-encoded, p.ej. un SVG de prueba) a bytes ──
function decodificarDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl || '');
  if (!match) throw new Error('Formato de imagen no soportado');
  const [, mimeCrudo, esBase64, contenido] = match;
  const mime = mimeCrudo || 'application/octet-stream';
  if (esBase64) {
    const binario = atob(contenido);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
    return { bytes, mime };
  }
  const bytes = new TextEncoder().encode(decodeURIComponent(contenido));
  return { bytes, mime: mime === 'application/octet-stream' ? 'image/svg+xml' : mime };
}

const EXT_POR_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};

function extensionDe(mime, nombre) {
  if (EXT_POR_MIME[mime]) return EXT_POR_MIME[mime];
  const m = /\.([a-zA-Z0-9]+)$/.exec(nombre || '');
  return m ? m[1].toLowerCase() : 'jpg';
}

// ── ZIP con las fotografías de la valoración ──
export async function generarZipFotos(orden, valoracion) {
  const imagenes = (valoracion && valoracion.imagenes) || [];
  if (!imagenes.length) throw new Error('La valoración no tiene fotografías para descargar.');
  const zip = new JSZip();
  imagenes.forEach((img, i) => {
    const { bytes, mime } = decodificarDataUrl(img.url);
    const ext = extensionDe(mime, img.nombre);
    const base = (img.nombre || `foto_${i + 1}`).replace(/\.[a-zA-Z0-9]+$/, '');
    zip.file(`${String(i + 1).padStart(2, '0')}_${base}.${ext}`, bytes);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  descargarBlob(blob, `fotos_${orden.placa}.zip`);
}
