import type { Metadata } from "next";
import { Fragment } from "react";
import { Check, Info, Minus, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP } from "@/lib/app";
import { requireOrgUser } from "@/lib/auth/session";
import { requireCurrentOrg } from "@/lib/org";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Planes" };

type Feature = { name: string; free: boolean | string; premium: boolean | string };

const FEATURES: { group: string; items: Feature[] }[] = [
  {
    group: "Propiedades y contratos",
    items: [
      { name: "Propiedades", free: "Hasta 2", premium: "Ilimitadas" },
      { name: "Unidades", free: "Hasta 20", premium: "Ilimitadas" },
      { name: "Perfiles de inquilinos", free: true, premium: true },
      { name: "Contratos con plantilla y firma digital", free: false, premium: true },
    ],
  },
  {
    group: "Operación diaria",
    items: [
      { name: "Calendario global", free: true, premium: true },
      { name: "Control de servicios y totales", free: true, premium: true },
      { name: "Cobros y estado de pagos", free: true, premium: true },
      { name: "Recordatorios automáticos por correo y WhatsApp", free: false, premium: true },
      { name: "Recibos automáticos en PDF", free: false, premium: true },
    ],
  },
  {
    group: "Análisis",
    items: [
      { name: "Resumen del mes", free: true, premium: true },
      { name: "Reportes de rentabilidad y ocupación", free: false, premium: true },
      { name: "Exportar a Excel y PDF", free: false, premium: true },
    ],
  },
  {
    group: "Equipo y marca",
    items: [
      { name: "Portal para inquilinos", free: true, premium: true },
      { name: "Personalización de marca", free: true, premium: true },
      { name: "Usuarios administrativos", free: "1", premium: "Ilimitados" },
      { name: "Permisos por propiedad", free: false, premium: true },
      { name: "Bitácora de auditoría", free: false, premium: true },
    ],
  },
];

export default async function PremiumPage() {
  const { session } = await requireOrgUser(["OWNER", "ADMIN"]);
  const org = await requireCurrentOrg();
  const isPremium = org.plan === "PREMIUM";

  return (
    <>
      <PageHeader
        title={`Planes de ${APP.name}`}
        description={`El plan es de tu cuenta en ${APP.name} y cubre todas tus propiedades. Empieza gratis y activa Premium cuando quieras automatizar el seguimiento y medir la rentabilidad.`}
      />

      {session.role === "OWNER" ? (
        <div className="flex gap-3 rounded-lg border border-dashed p-4 text-sm">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground text-pretty">
            El plan lo administra {APP.name}. Para cambiarlo, contacta al
            administrador de la plataforma.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanCard
          name="Gratuito"
          price="$0"
          cadence="para siempre"
          description="Lo necesario para llevar el control de un edificio pequeño."
          active={!isPremium}
          highlights={[
            "Hasta 2 propiedades y 20 unidades",
            "Calendario global y control de servicios",
            "Portal para tus inquilinos",
            "Personalización de marca",
          ]}
        />
        <PlanCard
          name="Premium"
          price="$799"
          cadence="al mes por arrendadora"
          description="Para quien administra varios inmuebles y quiere dejar de perseguir pagos."
          active={isPremium}
          featured
          highlights={[
            "Propiedades y unidades ilimitadas",
            "Recordatorios automáticos de pago",
            "Reportes de rentabilidad y exportación",
            "Contratos con firma digital",
            "Equipo con permisos y bitácora",
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa completa</CardTitle>
          <CardDescription>
            Todo lo que incluye cada plan, sin letras chiquitas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-lg">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Función</TableHead>
                <TableHead scope="col" className="w-28 text-center">
                  Gratuito
                </TableHead>
                <TableHead scope="col" className="text-primary w-28 text-center">
                  Premium
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURES.map((group) => (
                <Fragment key={group.group}>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead
                      scope="colgroup"
                      colSpan={3}
                      className="h-auto pt-5 pb-1 text-xs font-semibold tracking-wide uppercase"
                    >
                      {group.group}
                    </TableHead>
                  </TableRow>
                  {group.items.map((feature) => (
                    <TableRow key={feature.name}>
                      <TableCell className="whitespace-normal text-pretty">
                        {feature.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <FeatureValue value={feature.free} />
                      </TableCell>
                      <TableCell className="bg-brand-soft text-center">
                        <FeatureValue value={feature.premium} highlighted />
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function FeatureValue({
  value,
  highlighted,
}: {
  value: boolean | string;
  highlighted?: boolean;
}) {
  if (typeof value === "string") {
    return (
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          highlighted && "text-primary",
        )}
      >
        {value}
      </span>
    );
  }
  return value ? (
    <Check
      className={cn("mx-auto size-4", highlighted ? "text-primary" : "text-success")}
      aria-label="Incluido"
    />
  ) : (
    <Minus className="text-muted-foreground/50 mx-auto size-4" aria-label="No incluido" />
  );
}

function PlanCard({
  name,
  price,
  cadence,
  description,
  highlights,
  active,
  featured,
}: {
  name: string;
  price: string;
  cadence: string;
  description: string;
  highlights: string[];
  active: boolean;
  featured?: boolean;
}) {
  return (
    <Card className={cn(featured && "border-primary/40 bg-primary/5")}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            {featured ? (
              <Sparkles className="text-primary size-4" aria-hidden />
            ) : null}
            {name}
          </CardTitle>
          {active ? <StatusBadge tone="success">Tu plan actual</StatusBadge> : null}
        </div>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums">{price}</span>
          <span className="text-muted-foreground text-sm">{cadence}</span>
        </p>
        <ul className="space-y-2">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  featured ? "text-primary" : "text-success",
                )}
                aria-hidden
              />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
