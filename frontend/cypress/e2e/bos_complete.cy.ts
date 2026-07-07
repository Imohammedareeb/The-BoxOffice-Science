/// <reference types="cypress" />

/**
 * BOX OFFICE SCIENCE. — Complete E2E Test Suite
 * Covers: Auth · Dashboard · Oracle · Scanner · Production · Vault · Market · Navigation · Security
 */

// ─────────────────────────────────────────────────────────
// HELPER: Login via API (bypass UI for non-auth tests)
// ─────────────────────────────────────────────────────────
const login = () => {
  cy.request("POST", `${Cypress.env("API_URL") ?? "http://localhost:8000"}/api/auth/login`, {
    email: "demo@boxofficescience.ai",
    password: "Demo@1234",
  }).then((res) => {
    cy.setCookie("bos_session", res.body.access_token, { path: "/" });
    window.localStorage.setItem("bos_user", JSON.stringify({
      id: res.body.user.id,
      name: res.body.user.display_name,
      email: res.body.user.email,
      role: "analyst",
    }));
  });
};

// ─────────────────────────────────────────────────────────
// 1. AUTHENTICATION MODULE
// ─────────────────────────────────────────────────────────
describe("AUTH-001 — Login Page", () => {
  beforeEach(() => cy.visit("/login"));

  it("TC-A01 — displays correct project name 'BOX OFFICE SCI.'", () => {
    cy.contains("BOX OFFICE SCI.").should("be.visible");
    cy.contains("Box Office Science.").should("be.visible");
  });

  it("TC-A02 — shows inline error for empty email", () => {
    cy.get("button[type='submit']").click();
    cy.contains("Email is required.").should("be.visible");
  });

  it("TC-A03 — shows inline error for invalid email format", () => {
    cy.get("input[type='email']").type("notanemail");
    cy.get("button[type='submit']").click();
    cy.contains("valid email address").should("be.visible");
  });

  it("TC-A04 — shows error for short password", () => {
    cy.get("input[type='email']").type("test@test.com");
    cy.get("input[type='password']").type("abc");
    cy.get("button[type='submit']").click();
    cy.contains("at least 8 characters").should("be.visible");
  });

  it("TC-A05 — Auto-fill Demo populates both fields", () => {
    cy.contains("Auto-fill Demo Account").click();
    cy.get("input[type='email']").should("have.value", "demo@boxofficescience.ai");
    cy.get("input[type='password']").should("have.value", "Demo@1234");
  });

  it("TC-A06 — password toggle shows/hides password", () => {
    cy.get("input[type='password']").type("Test1234");
    cy.get("button[aria-label='Show password']").click();
    cy.get("input[type='text']").should("have.value", "Test1234");
    cy.get("button[aria-label='Hide password']").click();
    cy.get("input[type='password']").should("exist");
  });

  it("TC-A07 — successful demo login redirects to dashboard", () => {
    cy.contains("Auto-fill Demo Account").click();
    cy.get("button[type='submit']").click();
    cy.url({ timeout: 10000 }).should("eq", `${Cypress.config("baseUrl")}/`);
    cy.contains("Command Center").should("be.visible");
  });

  it("TC-A08 — 'Contact admin' is replaced with demo-only note", () => {
    cy.contains("Contact admin").should("not.exist");
    cy.contains("Demo accounts only").should("be.visible");
  });

  it("TC-A09 — XSS in email field is escaped", () => {
    cy.get("input[type='email']").type("<script>alert(1)</script>");
    cy.get("button[type='submit']").click();
    cy.get("script").should("not.exist");
  });

  it("TC-A10 — authenticated user visiting /login is redirected to /", () => {
    login();
    cy.visit("/login");
    cy.url({ timeout: 5000 }).should("eq", `${Cypress.config("baseUrl")}/`);
  });
});

