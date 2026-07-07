/// <reference types="cypress" />

// ─────────────────────────────────────────────────────────
// Auth Flow — End-to-End Tests
// The Box Office Science
//
// ISS-01 FIX: Cookie name corrected (bos_token → bos_session)
// ISS-02 FIX: Routes corrected (/auth/login → /login, /auth/register → /signup)
// ISS-02 FIX: Text selectors match actual DOM
// ISS-02 FIX: Query param corrected (?redirect → ?from)
// ─────────────────────────────────────────────────────────

const EMAIL    = `qa_${Date.now()}@boxofficescience.test`;
const NAME     = "QA Analyst";
const PASSWORD = "Test1234!";

// ── AUTH-001: Unauthenticated Redirect ───────────────────

describe("AUTH-001 — Unauthenticated Redirect", () => {
  it("redirects / to /login when not authenticated", () => {
    cy.clearAuth();
    cy.visit("/", { failOnStatusCode: false });
    cy.url().should("include", "/login");           // ISS-02 FIX: was "/auth/login"
  });

  it("redirects /oracle to /login?from=/oracle", () => {
    cy.clearAuth();
    cy.visit("/oracle", { failOnStatusCode: false });
    cy.url().should("include", "/login");
    cy.url().should("include", "from");             // ISS-02 FIX: was "redirect"
  });

  it("allows /login to load without redirect loop", () => {
    cy.clearAuth();
    cy.visit("/login");                             // ISS-02 FIX: was "/auth/login"
    cy.url().should("include", "/login");
    cy.contains("Welcome Back").should("be.visible"); // ISS-02 FIX: was "Command Access"
  });

  it("allows /signup to load without redirect loop", () => {
    cy.clearAuth();
    cy.visit("/signup");                            // ISS-02 FIX: was "/auth/register"
    cy.url().should("include", "/signup");
    cy.contains("Join the Studio").should("be.visible");
  });
});

// ── AUTH-002: Registration Page UI ──────────────────────

describe("AUTH-002 — Registration Page UI", () => {
  beforeEach(() => {
    cy.clearAuth();
    cy.visit("/signup");                            // ISS-02 FIX: was "/auth/register"
  });

  it("shows all required form fields", () => {
    cy.get("input[autocomplete='name']").should("be.visible");
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").first().should("be.visible");
    cy.contains("Create Account").should("be.visible"); // ISS-02 FIX: was "Create Analyst Account"
    cy.contains("Sign in →").should("be.visible");
  });

  it("TC-REG-001 — shows inline error for short display name", () => {
    cy.get("input[autocomplete='name']").type("A").blur();
    cy.contains("at least 2 characters").should("be.visible");
  });

  it("TC-REG-002 — shows inline error for invalid email", () => {
    cy.get("input[type='email']").type("notanemail").blur();
    cy.contains("valid email").should("be.visible");
  });

  it("TC-REG-003 — shows password strength indicator on typing", () => {
    cy.get("input[type='password']").first().type("weak");
    cy.contains("Weak").should("be.visible");
  });

  it("TC-REG-004 — strong password shows green indicator", () => {
    cy.get("input[type='password']").first().type("Test1234!");
    cy.contains("Strong").should("be.visible");
  });

  it("TC-REG-005 — shows confirm password mismatch error", () => {
    cy.get("input[type='password']").first().type("Test1234!");
    cy.get("input[type='password']").last().type("Different1!").blur();
    cy.contains("do not match").should("be.visible");
  });

  it("TC-REG-006 — password toggle shows/hides password", () => {
    cy.get("input[type='password']").first().type("Test1234!");
    cy.get("button[aria-label='Show password']").first().click();
    cy.get("input[type='text']").first().should("have.value", "Test1234!");
    cy.get("button[aria-label='Hide password']").first().click();
    cy.get("input[type='password']").first().should("exist");
  });

  it("TC-REG-007 — navigates to login on 'Sign in' link", () => {
    cy.contains("Sign in →").click();
    cy.url().should("include", "/login");           // ISS-02 FIX: was "/auth/login"
  });

  it("TC-REG-008 — Platform Admin role is NOT available (security fix)", () => {
    cy.contains("Platform Admin").should("not.exist"); // ISS-05 regression test
  });
});

// ── AUTH-003: Login Page UI ──────────────────────────────

describe("AUTH-003 — Login Page UI", () => {
  beforeEach(() => {
    cy.clearAuth();
    cy.visit("/login");                             // ISS-02 FIX: was "/auth/login"
  });

  it("shows email, password fields and submit button", () => {
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").should("be.visible");
    cy.contains("Access Dashboard").should("be.visible");
  });

  it("TC-LOG-001 — shows error for empty email", () => {
    cy.get("input[type='email']").focus().blur();
    cy.contains("button", "Access Dashboard").click();
    cy.contains("Email is required").should("be.visible");
  });

  it("TC-LOG-002 — auto-fill demo fills both fields", () => {
    cy.contains("Auto-fill Demo Account").click();
    cy.get("input[type='email']").should("have.value", "demo@boxofficescience.ai");
  });

  it("TC-LOG-003 — invalid credentials shows error banner", () => {
    cy.get("input[type='email']").type("wrong@email.com");
    cy.get("input[type='password']").type("wrongpassword");
    cy.contains("button", "Access Dashboard").click();
    cy.contains("Invalid").should("be.visible", { timeout: 5000 });
  });
});

// ── AUTH-004: Full Login → Logout flow ──────────────────

describe("AUTH-004 — Login and Logout Flow", () => {
  before(() => cy.seedDemoUser());

  it("TC-AUTH-FLOW-001 — demo login redirects to dashboard", () => {
    cy.clearAuth();
    cy.visit("/login");
    cy.contains("Auto-fill Demo Account").click();
    cy.contains("button", "Access Dashboard").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`, { timeout: 10000 });
    cy.contains("THE COMMAND CENTER").should("be.visible");
  });

  it("TC-AUTH-FLOW-002 — logout clears bos_session cookie and redirects", () => {
    cy.loginViaAPI("demo@boxofficescience.ai", "Demo@1234");
    cy.visit("/");
    cy.contains("SIGN OUT").click();
    cy.getCookie("bos_session").should("not.exist"); // ISS-01 FIX: was "bos_token"
    cy.url().should("include", "/login");
  });

  it("TC-AUTH-FLOW-003 — protected route redirects after logout", () => {
    cy.clearAuth();
    cy.visit("/oracle", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});

// ── AUTH-005: Security Tests ─────────────────────────────

describe("AUTH-005 — Security", () => {
  it("TC-SEC-001 — XSS in email field is escaped, not executed", () => {
    cy.clearAuth();
    cy.visit("/login");
    cy.get("input[type='email']").type("<script>window.__xss=1</script>");
    cy.window().then((win) => {
      expect((win as any).__xss).to.be.undefined;
    });
  });

  it("TC-SEC-002 — XSS in name field on signup is escaped", () => {
    cy.clearAuth();
    cy.visit("/signup");
    cy.get("input[autocomplete='name']").type("<img onerror=\"window.__xss=1\" src=x>");
    cy.window().then((win) => {
      expect((win as any).__xss).to.be.undefined;
    });
  });
});
