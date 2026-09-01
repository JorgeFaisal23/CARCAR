"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/form-field";
import { createBuilding } from "@/server/actions/properties";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar propiedad"}
    </Button>
  );
}

export function NewBuildingDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  // La acción se envuelve en lugar de reaccionar a su resultado con un
  // efecto: cerrar el diálogo y avisar son consecuencias directas de
  // enviar el formulario, no de un cambio de estado posterior.
  async function submit(formData: FormData) {
    const result = await createBuilding({}, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setOpen(false);
    toast.success("Propiedad registrada.");
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" aria-hidden />
            Nueva propiedad
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form action={submit}>
          <DialogHeader>
            <DialogTitle>Nueva propiedad</DialogTitle>
            <DialogDescription>
              Un edificio, una casa o cualquier inmueble que agrupe unidades en
              renta. Después le agregas los cuartos o departamentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field label="Nombre" htmlFor="name" required
              hint="Como lo identificas tú, por ejemplo “Edificio Reforma”.">
              <Input id="name" name="name" required placeholder="Edificio Reforma" />
            </Field>

            <Field label="Dirección" htmlFor="address" required>
              <Input
                id="address"
                name="address"
                required
                placeholder="Av. Reforma 148, Col. Juárez"
              />
            </Field>

            <Field label="Ciudad" htmlFor="city">
              <Input id="city" name="city" placeholder="Ciudad de México" />
            </Field>

            <Field label="Notas" htmlFor="notes">
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Cualquier detalle que quieras recordar."
              />
            </Field>

            <FormError message={error} />
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
