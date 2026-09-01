import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/** Tarjeta de indicador para el dashboard y los totales de servicios. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "danger";
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          {Icon ? (
            <span
              className={cn(
                "rounded-md p-1.5",
                tone === "brand" && "bg-primary/10 text-primary",
                tone === "danger" &&
                  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
                tone === "default" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
            tone === "danger" && "text-rose-600 dark:text-rose-400",
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-xs text-pretty">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
