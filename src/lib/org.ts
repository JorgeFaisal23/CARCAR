import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND } from "@/lib/brand";

/**
 * Valores de respaldo para cuando no hay fila que leer: antes de sembrar la
 * base, y también si la base no contesta.
 */
const ORGANIZACION_POR_DEFECTO = {
  id: "sin-organizacion",
  name: "Mi arrendadora",
  plan: "FREE" as const,
  brandName: "Rentas",
  logoUrl: null,
  primaryColor: DEFAULT_BRAND.primaryColor,
  radius: DEFAULT_BRAND.radius,
  fontFamily: DEFAULT_BRAND.fontFamily,
  loginBackgroundUrl: null,
  contactEmail: null,
  contactPhone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Resuelve la organización activa. Si se proporciona `orgId`, busca dicha organización;
 * de lo contrario o si no existe, toma la primera disponible o los valores por defecto.
 * `cache` evita repetir la consulta dentro del mismo ciclo de render de RSC.
 */
export const getOrganization = cache(async (orgId?: string | null) => {
  try {
    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
      if (org) return org;
    }

    const org = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return org ?? ORGANIZACION_POR_DEFECTO;
  } catch (error) {
    console.error("No se pudo leer la organización:", error);
    return ORGANIZACION_POR_DEFECTO;
  }
});

export async function isPremium(orgId?: string | null) {
  const org = await getOrganization(orgId);
  return org.plan === "PREMIUM";
}
