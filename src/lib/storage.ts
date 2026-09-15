import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Gestor de almacenamiento de archivos para RentaCore.
 * 
 * Regla de Oro de AGENTS.md:
 * Prohibido almacenar imágenes completas en base64 en PostgreSQL en producción.
 * Este módulo abstrae el guardado de comprobantes y logos:
 * - Local / Docker Volume: almacena en `public/uploads/...` y devuelve la ruta relativa.
 * - S3 / Cloudflare R2: soporte futuro configurable vía variables de entorno.
 */

export type StorageCategory = "receipts" | "logos" | "documents";

/**
 * Guarda un archivo (a partir de un data URL base64 o Buffer) y devuelve su URL pública/relativa.
 * Si ya es una URL pública (http/https) o una ruta relativa de upload, la devuelve intacta.
 */
export async function saveFile(
  input: string | Buffer,
  category: StorageCategory = "receipts",
  prefix = "file",
): Promise<string> {
  // Si ya es una URL externa o ruta local ya almacenada, no procesar
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/uploads/")
    ) {
      return trimmed;
    }
  }

  let buffer: Buffer;
  let ext = "jpg";

  if (typeof input === "string") {
    // Parsear data URL (ej: data:image/jpeg;base64,/9j/4AAQSkZJRg...)
    const matches = input.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches[1] && matches[2]) {
      const mime = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, "base64");

      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("svg")) ext = "svg";
      else if (mime.includes("pdf")) ext = "pdf";
      else ext = "jpg";
    } else {
      // Si no tiene prefijo data URL, asumir base64 crudo
      buffer = Buffer.from(input, "base64");
    }
  } else {
    buffer = input;
  }

  // Generar nombre de archivo único
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const filename = `${prefix}_${Date.now()}_${randomSuffix}.${ext}`;

  // Directorio destino en disco
  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  // Retornar la ruta servible estáticamente por Next.js / Caddy
  return `/uploads/${category}/${filename}`;
}
