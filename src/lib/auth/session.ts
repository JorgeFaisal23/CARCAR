import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type Role,
  type SessionPayload,
  signSession,
  verifySession,
} from "./jwt";

/** Lee la sesión actual. Devuelve null si no hay o si el token no es válido. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Exige una sesión válida y, opcionalmente, uno de los roles indicados.
 * Valida en base de datos que la sesión sea la única activa.
 * Redirige en vez de lanzar para que las páginas no tengan que manejarlo.
 */
export async function requireUser(roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { active: true, currentSessionId: true },
  });

  if (!user || !user.active) {
    await destroySession();
    redirect("/login");
  }

  if (user.currentSessionId !== session.sessionId) {
    await destroySession();
    redirect("/login?motivo=sesion_duplicada");
  }

  if (roles && !roles.includes(session.role)) {
    redirect(session.role === "TENANT" ? "/portal" : "/dashboard");
  }
  return session;
}

/** Para Server Actions: lanza en vez de redirigir. */
export async function requireUserAction(roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Sesión no válida. Vuelve a iniciar sesión.");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { active: true, currentSessionId: true },
  });

  if (!user || !user.active) {
    await destroySession();
    throw new Error("Tu cuenta ya no está activa o tu sesión ha expirado.");
  }

  if (user.currentSessionId !== session.sessionId) {
    await destroySession();
    throw new Error("Tu sesión fue cerrada porque se inició sesión en otro dispositivo.");
  }

  if (roles && !roles.includes(session.role)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
  return session;
}

/** Comprueba si la sesión actual sigue siendo la activa en BD (para el monitor en cliente). */
export async function checkSessionActive(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { active: true, currentSessionId: true },
  });

  if (!user || !user.active || user.currentSessionId !== session.sessionId) {
    await destroySession();
    return false;
  }

  return true;
}
