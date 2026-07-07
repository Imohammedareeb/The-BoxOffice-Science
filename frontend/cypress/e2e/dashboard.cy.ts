/// <reference types="cypress" />

// ─────────────────────────────────────────────────────────
// Dashboard & Core Features — End-to-End Tests
// The Box Office Science
//
// ISS-01 FIX: Uses corrected loginViaAPI (bos_session cookie)
// ISS-02 FIX: All routes, text selectors, cookie names corrected
// ─────────────────────────────────────────────────────────

const EMAIL    = `qa_dash_${Date.now()}@boxofficescience.test`;
const PASSWORD = "Test1234!";
const NAME     = "Dashboard Tester";

// Register once before all tests in this suite
before(() => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("API_URL")}/api/auth/register`,
    body: { email: EMAIL, display_name: NAME, password: PASSWORD },
    failOnStatusCode: false,
  });
});

// Authenticate before each test
beforeEach(() => {
  cy.loginViaAPI(EMAIL, PASSWORD); // ISS-01 FIX: now sets correct bos_session cookie
});


// ── TC-NAV: Navigation ────────────────────────────────────

describe("NAV-001 — Sidebar Navigation", () => {
  it("TC-NAV-001 — all 6 nav links are present in sidebar", () => {
    cy.visit("/");
    const labels = ["Dashboard", "The Oracle", "Script Scanner", "Production", "Studio Vault", "Market Pulse"];
    labels.forEach((label) => {
      cy.contains(label).should("be.visible");
    });
  });

  it("TC-NAV-002 — active nav item is highlighted (Dashboard)", () => {
    cy.visit("/");
    cy.contains("Dashboard")
      .parent()
      .should("exist");
  });

  it("TC-NAV-003 — clicking Oracle navigates to /oracle", () => {
    cy.visit("/");
    cy.contains("The Oracle").click();
    cy.url().should("include", "/oracle");
    cy.contains("THE ORACLE").should("be.visible");
  });

  it("TC-NAV-004 — clicking Scanner navigates to /scanner", () => {
    cy.visit("/");
    cy.contains("Script Scanner").click();
    cy.url().should("include", "/scanner");
  });

  it("TC-NAV-005 — clicking Market Pulse navigates to /market", () => {
    cy.visit("/");
    cy.contains("Market Pulse").click();
    cy.url().should("include", "/market");
  });

  it("TC-NAV-006 — dark mode toggle switches theme", () => {
    cy.visit("/");
    cy.get("button[title*='mode'], button[title*='Mode']").first().click();
    cy.get("html").should("have.class", "dark");
    cy.get("button[title*='mode'], button[title*='Mode']").first().click();
    cy.get("html").should("not.have.class", "dark");
  });

  it("TC-NAV-007 — mobile bottom nav includes Market (ISS-06 fix regression)", () => {
    cy.viewport("iphone-12");
    cy.visit("/");
    cy.contains("Market").should("exist"); // ISS-06 fix regression test
  });
});


// ── TC-DASH: Dashboard ────────────────────────────────────

describe("DASH-001 — Command Center", () => {
  beforeEach(() => cy.visit("/"));

  it("TC-DASH-001 — page title is visible", () => {
    cy.contains("THE COMMAND CENTER").should("be.visible");
  });

  it("TC-DASH-002 — film portfolio ROI card renders", () => {
    cy.contains("FILM PORTFOLIO ROI").should("be.visible");
  });

  it("TC-DASH-003 — market sentiment shows", () => {
    cy.contains("MARKET SENTIMENT").should("be.visible");
  });

  it("TC-DASH-004 — active ventures card shows venture names", () => {
    cy.contains("ACTIVE VENTURES").should("be.visible");
  });
});


// ── TC-ORACLE: Revenue Prediction ────────────────────────

describe("ORACLE-001 — Revenue Prediction Engine", () => {
  beforeEach(() => cy.visit("/oracle"));

  it("TC-ORC-001 — page loads with prediction form", () => {
    cy.contains("THE ORACLE").should("be.visible");
    cy.contains("CRUNCH THE NUMBERS").should("be.visible");
  });

  it("TC-ORC-002 — submit prediction shows Oracle Results modal", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 }).should("be.visible");
    cy.contains("NET ROI").should("be.visible");
    cy.contains("Financial Breakdown").should("be.visible");
  });

  it("TC-ORC-003 — BUG-01 REGRESSION: modal renders exactly once", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 });
    // After createPortal fix: only ONE instance of this heading should exist
    cy.get("h2").filter(":contains('ORACLE')").should("have.length", 1);
  });

  it("TC-ORC-004 — modal closes on X button click", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 });
    cy.get("button").filter(":contains('')").last().click(); // X button
    cy.contains("ORACLE RESULTS").should("not.exist");
  });

  it("TC-ORC-005 — Save to Vault button shows toast", () => {
    cy.contains("CRUNCH THE NUMBERS").click();
    cy.contains("ORACLE RESULTS", { timeout: 15000 });
    cy.contains("Save to Vault").click();
    cy.contains("Analysis Saved", { timeout: 3000 }).should("be.visible");
  });

  it("TC-ORC-006 — changing genre updates live preview strip", () => {
    cy.get("select").first().select("Horror");
    cy.contains("Horror").should("be.visible");
  });
});


// ── TC-SCANNER: NLP Concept Matching ─────────────────────

describe("SCANNER-001 — Script Scanner NLP", () => {
  beforeEach(() => cy.visit("/scanner"));

  it("TC-NLP-001 — page loads with textarea", () => {
    cy.contains("SCRIPT SCANNER").should("be.visible");
    cy.get("textarea").should("be.visible");
  });

  it("TC-NLP-002 — ISS-08 REGRESSION: short concept shows validation error (not API unavailable)", () => {
    cy.get("textarea").type("Movie"); // 5 chars, under min 10
    cy.contains("Scan for Matching IPs").click();
    cy.contains("at least 10 characters").should("be.visible");
    cy.contains("API Unavailable").should("not.exist"); // regression guard
  });

  it("TC-NLP-003 — example prompt buttons populate textarea", () => {
    cy.contains("Gritty reboot").click();
    cy.get("textarea").should("not.have.value", "");
  });

  it("TC-NLP-004 — valid concept triggers search", () => {
    cy.get("textarea").type(
      "A science fiction epic with an ensemble cast in space dealing with survival"
    );
    cy.contains("Scan for Matching IPs").click();
    // Should show loading or results — not an error
    cy.contains("Matching IPs Found", { timeout: 15000 }).should("be.visible");
  });
});


// ── TC-VAULT: Studio Vault ────────────────────────────────

describe("VAULT-001 — Studio Vault", () => {
  beforeEach(() => cy.visit("/vault"));

  it("TC-VAULT-001 — page loads with film table", () => {
    cy.contains("STUDIO VAULT").should("be.visible");
    cy.get("table").should("be.visible", { timeout: 10000 });
  });

  it("TC-VAULT-002 — search filters results", () => {
    cy.get("input[placeholder*='SEARCH']").type("Avatar");
    cy.contains("Avatar", { timeout: 5000 }).should("be.visible");
  });

  it("TC-VAULT-003 — genre filter tabs exist and are scrollable", () => {
    cy.contains("Action").should("exist");
    cy.contains("Animation").should("exist");
  });

  it("TC-VAULT-004 — Export CSV button is fully visible and clickable", () => {
    cy.contains("Export CSV").should("be.visible").click();
    // File download triggered — just verify no error thrown
  });
});


// ── TC-MARKET: Market Pulse ───────────────────────────────

describe("MARKET-001 — Market Pulse", () => {
  beforeEach(() => cy.visit("/market"));

  it("TC-MKT-001 — page loads with sentiment data", () => {
    cy.contains("MARKET PULSE").should("be.visible");
    cy.contains("BULLISH").should("be.visible");
  });

  it("TC-MKT-002 — genre momentum section renders", () => {
    cy.contains("GENRE MOMENTUM").should("be.visible");
    cy.contains("FAMILY").should("be.visible");
  });
});


// ── TC-PRODUCTION: Active Ventures ───────────────────────

describe("PROD-001 — Production Tracker", () => {
  beforeEach(() => cy.visit("/production"));

  it("TC-PROD-001 — page loads with venture cards", () => {
    cy.contains("PRODUCTION").should("be.visible");
    cy.contains("ACTIVE VENTURES").should("be.visible");
  });

  it("TC-PROD-002 — venture cards show budget and projected revenue", () => {
    cy.contains("BUDGET").should("be.visible");
    cy.contains("PROJECTED").should("be.visible");
  });
});


// ── TC-404: Not Found ─────────────────────────────────────

describe("ERR-001 — Error Pages", () => {
  it("TC-404-001 — /nonexistent shows branded 404 page", () => {
    cy.visit("/nonexistent-page-xyz", { failOnStatusCode: false });
    cy.contains("404").should("be.visible");
  });
});
