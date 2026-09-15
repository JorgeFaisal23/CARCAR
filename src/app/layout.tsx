import type { Metadata } from "next";
import { Inter, Poppins, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP } from "@/lib/app";
import { brandStyleSheet } from "@/lib/brand";
import { getSession } from "@/lib/auth/session";
import { getOrganization } from "@/lib/org";
import "./globals.css";

// Las tres fuentes se cargan siempre; el panel de marca solo decide a cuál
// apunta --font-sans, así el cambio es instantáneo y sin recarga.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

/**
 * Dos identidades conviven en los metadatos: el título es la marca del
 * arrendador —es lo que el inquilino reconoce en la pestaña— y
 * `applicationName` es el SaaS (RentaCore), que es el software que sirve la página.
 */
export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  const org = await getOrganization(session?.organizationId);
  return {
    title: {
      default: org.brandName,
      template: `%s · ${org.brandName}`,
    },
    description: APP.description,
    applicationName: APP.name,
    generator: APP.name,
    appleWebApp: { title: org.brandName },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const org = await getOrganization(session?.organizationId);
  const brandCss = brandStyleSheet({
    primaryColor: org.primaryColor,
    radius: org.radius,
    fontFamily: org.fontFamily,
  });

  return (
    // Las variables de fuente van en <html>: los tokens que las consumen se
    // declaran en :root, y desde ahí no se ve una variable definida en <body>.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${sourceSans.variable}`}
    >
      <body className="antialiased">
        {/* Tokens de marca renderizados en servidor: llegan en el primer
            pintado, así que no hay parpadeo de color al cargar. */}
        <style
          id="brand-tokens"
          dangerouslySetInnerHTML={{ __html: brandCss }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
