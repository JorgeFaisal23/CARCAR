import { APP } from "@/lib/app";
import { cn } from "@/lib/utils";

/**
 * Distintivo de CARCAR: dos arcos concéntricos (la doble C del nombre).
 *
 * No usa los tokens de marca: el color sale de APP.color o del color de texto
 * heredado, nunca de --primary. Si tomara el primario, el logo del producto
 * cambiaría con la marca del arrendador y dejaría de identificar al software.
 */
export function AppMark({
  variant = "solid",
  className,
}: {
  /** `solid`: pastilla con el color del producto. `plain`: arcos en currentColor. */
  variant?: "solid" | "plain";
  className?: string;
}) {
  const solid = variant === "solid";

  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={APP.name}
      className={cn("size-6 shrink-0", className)}
    >
      {solid ? <rect width="32" height="32" rx="8" fill={APP.color} /> : null}
      <g
        fill="none"
        stroke={solid ? "#ffffff" : "currentColor"}
        strokeLinecap="round"
      >
        <path d="M21.16 8.63A9 9 0 1 0 21.16 23.37" strokeWidth="3" />
        <path d="M18.29 12.72A4 4 0 1 0 18.29 19.28" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

/** Distintivo + nombre del producto. Para encabezados y pantallas de acceso. */
export function AppWordmark({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "plain";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <AppMark variant={variant} className="size-5" />
      <span className="font-semibold tracking-tight">{APP.name}</span>
    </span>
  );
}
