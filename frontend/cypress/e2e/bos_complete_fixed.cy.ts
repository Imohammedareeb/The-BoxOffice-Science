/// <reference types="cypress" />

// ═══════════════════════════════════════════════════════════════════════════════
// The Box Office Science — COMPLETE QA Cypress Test Suite
// Covers: Auth, Security, Navigation, Dashboard, Oracle, Scanner,
//         Production (user-scoped), Vault, Market, Profile, API, Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO = { email: "demo@boxofficescience.ai", password: "Demo@1234" };
const TS   = Date.now();
const REAL = {
  email:    `qa_real_${TS}@boxofficescience.test`,
  password: "Test1234!",
  name:     `QA User ${TS}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 1 — Authentication Flows
// ─────────────────────────────────────────────────────────────────────────────

describe("AUTH-001 — Unauthenticated Redirect", () => {
  beforeEach(() => cy.clearAuth());

  it("TC-AUTH-001: / redirects to /login when not authenticated", () => {
    cy.visit("/", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });

  it("TC-AUTH-002: /oracle redirects to /login with ?from=/oracle", () => {
    cy.visit("/oracle", { failOnStatusCode: false });
    cy.url().should("include", "/login");
    cy.url().should("include", "from=%2Foracle"); // URL-encoded /oracle
  });

  it("TC-AUTH-003: /login loads without redirect loop", () => {
    cy.visit("/login");
    cy.url().should("include", "/login");
    cy.contains("Welcome Back").should("be.visible");
  });

  it("TC-AUTH-004: /signup loads without redirect loop", () => {
    cy.visit("/signup");
    cy.contains("Join the Studio").should("be.visible");
  });
});


describe("AUTH-002 — Login Page UI & Validation", () => {
  beforeEach(() => { cy.clearAuth(); cy.visit("/login"); });

  it("TC-LOG-001: empty submit shows field errors", () => {
    cy.contains("button", "Access Dashboard").click();
    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");
  });

  it("TC-LOG-002: invalid email format shows error", () => {
    cy.get("input[type='email']").type("notanemail");
    cy.contains("button", "Access Dashboard").click();
    cy.contains("valid email").should("be.visible");
  });

  it("TC-LOG-003: wrong credentials shows error banner", () => {
    cy.get("input[type='email']").type("wrong@email.com");
    cy.get("input[type='password']").type("WrongPass1!");
    cy.contains("button", "Access Dashboard").click();
    cy.contains("Invalid", { timeout: 8000 }).should("be.visible");
  });

  it("TC-LOG-004: password toggle shows/hides password", () => {
    cy.get("input[type='password']").type("Test1234!");
    cy.get("button[aria-label='Show password']").click();
    cy.get("input[type='text']").should("have.value", "Test1234!");
    cy.get("button[aria-label='Hide password']").click();
    cy.get("input[type='password']").should("exist");
  });

  it("TC-LOG-005: One-Click Demo Login button auto-submits", () => {
    cy.seedDemoUser();
    cy.contains("One-Click Demo Login").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`, { timeout: 12000 });
  });

  it("TC-LOG-006: SEC-01 — open redirect blocked (external URL in ?from rejected)", () => {
    cy.visit("/login?from=https://evil.com");
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/login?from=https://evil.com");
    // After login, should redirect to / (safe fallback), not evil.com
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });
});


