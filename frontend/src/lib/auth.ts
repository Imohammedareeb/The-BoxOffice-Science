/**
 * Auth utility — client-side session management.
 *
 * BUG-02 FIX: hasJwtCookie() was checking document.cookie for "bos_session"
 * which is set as an HttpOnly cookie by the server. HttpOnly cookies CANNOT
 * be read by JavaScript — they are invisible to document.cookie.
 *
 * Result of the bug: hasJwtCookie() always returned false (even when logged in),
 * causing loadSession() to always clear localStorage and return null.
 * This means users were logged out on every page refresh.
 *
 * Fix: replaced hasJwtCookie() with hasSessionToken() which checks
 * sessionStorage for the JS-accessible token copy (bos_session_js).
 * This is the token stored by storeToken() in cookies.ts after login.
 *
 * Auth flow:
 *   1. User logs in → backend sets HttpOnly cookie (bos_session) + returns token in body
 *   2. Frontend: storeToken(token) → sessionStorage.setItem("bos_session_js", token)
 *   3. Frontend: saveSession(user) → localStorage.setItem("bos_user", user)
 *   4. On page load: loadSession() checks sessionStorage for token → if missing, clears localStorage
 *   5. Next.js middleware reads the HttpOnly cookie to protect server-side routes
 *   6. Axios reads sessionStorage token for API Bearer header
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "analyst" | "executive" | "admin";
  avatar?: string;
}

const AUTH_KEY  = "bos_user";
const TOKEN_KEY = "bos_session_js"; // JS-accessible copy of the JWT (not the HttpOnly one)

/**
 * BUG-02 FIX: Check sessionStorage for the JS-readable token copy.
 * This is the correct way to check if a user is still logged in
 * without trying to read the HttpOnly cookie (which is impossible from JS).
 */
function hasSessionToken(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token !== null && token.length > 0;
}

export function saveSession(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/**
 * BUG-02 FIX: Now checks sessionStorage token instead of HttpOnly cookie.
 * If the sessionStorage token is gone (tab closed, session expired, explicit logout),
 * clear the stale localStorage data to prevent phantom auth state.
 */
export function loadSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    // BUG-02 FIX: check the JS-accessible token, NOT document.cookie
    if (!hasSessionToken()) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return loadSession() !== null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}
