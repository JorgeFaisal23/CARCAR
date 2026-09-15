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
  organizationId?: string | null,
) {
  try {
    let orgId = organizationId;
    if (!orgId && userId) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      orgId = u?.organizationId ?? null;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        organizationId: orgId,
        action,
        entity,
        entityId,
        detail,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar en la bitácora:", error);
  }
}
