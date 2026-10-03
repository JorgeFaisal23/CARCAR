"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireOrgUserAction } from "@/lib/auth/session";
import { logAction } from "@/server/actions/audit";
import { isEmailInUse } from "@/lib/db/accounts";
import { unitExists } from "@/lib/db/guards";
import type { ActionResult } from "@/lib/action-result";

/**
 * Alta de inquilino. Crea el perfil y, si se indicó una unidad, el contrato
 * correspondiente en un solo paso: es el flujo real del arrendador.
 */

const tenantSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre completo."),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  phone: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  password: z
    .string({ error: "Escribe una contraseña temporal." })
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

const leaseSchema = z.object({
  unitId: z.string().min(1),
  startDate: z.string().min(1, "Indica el inicio del contrato."),
  endDate: z.string().min(1, "Indica el vencimiento del contrato."),
  rentAmount: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0).optional(),
  paymentDay: z.coerce.number().int().min(1).max(28),
});

export async function createTenant(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { session, orgId, db } = await requireOrgUserAction(["OWNER", "ADMIN"]);

  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    documentId: formData.get("documentId") || undefined,
    notes: formData.get("notes") || undefined,
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  // El correo es único en toda la plataforma, no solo en esta arrendadora.
  if (await isEmailInUse(parsed.data.email)) {
    return { error: "Ese correo ya está registrado. Usa otro." };
  }

  const unitId = String(formData.get("unitId") ?? "");
  let leaseData: z.infer<typeof leaseSchema> | null = null;

  if (unitId) {
    const leaseParsed = leaseSchema.safeParse({
      unitId,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      rentAmount: formData.get("rentAmount"),
      depositAmount: formData.get("depositAmount") || undefined,
      paymentDay: formData.get("paymentDay") || 1,
    });

    if (!leaseParsed.success) {
      return {
        error: leaseParsed.error.issues[0]?.message ?? "Revisa los datos del contrato.",
      };
    }

    if (new Date(leaseParsed.data.endDate) <= new Date(leaseParsed.data.startDate)) {
      return { error: "El vencimiento debe ser posterior al inicio del contrato." };
    }

    if (!(await unitExists(db, unitId))) {
      return { error: "No se encontró la unidad." };
    }

    // Una unidad no puede tener dos contratos vigentes a la vez.
    const busy = await db.lease.findFirst({
      where: { unitId, status: "ACTIVE" },
      select: { id: true },
    });
    if (busy) {
      return { error: "Esa unidad ya tiene un contrato vigente." };
    }

    leaseData = leaseParsed.data;
  }

  // La contraseña temporal permite al inquilino entrar al portal desde el día
  // uno. Nunca hay una contraseña por defecto: una conocida por todos sería
  // una puerta abierta a cualquier cuenta nueva.
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  // Perfil, contrato y estado de la unidad se guardan juntos: si algo falla
  // no queda un inquilino a medias ni una unidad ocupada sin contrato.
  const tenant = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        organizationId: orgId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        documentId: parsed.data.documentId,
        notes: parsed.data.notes,
        role: "TENANT",
        passwordHash,
      },
    });

    if (leaseData) {
      await tx.lease.create({
        data: {
          organizationId: orgId,
          unitId: leaseData.unitId,
          tenantId: created.id,
          startDate: new Date(leaseData.startDate),
          endDate: new Date(leaseData.endDate),
          rentAmount: leaseData.rentAmount,
          depositAmount: leaseData.depositAmount ?? null,
          paymentDay: leaseData.paymentDay,
          status: "ACTIVE",
        },
      });

      await tx.unit.update({
        where: { id: leaseData.unitId },
        data: { status: "OCCUPIED" },
      });
    }

    return created;
  });

  await logAction(db, session.sub, "Alta de inquilino", "User", tenant.id, tenant.name);

  revalidatePath("/inquilinos");
  revalidatePath("/edificios");
  revalidatePath("/dashboard");
  redirect(`/inquilinos/${tenant.id}`);
}

const updateSchema = tenantSchema.omit({ password: true });

export async function updateTenant(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { session, db } = await requireOrgUserAction(["OWNER", "ADMIN"]);
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return { error: "No se identificó al inquilino." };

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    documentId: formData.get("documentId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  // La acción se puede invocar directamente con cualquier id: sin esta
  // comprobación, alguien del equipo podría cambiar el correo del dueño y
  // quedarse con su cuenta.
  const tenant = await db.user.findFirst({
    where: { id: tenantId, role: "TENANT" },
    select: { id: true },
  });
  if (!tenant) return { error: "No se encontró al inquilino." };

  if (await isEmailInUse(parsed.data.email, tenantId)) {
    return { error: "Ese correo ya está registrado. Usa otro." };
  }

  await db.user.update({
    where: { id: tenantId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      documentId: parsed.data.documentId ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  await logAction(db, session.sub, "Edición de inquilino", "User", tenantId, parsed.data.name);

  revalidatePath(`/inquilinos/${tenantId}`);
  revalidatePath("/inquilinos");
  return { ok: true };
}
