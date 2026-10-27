import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// First gate, at the edge, from the JWT. The role in the token can be stale, so admin
// pages (lib/auth-guard.ts) and admin API routes (requireAdmin) re-check it in the database.
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api/admin")) {
      if (token?.role === "ADMIN") return NextResponse.next();
      return token
        ? NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 })
        : NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue" } }, { status: 401 });
    }
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Students finish onboarding before seeing the dashboard.
    if (pathname.startsWith("/dashboard") && token?.role !== "ADMIN" && !token?.onboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  },
  {
    // API routes answer with JSON above instead of being redirected to the login page.
    callbacks: { authorized: ({ token, req }) => req.nextUrl.pathname.startsWith("/api/") || Boolean(token) },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/admin/:path*", "/api/admin/:path*"],
};
