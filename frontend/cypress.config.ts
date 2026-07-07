import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx,js}",
    supportFile: "cypress/support/e2e.ts",

    // Viewport
    viewportWidth:  1280,
    viewportHeight: 800,

    // Timeouts (generous for a full-stack app with DB queries)
    defaultCommandTimeout: 12000,
    requestTimeout:        20000,
    responseTimeout:       20000,
    pageLoadTimeout:       40000,
    execTimeout:           60000,

    // Retries: 1 in CI, 0 in local interactive
    retries: {
      runMode:  1,
      openMode: 0,
    },

    video:                    false,
    screenshotOnRunFailure:   true,
    chromeWebSecurity:        false, // Allow cross-origin API requests in tests

    // Environment variables (override via cypress.env.json or --env flag)
    env: {
      API_URL: "http://localhost:8000",
    },

    setupNodeEvents(on, config) {
      // Register tasks if needed (e.g., DB seeding via node)
      on("task", {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
