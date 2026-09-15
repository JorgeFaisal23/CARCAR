import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { PortalNav } from "@/components/layout/portal-nav";
import { AppSignature } from "@/components/shared/app-signature";
import { requireUser } from "@/lib/auth/session";
import { getOrganization } from "@/lib/org";

/**
 * El portal usa un layout propio, sin el menú lateral del panel: el inquilino
 * solo tiene tres pantallas y conviene que se vea simple.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser(["TENANT"]);
  const org = await getOrganization(session.organizationId);

  return (
    <div className="bg-muted/30 flex min-h-svh flex-col">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-4">
          <Link href="/portal" className="flex items-center gap-2.5">
            <BrandLogo
              brandName={org.brandName}
              logoUrl={org.logoUrl}
              size="sm"
            />
            <span className="font-semibold">{org.brandName}</span>
          </Link>
          <div className="ml-auto">
            <PortalNav userName={session.name} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 sm:p-6">
        {children}
      </main>

      <footer className="text-muted-foreground mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs">
        {org.contactEmail || org.contactPhone ? (
          <p className="text-pretty">
            ¿Dudas? Escríbenos a{" "}
            {org.contactEmail ? (
              <a href={`mailto:${org.contactEmail}`} className="underline">
                {org.contactEmail}
              </a>
            ) : null}
            {org.contactEmail && org.contactPhone ? " o llama al " : ""}
            {org.contactPhone ? (
              <a href={`tel:${org.contactPhone}`} className="underline">
                {org.contactPhone}
              </a>
            ) : null}
            .
          </p>
        ) : null}

        {/* El inquilino trata con su arrendador, no con nosotros: el producto
            solo se nombra aquí, al final y en pequeño. */}
        <AppSignature className="ml-auto" />
      </footer>
    </div>
  );
}
