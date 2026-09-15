"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserAction } from "@/lib/auth/session";
import { logAction } from "@/server/actions/audit";
import { saveFile } from "@/lib/storage";
import type { ActionResult } from "@/server/actions/properties";

/** Límite del logo. Se guarda como data URL en la base para no depender de un
 *  servicio de almacenamiento durante la demo. */
const MAX_LOGO_BYTES = 400 * 1024;

const brandSchema = z.object({
  brandName: z.string().trim().min(1, "Escribe el nombre de tu marca.").max(60),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Elige un color válido."),
  radius: z.enum(["SHARP", "SOFT", "ROUND"]),
  fontFamily: z.enum(["Inter", "Poppins", "Source Sans 3"]),
  contactEmail: z.string().trim().email("Correo no válido.").optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional(),
});

export async function updateBrand(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER"]);

  const parsed = brandSchema.safeParse({
    brandName: formData.get("brandName"),
    primaryColor: formData.get("primaryColor"),
    radius: formData.get("radius"),
    fontFamily: formData.get("fontFamily"),
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const org = session.organizationId
    ? await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { id: true },
      })
    : await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
  if (!org) return { error: "No hay una organización configurada." };

  // El logo llega como data URL desde el navegador; se valida el tamaño porque
  // va directo a una columna de texto.
  const logoField = formData.get("logoUrl");
  let logoUrl: string | null | undefined;

  if (typeof logoField === "string") {
    if (logoField === "") {
      logoUrl = null; // el usuario quitó el logo
    } else if (logoField.startsWith("data:image/")) {
      if (logoField.length > MAX_LOGO_BYTES) {
        return { error: "El logo es muy pesado. Usa una imagen de menos de 300 KB." };
      }
      try {
        logoUrl = await saveFile(logoField, "logos", `brand_${org.id}`);
      } catch {
        return { error: "No se pudo guardar el archivo del logo." };
      }
    }
    // Si no es data URL ni cadena vacía, se deja el logo actual sin tocar.
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      brandName: parsed.data.brandName,
      primaryColor: parsed.data.primaryColor,
      radius: parsed.data.radius,
      fontFamily: parsed.data.fontFamily,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
    },
  });

  await logAction(
    session.sub,
    "Actualización de marca",
    "Organization",
    org.id,
    parsed.data.brandName,
    org.id,
  );

  // La marca se inyecta en el layout raíz, así que hay que revalidar todo.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Cambia el plan. En la demo permite mostrar el antes y después de Premium. */
export async function setPlan(plan: "FREE" | "PREMIUM"): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER"]);

  const org = session.organizationId
    ? await prisma.organization.findUnique({
        where: { id: session.organizationId },
        select: { id: true },
      })
    : await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
  if (!org) return { error: "No hay una organización configurada." };

  await prisma.organization.update({ where: { id: org.id }, data: { plan } });
  await logAction(session.sub, "Cambio de plan", "Organization", org.id, plan, org.id);

  revalidatePath("/", "layout");
  return { ok: true };
}
