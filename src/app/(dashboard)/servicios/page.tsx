import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/permissions";
import { getServicesBoard } from "@/lib/queries/services";
import { money, moneyCompact, periodKey, periodLabel, recentPeriods } from "@/lib/format";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { AmountInput } from "./amount-input";
import { PeriodToolbar } from "./period-toolbar";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await requireUser(["OWNER", "ADMIN"]);
  const { mes } = await searchParams;

  const periods = recentPeriods(12);
  const period = mes && periods.includes(mes) ? mes : periodKey(new Date());

  const board = await getServicesBoard(period, session.organizationId);
  const editable = canEdit(session.role);

  const difference = board.grandTotal - board.previousTotal;
  const hasPrevious = board.previousTotal > 0;
  const capturedCount = board.totalAccounts - board.missingCount;

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Captura lo que cuesta cada servicio y consulta el gasto por propiedad y el total consolidado."
        action={
          <PeriodToolbar
            period={period}
            periods={periods}
            previousPeriod={board.previousPeriod}
            missingCount={board.missingCount}
            editable={editable}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={`Total consolidado · ${periodLabel(period)}`}
          value={moneyCompact(board.grandTotal)}
          hint={`${board.buildings.length} ${board.buildings.length === 1 ? "propiedad" : "propiedades"}`}
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label={`Comparado con ${periodLabel(board.previousPeriod).toLowerCase()}`}
          value={
            hasPrevious
              ? `${difference >= 0 ? "+" : "−"}${moneyCompact(Math.abs(difference))}`
              : "Sin referencia"
          }
          hint={
            hasPrevious
              ? `El mes pasado fueron ${moneyCompact(board.previousTotal)}`
              : "No hay montos capturados el mes anterior"
          }
          icon={difference >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Avance de captura"
          value={`${capturedCount}/${board.totalAccounts}`}
          hint={
            board.missingCount === 0
              ? "Todos los servicios tienen monto"
              : `Faltan ${board.missingCount} por capturar`
          }
          icon={Receipt}
          tone={board.missingCount > 0 ? "danger" : "default"}
        />
      </div>

      {board.buildings.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Todavía no hay propiedades"
          description="Registra una propiedad y sus unidades para empezar a llevar el control de los servicios."
        />
      ) : (
        board.buildings.map((building) => (
          <Card key={building.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <CardTitle>
                    <Link
                      href={`/edificios/${building.id}`}
                      className="hover:underline"
                    >
                      {building.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {building.units.length}{" "}
                    {building.units.length === 1 ? "unidad" : "unidades"} ·
                    Escribe directamente sobre los montos para editarlos.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">
                    Total de la propiedad
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {money(building.total)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ------------------------------------ servicios por unidad */}
              {building.units.length === 0 ? (
                <EmptyState
                  title="Esta propiedad no tiene unidades"
                  description="Agrega cuartos o departamentos para capturar sus servicios."
                />
              ) : (
                <div className="-mx-6 overflow-x-auto px-6">
                  <table className="w-full min-w-[36rem] border-collapse text-sm">
                    <caption className="sr-only">
                      Montos de servicios por unidad en {periodLabel(period)}
                    </caption>
                    <thead>
                      <tr className="border-b">
                        <th
                          scope="col"
                          className="text-muted-foreground py-2 pr-3 text-left font-medium"
                        >
                          Unidad
                        </th>
                        {board.columns.map((type) => (
                          <th
                            key={type}
                            scope="col"
                            className="text-muted-foreground px-2 py-2 text-right font-medium"
                          >
                            {SERVICE_TYPE_LABELS[type]}
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="text-muted-foreground py-2 pl-3 text-right font-medium"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {building.units.map((unit) => (
                        <tr key={unit.id} className="border-b last:border-0">
                          <th
                            scope="row"
                            className="py-1.5 pr-3 text-left font-normal"
                          >
                            <Link
                              href={`/unidades/${unit.id}`}
                              className="hover:underline"
                            >
                              <span className="font-medium">{unit.code}</span>
                            </Link>
                          </th>
                          {board.columns.map((type) => {
                            const cell = unit.cells[type];
                            return (
                              <td key={type} className="px-1 py-1.5">
                                {cell ? (
                                  <AmountInput
                                    accountId={cell.accountId}
                                    period={period}
                                    initialAmount={cell.amount}
                                    label={`${SERVICE_TYPE_LABELS[type]} de la unidad ${unit.code}`}
                                    editable={editable}
                                  />
                                ) : (
                                  <span
                                    className="text-muted-foreground/40 block text-right"
                                    title="Esta unidad no tiene contratado este servicio"
                                  >
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-1.5 pl-3 text-right font-medium tabular-nums">
                            {unit.total === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              money(unit.total)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2">
                        <th
                          scope="row"
                          className="py-2 pr-3 text-left text-sm font-medium"
                        >
                          Subtotal por unidades
                        </th>
                        <td
                          colSpan={board.columns.length}
                          className="py-2"
                        />
                        <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                          {money(building.unitsTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* ------------------------------- recibos de toda la propiedad */}
              {building.buildingAccounts.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">
                      Recibos de toda la propiedad
                    </h3>
                    <p className="text-muted-foreground text-xs text-pretty">
                      Llegan a nombre del edificio completo y se reparten entre
                      las unidades habitables.
                    </p>
                  </div>

                  <ul className="grid gap-3 md:grid-cols-2">
                    {building.buildingAccounts.map((account) => (
                      <li
                        key={account.accountId}
                        className="space-y-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {SERVICE_TYPE_LABELS[account.type]}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {account.providerName ?? "Sin proveedor"} ·
                              Contrato {account.contractNumber ?? "—"}
                            </p>
                          </div>
                          <div className="w-28 shrink-0">
                            <AmountInput
                              accountId={account.accountId}
                              period={period}
                              initialAmount={account.amount}
                              label={`${SERVICE_TYPE_LABELS[account.type]} de ${building.name}`}
                              editable={editable}
                            />
                          </div>
                        </div>

                        {account.allocation.length > 0 ? (
                          <details className="group">
                            <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs">
                              Ver reparto entre {account.allocation.length}{" "}
                              unidades
                              <span className="ml-1 inline-block transition group-open:rotate-90">
                                ›
                              </span>
                            </summary>
                            <ul className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                              {account.allocation.map((share) => (
                                <li
                                  key={share.id}
                                  className="flex justify-between gap-2 tabular-nums"
                                >
                                  <span>{share.label}</span>
                                  <span>{money(share.amount)}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}

                        {account.includedInRent ? (
                          <StatusBadge tone="success">
                            Incluido en la renta
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">
                            Se cobra aparte
                          </StatusBadge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}

      {/* ------------------------------------------- consolidado global */}
      {board.buildings.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Total consolidado de {periodLabel(period).toLowerCase()}
              </p>
              <p className="text-muted-foreground text-xs text-pretty">
                Suma de todas las propiedades, incluyendo recibos de edificio y
                servicios por unidad.
              </p>
            </div>
            <p className="text-3xl font-semibold tabular-nums">
              {money(board.grandTotal)}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
