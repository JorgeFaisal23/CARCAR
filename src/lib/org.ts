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
 * La organización es una fila única: guarda el plan (que controla el muro de
 * pago) y la identidad de marca. `cache` evita repetir la consulta cuando
 * varios componentes del mismo render la necesitan.
 */
export const getOrganization = cache(async () => {
  try {
    const org = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return org ?? ORGANIZACION_POR_DEFECTO;
  } catch (error) {
    // El layout raíz lee la marca de aquí, así que la 404 —que Next
    // prerenderiza durante el build— también depende de esta consulta. Si la
    // base no responde (Neon dormida, build sin acceso a la red) servimos la
    // marca por defecto: preferimos una página sin personalizar a un build
    // roto. Las páginas con datos reales siguen fallando por su cuenta, que
    // es lo correcto: ahí no hay nada sensato que mostrar.
    console.error("No se pudo leer la organización:", error);
    return ORGANIZACION_POR_DEFECTO;
  }
});

export async function isPremium() {
  const org = await getOrganization();
  return org.plan === "PREMIUM";
}
