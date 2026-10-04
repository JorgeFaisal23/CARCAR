"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { KeyRound, PauseCircle, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, FormError } from "@/components/shared/form-field";
import {
  resetOwnerPassword,
  setOrganizationPlan,
  setOrganizationStatus,
  updateOrganization,
} from "@/server/superadmin/actions";
import { TempPassword } from "../../temp-password";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  );
}

/** Nombre interno y slug (URL de su acceso con marca). */
export function OrganizationDetailsForm({
  orgId,
  name,
  slug,
}: {
  orgId: string;
  name: string;
  slug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [draftSlug, setDraftSlug] = useState(slug);

  async function submit(formData: FormData) {
    const result = await updateOrganization({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success("Datos guardados.");
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <Field label="Nombre" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={name} required />
      </Field>
      <Field
        label="Identificador"
        htmlFor="slug"
        required
        hint={
          draftSlug === slug
            ? `Acceso: /a/${slug}/login`
            : `El acceso pasará a /a/${draftSlug || "…"}/login; el anterior dejará de funcionar.`
        }
      >
        <Input
          id="slug"
          name="slug"
          value={draftSlug}
          onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
          required
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <FormError message={error} />
      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

export function PlanControl({ orgId, plan }: { orgId: string; plan: "FREE" | "PREMIUM" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = plan === "PREMIUM" ? "FREE" : "PREMIUM";

  return (
    <Button
      variant={plan === "PREMIUM" ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setOrganizationPlan(orgId, next);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(next === "PREMIUM" ? "Premium activado." : "Plan cambiado a gratuito.");
          router.refresh();
        })
      }
    >
      <Sparkles className="size-4" aria-hidden />
      {next === "PREMIUM" ? "Activar Premium" : "Pasar a gratuito"}
    </Button>
  );
}

/** Suspender pide confirmación: saca de inmediato a todos sus usuarios. */
export function StatusControl({
  orgId,
  name,
  status,
}: {
  orgId: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const apply = (next: "ACTIVE" | "SUSPENDED") =>
    startTransition(async () => {
      const result = await setOrganizationStatus(orgId, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(next === "SUSPENDED" ? "Acceso suspendido." : "Acceso reactivado.");
      router.refresh();
    });

  if (status === "SUSPENDED") {
    return (
      <Button disabled={pending} onClick={() => apply("ACTIVE")}>
        <PlayCircle className="size-4" aria-hidden />
        Reactivar acceso
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive">
            <PauseCircle className="size-4" aria-hidden />
            Suspender acceso
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Suspender a {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Su dueño, su equipo y sus inquilinos salen de inmediato y no podrán
            volver a entrar hasta que la reactives. Sus datos se conservan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => apply("SUSPENDED")}>
            {pending ? "Suspendiendo…" : "Suspender"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Nueva contraseña temporal para un dueño que perdió el acceso. */
export function ResetOwnerPassword({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPassword(undefined);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound className="size-4" aria-hidden />
            Restablecer contraseña
          </Button>
        }
      />
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Restablecer contraseña</AlertDialogTitle>
          <AlertDialogDescription>
            {password
              ? "Listo. Su sesión anterior se cerró."
              : `Se genera una contraseña temporal para ${email} y se cierra su sesión actual.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {password ? <TempPassword email={email} password={password} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{password ? "Cerrar" : "Cancelar"}</AlertDialogCancel>
          {password ? null : (
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await resetOwnerPassword(userId);
                  if (result.error || !result.tempPassword) {
                    toast.error(result.error ?? "No se pudo restablecer.");
                    return;
                  }
                  setPassword(result.tempPassword);
                })
              }
            >
              {pending ? "Generando…" : "Generar contraseña"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