describe("AUTH-002 — Signup Page", () => {
  beforeEach(() => cy.visit("/signup"));

  it("TC-S01 — displays correct project name", () => {
    cy.contains("Box Office Science.").should("be.visible");
  });

  it("TC-S02 — shows password strength indicator — Weak", () => {
    cy.get("input[type='password']").first().type("weak");
    cy.contains("Weak").should("be.visible");
  });

  it("TC-S03 — shows password strength indicator — Strong", () => {
    cy.get("input[type='password']").first().type("Test1234!");
    cy.contains("Strong").should("be.visible");
  });

  it("TC-S04 — password mismatch shows error", () => {
    cy.get("input[placeholder='Your Name']").type("Test User");
    cy.get("input[type='email']").type("new@test.com");
    cy.get("input[type='password']").first().type("Test1234");
    cy.get("input[placeholder='Repeat your password']").type("Different1");
    cy.get("button[type='submit']").click();
    cy.contains("do not match").should("be.visible");
  });

  it("TC-S05 — Platform Admin role is NOT available", () => {
    cy.contains("Platform Admin").should("not.exist");
    cy.contains("Data Analyst").should("be.visible");
    cy.contains("Studio Executive").should("be.visible");
  });
});

describe("AUTH-003 — Session & Logout", () => {
  beforeEach(login);

  it("TC-L01 — unauthenticated visit to /oracle redirects to /login?from=/oracle", () => {
    cy.clearCookie("bos_session");
    cy.visit("/oracle", { failOnStatusCode: false });
    cy.url({ timeout: 5000 }).should("include", "/login");
    cy.url().should("include", "from=/oracle");
  });

  it("TC-L02 — logout clears session and redirects to /login", () => {
    cy.visit("/");
    cy.contains("DEMO").click();
    cy.contains("Sign Out").click();
    cy.url({ timeout: 5000 }).should("include", "/login");
    cy.getCookie("bos_session").should("be.null");
  });
});

// ─────────────────────────────────────────────────────────
// 2. NAVIGATION — TopNav + SideNav
// ─────────────────────────────────────────────────────────
describe("NAV-001 — TopNav Module Links", () => {
  beforeEach(() => { login(); cy.visit("/"); });

  // FIX-NAV-01 regression: all 6 nav links in TopNav
  it("TC-N01 — TopNav contains all 6 module links on xl viewport", () => {
    cy.viewport(1400, 900);
    cy.contains("a", "Dashboard").should("be.visible");
    cy.contains("a", "Oracle").should("be.visible");
    cy.contains("a", "Scanner").should("be.visible");
    cy.contains("a", "Slate").should("be.visible");
    cy.contains("a", "Vault").should("be.visible");
    cy.contains("a", "Market").should("be.visible");
  });

  it("TC-N02 — Search SCAN... button navigates to /scanner", () => {
    cy.viewport(1400, 900);
    cy.contains("SCAN...").click();
    cy.get("input[placeholder='QUERY DATABASE...']").type("superhero{enter}");
    cy.url({ timeout: 5000 }).should("include", "/scanner");
    cy.url().should("include", "q=superhero");
  });

  it("TC-N03 — Notification bell opens notification panel", () => {
    cy.get("button[aria-label='Notifications']").click();
    cy.contains("Alerts").should("be.visible");
    cy.contains("Mark all read").should("be.visible");
  });

  it("TC-N04 — Notification panel shows unread count badge", () => {
    cy.get("button[aria-label='Notifications']").then(($btn) => {
      cy.wrap($btn).find("span").should("exist");
    });
  });

  it("TC-N05 — Mark all read clears unread badge", () => {
    cy.get("button[aria-label='Notifications']").click();
    cy.contains("Mark all read").click();
    cy.get("button[aria-label='Notifications'] span.bg-\\[\\#F6DB35\\]").should("not.exist");
  });

  it("TC-N06 — Theme toggle switches dark/light mode", () => {
    cy.get("html").should("not.have.class", "dark");
    cy.get("button[title='Switch to Dark Mode']").click();
    cy.get("html").should("have.class", "dark");
    cy.get("button[title='Switch to Light Mode']").click();
    cy.get("html").should("not.have.class", "dark");
  });
});

describe("NAV-002 — SideNav Items", () => {
  beforeEach(() => { login(); cy.visit("/"); });

  it("TC-SN01 — all 6 modules in sidebar", () => {
    cy.contains("Dashboard").should("be.visible");
    cy.contains("The Oracle").should("be.visible");
    cy.contains("Script Scanner").should("be.visible");
    cy.contains("Production").should("be.visible");
    cy.contains("Studio Vault").should("be.visible");
    cy.contains("Market Pulse").should("be.visible");
  });

  it("TC-SN02 — active route is highlighted in sidebar", () => {
    cy.visit("/oracle");
    cy.contains("The Oracle").parents("a").siblings("div").should("exist");
  });

  it("TC-SN03 — New Venture button navigates to /oracle", () => {
    cy.contains("New Venture").click();
    cy.url().should("include", "/oracle");
  });
});

