import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BRAND } from "@/lib/brand";

/**
 * La organización es una fila única: guarda el plan (que controla el muro de
 * pago) y la identidad de marca. `cache` evita repetir la consulta cuando
 * varios componentes del mismo render la necesitan.
 */
export const getOrganization = cache(async () => {
  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  // Antes de sembrar la base todavía no existe la fila; devolvemos los valores
  // por defecto para que la app renderice en vez de reventar.
  return (
    org ?? {
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
    }
  );
});

export async function isPremium() {
  const org = await getOrganization();
  return org.plan === "PREMIUM";
}
