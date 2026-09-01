"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/form-field";
import { periodKey, periodLabel, shiftPeriod } from "@/lib/format";

/** Navegación de mes y filtro por propiedad. */
export function CalendarToolbar({
  period,
  buildings,
  buildingId,
}: {
  period: string;
  buildings: { id: string; name: string }[];
  buildingId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const go = (next: Partial<{ mes: string; edificio: string }>) => {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    router.push(`/calendario?${query.toString()}`);
  };

  const currentPeriod = periodKey(new Date());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Mes anterior"
          onClick={() => go({ mes: shiftPeriod(period, -1) })}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="min-w-36 text-center text-sm font-medium">
          {periodLabel(period)}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Mes siguiente"
          onClick={() => go({ mes: shiftPeriod(period, 1) })}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {period !== currentPeriod ? (
        <Button variant="ghost" onClick={() => go({ mes: currentPeriod })}>
          Hoy
        </Button>
      ) : null}

      <NativeSelect
        aria-label="Filtrar por propiedad"
        value={buildingId ?? ""}
        onChange={(e) => go({ edificio: e.target.value })}
        className="w-48"
      >
        <option value="">Todas las propiedades</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
