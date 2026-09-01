"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/form-field";
import { periodLabel } from "@/lib/format";
import { generateMonthlyCharges } from "@/server/actions/payments";

/** Selector de mes y generación de los cargos del periodo. */
export function PaymentsToolbar({
  period,
  periods,
  missingCharges,
  editable,
}: {
  period: string;
  periods: string[];
  missingCharges: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        aria-label="Mes"
        value={period}
        onChange={(e) => router.push(`/pagos?mes=${e.target.value}`)}
        className="w-44"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {periodLabel(p)}
          </option>
        ))}
      </NativeSelect>

      {editable && missingCharges > 0 ? (
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await generateMonthlyCharges(period);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              toast.success(
                result.created === 0
                  ? "No había cargos por generar."
                  : `Se generaron ${result.created} cargos.`,
              );
              router.refresh();
            })
          }
        >
          <FilePlus2 className="size-4" aria-hidden />
          {pending ? "Generando…" : `Generar ${missingCharges} cargos`}
        </Button>
      ) : null}
    </div>
  );
}
