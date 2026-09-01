"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, LogIn } from "lucide-react";
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

export function LoginForm({ redirigir }: { redirigir?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
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
          <p
            role="alert"
            className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {state.error}
          </p>
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
              className="hover:border-primary/60 hover:bg-accent focus-visible:ring-ring rounded-md border p-2.5 text-left transition focus-visible:ring-2 focus-visible:outline-none"
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
