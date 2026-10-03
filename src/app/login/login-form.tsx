"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn, ShieldAlert } from "lucide-react";
import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/labels";
import type { Role } from "@/lib/auth/jwt";

const DEMO_ACCOUNTS: { email: string; role: Role }[] = [
  { email: "dueno@demo.mx", role: "OWNER" },
  { email: "admin@demo.mx", role: "ADMIN" },
  { email: "consulta@demo.mx", role: "VIEWER" },
  { email: "inquilino@demo.mx", role: "TENANT" },
];

const DEMO_PASSWORD = "demo1234";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      <LogIn className="size-4" aria-hidden />
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}

export function LoginForm({
  redirigir,
  motivo,
}: {
  redirigir?: string;
  motivo?: string;
}) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      {motivo === "sesion_duplicada" ? (
        <Callout tone="warning" icon={ShieldAlert} title="Sesión cerrada">
          Tu sesión se cerró porque se inició sesión en otro dispositivo o
          navegador. Vuelve a ingresar para continuar aquí.
        </Callout>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirigir" value={redirigir ?? ""} />

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {state.error ? (
          <Callout tone="danger">{state.error}</Callout>
        ) : null}

        <SubmitButton />
      </form>

      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <div>
          <p className="text-sm font-medium">Cuentas de demostración</p>
          <p className="text-muted-foreground text-xs">
            Elige un perfil para llenar el formulario y ver la plataforma desde
            ese rol.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="hover:border-primary/60 hover:bg-accent focus-visible:ring-ring rounded-lg border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="block text-sm font-medium">
                {ROLE_LABELS[account.role]}
              </span>
              <span className="text-muted-foreground block text-xs text-pretty">
                {ROLE_DESCRIPTIONS[account.role]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
