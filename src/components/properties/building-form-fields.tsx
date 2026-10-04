import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";

export type BuildingDefaults = {
  name: string;
  address: string;
  city: string | null;
  notes: string | null;
};

/** Campos de una propiedad, compartidos por el alta y la edición. */
export function BuildingFormFields({ defaults }: { defaults?: BuildingDefaults }) {
  return (
    <>
      <Field
        label="Nombre"
        htmlFor="name"
        required
        hint="Como lo identificas tú, por ejemplo “Edificio Reforma”."
      >
        <Input
          id="name"
          name="name"
          required
          placeholder="Edificio Reforma"
          defaultValue={defaults?.name}
        />
      </Field>

      <Field label="Dirección" htmlFor="address" required>
        <Input
          id="address"
          name="address"
          required
          placeholder="Av. Reforma 148, Col. Juárez"
          defaultValue={defaults?.address}
        />
      </Field>

      <Field label="Ciudad" htmlFor="city">
        <Input
          id="city"
          name="city"
          placeholder="Ciudad de México"
          defaultValue={defaults?.city ?? ""}
        />
      </Field>

      <Field label="Notas" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Cualquier detalle que quieras recordar."
          defaultValue={defaults?.notes ?? ""}
        />
      </Field>
    </>
  );
}
