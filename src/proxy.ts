import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { canAccessPath, homePathFor } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login"];

/** Rutas que cualquiera puede abrir, con o sin sesión y sea cual sea su rol. */
const ALWAYS_ALLOWED = ["/salir"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ALWAYS_ALLOWED.includes(pathname)) return NextResponse.next();

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (PUBLIC_PATHS.includes(pathname)) {
    // Quien ya inició sesión no necesita ver el login otra vez, salvo
    // que venga redirigido por algún motivo (ej. sesión duplicada/desplazada).
    if (session && !request.nextUrl.searchParams.has("motivo")) {
      return NextResponse.redirect(
        new URL(homePathFor(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("redirigir", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
  }

  if (!canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todo salvo assets estáticos y la API de autenticación. El manifiesto y los
  // iconos describen el producto y el navegador los pide sin cookies: si
  // pasaran por aquí acabarían redirigidos al login y el icono no cargaría.
  // `icon` es el favicon generado por src/app/icon.tsx (no lleva extensión).
  matcher: [
    "/((?!api|_next/static|_next/image|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