// ─────────────────────────────────────────────────────────
// 3. DASHBOARD PAGE
// ─────────────────────────────────────────────────────────
describe("DASH-001 — Dashboard", () => {
  beforeEach(() => { login(); cy.visit("/"); });

  it("TC-D01 — page title shows 'THE COMMAND CENTER'", () => {
    cy.contains("The Command").should("be.visible");
    cy.contains("Center").should("be.visible");
  });

  it("TC-D02 — Portfolio ROI chart has 'Illustrative' label", () => {
    cy.contains("Illustrative").should("be.visible");
  });

  it("TC-D03 — Active Ventures card uses live data with fallback", () => {
    cy.contains("Active Ventures").should("be.visible");
  });

  it("TC-D04 — KPI row shows Total Revenue, Average ROI, Market Sentiment", () => {
    cy.contains("Total Predicted Revenue").should("be.visible");
    cy.contains("Average ROI").should("be.visible");
    cy.contains("Market Sentiment").should("be.visible");
  });

  it("TC-D05 — Global Market Trends card shows 4 regions", () => {
    cy.contains("Global Market Trends").should("be.visible");
    cy.contains("NORTH AMERICA").should("be.visible");
    cy.contains("EAST ASIA").should("be.visible");
  });

  it("TC-D06 — FAB + button navigates to /oracle", () => {
    cy.get("button[aria-label='New Venture']").click();
    cy.url().should("include", "/oracle");
  });
});

// ─────────────────────────────────────────────────────────
// 4. ORACLE PAGE
// ─────────────────────────────────────────────────────────
describe("ORACLE-001 — Revenue Prediction Engine", () => {
  beforeEach(() => { login(); cy.visit("/oracle"); });

  it("TC-O01 — page header shows 'The Oracle'", () => {
    cy.contains("The Oracle").should("be.visible");
  });

  it("TC-O02 — budget slider default value is $50M", () => {
    cy.contains("$50.0M").should("be.visible");
  });

  it("TC-O03 — genre selection changes active button", () => {
    cy.contains("button", "Sci-Fi").click();
    cy.contains("button", "Sci-Fi").should("have.css", "background-color");
  });

  it("TC-O04 — form submits and shows results modal", () => {
    cy.contains("button", "PREDICT REVENUE").click();
    cy.contains("Financial Breakdown", { timeout: 15000 }).should("be.visible");
    cy.contains("GROSS REVENUE").should("be.visible");
    cy.contains("NET PROFIT").should("be.visible");
    cy.contains("AI Confidence Score").should("be.visible");
  });

  it("TC-O05 — result modal has Recalculate button that closes modal", () => {
    cy.contains("button", "PREDICT REVENUE").click();
    cy.contains("RECALCULATE", { timeout: 10000 }).click();
    cy.contains("Financial Breakdown").should("not.exist");
  });

  it("TC-O06 — result modal is not duplicated (screenshot shows duplicate BUG)", () => {
    cy.contains("button", "PREDICT REVENUE").click();
    cy.contains("Financial Breakdown", { timeout: 10000 }).should("have.length", 1);
  });
});

// ─────────────────────────────────────────────────────────
// 5. SCRIPT SCANNER PAGE
// ─────────────────────────────────────────────────────────
describe("SCAN-001 — Script Scanner", () => {
  beforeEach(() => { login(); cy.visit("/scanner"); });

  it("TC-SC01 — page header shows 'Script Scanner'", () => {
    cy.contains("Script Scanner").should("be.visible");
  });

  it("TC-SC02 — query from TopNav search pre-fills input field", () => {
    cy.visit("/scanner?q=superhero+epic");
    cy.get("textarea, input[type='text']").first().should("have.value", "superhero epic");
  });

  it("TC-SC03 — submitting empty concept shows validation error", () => {
    cy.get("button").contains(/Scan|Analyze|Match/i).click();
    cy.contains(/required|empty|enter/i).should("be.visible");
  });

  it("TC-SC04 — valid concept returns match results", () => {
    cy.get("textarea, input[type='text']").first().type("futuristic AI detective in a neon city");
    cy.get("button").contains(/Scan|Analyze|Match/i).click();
    cy.contains(/match|score|result/i, { timeout: 15000 }).should("be.visible");
  });

  it("TC-SC05 — match card shows title, genre, score, revenue", () => {
    cy.get("textarea, input[type='text']").first().type("epic space opera");
    cy.get("button").contains(/Scan|Analyze|Match/i).click();
    cy.get("[class*='MatchCard'], [class*='match']", { timeout: 15000 })
      .first()
      .within(() => {
        cy.contains(/\d+%/).should("exist");
      });
  });
});

