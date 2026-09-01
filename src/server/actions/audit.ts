import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Bitácora. Se escribe siempre; solo se lee desde la pantalla Premium de
 * equipo, de modo que al activar el plan ya hay historial que mostrar.
 *
 * Nunca debe tumbar la operación principal: si falla el registro, se anota en
 * consola y la acción del usuario continúa.
 */
export async function logAction(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  detail?: string,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, detail },
    });
  } catch (error) {
    console.error("No se pudo registrar en la bitácora:", error);
  }
}
