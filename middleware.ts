import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "./lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /chat and /api/* routes (except /api/auth)
  const isProtected =
    pathname.startsWith("/chat") ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth"));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME);
  if (
    !token ||
    (!token.value.startsWith("authenticated:") &&
      !token.value.startsWith("test-authenticated:"))
  ) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/api/chat/:path*", "/api/upload/:path*", "/api/usage/:path*"],
};
