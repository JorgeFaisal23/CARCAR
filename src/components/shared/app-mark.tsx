import { APP, APP_INITIAL } from "@/lib/app";
import { cn } from "@/lib/utils";

/**
 * Distintivo del producto: la inicial de APP.name sobre una pastilla.
 *
 * Es genérico a propósito: el nombre del producto es configurable (ver
 * src/lib/app.ts), así que el distintivo se deriva de él en vez de dibujar un
 * logotipo fijo.
 *
 * No usa los tokens de marca: el color sale de APP.color o del color de texto
 * heredado, nunca de --primary. Si tomara el primario, el logo del producto
 * cambiaría con la marca de la arrendadora y dejaría de identificar al software.
 */
export function AppMark({
  variant = "solid",
  className,
}: {
  /** `solid`: pastilla con el color del producto. `plain`: contorno en currentColor. */
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
      {solid ? (
        <rect width="32" height="32" rx="8" fill={APP.color} />
      ) : (
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      )}
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill={solid ? "#ffffff" : "currentColor"}
      >
        {APP_INITIAL}
      </text>
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
