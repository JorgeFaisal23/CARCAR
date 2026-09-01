import { SignJWT, jwtVerify } from "jose";

/**
 * Firma y verificación de la sesión. Este módulo se mantiene libre de
 * dependencias de Node (nada de `next/headers` ni Prisma) para que el
 * middleware pueda importarlo en el runtime Edge.
 */

export const SESSION_COOKIE = "rentas_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export type Role = "OWNER" | "ADMIN" | "VIEWER" | "TENANT";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role as Role,
    };
  } catch {
    // Token expirado, alterado o firmado con otro secreto.
    return null;
  }
}
