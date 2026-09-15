import type { Metadata } from "next";
import { CreditCard, Receipt } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getPortalData } from "@/lib/queries/portal";
import { money, periodLabel, shortDate } from "@/lib/format";
import { CHARGE_STATUS_LABELS, CHARGE_STATUS_TONES } from "@/lib/labels";
import { ReceiptViewer } from "@/components/payments/receipt-viewer";

export const metadata: Metadata = { title: "Mis pagos" };

export default async function PortalPaymentsPage() {
  const session = await requireUser(["TENANT"]);
  const data = await getPortalData(session.sub, session.organizationId);

  const paid = data.charges.filter((c) => c.status === "PAID");

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mis pagos</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          El historial de tus cargos de renta y su estado.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Saldo pendiente"
          value={data.balance === 0 ? "Sin adeudo" : money(data.balance)}
          hint={
            data.balance === 0
              ? "Estás al corriente"
              : "Suma de tus cargos sin liquidar"
          }
          icon={CreditCard}
          tone={data.balance > 0 ? "danger" : "brand"}
        />
        <StatCard
          label="Pagos registrados"
          value={String(paid.length)}
          hint={`De ${data.charges.length} cargos en total`}
          icon={Receipt}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>
            Si detectas algo que no corresponde, avísale al administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.charges.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Todavía no hay cargos"
              description="Cuando se genere el primer cargo de tu renta aparecerá aquí."
            />
          ) : (
            <ul className="divide-y">
              {data.charges.map((charge) => (
                <li
                  key={charge.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {periodLabel(charge.period)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Vence el {shortDate(charge.dueDate)}
                      {charge.paidAt
                        ? ` · pagado el ${shortDate(charge.paidAt)}`
                        : ""}
                      {charge.method ? ` · ${charge.method}` : ""}
                      {charge.reference ? ` · ${charge.reference}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {money(charge.amount)}
                    </span>
                    <StatusBadge tone={CHARGE_STATUS_TONES[charge.status]}>
                      {CHARGE_STATUS_LABELS[charge.status]}
                    </StatusBadge>
                    {charge.receiptUrl ? (
                      <ReceiptViewer
                        receiptUrl={charge.receiptUrl}
                        title={`Pago de ${periodLabel(charge.period)}`}
                        subtitle={`${money(charge.amount)}${charge.method ? ` · ${charge.method}` : ""}`}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
