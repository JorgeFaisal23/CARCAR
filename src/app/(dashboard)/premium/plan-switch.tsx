"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setPlan } from "@/server/actions/brand";

/**
 * Control exclusivo de la demostración: permite encender y apagar Premium para
 * enseñar el antes y el después sin pasar por un cobro. En producción esto lo
 * decidiría la pasarela de pago.
 */
export function PlanSwitch({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (plan: "FREE" | "PREMIUM") =>
    startTransition(async () => {
      const result = await setPlan(plan);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        plan === "PREMIUM"
          ? "Premium activado. Las secciones bloqueadas ya están disponibles."
          : "Volviste al plan gratuito.",
      );
      router.refresh();
    });

  if (isPremium) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => change("FREE")}
      >
        <Undo2 className="size-4" aria-hidden />
        {pending ? "Cambiando…" : "Volver al plan gratuito"}
      </Button>
    );
  }

  return (
    <Button disabled={pending} onClick={() => change("PREMIUM")}>
      <Sparkles className="size-4" aria-hidden />
      {pending ? "Activando…" : "Activar Premium en la demo"}
    </Button>
  );
}
