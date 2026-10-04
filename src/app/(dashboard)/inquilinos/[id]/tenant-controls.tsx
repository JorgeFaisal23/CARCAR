"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FormError } from "@/components/shared/form-field";
import { ResetAccessDialog } from "@/components/auth/reset-access-dialog";
import { resetTenantAccess, setTenantActive, updateTenant } from "@/server/actions/tenants";

type TenantInfo = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  documentId: string | null;
  notes: string | null;
  active: boolean;
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  );
}

function EditTenantDialog({ tenant }: { tenant: TenantInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const result = await updateTenant({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setOpen(false);
    toast.success("Datos actualizados.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" aria-hidden />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form action={submit}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <DialogHeader>
            <DialogTitle>Editar inquilino</DialogTitle>
            <DialogDescription>
              Si cambias el correo, a partir de ahora entrará al portal con el nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field label="Nombre completo" htmlFor="t-name" required>
              <Input id="t-name" name="name" defaultValue={tenant.name} required />
            </Field>
            <Field label="Correo" htmlFor="t-email" required>
              <Input id="t-email" name="email" type="email" defaultValue={tenant.email} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="t-phone">
                <Input id="t-phone" name="phone" defaultValue={tenant.phone ?? ""} />
              </Field>
              <Field label="Identificación" htmlFor="t-doc">
                <Input id="t-doc" name="documentId" defaultValue={tenant.documentId ?? ""} />
              </Field>
            </div>
            <Field label="Notas" htmlFor="t-notes">
              <Textarea id="t-notes" name="notes" rows={2} defaultValue={tenant.notes ?? ""} />
            </Field>
            <FormError message={error} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Save />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Editar datos, dar un acceso nuevo al portal y activar o desactivar la cuenta. */
export function TenantControls({ tenant }: { tenant: TenantInfo }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggleActive = () =>
    startTransition(async () => {
      const result = await setTenantActive(tenant.id, !tenant.active);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tenant.active ? "Acceso al portal desactivado." : "Acceso al portal reactivado.");
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      <EditTenantDialog tenant={tenant} />
      {tenant.active ? (
        <ResetAccessDialog
          email={tenant.email}
          action={() => resetTenantAccess(tenant.id)}
          label="Acceso al portal"
        />
      ) : null}
      <Button variant="ghost" size="sm" disabled={pending} onClick={toggleActive}>
        {tenant.active ? (
          <UserX className="size-4" aria-hidden />
        ) : (
          <UserCheck className="size-4" aria-hidden />
        )}
        {tenant.active ? "Desactivar" : "Reactivar"}
      </Button>
    </div>
  );
}
