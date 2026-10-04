import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DoorOpen, Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Amount } from "@/components/shared/amount";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ButtonLink } from "@/components/shared/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBuildingDetail } from "@/lib/queries/properties";
import { requireOrgUser } from "@/lib/auth/session";
import { canEdit } from "@/lib/permissions";
import { shortDate } from "@/lib/format";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddServiceDialog } from "@/components/services/add-service-dialog";
import { ServiceAccountCard } from "@/components/services/service-account-card";
import { deleteBuilding } from "@/server/actions/properties";
import {
  UNIT_STATUS_LABELS,
  UNIT_STATUS_TONES,
  UNIT_TYPE_LABELS,
} from "@/lib/labels";
import { EditBuildingDialog } from "./edit-building-dialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { db } = await requireOrgUser(["OWNER", "ADMIN"]);
  const { id } = await params;
  const building = await getBuildingDetail(db, id);
  return { title: building?.name ?? "Propiedad" };
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session, db } = await requireOrgUser(["OWNER", "ADMIN"]);
  const { id } = await params;
  const building = await getBuildingDetail(db, id);

  if (!building) notFound();

  const editable = canEdit(session.role);
  const occupied = building.units.filter(
    (u) => u.status === "OCCUPIED" || u.status === "SHORT_TERM",
  ).length;

  return (
    <>
      <Link
        href="/edificios"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Propiedades
      </Link>

      <PageHeader
        title={building.name}
        description={`${building.address}${building.city ? `, ${building.city}` : ""} · ${occupied} de ${building.units.length} unidades ocupadas.`}
        action={
          editable ? (
            <div className="flex flex-wrap gap-2">
              <ConfirmDelete
                label="Eliminar"
                title={`¿Eliminar ${building.name}?`}
                description="Se borra la propiedad con sus unidades y servicios. Solo es posible si nunca tuvo contratos, reservas ni servicios capturados."
                confirmLabel="Eliminar propiedad"
                action={deleteBuilding.bind(null, building.id)}
              />
              <EditBuildingDialog
                buildingId={building.id}
                defaults={{
                  name: building.name,
                  address: building.address,
                  city: building.city,
                  notes: building.notes,
                }}
              />
              <ButtonLink href={`/unidades/nueva?edificio=${building.id}`}>
                <Plus className="size-4" aria-hidden />
                Nueva unidad
              </ButtonLink>
            </div>
          ) : null
        }
      />

      {/* ------------------------------------------------------- unidades */}
      <Card>
        <CardHeader>
          <CardTitle>Unidades</CardTitle>
          <CardDescription>
            Cada cuarto o departamento con su renta, su estado y quién lo ocupa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {building.units.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="Esta propiedad no tiene unidades"
              description="Agrega los cuartos o departamentos que rentas dentro de este inmueble."
              actions={
                editable ? (
                  <ButtonLink
                    href={`/unidades/nueva?edificio=${building.id}`}
                    size="sm"
                    variant="outline"
                  >
                    Agregar la primera unidad
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y">
              {building.units.map((unit) => (
                <li key={unit.id}>
                  <Link
                    href={`/unidades/${unit.id}`}
                    className="hover:bg-accent/60 -mx-2 flex flex-col gap-2 rounded-lg px-2 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
                        {unit.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {unit.name ?? UNIT_TYPE_LABELS[unit.type]}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {unit.tenantName
                            ? unit.tenantName
                            : unit.nextGuest
                              ? `Próxima llegada: ${unit.nextGuest.name}, ${shortDate(unit.nextGuest.checkIn)}`
                              : "Sin ocupante asignado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-sm">
                        <Amount value={unit.baseRent} className="font-medium" />
                        <span className="text-muted-foreground text-xs font-normal">
                          {unit.status === "SHORT_TERM" ? " /noche" : " /mes"}
                        </span>
                      </span>
                      <StatusBadge tone={UNIT_STATUS_TONES[unit.status]}>
                        {UNIT_STATUS_LABELS[unit.status]}
                      </StatusBadge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------- servicios del edificio */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Servicios de la propiedad</CardTitle>
              <CardDescription>
                Recibos que llegan a nombre del edificio completo y se reparten
                entre las unidades. Sus montos se capturan en Servicios.
              </CardDescription>
            </div>
            {editable ? (
              <AddServiceDialog
                target={{ scope: "BUILDING", buildingId: building.id }}
                existingTypes={building.serviceAccounts.map((a) => a.type)}
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {building.serviceAccounts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin servicios a nivel propiedad"
              description="Agrega los recibos globales, como el agua de todo el edificio, y elige cómo se reparten."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {building.serviceAccounts.map((account) => (
                <ServiceAccountCard
                  key={account.id}
                  account={account}
                  editable={editable}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {building.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm text-pretty">
              {building.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
