import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that DO NOT require authentication
const PUBLIC_ROUTES = ["/login", "/signup"];

// Static assets and Next.js internals — always skip
const SKIP_PREFIXES = ["/_next", "/api", "/favicon", "/fonts", "/images"];

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

/**
 * SEC-01 FIX: Validate the `from` redirect param.
 * Must start with "/" to prevent open redirect to external URLs.
 * Example attack: /login?from=https://evil.com
 */
function isSafeRedirect(path: string | null): boolean {
  if (!path) return false;
  // Must be a relative path starting with /
  // Must not start with // (protocol-relative URL → still external)
  return path.startsWith("/") && !path.startsWith("//");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/api routes
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow public auth pages
  if (PUBLIC_ROUTES.includes(pathname)) {
    // If already authenticated, redirect to dashboard instead of showing login again
    const session = request.cookies.get("bos_session");
    if (session?.value) {
      try {
        await jwtVerify(session.value, SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // Invalid token — let them through to login/signup to re-authenticate
      }
    }
    return NextResponse.next();
  }

  // Check for JWT session cookie (set by FastAPI server after login)
  const session = request.cookies.get("bos_session");

  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    // SEC-01 FIX: Only add `from` if it's a safe relative path
    if (isSafeRedirect(pathname)) {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT signature
    await jwtVerify(session.value, SECRET);
    return NextResponse.next();
  } catch {
    // Token is invalid or expired — clear it and redirect to login
    const loginUrl = new URL("/login", request.url);
    if (isSafeRedirect(pathname)) {
      loginUrl.searchParams.set("from", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    // Clear the invalid cookie so the client doesn't keep sending it
    response.cookies.delete("bos_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