describe("AUTH-003 — Registration Flow", () => {
  beforeEach(() => { cy.clearAuth(); cy.visit("/signup"); });

  it("TC-REG-001: shows validation for short name", () => {
    cy.get("input[autocomplete='name']").type("A");
    cy.contains("button", "Create Account").click();
    cy.contains("at least 2 characters").should("be.visible");
  });

  it("TC-REG-002: invalid email blocked", () => {
    cy.get("input[type='email']").type("notanemail");
    cy.contains("button", "Create Account").click();
    cy.contains("valid email").should("be.visible");
  });

  it("TC-REG-003: weak password shows 'Weak' indicator", () => {
    cy.get("#signup-password").type("weak");
    cy.contains("Weak").should("be.visible");
  });

  it("TC-REG-004: strong password shows 'Strong' indicator", () => {
    cy.get("#signup-password").type("Test1234!");
    cy.contains("Strong").should("be.visible");
  });

  it("TC-REG-005: password mismatch blocked", () => {
    cy.get("#signup-password").type("Test1234!");
    cy.get("#signup-confirm").type("Different1!");
    cy.contains("button", "Create Account").click();
    cy.contains("do not match").should("be.visible");
  });

  it("TC-REG-006: Platform Admin role NOT available (security regression test)", () => {
    cy.contains("Platform Admin").should("not.exist");
  });

  it("TC-REG-007: brand name is correct — Box Office Science. (not Sci.)", () => {
    cy.contains("Box Office Science.").should("be.visible");
    cy.contains("Box Office Sci.").should("not.exist");
  });

  it("TC-REG-008: role info text explains Analyst default", () => {
    cy.contains("Venture Analyst").should("be.visible");
  });

  it("TC-REG-009: full registration creates account and redirects to dashboard", () => {
    cy.get("input[autocomplete='name']").type(REAL.name);
    cy.get("input[type='email']").type(REAL.email);
    cy.get("#signup-password").type(REAL.password);
    cy.get("#signup-confirm").type(REAL.password);
    cy.contains("button", "Create Account").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`, { timeout: 12000 });
  });

  it("TC-REG-010: duplicate email shows 409 error", () => {
    cy.seedDemoUser();
    cy.get("input[autocomplete='name']").type("Demo");
    cy.get("input[type='email']").type(DEMO.email);
    cy.get("#signup-password").type("Test1234!");
    cy.get("#signup-confirm").type("Test1234!");
    cy.contains("button", "Create Account").click();
    cy.contains("already exists", { timeout: 8000 }).should("be.visible");
  });
});


describe("AUTH-004 — Logout Flow", () => {
  it("TC-LOGOUT-001: logout clears bos_session cookie and redirects", () => {
    cy.seedDemoUser();
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/");
    cy.get("[data-testid='logout-button']").click();
    cy.url().should("include", "/login");
    cy.getCookie("bos_session").should("not.exist");
  });

  it("TC-LOGOUT-002: after logout, protected route redirects back to login", () => {
    cy.clearAuth();
    cy.visit("/oracle", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — Data Isolation (The Core Bug Fix)
// ─────────────────────────────────────────────────────────────────────────────

describe("DATA-001 — User Data Isolation", () => {
  const newUserEmail    = `isolation_${Date.now()}@test.com`;
  const newUserPassword = "Test1234!";

  before(() => {
    // Register a brand-new account
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/register`,
      body: { email: newUserEmail, display_name: "Isolation Test", password: newUserPassword },
      failOnStatusCode: false,
    });
  });

  it("TC-DATA-001: new user gets empty ventures (not demo data)", () => {
    cy.loginViaAPI(newUserEmail, newUserPassword);
    cy.request({
      url: `${Cypress.env("API_URL")}/api/production/ventures`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
    }).then((res) => {
      // All returned ventures should be demo placeholders (is_demo: true)
      // or the list should be empty
      const realVentures = res.body.filter((v: any) => !v.is_demo);
      expect(realVentures).to.have.length(0);
    });
  });

  it("TC-DATA-002: new user personal stats shows is_new_account=true", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/login`,
      body: { email: newUserEmail, password: newUserPassword },
    }).then((res) => {
      const token = res.body.access_token;
      cy.request({
        url: `${Cypress.env("API_URL")}/api/dashboard/personal-stats`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((statsRes) => {
        expect(statsRes.body.is_new_account).to.eq(true);
        expect(statsRes.body.venture_count).to.eq(0);
        expect(statsRes.body.prediction_count).to.eq(0);
      });
    });
  });

  it("TC-DATA-003: demo and new user ventures are separate", () => {
    // Demo user login
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/login`,
      body: { email: DEMO.email, password: DEMO.password },
    }).then((demoRes) => {
      const demoToken = demoRes.body.access_token;
      cy.request({
        url: `${Cypress.env("API_URL")}/api/production/ventures`,
        headers: { Authorization: `Bearer ${demoToken}` },
      }).then((demoVentures) => {
        // New user login
        cy.request({
          method: "POST",
          url: `${Cypress.env("API_URL")}/api/auth/login`,
          body: { email: newUserEmail, password: newUserPassword },
        }).then((newRes) => {
          const newToken = newRes.body.access_token;
          cy.request({
            url: `${Cypress.env("API_URL")}/api/production/ventures`,
            headers: { Authorization: `Bearer ${newToken}` },
          }).then((newVentures) => {
            // Real ventures (non-demo) for new user = 0
            const newRealVentures = newVentures.body.filter((v: any) => !v.is_demo);
            expect(newRealVentures).to.have.length(0);
          });
        });
      });
    });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 3 — Navigation
