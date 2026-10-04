"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CalendarX, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cancelLease, endLease, renewLease } from "@/server/actions/leases";
import { localDateInput } from "./lease-terms-fields";

type LeaseInfo = {
  id: string;
  endDate: Date;
  rentAmount: number;
  tenantName: string;
};

/** Diálogo con un formulario que llama a una acción del contrato. */
function LeaseDialog({
  trigger,
  title,
  description,
  submitLabel,
  destructive,
  action,
  success,
  children,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  submitLabel: string;
  destructive?: boolean;
  action: (formData: FormData) => Promise<{ error?: string }>;
  success: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form
          action={(formData) =>
            startTransition(async () => {
              const result = await action(formData);
              if (result.error) {
                setError(result.error);
                return;
              }
              setOpen(false);
              toast.success(success);
              router.refresh();
            })
          }
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {children}
            <FormError message={error} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Volver
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Renovar, terminar o cancelar un contrato vigente. */
export function LeaseActions({ lease }: { lease: LeaseInfo }) {
  const currentEnd = localDateInput(0, lease.endDate);

  return (
    <div className="flex flex-wrap gap-2">
      <LeaseDialog
        trigger={
          <Button variant="outline" size="sm">
            <CalendarPlus className="size-4" aria-hidden />
            Renovar
          </Button>
        }
        title="Renovar contrato"
        description={`Extiende la vigencia del contrato de ${lease.tenantName}. Una renta nueva aplica a los cargos que aún no se generan.`}
        submitLabel="Renovar"
        success="Contrato renovado."
        action={(formData) => renewLease(lease.id, formData)}
      >
        <Field label="Nuevo vencimiento" htmlFor="renew-end" required>
          <Input
            id="renew-end"
            name="endDate"
            type="date"
            required
            min={currentEnd}
            defaultValue={localDateInput(12, lease.endDate)}
          />
        </Field>
        <Field label="Renta mensual" htmlFor="renew-rent" hint="Déjala igual si no cambia.">
          <Input
            id="renew-rent"
            name="rentAmount"
            type="number"
            min={0}
            step={50}
            defaultValue={lease.rentAmount}
            className="text-right tabular-nums"
          />
        </Field>
      </LeaseDialog>

      <LeaseDialog
        trigger={
          <Button variant="outline" size="sm">
            <CalendarX className="size-4" aria-hidden />
            Terminar
          </Button>
        }
        title="Terminar contrato"
        description="Con la fecha de hoy (o anterior) termina ya y la unidad queda disponible. Con una fecha futura, termina solo ese día. Los cargos de meses posteriores sin pagos se borran."
        submitLabel="Terminar contrato"
        destructive
        success="Contrato actualizado."
        action={(formData) => endLease(lease.id, formData)}
      >
        <Field label="Fecha de terminación" htmlFor="end-date" required>
          <Input
            id="end-date"
            name="endDate"
            type="date"
            required
            max={currentEnd}
            defaultValue={localDateInput()}
          />
        </Field>
        <Field label="Motivo" htmlFor="end-reason" hint="Opcional. Queda en la bitácora y en el historial.">
          <Input id="end-reason" name="reason" placeholder="El inquilino se mudó" maxLength={200} />
        </Field>
      </LeaseDialog>

      <LeaseDialog
        trigger={
          <Button variant="ghost" size="sm">
            <Ban className="size-4" aria-hidden />
            Cancelar
          </Button>
        }
        title="Cancelar contrato"
        description="Para un contrato capturado por error o que no llegó a empezar: se anula junto con sus cargos. Si ya tiene pagos, termínalo en su lugar."
        submitLabel="Cancelar contrato"
        destructive
        success="Contrato cancelado."
        action={(formData) => cancelLease(lease.id, formData)}
      >
        <Field label="Motivo" htmlFor="cancel-reason">
          <Input id="cancel-reason" name="reason" placeholder="Capturado por error" maxLength={200} />
        </Field>
      </LeaseDialog>
    </div>
  );
}
