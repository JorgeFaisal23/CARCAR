import type { Metadata } from "next";
import { brandStyleSheet } from "@/lib/brand";
import { getOrgBySlug } from "@/lib/org";

/**
 * Páginas públicas de una arrendadora (/a/{slug}/…): su acceso con marca.
 *
 * El layout raíz pinta la marca del producto porque aquí aún no hay sesión;
 * este layout agrega los tokens de la arrendadora. Van después en el
 * documento y con los mismos selectores, así que ganan.
 */

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return {};
  return {
    title: { default: org.brandName, template: `%s · ${org.brandName}` },
    appleWebApp: { title: org.brandName },
  };
}

export default async function OrgPublicLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  // Sin arrendadora (slug inexistente o cambiado) cada página decide qué
  // hacer; el acceso, por ejemplo, manda al genérico.
  if (!org) return children;

  const brandCss = brandStyleSheet({
    primaryColor: org.primaryColor,
    radius: org.radius,
    fontFamily: org.fontFamily,
  });

  return (
    <>
      <style id="org-brand-tokens" dangerouslySetInnerHTML={{ __html: brandCss }} />
      {children}
    </>
  );
}
