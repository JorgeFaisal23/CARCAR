import { cn } from "@/lib/utils";
import { TONE_CLASSES, TONE_DOT, type Tone } from "@/lib/labels";

/**
 * Etiqueta de estado del semáforo de la aplicación. Siempre lleva texto además
 * del punto de color: el color por sí solo no comunica el estado a quien no
 * distingue tonos.
 */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />
      {children}
    </span>
  );
}
