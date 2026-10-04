"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ButtonLink } from "@/components/shared/button-link";
import { Field, FormError, NativeSelect } from "@/components/shared/form-field";
import { Separator } from "@/components/ui/separator";
import { createTenant } from "@/server/actions/tenants";
import type { ActionResult } from "@/lib/action-result";
import { money } from "@/lib/format";
import { LeaseTermsFields } from "@/components/leases/lease-terms-fields";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar inquilino"}
    </Button>
  );
}

export function NewTenantForm({
  units,
  defaultUnitId,
  canInvite = false,
}: {
  units: { id: string; code: string; buildingName: string; baseRent: number }[];
  defaultUnitId?: string;
  /** Hay correo configurado: sin contraseña temporal se le manda una invitación. */
  canInvite?: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    createTenant,
    {},
  );
  const [unitId, setUnitId] = useState(defaultUnitId ?? "");

  const selectedUnit = units.find((u) => u.id === unitId);

  return (
    <form action={formAction} className="space-y-6">
      {/* ------------------------------------------------- datos personales */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="name" required>
            <Input id="name" name="name" required placeholder="María Fernanda López" />
          </Field>
          <Field
            label="Correo electrónico"
            htmlFor="email"
            required
            hint="Con este correo entrará a su portal."
          >
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="maria@ejemplo.com"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="phone">
            <Input id="phone" name="phone" placeholder="55 1234 5678" />
          </Field>
          <Field label="Identificación" htmlFor="documentId" hint="CURP, INE o pasaporte.">
            <Input id="documentId" name="documentId" />
          </Field>
        </div>

        <Field
          label="Contraseña temporal"
          htmlFor="password"
          required={!canInvite}
          hint={
            canInvite
              ? "Déjala vacía para enviarle una invitación por correo. Si la escribes (mínimo 8 caracteres), entrégasela tú; al entrar se le pedirá cambiarla."
              : "Mínimo 8 caracteres. Entrégasela por un medio seguro; al entrar se le pedirá cambiarla."
          }
        >
          <Input
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            minLength={8}
            required={!canInvite}
          />
        </Field>

        <Field label="Notas" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
      </div>

      <Separator />

      {/* -------------------------------------------------------- contrato */}
      <div className="space-y-4">
        <div>
          <h2 className="font-medium">Contrato (opcional)</h2>
          <p className="text-muted-foreground text-sm text-pretty">
            Si ya sabes qué unidad ocupará, regístralo aquí y el contrato queda
            listo. También puedes hacerlo después.
          </p>
        </div>

        <Field label="Unidad" htmlFor="unitId">
          <NativeSelect
            id="unitId"
            name="unitId"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <option value="">Sin asignar por ahora</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.buildingName} · {unit.code} — {money(unit.baseRent)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {unitId ? <LeaseTermsFields key={unitId} baseRent={selectedUnit?.baseRent} /> : null}
      </div>

      <FormError message={state.error} />

      <div className="flex flex-wrap justify-end gap-2">
        <ButtonLink href="/inquilinos" variant="outline">
          Cancelar
        </ButtonLink>
        <Submit />
      </div>
    </form>
  );
}
