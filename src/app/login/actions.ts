"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { homePathFor } from "@/lib/permissions";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
  redirigir: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirigir: formData.get("redirigir") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { email, password, redirigir } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Mismo mensaje para usuario inexistente y contraseña incorrecta: no vale la
  // pena revelar cuáles correos existen.
  if (!user || !user.active || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const destination =
    redirigir && redirigir.startsWith("/") ? redirigir : homePathFor(user.role);

  redirect(destination);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
