import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { ORG_COOKIE, ORG_COOKIE_MAX_AGE } from "@/lib/auth/paths";
import type { Role } from "@/lib/auth/jwt";

/**
 * Abre una sesión nueva para el usuario. La usan el login, el cambio de
 * contraseña y los enlaces de un solo uso.
 *
 * Genera un identificador de sesión y lo guarda en la base: cualquier sesión
 * anterior del usuario queda invalidada (una sesión activa por persona).
 */
export async function startSession(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  organization: { slug: string } | null;
}) {
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
}

/** Lo que startSession necesita, para pedirlo igual en todos lados. */
export const SESSION_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  passwordHash: true,
  mustChangePassword: true,
  organizationId: true,
  organization: { select: { slug: true, status: true } },
} as const;
