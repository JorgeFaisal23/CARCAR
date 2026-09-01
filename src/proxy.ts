import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { canAccessPath, homePathFor } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (PUBLIC_PATHS.includes(pathname)) {
    // Quien ya inició sesión no necesita ver el login otra vez.
    if (session) {
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
  // iconos describen la app (CARCAR) y el navegador los pide sin cookies: si
  // pasaran por aquí acabarían redirigidos al login y el icono no cargaría.
  matcher: [
    "/((?!api|_next/static|_next/image|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
