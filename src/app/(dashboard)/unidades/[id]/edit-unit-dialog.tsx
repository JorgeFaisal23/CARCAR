"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/shared/form-field";
import {
  UnitFormFields,
  type UnitDefaults,
} from "@/components/units/unit-form-fields";
import { updateUnit } from "@/server/actions/properties";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );
}

export function EditUnitDialog({
  unitId,
  buildings,
  defaults,
}: {
  unitId: string;
  buildings: { id: string; name: string }[];
  defaults: UnitDefaults;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  // La acción se envuelve en lugar de reaccionar a su resultado con un
  // efecto: cerrar el diálogo y avisar son consecuencias directas de
  // enviar el formulario, no de un cambio de estado posterior.
  async function submit(formData: FormData) {
    const result = await updateUnit({}, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setOpen(false);
    toast.success("Unidad actualizada.");
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Pencil className="size-4" aria-hidden />
            Editar
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form action={submit}>
          <input type="hidden" name="unitId" value={unitId} />

          <DialogHeader>
            <DialogTitle>Editar unidad</DialogTitle>
            <DialogDescription>
              Cambia los datos generales de la unidad. El identificador debe ser
              único dentro de la propiedad.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <UnitFormFields buildings={buildings} defaults={defaults} />
            <div className="mt-4">
              <FormError message={error} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
