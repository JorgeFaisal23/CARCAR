"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserAction } from "@/lib/auth/session";
import { shiftPeriod } from "@/lib/format";
import { logAction } from "@/server/actions/audit";
import type { ActionResult } from "@/server/actions/properties";

const PERIOD = /^\d{4}-\d{2}$/;

const amountSchema = z.object({
  accountId: z.string().min(1),
  period: z.string().regex(PERIOD, "Periodo no válido."),
  amount: z.number().min(0, "El monto no puede ser negativo.").max(9_999_999),
});

/**
 * Captura o actualiza el monto de un servicio para un periodo.
 * Un monto vacío borra el cargo: es la forma natural de deshacer una captura.
 */
export async function setServiceAmount(input: {
  accountId: string;
  period: string;
  amount: number | null;
}): Promise<ActionResult> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);

  if (input.amount === null) {
    await prisma.serviceCharge.deleteMany({
      where: { serviceAccountId: input.accountId, period: input.period },
    });
    revalidatePath("/servicios");
    return { ok: true };
  }

  const parsed = amountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Monto no válido." };
  }

  const { accountId, period, amount } = parsed.data;

  await prisma.serviceCharge.upsert({
    where: { serviceAccountId_period: { serviceAccountId: accountId, period } },
    create: { serviceAccountId: accountId, period, amount },
    update: { amount },
  });

  await logAction(session.sub, "Captura de servicio", "ServiceCharge", accountId, `${period}: ${amount}`);

  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Copia al periodo indicado los montos del mes anterior que aún no se han
 * capturado. No pisa lo ya capturado: el trabajo manual siempre gana.
 */
export async function copyPreviousMonth(period: string): Promise<
  ActionResult & { copied?: number }
> {
  const session = await requireUserAction(["OWNER", "ADMIN"]);

  if (!PERIOD.test(period)) return { error: "Periodo no válido." };

  const previous = shiftPeriod(period, -1);

  const [previousCharges, existing] = await Promise.all([
    prisma.serviceCharge.findMany({
      where: { period: previous },
      select: { serviceAccountId: true, amount: true },
    }),
    prisma.serviceCharge.findMany({
      where: { period },
      select: { serviceAccountId: true },
    }),
  ]);

  const alreadyCaptured = new Set(existing.map((c) => c.serviceAccountId));
  const pending = previousCharges.filter(
    (c) => !alreadyCaptured.has(c.serviceAccountId),
  );

  if (pending.length === 0) {
    return { ok: true, copied: 0 };
  }

  await prisma.serviceCharge.createMany({
    data: pending.map((charge) => ({
      serviceAccountId: charge.serviceAccountId,
      period,
      amount: charge.amount,
    })),
  });

  await logAction(
    session.sub,
    "Copia de montos del mes anterior",
    "ServiceCharge",
    undefined,
    `${previous} → ${period}: ${pending.length} montos`,
  );

  revalidatePath("/servicios");
  revalidatePath("/dashboard");
  return { ok: true, copied: pending.length };
}
