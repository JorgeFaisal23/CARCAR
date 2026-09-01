"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserAction } from "@/lib/auth/session";
import { logAction } from "@/server/actions/audit";

/** Resultado uniforme de las acciones: la UI solo revisa `error`. */
export type ActionResult = { ok?: boolean; error?: string };

// ------------------------------------------------------------------ edificios

const buildingSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la propiedad."),
  address: z.string().trim().min(4, "Escribe la dirección."),
  city: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createBuilding(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);

  const parsed = buildingSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const building = await prisma.building.create({ data: parsed.data });
  await logAction(session.sub, "Alta de propiedad", "Building", building.id, building.name);

  revalidatePath("/edificios");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ------------------------------------------------------------------ unidades

const unitSchema = z.object({
  buildingId: z.string().min(1, "Elige la propiedad."),
  code: z.string().trim().min(1, "Escribe el identificador de la unidad."),
  name: z.string().trim().optional(),
  type: z.enum(["ROOM", "APARTMENT", "STUDIO", "COMMERCIAL"]),
  status: z.enum(["AVAILABLE", "OCCUPIED", "SHORT_TERM", "MAINTENANCE"]),
  floor: z.coerce.number().int().min(0).max(200).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  sizeM2: z.coerce.number().min(0).max(10000).optional(),
  baseRent: z.coerce.number().min(0, "La renta no puede ser negativa."),
  description: z.string().trim().optional(),
});

function readUnitForm(formData: FormData) {
  return {
    buildingId: formData.get("buildingId"),
    code: formData.get("code"),
    name: formData.get("name") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    floor: formData.get("floor") || undefined,
    bedrooms: formData.get("bedrooms") || 1,
    bathrooms: formData.get("bathrooms") || 1,
    sizeM2: formData.get("sizeM2") || undefined,
    baseRent: formData.get("baseRent"),
    description: formData.get("description") || undefined,
  };
}

export async function createUnit(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);
  const parsed = unitSchema.safeParse(readUnitForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  // El identificador debe ser único dentro del edificio: dos "101" en el mismo
  // inmueble harían imposible saber de cuál se habla.
  const duplicate = await prisma.unit.findFirst({
    where: { buildingId: parsed.data.buildingId, code: parsed.data.code },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error: `Ya existe una unidad con el identificador "${parsed.data.code}" en esta propiedad.`,
    };
  }

  const unit = await prisma.unit.create({ data: parsed.data });
  await logAction(session.sub, "Alta de unidad", "Unit", unit.id, unit.code);

  revalidatePath("/edificios");
  revalidatePath(`/edificios/${parsed.data.buildingId}`);
  revalidatePath("/dashboard");
  redirect(`/unidades/${unit.id}`);
}

export async function updateUnit(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);
  const unitId = String(formData.get("unitId") ?? "");
  if (!unitId) return { error: "No se identificó la unidad." };

  const parsed = unitSchema.safeParse(readUnitForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const duplicate = await prisma.unit.findFirst({
    where: {
      buildingId: parsed.data.buildingId,
      code: parsed.data.code,
      NOT: { id: unitId },
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error: `Ya existe otra unidad con el identificador "${parsed.data.code}" en esta propiedad.`,
    };
  }

  await prisma.unit.update({ where: { id: unitId }, data: parsed.data });
  await logAction(session.sub, "Edición de unidad", "Unit", unitId, parsed.data.code);

  revalidatePath(`/unidades/${unitId}`);
  revalidatePath(`/edificios/${parsed.data.buildingId}`);
  revalidatePath("/edificios");
  return { ok: true };
}

// ------------------------------------------------------------------ servicios

const serviceAccountSchema = z.object({
  includedInRent: z.coerce.boolean(),
  providerName: z.string().trim().optional(),
  contractNumber: z.string().trim().optional(),
});

/** Guarda la configuración de un servicio (incluido Sí/No, proveedor, contrato). */
export async function updateServiceAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);
  const accountId = String(formData.get("accountId") ?? "");
  if (!accountId) return { error: "No se identificó el servicio." };

  const parsed = serviceAccountSchema.safeParse({
    includedInRent: formData.get("includedInRent") === "on",
    providerName: formData.get("providerName") || undefined,
    contractNumber: formData.get("contractNumber") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const account = await prisma.serviceAccount.update({
    where: { id: accountId },
    data: {
      includedInRent: parsed.data.includedInRent,
      providerName: parsed.data.providerName ?? null,
      contractNumber: parsed.data.contractNumber ?? null,
    },
    select: { unitId: true, buildingId: true, type: true },
  });

  await logAction(session.sub, "Edición de servicio", "ServiceAccount", accountId, account.type);

  if (account.unitId) revalidatePath(`/unidades/${account.unitId}`);
  if (account.buildingId) revalidatePath(`/edificios/${account.buildingId}`);
  revalidatePath("/servicios");
  return { ok: true };
}

/** Da de alta un servicio para una unidad (p. ej. contratar internet). */
export async function createUnitServiceAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);

  const schema = z.object({
    unitId: z.string().min(1),
    type: z.enum(["WATER", "ELECTRICITY", "INTERNET", "MAINTENANCE", "GAS", "OTHER"]),
    providerName: z.string().trim().optional(),
    contractNumber: z.string().trim().optional(),
    includedInRent: z.coerce.boolean(),
  });

  const parsed = schema.safeParse({
    unitId: formData.get("unitId"),
    type: formData.get("type"),
    providerName: formData.get("providerName") || undefined,
    contractNumber: formData.get("contractNumber") || undefined,
    includedInRent: formData.get("includedInRent") === "on",
  });

  if (!parsed.success) {
    return { error: "Elige el tipo de servicio." };
  }

  const exists = await prisma.serviceAccount.findFirst({
    where: { unitId: parsed.data.unitId, type: parsed.data.type },
    select: { id: true },
  });
  if (exists) {
    return { error: "Esta unidad ya tiene registrado ese servicio." };
  }

  await prisma.serviceAccount.create({
    data: {
      scope: "UNIT",
      unitId: parsed.data.unitId,
      type: parsed.data.type,
      providerName: parsed.data.providerName ?? null,
      contractNumber: parsed.data.contractNumber ?? null,
      includedInRent: parsed.data.includedInRent,
    },
  });

  await logAction(session.sub, "Alta de servicio", "ServiceAccount", parsed.data.unitId, parsed.data.type);

  revalidatePath(`/unidades/${parsed.data.unitId}`);
  revalidatePath("/servicios");
  return { ok: true };
}
