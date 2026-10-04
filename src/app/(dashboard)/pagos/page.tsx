import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Banknote, CircleDollarSign, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireOrgUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/permissions";
import { getPaymentsBoard } from "@/lib/queries/payments";
import {
  money,
  periodKey,
  periodLabel,
  recentPeriods,
  shortDate,
} from "@/lib/format";
import { CHARGE_STATUS_LABELS, CHARGE_STATUS_TONES } from "@/lib/labels";
import { PaymentsToolbar } from "./payments-toolbar";
import { PaymentRowActions } from "./payment-row-actions";
import { ReceiptBadge } from "@/components/payments/receipt-viewer";

export const metadata: Metadata = { title: "Cobros" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { session, db } = await requireOrgUser(["OWNER", "ADMIN"]);
  const { mes } = await searchParams;

  const periods = recentPeriods(12);
  const period = mes && periods.includes(mes) ? mes : periodKey(new Date());

  const board = await getPaymentsBoard(db, period);
  const editable = canEdit(session.role);

  const progress =
    board.expected === 0 ? 0 : Math.round((board.collected / board.expected) * 100);

  return (
    <>
      <PageHeader
        title="Cobros"
        description="Cargos de renta del mes: qué se espera, qué ya entró y qué está vencido."
        action={
          <PaymentsToolbar
            period={period}
            periods={periods}
            missingCharges={board.missingCharges}
            editable={editable}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Esperado · ${periodLabel(period)}`}
          value={<Amount value={board.expected} compact />}
          hint={`${board.chargeCount} ${board.chargeCount === 1 ? "cargo" : "cargos"} generados`}
          icon={Wallet}
        />
        <StatCard
          label="Cobrado"
          value={<Amount value={board.collected} compact />}
          hint={`${progress}% del total esperado`}
          icon={Banknote}
          tone="brand"
        />
        <StatCard
          label="Por cobrar"
          value={<Amount value={board.pending} compact />}
          hint={
            board.pending === 0
              ? "Todo cobrado este mes"
              : "Incluye pendientes y vencidos"
          }
          icon={CircleDollarSign}
        />
        <StatCard
          label="Vencidos"
          value={board.overdueCount === 0 ? "Ninguno" : String(board.overdueCount)}
          hint={
            board.overdueCount === 0
              ? "Sin atrasos"
              : "Conviene contactar a estos inquilinos"
          }
          icon={AlertTriangle}
          tone={board.overdueCount > 0 ? "danger" : "default"}
        />
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Avance de cobranza</span>
            <span className="text-muted-foreground tabular-nums">
              <Amount value={board.collected} className="text-foreground" /> de{" "}
              <Amount value={board.expected} className="font-normal" />
            </span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {board.chargeCount === 0 ? (
        <EmptyState
          icon={Banknote}
          title={`Aún no hay cargos de ${periodLabel(period).toLowerCase()}`}
          description={
            board.activeLeases === 0
              ? "Cuando tengas contratos vigentes podrás generar aquí los cargos mensuales."
              : `Tienes ${board.activeLeases} contratos vigentes. Genera los cargos del mes para empezar a llevar la cobranza.`
          }
          actions={
            editable && board.activeLeases > 0 ? (
              <PaymentsToolbar
                period={period}
                periods={periods}
                missingCharges={board.missingCharges}
                editable={editable}
              />
            ) : undefined
          }
        />
      ) : (
        board.buildings.map((building) => (
          <Card key={building.id}>
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
                    {building.charges.length}{" "}
                    {building.charges.length === 1 ? "cargo" : "cargos"} ·{" "}
                    <Amount value={building.collected} className="font-normal" /> cobrados
                  </CardDescription>
                </div>
                <Amount value={building.total} className="text-xl tracking-tight" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {building.charges.map((charge) => (
                  <li
                    key={charge.id}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/inquilinos/${charge.tenantId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {charge.tenantName}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        Unidad {charge.unitCode} · vence el{" "}
                        {shortDate(charge.dueDate)}
                        {charge.paidAt
                          ? ` · pagado el ${shortDate(charge.paidAt)}${charge.method ? ` (${charge.method})` : ""}`
                          : ""}
                      </p>
                      {charge.status === "PARTIAL" ? (
                        <p className="text-muted-foreground text-xs">
                          Abonado <Amount value={charge.paidAmount} /> de{" "}
                          <Amount value={charge.amount} />
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Amount value={charge.amount} className="text-sm" />
                      <StatusBadge tone={CHARGE_STATUS_TONES[charge.status]}>
                        {CHARGE_STATUS_LABELS[charge.status]}
                      </StatusBadge>
                      {charge.receiptUrl ? (
                        <ReceiptBadge
                          receiptUrl={charge.receiptUrl}
                          title={`${charge.tenantName} · ${money(charge.amount)}`}
                          subtitle={`Unidad ${charge.unitCode} · ${periodLabel(period)}`}
                        />
                      ) : null}
                      {editable ? (
                        <PaymentRowActions
                          chargeId={charge.id}
                          tenantName={charge.tenantName}
                          amount={charge.amount}
                          paidAmount={charge.paidAmount}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
