import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, CUSTOMER_COOKIE, verifySession } from "@/lib/session-token";

/**
 * Optimistic route protection: redirects visitors without a valid signed
 * session before rendering. Pages and APIs still re-check authorisation.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value, "admin");
    if (!session && !isLogin) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (session && isLogin) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    const session = await verifySession(req.cookies.get(CUSTOMER_COOKIE)?.value, "customer");
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    const session = await verifySession(req.cookies.get(CUSTOMER_COOKIE)?.value, "customer");
    if (session) return NextResponse.redirect(new URL(req.nextUrl.searchParams.get("next") || "/account", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
