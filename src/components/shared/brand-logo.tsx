import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Identidad visible. Si el arrendador subió un logo se usa; si no, la inicial
 * de la marca sobre el color primario. Nunca se cae a un espacio en blanco.
 */
export function BrandLogo({
  brandName,
  logoUrl,
  size = "md",
  className,
}: {
  brandName: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = {
    sm: "size-7 text-xs",
    md: "size-9 text-sm",
    lg: "size-12 text-base",
  }[size];

  if (logoUrl) {
    return (
      // El logo es un data URL subido por el usuario; next/image no aporta aquí.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={brandName}
        className={cn("shrink-0 rounded-md object-contain", box, className)}
      />
    );
  }

  const letter = brandName.trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-md font-semibold",
        box,
        className,
      )}
      aria-hidden
    >
      {letter || <Building2 className="size-4" />}
    </span>
  );
}
