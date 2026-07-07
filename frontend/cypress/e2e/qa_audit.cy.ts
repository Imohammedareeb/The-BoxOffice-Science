/// <reference types="cypress" />

// ─────────────────────────────────────────────────────────
// QA Audit — End-to-End Suite
// The Box Office Science
//
// MED-07 FIX: All selectors corrected to match actual DOM
//   TC-01: uses correct nav label "Vault" (sidebar) not generic "Vault"
//   TC-02: Oracle uses range inputs + "CRUNCH THE NUMBERS" button
//   TC-03: Short concept shows validation error, not "No Records Found"
// ─────────────────────────────────────────────────────────

describe("The Box Office Science — QA Audit Suite", () => {
  before(() => cy.seedDemoUser());

  beforeEach(() => {
    cy.visit("/login");
    cy.contains("Auto-fill Demo Account").click();
    cy.contains("button", "Access Dashboard").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/", { timeout: 10000 });
  });

  it("TC-01: Navigation Flow — Command Center to Vault", () => {
    // MED-07 FIX: use SideNav "Studio Vault" label not generic "Vault"
    cy.contains("Studio Vault").click();
    cy.url().should("include", "/vault");
    cy.contains("STUDIO VAULT").should("be.visible");
  });

  it("TC-02: Predictor Logic — Positive Case", () => {
    cy.visit("/oracle");
    // MED-07 FIX: Oracle uses range input (type=range), not number input
    // MED-07 FIX: button text is "CRUNCH THE NUMBERS", not "Predict Revenue"
    cy.contains("CRUNCH THE NUMBERS").should("be.visible").click();
    // MED-07 FIX: results appear in portal modal, check for "ORACLE RESULTS"
    cy.contains("ORACLE RESULTS", { timeout: 15000 }).should("be.visible");
    cy.contains("NET ROI").should("be.visible");
  });

  it("TC-03: NLP Concept Matching — Word Count Edge Case", () => {
    cy.visit("/scanner");
    cy.get("textarea").type("Movie"); // 5 chars — under 10 char minimum
    cy.contains("Scan for Matching IPs").click();
    // MED-07 FIX: ISS-08 fix means short input shows validation error, not "No Records Found"
    cy.contains("at least 10 characters").should("be.visible");
  });

  it("TC-04: Theme Toggle — Dark/Light Mode", () => {
    cy.get("button[title*='mode'], button[title*='Mode']").first().click();
    cy.get("html").should("have.class", "dark");
    cy.get("button[title*='mode'], button[title*='Mode']").first().click();
    cy.get("html").should("not.have.class", "dark");
  });

  it("TC-05: Market Pulse — Sentiment Data Visible", () => {
    cy.visit("/market");
    cy.contains("MARKET PULSE").should("be.visible");
    cy.contains("GENRE MOMENTUM").should("be.visible");
  });

  it("TC-06: Logout Clears Session", () => {
    cy.contains("SIGN OUT").click();
    cy.getCookie("bos_session").should("not.exist");
    cy.url().should("include", "/login");
  });
});
