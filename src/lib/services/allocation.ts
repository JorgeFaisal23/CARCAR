import type { SplitMode } from "@/generated/prisma/enums";

/**
 * Reparto de un recibo de edificio entre sus unidades.
 *
 * El total repartido siempre debe cuadrar exactamente con el monto del recibo:
 * los centavos que sobran por redondeo se asignan a las primeras unidades, en
 * vez de perderse.
 */

export type AllocationTarget = {
  id: string;
  label: string;
  /** Peso para el modo BY_SIZE. Si falta, esa unidad cuenta como promedio. */
  sizeM2?: number | null;
};

export type Allocation = {
  id: string;
  label: string;
  amount: number;
};

export function allocate(
  total: number,
  targets: AllocationTarget[],
  mode: SplitMode,
): Allocation[] {
  if (mode === "NONE" || targets.length === 0) return [];

  const weights = targets.map((target) => {
    if (mode === "EQUAL") return 1;
    const size = target.sizeM2;
    return size && size > 0 ? size : 0;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Sin superficies capturadas no se puede repartir por metros: caemos a partes
  // iguales en vez de devolver ceros silenciosamente.
  if (totalWeight === 0) {
    return allocate(total, targets, "EQUAL");
  }

  const cents = Math.round(total * 100);
  const raw = weights.map((w) => (cents * w) / totalWeight);
  const floored = raw.map((value) => Math.floor(value));
  let remainder = cents - floored.reduce((sum, v) => sum + v, 0);

  // Los centavos restantes van a quienes tienen mayor parte fraccionaria.
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (const { index } of order) {
    if (remainder <= 0) break;
    result[index] += 1;
    remainder -= 1;
  }

  return targets.map((target, index) => ({
    id: target.id,
    label: target.label,
    amount: result[index] / 100,
  }));
}
