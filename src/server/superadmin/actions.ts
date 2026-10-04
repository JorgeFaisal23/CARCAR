"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperadminAction } from "@/lib/auth/session";
import { isEmailInUse } from "@/lib/db/accounts";
import { slugError } from "@/lib/slug";
import { deliverAccess, unusablePasswordHash, type AccessDelivery } from "@/server/auth/access";
import type { ActionResult } from "@/lib/action-result";

/**
 * Acciones de la plataforma: alta y administración de arrendadoras. Solo el
 * superadministrador. Usan el cliente sin alcance porque trabajan sobre
 * arrendadoras distintas, pero nunca tocan sus datos de operación (propiedades,
 * contratos, cobros): solo la fila de la organización y las cuentas de su
 * dueño.
 *
 * Cada movimiento queda en la bitácora de la arrendadora afectada, así su
 * dueño ve que la plataforma cambió su plan o su acceso.
 */

async function logPlatformAction(entry: {
  organizationId: string;
  userId: string;
  action: string;
  detail?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        entity: "Organization",
        entityId: entry.organizationId,
        detail: entry.detail,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar en la bitácora:", error);
  }
}

function refresh(orgId?: string) {
  revalidatePath("/superadmin");
  if (orgId) revalidatePath(`/superadmin/organizaciones/${orgId}`);
}

// ------------------------------------------------------------------ alta

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la arrendadora.").max(80),
  slug: z.string().trim().toLowerCase(),
});

const createSchema = organizationSchema.extend({
  plan: z.enum(["FREE", "PREMIUM"]),
  ownerName: z.string().trim().min(3, "Escribe el nombre completo del dueño.").max(80),
  ownerEmail: z.string().trim().toLowerCase().email("Escribe un correo válido para el dueño."),
});

export type CreateOrganizationResult = ActionResult & {
  orgId?: string;
  slug?: string;
  /** Cómo recibió el dueño su acceso (enlace por correo o contraseña temporal). */
  delivery?: AccessDelivery;
};

/** Crea una arrendadora con su dueño y le da acceso. */
export async function createOrganization(
  _prev: CreateOrganizationResult,
  formData: FormData,
): Promise<CreateOrganizationResult> {
  const session = await requireSuperadminAction();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    plan: formData.get("plan"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const data = parsed.data;

  const invalidSlug = slugError(data.slug);
  if (invalidSlug) return { error: invalidSlug };

  const [slugTaken, emailTaken] = await Promise.all([
    prisma.organization.findUnique({ where: { slug: data.slug }, select: { id: true } }),
    isEmailInUse(data.ownerEmail),
  ]);
  if (slugTaken) return { error: "Ese identificador ya lo usa otra arrendadora." };
  if (emailTaken) return { error: "El correo del dueño ya está registrado en la plataforma." };

  const passwordHash = await unusablePasswordHash();

  const { org, ownerId } = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: { slug: data.slug, name: data.name, brandName: data.name, plan: data.plan },
    });
    const owner = await tx.user.create({
      data: {
        organizationId: created.id,
        email: data.ownerEmail,
        name: data.ownerName,
        role: "OWNER",
        passwordHash,
      },
    });
    return { org: created, ownerId: owner.id };
  });

  const delivery = await deliverAccess(ownerId, "INVITE");

  await logPlatformAction({
    organizationId: org.id,
    userId: session.sub,
    action: "Alta de la arrendadora en la plataforma",
    detail: `${data.name} · plan ${data.plan}`,
  });

  refresh();
  return { ok: true, orgId: org.id, slug: org.slug, delivery };
}

// ------------------------------------------------------------------ edición

/** Nombre interno y slug. Cambiar el slug cambia la URL de su acceso con marca. */
export async function updateOrganization(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSuperadminAction();
  const orgId = String(formData.get("orgId") ?? "");

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const invalidSlug = slugError(parsed.data.slug);
  if (invalidSlug) return { error: invalidSlug };

  const [org, clash] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { slug: true } }),
    prisma.organization.findFirst({
      where: { slug: parsed.data.slug, NOT: { id: orgId } },
      select: { id: true },
    }),
  ]);
  if (!org) return { error: "No se encontró la arrendadora." };
  if (clash) return { error: "Ese identificador ya lo usa otra arrendadora." };

  await prisma.organization.update({
    where: { id: orgId },
    data: { name: parsed.data.name, slug: parsed.data.slug },
  });

  await logPlatformAction({
    organizationId: orgId,
    userId: session.sub,
    action: "Edición de datos de la arrendadora",
    detail:
      org.slug === parsed.data.slug
        ? parsed.data.name
        : `${parsed.data.name} · acceso /a/${org.slug} → /a/${parsed.data.slug}`,
  });

  refresh(orgId);
  return { ok: true };
}

const planSchema = z.enum(["FREE", "PREMIUM"]);

export async function setOrganizationPlan(
  orgId: string,
  plan: "FREE" | "PREMIUM",
): Promise<ActionResult> {
  const session = await requireSuperadminAction();
  if (!planSchema.safeParse(plan).success) return { error: "Plan no válido." };

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) return { error: "No se encontró la arrendadora." };

  await prisma.organization.update({ where: { id: orgId }, data: { plan } });
  await logPlatformAction({
    organizationId: orgId,
    userId: session.sub,
    action: "Cambio de plan",
    detail: plan === "PREMIUM" ? "Premium" : "Gratuito",
  });

  refresh(orgId);
  return { ok: true };
}

/**
 * Suspende o reactiva el acceso de una arrendadora. Suspender cierra en el
 * acto las sesiones de todos sus usuarios (dueño, equipo e inquilinos); sus
 * datos se conservan intactos.
 */
export async function setOrganizationStatus(
  orgId: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<ActionResult> {
  const session = await requireSuperadminAction();
  if (status !== "ACTIVE" && status !== "SUSPENDED") return { error: "Estado no válido." };

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) return { error: "No se encontró la arrendadora." };

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({ where: { id: orgId }, data: { status } });
    if (status === "SUSPENDED") {
      await tx.user.updateMany({
        where: { organizationId: orgId },
        data: { currentSessionId: null },
      });
    }
  });

  await logPlatformAction({
    organizationId: orgId,
    userId: session.sub,
    action: status === "SUSPENDED" ? "Suspensión del acceso" : "Reactivación del acceso",
  });

  refresh(orgId);
  return { ok: true };
}

/**
 * Nuevo acceso para el dueño de una arrendadora (soporte: perdió el acceso):
 * enlace por correo o contraseña temporal. Cierra su sesión actual. Solo
 * dueños: el equipo y los inquilinos los atiende su propia arrendadora.
 */
export async function resetOwnerPassword(
  userId: string,
): Promise<ActionResult & { delivery?: AccessDelivery }> {
  const session = await requireSuperadminAction();

  const owner = await prisma.user.findFirst({
    where: { id: userId, role: "OWNER" },
    select: { id: true, email: true, organizationId: true },
  });
  if (!owner || !owner.organizationId) return { error: "No se encontró al dueño." };

  const delivery = await deliverAccess(owner.id, "RESET");

  await logPlatformAction({
    organizationId: owner.organizationId,
    userId: session.sub,
    action: "Restablecimiento de contraseña del dueño",
    detail: owner.email,
  });

  refresh(owner.organizationId);
  return { ok: true, delivery };
}
