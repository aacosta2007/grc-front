// Fotos de ejemplo generadas como SVG (data URL) para no depender de archivos externos.
const TONOS = ['#3a3a3a', '#2f2f2f', '#444141', '#353535', '#2b2b2b', '#403d3d'];

export function placeholderFoto(etiqueta = 'FOTO', seed = 0) {
  const fondo = TONOS[seed % TONOS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
<rect width="480" height="360" fill="${fondo}"/>
<path d="M90 230 L130 170 Q140 155 160 152 L320 152 Q340 155 352 170 L392 230 Z" fill="#595959"/>
<rect x="80" y="228" width="320" height="42" rx="10" fill="#6b6b6b"/>
<circle cx="150" cy="272" r="24" fill="#1a1a1a"/><circle cx="330" cy="272" r="24" fill="#1a1a1a"/>
<text x="20" y="36" font-family="monospace" font-size="18" fill="#BFBFBF" letter-spacing="2">${etiqueta}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
