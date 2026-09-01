import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Botón que navega. Base UI compone con `render` en lugar de `asChild`;
 * envolverlo aquí evita repetir ese detalle en cada página.
 */
export function ButtonLink({
  href,
  children,
  ...props
}: { href: string } & Omit<React.ComponentProps<typeof Button>, "render">) {
  return (
    <Button render={<Link href={href} />} {...props}>
      {children}
    </Button>
  );
}
