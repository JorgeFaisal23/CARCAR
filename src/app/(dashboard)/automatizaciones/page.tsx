import type { Metadata } from "next";
import { Bell, CalendarClock, FileWarning, MessageSquare, Plus, Zap } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { requireUser } from "@/lib/auth/session";
import { getAutomationCounts } from "@/lib/queries/automations";

export const metadata: Metadata = { title: "Automatizaciones" };

const AUTOMATIONS = [
  {
    icon: Bell,
    title: "Recordatorio de pago",
    description:
      "Correo al inquilino 3 días antes de su fecha de pago, con el monto y los datos para transferir.",
    channel: "Correo",
    enabled: true,
  },
  {
    icon: MessageSquare,
    title: "Aviso de pago vencido",
    description:
      "Mensaje de WhatsApp al día siguiente del vencimiento y recordatorio semanal mientras siga sin pagarse.",
    channel: "WhatsApp",
    enabled: true,
  },
  {
    icon: CalendarClock,
    title: "Alerta de contrato por vencer",
    description:
      "Aviso a ti y al inquilino 60 y 30 días antes del vencimiento, para renovar con tiempo.",
    channel: "Correo",
    enabled: true,
  },
  {
    icon: FileWarning,
    title: "Recordatorio de captura de servicios",
    description:
      "Aviso al equipo administrativo si el día 5 del mes todavía faltan montos de servicios por capturar.",
    channel: "Correo",
    enabled: false,
  },
  {
    icon: Zap,
    title: "Recibo automático",
    description:
      "Al registrar un pago se envía el comprobante en PDF al inquilino, con tu logo y tus datos.",
    channel: "Correo",
    enabled: true,
  },
];

export default async function AutomationsPage() {
  await requireUser(["OWNER", "ADMIN"]);

  const { pendingCharges, expiringLeases, daysAhead } =
    await getAutomationCounts();

  return (
    <>
      <PageHeader
        title="Automatizaciones"
        description="Deja que la plataforma haga los recordatorios por ti."
        action={
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            Nueva automatización
          </Button>
        }
      />

      <PremiumGate
        title="Automatizaciones"
        description="Recordatorios de pago por correo y WhatsApp, alertas de contratos por vencer y recibos automáticos. Deja de perseguir cobros a mano."
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Recordatorios que se enviarían hoy
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {pendingCharges}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Contratos por vencer en {daysAhead} días
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {expiringLeases}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Horas de seguimiento ahorradas al mes
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">~6 h</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reglas disponibles</CardTitle>
              <CardDescription>
                Actívalas o desactívalas según cómo trabajes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {AUTOMATIONS.map((automation) => (
                  <li
                    key={automation.title}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                      <automation.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{automation.title}</p>
                        <StatusBadge tone="info">{automation.channel}</StatusBadge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm text-pretty">
                        {automation.description}
                      </p>
                    </div>
                    <Switch defaultChecked={automation.enabled} disabled />
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