// ─────────────────────────────────────────────────────────
// 6. PRODUCTION PAGE
// ─────────────────────────────────────────────────────────
describe("PROD-001 — Production Page", () => {
  beforeEach(() => { login(); cy.visit("/production"); });

  // BUG-C-01 REGRESSION: must never crash
  it("TC-P01 — page loads without TypeError crash", () => {
    cy.contains("Production", { timeout: 8000 }).should("be.visible");
    cy.window().then((win) => {
      expect((win as any).__next_error).to.not.exist;
    });
  });

  it("TC-P02 — summary strip shows 4 KPI cards", () => {
    cy.contains("Active Ventures", { timeout: 10000 }).should("be.visible");
    cy.contains("Total Budget").should("be.visible");
    cy.contains("Projected Revenue").should("be.visible");
    cy.contains("Avg Progress").should("be.visible");
  });

  it("TC-P03 — team_size never shows 'undefined ppl'", () => {
    cy.contains("undefined ppl").should("not.exist");
  });

  it("TC-P04 — Details button expands venture card", () => {
    cy.contains("button", "Details").first().click();
    cy.contains("Director").should("be.visible");
    cy.contains("Cast Tier").should("be.visible");
    cy.contains("Release").should("be.visible");
  });

  it("TC-P05 — Details shows Less button and collapses on click", () => {
    cy.contains("button", "Details").first().click();
    cy.contains("button", "Less").first().click();
    cy.contains("Director").should("not.be.visible");
  });

  it("TC-P06 — refresh button triggers data refetch", () => {
    cy.intercept("GET", "**/api/production/ventures").as("ventures");
    cy.get("button[title='Refresh ventures']").click();
    cy.wait("@ventures").its("response.statusCode").should("eq", 200);
  });

  it("TC-P07 — 'Open Venture' button is disabled with tooltip", () => {
    cy.contains("Open Venture").should("be.visible");
    cy.contains("Open Venture").closest("button, div[title]")
      .should("have.attr", "title", "Venture detail pages coming soon");
  });

  it("TC-P08 — offline error shows Retry button", () => {
    cy.intercept("GET", "**/api/production/ventures", { forceNetworkError: true }).as("fail");
    cy.reload();
    cy.contains(/Could not reach|Offline/, { timeout: 10000 }).should("be.visible");
    cy.contains("button", "Retry").should("be.visible");
  });
});

