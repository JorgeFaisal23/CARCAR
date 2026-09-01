import type { Metadata } from "next";
import { Download, FileSignature, FileText, PenLine, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PremiumGate } from "@/components/premium/premium-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { toNumber, longDate, money } from "@/lib/format";

export const metadata: Metadata = { title: "Contratos" };

const TEMPLATES = [
  {
    name: "Arrendamiento de cuarto amueblado",
    description: "12 meses, servicios incluidos, depósito de un mes.",
    uses: 7,
  },
  {
    name: "Arrendamiento de departamento",
    description: "12 o 24 meses, luz e internet por cuenta del inquilino.",
    uses: 2,
  },
  {
    name: "Convenio de renta temporal",
    description: "Estancias de más de un mes sin contrato anual.",
    uses: 0,
  },
];

export default async function ContractsPage() {
  await requireUser(["OWNER", "ADMIN"]);

  const leases = await prisma.lease.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    take: 8,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      rentAmount: true,
      tenant: { select: { name: true } },
      unit: {
        select: { code: true, building: { select: { name: true } } },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Genera el contrato desde una plantilla y recoge la firma del inquilino sin imprimir nada."
        action={
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            Nueva plantilla
          </Button>
        }
      />

      <PremiumGate
        title="Contratos y firma digital"
        description="Plantillas con tus cláusulas, generación en PDF con los datos ya llenos y firma electrónica del inquilino desde su celular."
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas</CardTitle>
              <CardDescription>
                Tus cláusulas, con los datos de la unidad y del inquilino
                rellenados automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 md:grid-cols-3">
                {TEMPLATES.map((template) => (
                  <li key={template.name} className="rounded-lg border p-4">
                    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                      <FileText className="size-4" aria-hidden />
                    </span>
                    <p className="mt-3 font-medium text-pretty">{template.name}</p>
                    <p className="text-muted-foreground mt-1 text-xs text-pretty">
                      {template.description}
                    </p>
                    <p className="text-muted-foreground mt-3 text-xs">
                      {template.uses} contratos generados
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contratos vigentes</CardTitle>
              <CardDescription>
                Estado de la firma de cada contrato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {leases.map((lease, index) => (
                  <li
                    key={lease.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{lease.tenant.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {lease.unit.building.name} · Unidad {lease.unit.code} ·{" "}
                        {money(toNumber(lease.rentAmount))} · hasta{" "}
                        {longDate(lease.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* En Premium este estado vendría del proveedor de firma. */}
                      <StatusBadge tone={index % 4 === 1 ? "warning" : "success"}>
                        {index % 4 === 1 ? (
                          <>
                            <PenLine className="size-3" aria-hidden />
                            Pendiente de firma
                          </>
                        ) : (
                          <>
                            <FileSignature className="size-3" aria-hidden />
                            Firmado
                          </>
                        )}
                      </StatusBadge>
                      <Button variant="ghost" size="sm" disabled>
                        <Download className="size-4" aria-hidden />
                        PDF
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </PremiumGate>
    </>
  );
}