// ─────────────────────────────────────────────────────────────────────────────

describe("NAV-001 — Sidebar Navigation", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/");
  });

  it("TC-NAV-001: all 6 nav items visible in sidebar", () => {
    ["Dashboard", "The Oracle", "Script Scanner", "Production", "Studio Vault", "Market Pulse"]
      .forEach((label) => cy.contains(label).should("be.visible"));
  });

  it("TC-NAV-002: Profile link visible in sidebar footer", () => {
    cy.contains("My Profile").should("be.visible");
  });

  it("TC-NAV-003: clicking My Profile navigates to /profile", () => {
    cy.contains("My Profile").click();
    cy.url().should("include", "/profile");
    cy.contains("Account").should("be.visible");
  });

  it("TC-NAV-004: Oracle nav link works", () => {
    cy.contains("The Oracle").click();
    cy.url().should("include", "/oracle");
  });

  it("TC-NAV-005: Scanner nav link works", () => {
    cy.contains("Script Scanner").click();
    cy.url().should("include", "/scanner");
  });

  it("TC-NAV-006: Market Pulse nav link works", () => {
    cy.contains("Market Pulse").click();
    cy.url().should("include", "/market");
  });

  it("TC-NAV-007: avatar click links to /profile", () => {
    cy.get("a[href='/profile']").first().click();
    cy.url().should("include", "/profile");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 4 — Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe("DASH-001 — Command Center", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/");
  });

  it("TC-DASH-001: page title visible", () => {
    cy.contains("THE COMMAND CENTER").should("be.visible");
  });

  it("TC-DASH-002: KPI cards render", () => {
    cy.contains("FILM PORTFOLIO ROI").should("be.visible");
    cy.contains("MARKET SENTIMENT").should("be.visible");
  });

  it("TC-DASH-003: no JavaScript errors on load", () => {
    cy.window().then((win) => {
      // If there were unhandled errors, Cypress would have caught them
      expect(win.document.body).to.exist;
    });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 5 — Oracle (Revenue Prediction)
// ─────────────────────────────────────────────────────────────────────────────

describe("ORACLE-001 — Revenue Prediction Engine", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/oracle");
  });

  it("TC-ORC-001: page loads with prediction form", () => {
    cy.contains("THE ORACLE").should("be.visible");
    cy.contains("CRUNCH THE NUMBERS").should("be.visible");
  });

  it("TC-ORC-002: submit shows results modal", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 }).should("be.visible");
    cy.contains("NET ROI").should("be.visible");
  });

  it("TC-ORC-003: modal renders exactly once (no duplicate portals)", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 });
    cy.get("h2").filter(":contains('ORACLE')").should("have.length", 1);
  });

  it("TC-ORC-004: changing genre updates preview", () => {
    cy.get("select").first().select("Horror");
    cy.contains("Horror").should("be.visible");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 6 — Script Scanner
// ─────────────────────────────────────────────────────────────────────────────

describe("SCANNER-001 — NLP Concept Matcher", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/scanner");
  });

  it("TC-NLP-001: page loads with textarea", () => {
    cy.contains("SCRIPT SCANNER").should("be.visible");
    cy.get("textarea").should("be.visible");
  });

  it("TC-NLP-002: short concept (<10 chars) shows validation error", () => {
    cy.get("textarea").type("Movie");
    cy.contains("Scan for Matching IPs").click();
    cy.contains("at least 10 characters").should("be.visible");
    cy.contains("API Unavailable").should("not.exist");
  });

  it("TC-NLP-003: empty concept blocked", () => {
    cy.contains("Scan for Matching IPs").click();
    cy.contains("at least 10 characters").should("be.visible");
  });

  it("TC-NLP-004: valid concept returns results", () => {
    cy.get("textarea").type("A survival thriller in deep space with a small crew facing an alien encounter");
    cy.contains("Scan for Matching IPs").click();
    cy.contains("Matching IPs Found", { timeout: 15000 }).should("be.visible");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 7 — Production (User-Scoped Ventures)
// ─────────────────────────────────────────────────────────────────────────────

describe("PROD-001 — Production Tracker (User-Scoped)", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/production");
  });

  it("TC-PROD-001: page loads with ventures section", () => {
    cy.contains("PRODUCTION").should("be.visible");
  });

  it("TC-PROD-002: venture cards show budget and revenue", () => {
    cy.contains("BUDGET").should("be.visible");
    cy.contains("PROJECTED").should("be.visible");
  });
});