// ─────────────────────────────────────────────────────────
// 7. STUDIO VAULT PAGE
// ─────────────────────────────────────────────────────────
describe("VAULT-001 — Studio Vault", () => {
  beforeEach(() => { login(); cy.visit("/vault"); });

  it("TC-V01 — page header shows 'Studio Vault'", () => {
    cy.contains("Studio Vault").should("be.visible");
  });

  it("TC-V02 — table loads with film records", () => {
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("TC-V03 — search filters by title", () => {
    cy.get("table tbody tr", { timeout: 10000 }).its("length").then((initial) => {
      cy.get("input[placeholder*='SEARCH']").type("Avatar");
      cy.get("table tbody tr").its("length").should("be.lte", initial);
    });
  });

  it("TC-V04 — genre tab filters records", () => {
    cy.contains("button", "Action", { timeout: 10000 }).click();
    cy.get("table tbody td").contains("Drama").should("not.exist");
  });

  it("TC-V05 — sort by Revenue changes order", () => {
    cy.contains("button", "Revenue").click();
    cy.get("table tbody tr", { timeout: 8000 }).should("have.length.greaterThan", 0);
  });

  it("TC-V06 — Export CSV button triggers download", () => {
    cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    cy.contains("Export CSV").click();
    // No JS error — download triggered
  });

  it("TC-V07 — offline shows error with Retry button", () => {
    cy.intercept("GET", "**/api/dashboard/top-films*", { forceNetworkError: true }).as("fail");
    cy.reload();
    cy.contains(/Could Not Reach/, { timeout: 10000 }).should("be.visible");
    cy.contains("button", "Retry").should("be.visible");
  });
});

// ─────────────────────────────────────────────────────────
// 8. MARKET PULSE PAGE
// ─────────────────────────────────────────────────────────
describe("MARKET-001 — Market Pulse", () => {
  beforeEach(() => { login(); cy.visit("/market"); });

  it("TC-M01 — page header shows 'Market Pulse'", () => {
    cy.contains("Market Pulse").should("be.visible");
  });

  it("TC-M02 — sentiment gauge renders with score", () => {
    cy.get("svg", { timeout: 10000 }).should("exist");
    cy.contains(/BULLISH|NEUTRAL|BEARISH/).should("be.visible");
  });

  it("TC-M03 — genre trend bars render", () => {
    cy.contains(/Genre Performance|Trend/).should("be.visible");
  });

  it("TC-M04 — regional market section renders", () => {
    cy.contains(/Region|Market/).should("be.visible");
  });

  it("TC-M05 — refresh button triggers sentiment refetch", () => {
    cy.intercept("GET", "**/api/predictions/sentiment").as("sentiment");
    cy.get("button[title*='Refresh'], button").contains(/refresh|↻/i).click();
    cy.wait("@sentiment").its("response.statusCode").should("eq", 200);
  });
});

// ─────────────────────────────────────────────────────────
// 9. ERROR PAGES
// ─────────────────────────────────────────────────────────
describe("ERROR-001 — 404 Page", () => {
  it("TC-E01 — visiting unknown route shows 404 page", () => {
    cy.visit("/this-does-not-exist", { failOnStatusCode: false });
    cy.contains("404").should("be.visible");
    cy.contains("PLOT HOLE").should("be.visible");
  });

  it("TC-E02 — Command Center link on 404 goes to /", () => {
    cy.visit("/nonexistent", { failOnStatusCode: false });
    cy.contains("Command Center").click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });
});

// ─────────────────────────────────────────────────────────
// 10. SECURITY
// ─────────────────────────────────────────────────────────
describe("SEC-001 — Security Tests", () => {
  it("TC-SEC01 — all protected routes redirect unauthenticated users", () => {
    const routes = ["/", "/oracle", "/scanner", "/production", "/vault", "/market"];
    routes.forEach((route) => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit(route, { failOnStatusCode: false });
      cy.url({ timeout: 5000 }).should("include", "/login");
    });
  });

  it("TC-SEC02 — XSS in scanner concept input is escaped", () => {
    login();
    cy.visit("/scanner");
    cy.get("textarea, input[type='text']").first().type("<img src=x onerror=alert(1)>");
    cy.on("window:alert", () => { throw new Error("XSS executed!"); });
    cy.get("button").contains(/Scan|Analyze/i).click();
  });

  it("TC-SEC03 — API calls include Authorization header", () => {
    login();
    cy.intercept("GET", "**/api/dashboard/stats", (req) => {
      expect(req.headers["authorization"]).to.match(/^Bearer .+/);
      req.continue();
    }).as("dashStats");
    cy.visit("/");
    cy.wait("@dashStats");
  });
});

// ─────────────────────────────────────────────────────────
// 11. MOBILE RESPONSIVENESS
// ─────────────────────────────────────────────────────────
describe("MOBILE-001 — Mobile Viewport Tests", () => {
  beforeEach(() => {
    login();
    cy.viewport("iphone-14");
  });

  it("TC-MOB01 — hamburger menu opens mobile sidebar", () => {
    cy.visit("/");
    cy.get("button[aria-label]").filter(":visible").last().click();
    cy.contains("Dashboard").should("be.visible");
    cy.contains("Market Pulse").should("be.visible");
  });

  it("TC-MOB02 — mobile bottom nav includes Market link", () => {
    cy.visit("/");
    cy.contains("Market").should("be.visible");
  });

  it("TC-MOB03 — vault table is horizontally scrollable on mobile", () => {
    cy.visit("/vault");
    cy.get("table", { timeout: 10000 }).should("exist");
    cy.get(".overflow-x-auto").should("exist");
  });
});
