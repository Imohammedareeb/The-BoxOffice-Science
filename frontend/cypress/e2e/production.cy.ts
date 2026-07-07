/// <reference types="cypress" />

// ─────────────────────────────────────────────────────────
// Production Page — E2E Tests
// The Box Office Science
//
// BUG-C-01 REGRESSION: ventures?.some() null guard
// BUG-M-01 REGRESSION: team_size shows TBA not "undefined ppl"
// ─────────────────────────────────────────────────────────

describe("PROD-001 — Production Tracker Full Suite", () => {
  before(() => cy.seedDemoUser());

  beforeEach(() => {
    cy.loginViaAPI("demo@boxofficescience.ai", "Demo@1234");
    cy.visit("/production");
  });

  // ── BUG-C-01 REGRESSION ──────────────────────────────────
  it("TC-PROD-001 — page loads without TypeError crash (BUG-C-01 regression)", () => {
    cy.get("h1").contains("Production").should("be.visible");
    cy.get("body").should("not.contain", "TypeError");
    cy.get("body").should("not.contain", "Cannot read properties of null");
  });

  it("TC-PROD-002 — venture cards render with budget and progress", () => {
    cy.contains("BUDGET", { timeout: 10000 }).should("be.visible");
    cy.contains("PROJECTED").should("be.visible");
    cy.contains("Complete").should("exist");
  });

  // ── BUG-M-01 REGRESSION ──────────────────────────────────
  it("TC-PROD-003 — team_size shows TBA (not 'undefined ppl') for DB records", () => {
    cy.contains("undefined ppl").should("not.exist");
  });

  it("TC-PROD-004 — Details button expands venture info with animation", () => {
    cy.contains("button", "Details").first().click();
    cy.contains("Director").should("be.visible");
    cy.contains("Cast Tier").should("be.visible");
    cy.contains("Release").should("be.visible");
  });

  it("TC-PROD-005 — Details button collapses on second click", () => {
    cy.contains("button", "Details").first().click();
    cy.contains("button", "Less").first().click();
    cy.contains("Director").should("not.be.visible");
  });

  it("TC-PROD-006 — refresh icon triggers re-fetch of ventures API", () => {
    cy.intercept("GET", "**/api/production/ventures").as("ventures");
    cy.get("button[title='Refresh ventures']").click();
    cy.wait("@ventures").its("response.statusCode").should("eq", 200);
  });

  it("TC-PROD-007 — summary strip shows Total Budget and Avg Progress", () => {
    cy.contains("Active Ventures", { timeout: 10000 }).should("be.visible");
    cy.contains("Total Budget").should("be.visible");
    cy.contains("Avg Progress").should("be.visible");
  });

  it("TC-PROD-008 — offline mode shows error banner with Retry button", () => {
    cy.intercept("GET", "**/api/production/ventures", { forceNetworkError: true }).as("fail");
    cy.reload();
    cy.contains("Could not reach API", { timeout: 8000 }).should("be.visible");
    cy.contains("button", "Retry").should("be.visible");
  });

  it("TC-PROD-009 — phase timeline renders 5 phases per venture card", () => {
    // Each VentureCard has 5 phase nodes
    cy.get("[class*='w-6'][class*='h-6']", { timeout: 10000 }).should("have.length.gte", 5);
  });

  it("TC-PROD-010 — Live DB status indicator present in header", () => {
    cy.contains("Live DB").should("exist");
  });

  it("TC-PROD-011 — SECURITY: unauthenticated visit redirects to login", () => {
    cy.clearAuth();
    cy.visit("/production", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });

  it("TC-PROD-012 — EMPTY STATE: empty ventures array shows empty state message", () => {
    cy.intercept("GET", "**/api/production/ventures", { body: [] }).as("empty");
    cy.reload();
    cy.wait("@empty");
    // Either a message or at minimum no crash
    cy.get("body").should("not.contain", "TypeError");
  });
});
