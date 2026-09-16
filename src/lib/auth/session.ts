import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
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

  let isSecure = false;
  try {
    const headerStore = await headers();
    const proto = headerStore.get("x-forwarded-proto");
    isSecure =
      process.env.COOKIE_SECURE === "true" ||
      (proto === "https" && process.env.COOKIE_SECURE !== "false");
  } catch {
    isSecure = process.env.COOKIE_SECURE === "true";
  }

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
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
 * Redirige en vez de lanzar para que las páginas no tengan que manejarlo.
 */
export async function requireUser(roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) {
    redirect(session.role === "TENANT" ? "/portal" : "/dashboard");
  }
  return session;
}

/** Para Server Actions: lanza en vez de redirigir. */
export async function requireUserAction(roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Sesión no válida. Vuelve a iniciar sesión.");
  if (roles && !roles.includes(session.role)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
  return session;
}
