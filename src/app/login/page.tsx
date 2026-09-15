import type { Metadata } from "next";
import { Building2, CalendarRange, Receipt } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AppSignature } from "@/components/shared/app-signature";
import { AppWordmark } from "@/components/shared/app-mark";
import { APP, APP_VERSION_LABEL } from "@/lib/app";
import { getOrganization } from "@/lib/org";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const HIGHLIGHTS = [
  {
    icon: Building2,
    title: "Propiedades y contratos",
    text: "Cada cuarto con su renta, su inquilino y la vigencia a la vista.",
  },
  {
    icon: CalendarRange,
    title: "Un solo calendario",
    text: "Arrendamientos largos y reservas de Airbnb en la misma pantalla.",
  },
  {
    icon: Receipt,
    title: "Servicios bajo control",
    text: "Agua, luz e internet por propiedad, con totales automáticos.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirigir?: string }>;
}) {
  const { redirigir } = await searchParams;
  const org = await getOrganization();

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Columna de marca: se oculta en celular para no empujar el formulario. */}
      <section className="bg-primary text-primary-foreground hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-3">
          <BrandLogo
            brandName={org.brandName}
            logoUrl={org.logoUrl}
            size="md"
            className="bg-primary-foreground/15"
          />
          <span className="text-lg font-semibold">{org.brandName}</span>
          {/* El producto se presenta aparte de la marca, separado por una
              línea, para que no se lean como un mismo nombre compuesto. */}
          <span className="border-primary-foreground/25 text-primary-foreground/70 ml-auto border-l pl-3">
            <AppWordmark variant="plain" className="text-sm" />
          </span>
        </div>

        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-balance">
              La administración de tus rentas, en un solo lugar.
            </h2>
            <p className="text-primary-foreground/80 text-pretty">
              Contratos, servicios, cobros y reservas. Tú y tu equipo trabajan
              sobre la misma información; tus inquilinos consultan la suya.
            </p>
          </div>

          <ul className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="bg-primary-foreground/15 flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-primary-foreground/75 text-sm text-pretty">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <p className="text-primary-foreground/70 text-xs font-medium">
            {APP_VERSION_LABEL}
          </p>
          <p className="text-primary-foreground/60 text-xs">
            {APP.tagline}
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandLogo brandName={org.brandName} logoUrl={org.logoUrl} />
              <span className="text-lg font-semibold">{org.brandName}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Entra a tu cuenta
            </h1>
            <p className="text-muted-foreground text-sm text-pretty">
              Usa el correo con el que te dieron de alta.
            </p>
          </div>

          <LoginForm
            redirigir={redirigir}
            showDemoAccounts={false}
          />

          {/* En celular la columna de marca no se ve; aquí queda la única
              mención al producto. */}
          <AppSignature className="flex justify-center lg:hidden" />
        </div>
      </section>
    </main>
  );
}
