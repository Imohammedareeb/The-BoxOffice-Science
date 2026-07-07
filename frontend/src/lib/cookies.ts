/**
 * Cookie helpers for auth tokens.
 *
 * SEC-03 FIX: The JWT is now set as an HttpOnly cookie by the FastAPI server.
 * JavaScript cannot write or read an HttpOnly cookie.
 *
 * This file's role has changed:
 *   - getStoredToken(): reads from JS-readable fallback (for Axios interceptor)
 *   - storeToken(): kept for backward compat, but server now sets the real cookie
 *   - removeToken(): calls server-side /api/auth/logout to clear HttpOnly cookie
 *
 * Flow after login:
 *   1. POST /api/auth/login → FastAPI sets Set-Cookie: bos_session (HttpOnly)
 *   2. Next.js middleware reads the HttpOnly cookie automatically (server-side)
 *   3. Axios interceptor reads the non-HttpOnly "bos_session_js" fallback for API calls
 *      (the access_token returned in the response body — stored in memory/sessionStorage)
 */

const TOKEN_KEY = "bos_session_js";   // JS-accessible fallback (non-HttpOnly)
const COOKIE_KEY = "bos_session";      // read by the Next.js middleware
const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MAX_AGE   = 60 * 60 * 24;        // 24h — matches the backend token TTL

/**
 * Store the token in sessionStorage for the Axios request interceptor AND set a
 * `bos_session` cookie on the FRONTEND's own domain.
 *
 * Why the cookie: the Next.js middleware protects routes by reading the
 * `bos_session` cookie. In a split deployment (frontend on Vercel, backend on
 * Render) the backend's Set-Cookie lands on the backend's domain, which the
 * middleware can't see. Setting it here — same domain as the middleware — makes
 * route protection work everywhere (local and split-domain prod).
 */
export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* sessionStorage may be unavailable (private mode) — cookie still works */
  }
  const secure = typeof location !== "undefined" && location.protocol === "https:";
  document.cookie =
    `${COOKIE_KEY}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax` +
    (secure ? "; Secure" : "");
}

/**
 * Get the stored token for the Axios interceptor.
 * Falls back to null if sessionStorage is unavailable (SSR).
 */
export function getStoredToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * SEC-06 FIX: Proper logout clears both:
 *   1. The JS-readable token from sessionStorage
 *   2. The HttpOnly cookie (via server-side API call that returns Set-Cookie: clear)
 *
 * Note: This is async. Call `await removeToken()` in logout handlers.
 */
export async function removeToken(): Promise<void> {
  // Clear JS-readable copy
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(TOKEN_KEY);
  }
  // Clear the middleware cookie on the frontend domain
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }

  // Ask the server to clear the HttpOnly cookie
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",  // send the HttpOnly cookie with the request
    });
  } catch {
    // If the server is down, the cookie will expire naturally (24h)
    // Client-side state is already cleared above
  }
}
