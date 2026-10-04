"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/button-link";
import { Field, FormError, NativeSelect } from "@/components/shared/form-field";
import { LeaseTermsFields } from "@/components/leases/lease-terms-fields";
import { createLease } from "@/server/actions/leases";
import type { ActionResult } from "@/lib/action-result";
import { money } from "@/lib/format";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Crear contrato"}
    </Button>
  );
}

export function NewLeaseForm({
  tenants,
  units,
  defaultTenantId,
  defaultUnitId,
  cancelHref,
}: {
  tenants: { id: string; name: string; email: string }[];
  units: { id: string; code: string; buildingName: string; baseRent: number }[];
  defaultTenantId?: string;
  defaultUnitId?: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createLease, {});
  const [unitId, setUnitId] = useState(defaultUnitId ?? "");
  const selectedUnit = units.find((u) => u.id === unitId);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inquilino" htmlFor="tenantId" required>
          <NativeSelect id="tenantId" name="tenantId" defaultValue={defaultTenantId ?? ""} required>
            <option value="" disabled>
              Elige al inquilino
            </option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} · {tenant.email}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Unidad" htmlFor="unitId" required>
          <NativeSelect
            id="unitId"
            name="unitId"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
          >
            <option value="" disabled>
              Elige la unidad
            </option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.buildingName} · {unit.code} — {money(unit.baseRent)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {unitId ? <LeaseTermsFields key={unitId} baseRent={selectedUnit?.baseRent} /> : null}

      <FormError message={state.error} />

      <div className="flex flex-wrap justify-end gap-2">
        <ButtonLink href={cancelHref} variant="outline">
          Cancelar
        </ButtonLink>
        <Submit />
      </div>
    </form>
  );
}
