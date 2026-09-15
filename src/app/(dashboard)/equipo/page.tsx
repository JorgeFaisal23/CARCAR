import type { Metadata } from "next";
import { ScrollText, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PremiumGate } from "@/components/premium/premium-gate";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { initials, shortDate } from "@/lib/format";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/labels";

export const metadata: Metadata = { title: "Equipo" };

export default async function TeamPage() {
  const session = await requireUser(["OWNER", "ADMIN"]);

  const [staff, logs] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["OWNER", "ADMIN", "VIEWER"] },
        ...(session.organizationId
          ? { organizationId: session.organizationId }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: session.organizationId
        ? { organizationId: session.organizationId }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        entity: true,
        detail: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Equipo"
        description="Quién tiene acceso a la plataforma y qué ha hecho."
        action={
          <Button disabled>
            <UserPlus className="size-4" aria-hidden />
            Invitar usuario
          </Button>
        }
      />

      <PremiumGate
        title="Multi-edificio y equipo"
        description="Propiedades ilimitadas, varios usuarios administrativos con permisos por propiedad y bitácora completa de quién hizo cada movimiento."
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios con acceso</CardTitle>
              <CardDescription>
                En Premium puedes limitar a cada persona a las propiedades que le
                corresponden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {staff.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {member.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {member.email} · alta el {shortDate(member.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge tone={member.active ? "success" : "neutral"}>
                        {ROLE_LABELS[member.role]}
                      </StatusBadge>
                      <p className="text-muted-foreground mt-1 text-xs text-pretty">
                        {ROLE_DESCRIPTIONS[member.role]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bitácora</CardTitle>
              <CardDescription>
                Cada movimiento queda registrado con su autor y su fecha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <ScrollText className="size-4" aria-hidden />
                  Todavía no hay movimientos registrados.
                </p>
              ) : (
                <ul className="divide-y text-sm">
                  {logs.map((log) => (
                    <li
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-muted-foreground text-xs">
                          {log.user?.name ?? "Sistema"}
                          {log.detail ? ` · ${log.detail}` : ""}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {shortDate(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </PremiumGate>
    </>
  );
}
