"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkSessionProblem,
  createSession,
  destroySession,
  getSession,
  loginPathFor,
} from "@/lib/auth/session";
import { ORG_COOKIE, ORG_COOKIE_MAX_AGE } from "@/lib/auth/paths";
import { safeRedirect } from "@/lib/redirect";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
  redirigir: z.string().optional(),
  orgSlug: z.string().optional(),
});

export type LoginState = { error?: string };

const INVALID = "Correo o contraseña incorrectos.";

/**
 * Hash señuelo: cuando el correo no existe se compara contra él, para que la
 * respuesta tarde lo mismo que con una contraseña incorrecta y el tiempo no
 * delate qué correos están registrados.
 */
let dummyHash: string | null = null;
function getDummyHash() {
  dummyHash ??= bcrypt.hashSync(crypto.randomUUID(), 10);
  return dummyHash;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirigir: formData.get("redirigir") || undefined,
    orgSlug: formData.get("orgSlug") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const { email, password, redirigir, orgSlug } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { slug: true, status: true } } },
  });

  const passwordOk = await bcrypt.compare(
    password,
    user?.passwordHash ?? getDummyHash(),
  );

  // Mismo mensaje para usuario inexistente, inactivo y contraseña incorrecta:
  // no vale la pena revelar cuáles correos existen.
  if (!user || !user.active || !passwordOk) {
    return { error: INVALID };
  }

  // En el acceso con marca solo entran usuarios de esa arrendadora. Se
  // responde igual que con una contraseña incorrecta: el acceso de una
  // arrendadora no debe confirmar qué correos existen en otras.
  if (orgSlug && user.organization?.slug !== orgSlug) {
    return { error: INVALID };
  }

  // Solo después de comprobar la contraseña se dice que la arrendadora está
  // suspendida: quien la conoce ya demostró que la cuenta es suya.
  if (user.organization && user.organization.status !== "ACTIVE") {
    return {
      error:
        "El acceso de tu arrendadora está suspendido. Contacta al administrador de la plataforma.",
    };
  }

  // Un identificador por sesión: al guardarlo, cualquier sesión previa de este
  // usuario queda invalidada (una sesión activa por persona).
  const sessionId = crypto.randomUUID();
  await prisma.user.update({
    where: { id: user.id },
    data: { currentSessionId: sessionId },
  });

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId,
    orgId: user.organizationId,
    orgSlug: user.organization?.slug ?? null,
  });

  // Recuerda la arrendadora para mandar a su acceso con marca a quien vuelva
  // sin sesión (ver el proxy). El superadministrador usa el genérico.
  const store = await cookies();
  if (user.organization) {
    store.set(ORG_COOKIE, user.organization.slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ORG_COOKIE_MAX_AGE,
    });
  } else {
    store.delete(ORG_COOKIE);
  }

  redirect(safeRedirect(redirigir, user.role));
}

export async function logout() {
  const session = await getSession();
  if (session) {
    // Solo se borra el registro de sesión si sigue perteneciendo a este
    // dispositivo; si ya entró en otro lado, esa sesión se respeta.
    await prisma.user.updateMany({
      where: {
        id: session.sub,
        currentSessionId: session.sessionId,
      },
      data: { currentSessionId: null },
    });
  }
  await destroySession();
  redirect(loginPathFor(session?.orgSlug));
}

/**
 * Para el monitor de sesión en cliente. Devuelve a dónde mandar al usuario si
 * su sesión ya no vale, o null si sigue activa.
 */
export async function verifySessionLiveness(): Promise<string | null> {
  const session = await getSession();
  const problem = await checkSessionProblem();
  if (!problem) return null;

  const path = loginPathFor(session?.orgSlug);
  return problem === "sin_sesion" ? path : `${path}?motivo=${problem}`;
}
