/**
 * Compresión de imágenes en el navegador.
 *
 * Una foto de celular pesa entre 2 y 8 MB; guardarla tal cual sería inviable.
 * Aquí se reescala y se recomprime a JPEG antes de enviarla, de modo que un
 * comprobante típico acabe pesando entre 100 y 300 KB sin dejar de ser legible.
 */

export const MAX_RECEIPT_BYTES = 900 * 1024;

/** Tamaño aproximado en bytes de los datos que hay dentro de un data URL. */
export function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4);
}

export type CompressOptions = {
  /** Lado mayor máximo, en píxeles. */
  maxEdge?: number;
  /** Calidad JPEG inicial (0-1). */
  quality?: number;
  /** Tamaño objetivo en bytes. */
  maxBytes?: number;
};

/**
 * Devuelve la imagen como data URL JPEG, reescalada y comprimida.
 * Si tras el primer intento sigue pesando de más, baja la calidad por pasos.
 */
export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.75, maxBytes = MAX_RECEIPT_BYTES }: CompressOptions = {},
): Promise<string> {
  // `imageOrientation` respeta el EXIF: sin esto, las fotos tomadas en vertical
  // con el celular se guardarían giradas.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No se pudo procesar la imagen en este navegador.");
  }

  // Fondo blanco: si el original tiene transparencia, el JPEG la vería negra.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let current = quality;
  let dataUrl = canvas.toDataURL("image/jpeg", current);

  while (dataUrlBytes(dataUrl) > maxBytes && current > 0.3) {
    current -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", current);
  }

  if (dataUrlBytes(dataUrl) > maxBytes) {
    throw new Error(
      "La imagen es demasiado pesada incluso comprimida. Intenta con otra foto.",
    );
  }

  return dataUrl;
}
