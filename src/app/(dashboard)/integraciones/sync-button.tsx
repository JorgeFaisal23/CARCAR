"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  syncAirbnbConnection,
  syncAllConnections,
} from "@/server/actions/integrations";

export function SyncButton({
  connectionId,
  listingName,
  variant = "outline",
  size = "sm",
}: {
  connectionId?: string;
  listingName?: string;
  variant?: "default" | "outline";
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = connectionId
        ? await syncAirbnbConnection(connectionId)
        : await syncAllConnections();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        connectionId
          ? `${listingName ?? "Anuncio"} sincronizado.`
          : `Se sincronizaron ${"count" in result ? result.count : 0} anuncios.`,
        { description: "Demostración: no se consultó Airbnb realmente." },
      );
      router.refresh();
    });

  return (
    <Button variant={variant} size={size} onClick={run} disabled={pending}>
      <RefreshCw
        className={cn("size-4", pending && "animate-spin")}
        aria-hidden
      />
      {pending ? "Sincronizando…" : "Sincronizar ahora"}
    </Button>
  );
}
