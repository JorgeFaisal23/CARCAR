"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CopyPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/form-field";
import { periodLabel } from "@/lib/format";
import { copyPreviousMonth } from "@/server/actions/services";

/**
 * Selector de mes y atajo para copiar los montos del mes anterior. Ese atajo
 * es lo que vuelve llevadera la captura manual mes con mes.
 */
export function PeriodToolbar({
  period,
  periods,
  previousPeriod,
  missingCount,
  editable,
}: {
  period: string;
  periods: string[];
  previousPeriod: string;
  missingCount: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const copy = () => {
    startTransition(async () => {
      const result = await copyPreviousMonth(period);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.copied === 0) {
        toast.info("No hay montos por copiar: todo está capturado.");
        return;
      }
      toast.success(
        `Se copiaron ${result.copied} montos de ${periodLabel(previousPeriod).toLowerCase()}.`,
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        aria-label="Mes"
        value={period}
        onChange={(e) => router.push(`/servicios?mes=${e.target.value}`)}
        className="w-44"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {periodLabel(p)}
          </option>
        ))}
      </NativeSelect>

      {editable && missingCount > 0 ? (
        <Button variant="outline" onClick={copy} disabled={pending}>
          <CopyPlus className="size-4" aria-hidden />
          {pending
            ? "Copiando…"
            : `Copiar montos de ${periodLabel(previousPeriod).split(" ")[0].toLowerCase()}`}
        </Button>
      ) : null}
    </div>
  );
}
