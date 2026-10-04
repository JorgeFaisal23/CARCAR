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
  BuildingFormFields,
  type BuildingDefaults,
} from "@/components/properties/building-form-fields";
import { updateBuilding } from "@/server/actions/properties";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );
}

export function EditBuildingDialog({
  buildingId,
  defaults,
}: {
  buildingId: string;
  defaults: BuildingDefaults;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const result = await updateBuilding({}, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setOpen(false);
    toast.success("Propiedad actualizada.");
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
      <DialogContent className="sm:max-w-lg">
        <form action={submit}>
          <input type="hidden" name="buildingId" value={buildingId} />
          <DialogHeader>
            <DialogTitle>Editar propiedad</DialogTitle>
            <DialogDescription>
              El nombre y la dirección se ven en toda la app y en el portal de
              tus inquilinos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <BuildingFormFields defaults={defaults} />
            <FormError message={error} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
