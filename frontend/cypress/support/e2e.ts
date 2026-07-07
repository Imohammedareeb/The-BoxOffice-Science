// Import custom commands
import "./commands";

/**
 * Global Cypress hooks
 *
 * uncaught:exception handler:
 *   Suppress non-fatal browser errors that aren't caused by our code:
 *   - ResizeObserver: browser quirk, not a real error
 *   - Loading chunk: Next.js hot-reload / code-split timing
 *   - NEXT_NOT_FOUND: expected for 404 tests
 *   - hydration errors in CI: Next.js SSR/CSR mismatch (harmless in tests)
 *
 *   Let all OTHER exceptions fail the test as normal.
 */
beforeEach(() => {
  cy.on("uncaught:exception", (err) => {
    const suppressPatterns = [
      "ResizeObserver loop",
      "Loading chunk",
      "NEXT_NOT_FOUND",
      "Hydration failed",
      "hydration",
      "minified React error",
      "Text content does not match",
    ];
    const shouldSuppress = suppressPatterns.some((p) =>
      err.message.toLowerCase().includes(p.toLowerCase())
    );
    return !shouldSuppress;
  });
});
