/// <reference types="cypress" />

/**
 * Cypress Custom Commands v3
 *
 * clearAuth    — clears cookies + localStorage + sessionStorage
 * seedDemoUser — idempotently creates demo account (409 = already exists, OK)
 * seedAndLogin — seeds demo user then logs in via API (bypasses UI for speed)
 *
 * Why loginViaAPI instead of UI login?
 * UI login is slow (page load + form fill + submit + redirect).
 * For test setup (beforeEach), API login is 10x faster.
 * We still test UI login in AUTH-04 suite specifically.
 */

declare global {
  namespace Cypress {
    interface Chainable {
      clearAuth(): Chainable<void>;
      seedDemoUser(): Chainable<void>;
      seedAndLogin(email: string, password: string): Chainable<void>;
    }
  }
}

const API = () => Cypress.env("API_URL") || "http://localhost:8000";

// ── clearAuth ────────────────────────────────────────────────
Cypress.Commands.add("clearAuth", () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    try { win.sessionStorage.clear(); } catch { /* SSR guard */ }
  });
});

// ── seedDemoUser ─────────────────────────────────────────────
Cypress.Commands.add("seedDemoUser", () => {
  cy.request({
    method: "POST",
    url: `${API()}/api/auth/register`,
    body: {
      email:        "demo@boxofficescience.ai",
      display_name: "Demo Analyst",
      password:     "Demo@1234",
    },
    failOnStatusCode: false, // 409 (already exists) is acceptable
  }).then((res) => {
    if (res.status !== 201 && res.status !== 409) {
      throw new Error(`seedDemoUser: unexpected status ${res.status} — is the backend running?`);
    }
  });
});

// ── seedAndLogin ─────────────────────────────────────────────
Cypress.Commands.add("seedAndLogin", (email: string, password: string) => {
  cy.clearAuth();

  cy.request({
    method: "POST",
    url: `${API()}/api/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    if (res.status !== 200) {
      throw new Error(`seedAndLogin: login failed (${res.status}) for ${email}. Is demo user seeded?`);
    }

    const { access_token, user } = res.body;

    // Set bos_session cookie (Next.js middleware reads this to verify auth)
    cy.setCookie("bos_session", access_token, {
      path:     "/",
      sameSite: "lax",
      // httpOnly must be false here — Cypress cannot set HttpOnly cookies
      // The middleware will still read the cookie value and jwtVerify() it
    });

    // Set sessionStorage token (Axios interceptor + auth.ts hasSessionToken())
    // BUG-02 fix: auth.ts now checks sessionStorage not document.cookie
    cy.window().then((win) => {
      win.sessionStorage.setItem("bos_session_js", access_token);
      win.localStorage.setItem(
        "bos_user",
        JSON.stringify({
          id:    user.id,
          name:  user.display_name,
          email: user.email,
          role:  (user.tier ?? "analyst").toLowerCase(),
        })
      );
    });

    // Store in Cypress env for use in cy.request() headers
    Cypress.env("token", access_token);
    Cypress.env("userId", user.id);
  });
});

export {};