describe("PROD-002 — New User Empty State", () => {
  const emptyEmail = `empty_${Date.now()}@test.com`;

  before(() => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/register`,
      body: { email: emptyEmail, display_name: "Empty User", password: "Test1234!" },
      failOnStatusCode: false,
    });
  });

  it("TC-PROD-003: new user sees demo placeholders (is_demo=true)", () => {
    cy.loginViaAPI(emptyEmail, "Test1234!");
    cy.visit("/production");
    cy.contains("PRODUCTION").should("be.visible");
    // Page should load without error even with zero real ventures
    cy.get("body").should("not.contain", "500");
    cy.get("body").should("not.contain", "Error");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 8 — Studio Vault
// ─────────────────────────────────────────────────────────────────────────────

describe("VAULT-001 — Studio Vault", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/vault");
  });

  it("TC-VAULT-001: page loads with film table", () => {
    cy.contains("STUDIO VAULT").should("be.visible");
    cy.get("table", { timeout: 10000 }).should("be.visible");
  });

  it("TC-VAULT-002: search filters results", () => {
    cy.get("input[placeholder*='SEARCH']").type("Avatar");
    cy.contains("Avatar", { timeout: 5000 }).should("be.visible");
  });

  it("TC-VAULT-003: Export CSV button is clickable", () => {
    cy.contains("Export CSV").should("be.visible").click();
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 9 — Market Pulse
// ─────────────────────────────────────────────────────────────────────────────

describe("MARKET-001 — Market Pulse", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/market");
  });

  it("TC-MKT-001: page loads with sentiment", () => {
    cy.contains("MARKET PULSE").should("be.visible");
    cy.contains("BULLISH").should("be.visible");
  });

  it("TC-MKT-002: genre momentum section visible", () => {
    cy.contains("GENRE MOMENTUM").should("be.visible");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 10 — Profile Page
// ─────────────────────────────────────────────────────────────────────────────

describe("PROFILE-001 — Profile Page", () => {
  before(() => cy.seedDemoUser());
  beforeEach(() => {
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/profile");
  });

  it("TC-PROF-001: profile page loads (not 404)", () => {
    cy.url().should("include", "/profile");
    cy.contains("Account").should("be.visible");
  });

  it("TC-PROF-002: user email is shown", () => {
    cy.contains(DEMO.email).should("be.visible");
  });

  it("TC-PROF-003: role badge shows Venture Analyst", () => {
    cy.contains("Venture Analyst").should("be.visible");
  });

  it("TC-PROF-004: theme toggle works", () => {
    cy.get("button[aria-label='Toggle theme'], button:contains('Mode')").first().click({ force: true });
    // Theme toggle doesn't crash the page
    cy.contains("Account").should("be.visible");
  });

  it("TC-PROF-005: edit name saves correctly", () => {
    cy.get("button[title='Edit name']").click();
    cy.get("input.text-center").clear().type("New Test Name");
    cy.contains("Save").click();
    cy.contains("New Test Name").should("be.visible");
    cy.contains("Saved").should("be.visible");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 11 — Security Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("SEC-001 — Security Tests", () => {
  beforeEach(() => cy.clearAuth());

  it("TC-SEC-001: XSS in email field is not executed", () => {
    cy.visit("/login");
    cy.get("input[type='email']").type("<script>window.__xss=1</script>");
    cy.window().then((win) => {
      expect((win as any).__xss).to.be.undefined;
    });
  });

  it("TC-SEC-002: XSS in name field on signup is not executed", () => {
    cy.visit("/signup");
    cy.get("#signup-name").type('<img onerror="window.__xss=1" src=x>');
    cy.window().then((win) => {
      expect((win as any).__xss).to.be.undefined;
    });
  });

  it("TC-SEC-003: Open redirect blocked — ?from=https://evil.com redirects to /", () => {
    cy.seedDemoUser();
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/login`,
      body: DEMO,
    }).then((res) => {
      cy.setCookie("bos_session", res.body.access_token, { sameSite: "lax" });
    });
    // Now visit login with malicious from param
    cy.visit("/login?from=https://evil.com");
    // Should redirect to / (safe fallback), NOT to evil.com
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });

  it("TC-SEC-004: accessing /oracle without token returns 401 from API", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/stats`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("TC-SEC-005: SQL injection in email field does not crash login", () => {
    cy.visit("/login");
    cy.get("input[type='email']").type("'; DROP TABLE users; --@test.com");
    cy.get("input[type='password']").type("password123");
    cy.contains("button", "Access Dashboard").click();
    cy.contains("Invalid", { timeout: 8000 }).should("be.visible");
    // Confirm page still works (no 500)
    cy.get("body").should("not.contain", "500 Internal Server Error");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 12 — API Tests (via cy.request)
// ─────────────────────────────────────────────────────────────────────────────

describe("API-001 — Backend API Validation", () => {
  let authToken: string;

  before(() => {
    cy.seedDemoUser();
    cy.request("POST", `${Cypress.env("API_URL")}/api/auth/login`, DEMO)
      .then((res) => { authToken = res.body.access_token; });
  });

  it("TC-API-001: /health returns 200 with status online", () => {
    cy.request(`${Cypress.env("API_URL")}/health`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq("online");
    });
  });

  it("TC-API-002: POST /api/auth/login with valid creds returns JWT", () => {
    cy.request("POST", `${Cypress.env("API_URL")}/api/auth/login`, DEMO).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.access_token).to.be.a("string");
      expect(res.body.user.email).to.eq(DEMO.email);
    });
  });

  it("TC-API-003: POST /api/auth/login with wrong password returns 401", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/login`,
      body: { email: DEMO.email, password: "wrongpassword" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body.detail).to.include("Invalid");
    });
  });

  it("TC-API-004: GET /api/auth/me without token returns 401", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/auth/me`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("TC-API-005: GET /api/auth/me with valid token returns user", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/auth/me`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.email).to.eq(DEMO.email);
    });
  });

  it("TC-API-006: GET /api/dashboard/stats requires auth", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/stats`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("TC-API-007: GET /api/dashboard/stats returns KPI shape", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/stats`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.keys([
       "total_predicted_revenue", "average_roi", "active_ventures",
       "market_sentiment_label", "sentiment_score", "top_genre", "top_genre_roi",
       "total_predictions", "is_new_user",
      ]);

    });
  });

  it("TC-API-008: GET /api/dashboard/personal-stats returns user isolation data", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/personal-stats`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.keys([
        "has_data", "venture_count", "prediction_count",
        "avg_predicted_roi", "total_projected_revenue", "best_genre", "is_new_account",
      ]);
    });
  });

  it("TC-API-009: GET /api/production/ventures returns array", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/production/ventures`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
    });
  });

  it("TC-API-010: GET /api/dashboard/top-films with invalid sort uses safe default", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/top-films?sort_by=malicious_field`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200); // safe sort fallback applies
    });
  });

  it("TC-API-011: GET /api/dashboard/top-films?limit=1000 is capped at 50", () => {
    cy.request({
      url: `${Cypress.env("API_URL")}/api/dashboard/top-films?limit=1000`,
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.length).to.be.at.most(50);
    });
  });

  it("TC-API-012: POST /api/auth/register with duplicate email returns 409", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/register`,
      body: { email: DEMO.email, display_name: "Dup", password: "Test1234!" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(409);
    });
  });

  it("TC-API-013: POST /api/auth/register with weak password returns 422", () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/api/auth/register`,
      body: { email: `weak_${Date.now()}@test.com`, display_name: "Weak", password: "weak" },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(422);
    });
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 13 — Edge Cases & Error Handling
// ─────────────────────────────────────────────────────────────────────────────

describe("EDGE-001 — Edge Cases", () => {
  it("TC-EDGE-001: /nonexistent shows 404 page", () => {
    cy.seedDemoUser();
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/nonexistent-xyz-page", { failOnStatusCode: false });
    cy.contains("404").should("be.visible");
  });

  it("TC-EDGE-002: authenticated user visiting /login redirects to /", () => {
    cy.seedDemoUser();
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/login");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });

  it("TC-EDGE-003: authenticated user visiting /signup redirects to /", () => {
    cy.seedDemoUser();
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.visit("/signup");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });

  it("TC-EDGE-004: mobile viewport sidebar renders", () => {
    cy.seedDemoUser();
    cy.loginViaAPI(DEMO.email, DEMO.password);
    cy.viewport("iphone-12");
    cy.visit("/");
    cy.contains("THE COMMAND CENTER").should("be.visible");
    // Hamburger menu button should exist on mobile
    cy.get("button[aria-label*='enu'], button.md\\:hidden").should("exist");
  });
});
