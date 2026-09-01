import type { Metadata } from "next";
import { Download, PiggyBank, Receipt, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PremiumGate } from "@/components/premium/premium-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth/session";
import { getOrganization } from "@/lib/org";
import { chartPalette } from "@/lib/brand";
import { getReportsData } from "@/lib/queries/reports";
import { money, moneyCompact } from "@/lib/format";
import {
  IncomeVsExpensesChart,
  ProfitByBuildingChart,
  ServiceBreakdownChart,
} from "./report-charts";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportsPage() {
  await requireUser(["OWNER", "ADMIN"]);
  const [data, org] = await Promise.all([getReportsData(), getOrganization()]);
  // Colores concretos derivados de la marca: Recharts no resuelve var() en los
  // atributos del SVG.
  const colors = chartPalette(org.primaryColor);

  const net = data.totals.income - data.totals.expenses;
  const margin =
    data.totals.income === 0
      ? 0
      : Math.round((net / data.totals.income) * 100);

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Rentabilidad, ocupación y gasto de tus propiedades a lo largo del tiempo."
        action={
          <Button variant="outline" disabled>
            <Download className="size-4" aria-hidden />
            Exportar
          </Button>
        }
      />

      <PremiumGate
        title="Reportes y analítica"
        description="Mide la rentabilidad real de cada propiedad, compara meses, detecta en qué se te va el dinero y exporta todo a Excel o PDF."
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Renta facturada (6 meses)"
              value={moneyCompact(data.totals.income)}
              hint={`${moneyCompact(data.totals.collected)} efectivamente cobrados`}
              icon={TrendingUp}
              tone="brand"
            />
            <StatCard
              label="Gasto en servicios"
              value={moneyCompact(data.totals.expenses)}
              hint="Agua, luz, internet y mantenimiento"
              icon={Receipt}
            />
            <StatCard
              label="Resultado neto"
              value={moneyCompact(net)}
              hint={`Margen del ${margin}%`}
              icon={PiggyBank}
            />
            <StatCard
              label="Ingreso por renta corta"
              value={moneyCompact(data.totals.shortTermIncome)}
              hint="Reservas confirmadas y completadas"
              icon={TrendingUp}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos contra gastos</CardTitle>
              <CardDescription>
                Renta facturada y gasto en servicios, mes a mes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeVsExpensesChart data={data.monthly} colors={colors} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resultado por propiedad</CardTitle>
                <CardDescription>
                  Cuánto deja cada inmueble después de servicios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfitByBuildingChart data={data.byBuilding} colors={colors} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En qué se va el gasto</CardTitle>
                <CardDescription>
                  Distribución por tipo de servicio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceBreakdownChart data={data.serviceBreakdown} colors={colors} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle por propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="-mx-6 overflow-x-auto px-6">
                <table className="w-full min-w-2xl text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th scope="col" className="py-2 font-medium">Propiedad</th>
                      <th scope="col" className="py-2 text-right font-medium">Ingresos</th>
                      <th scope="col" className="py-2 text-right font-medium">Gastos</th>
                      <th scope="col" className="py-2 text-right font-medium">Neto</th>
                      <th scope="col" className="py-2 text-right font-medium">Margen</th>
                      <th scope="col" className="w-40 py-2 pl-4 font-medium">Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byBuilding.map((building) => (
                      <tr key={building.id} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{building.name}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {money(building.income)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {money(building.expenses)}
                        </td>
                        <td className="py-2.5 text-right font-medium tabular-nums">
                          {money(building.net)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {building.margin}%
                        </td>
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center gap-2">
                            <Progress value={building.occupancy} className="flex-1" />
                            <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                              {building.occupancy}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PremiumGate>
    </>
  );
}
