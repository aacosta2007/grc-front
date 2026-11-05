import { useCallback, useEffect, useRef, useState } from 'react';
import { FOTO_MAX_BYTES, FOTO_TIPOS, FOTOS_MAX_TOTAL_BYTES } from '../utils/constants';

const MB = 1024 * 1024;

// Algunos navegadores dejan file.type vacío: entonces se decide por la extensión.
const esTipoValido = (file) => (file.type ? FOTO_TIPOS.includes(file.type) : /\.(jpe?g|png)$/i.test(file.name || ''));

// Valida las fotos nuevas contra las ya adjuntas (bytes acumulados).
// Devuelve { aceptados: [File], error: '' | mensaje con las rechazadas }.
export function validarFotos(nuevos, bytesYaAdjuntos = 0) {
  const aceptados = [];
  const noImagen = [];
  const muyGrandes = [];
  const exceden = [];
  let total = bytesYaAdjuntos;
  nuevos.forEach((file) => {
    if (!esTipoValido(file)) noImagen.push(file.name);
    else if (file.size > FOTO_MAX_BYTES) muyGrandes.push(file.name);
    else if (total + file.size > FOTOS_MAX_TOTAL_BYTES) exceden.push(file.name);
    else {
      total += file.size;
      aceptados.push(file);
    }
  });
  const errores = [];
  if (noImagen.length) errores.push(`Solo se admiten fotos JPEG o PNG: ${noImagen.join(', ')}.`);
  if (muyGrandes.length) errores.push(`Superan ${FOTO_MAX_BYTES / MB} MB: ${muyGrandes.join(', ')}.`);
  if (exceden.length) errores.push(`Se pasan del máximo de ${FOTOS_MAX_TOTAL_BYTES / MB} MB por envío: ${exceden.join(', ')}.`);
  return { aceptados, error: errores.join(' ') };
}

let secuencia = 0;

// Fotos elegidas para enviar con una nota: preview con object URL (se libera al quitar, limpiar o desmontar).
// fotos: [{ key, file, url, nombre }] · archivos: [File] listos para el multipart.
export default function useFotosAdjuntas() {
  const [fotos, setFotos] = useState([]);
  const [error, setError] = useState('');
  const urlsRef = useRef(new Set());

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  const liberar = (url) => {
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  };

  const agregar = useCallback(
    (lista) => {
      const nuevos = Array.from(lista || []);
      if (nuevos.length === 0) return;
      const bytes = fotos.reduce((acc, f) => acc + f.file.size, 0);
      const { aceptados, error: msg } = validarFotos(nuevos, bytes);
      setError(msg);
      if (!aceptados.length) return;
      const items = aceptados.map((file) => {
        const url = URL.createObjectURL(file);
        urlsRef.current.add(url);
        secuencia += 1;
        return { key: `${file.name}-${secuencia}`, file, url, nombre: file.name };
      });
      setFotos((prev) => [...prev, ...items]);
    },
    [fotos]
  );

  const quitar = useCallback((key) => {
    setFotos((prev) => {
      const foto = prev.find((f) => f.key === key);
      if (foto) liberar(foto.url);
      return prev.filter((f) => f.key !== key);
    });
    setError('');
  }, []);

  const limpiar = useCallback(() => {
    setFotos((prev) => {
      prev.forEach((f) => liberar(f.url));
      return [];
    });
    setError('');
  }, []);

  return { fotos, agregar, quitar, limpiar, archivos: fotos.map((f) => f.file), error };
}
