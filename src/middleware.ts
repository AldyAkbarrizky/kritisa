import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "kritisa_session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (path === "/" || path === "/masuk" || path === "/daftar" || path === "/cerpen" || path.startsWith("/cerpen/") || path === "/selesai" || path.startsWith("/api/") || path === "/sitemap.xml" || path === "/robots.txt" || path.startsWith("/_next") || path.startsWith("/brand")) {
    return NextResponse.next();
  }

  // Dosen routes
  if (path.startsWith("/dosen")) {
    if (!session) return NextResponse.redirect(new URL("/masuk", request.url));

    try {
      const encoded = session.split(".")[0];
      const value = Buffer.from(encoded, "base64url").toString("utf8");
      const [, role] = value.split(":");
      if (role !== "dosen") return NextResponse.redirect(new URL("/masuk", request.url));
    } catch {
      return NextResponse.redirect(new URL("/masuk", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
