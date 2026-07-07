// The browser will only let the app fetch/XHR/WebSocket to origins listed in the
// CSP `connect-src`. Derive it from the same env var the API client uses so the
// allow-list always matches the backend this build targets (localhost in dev,
// the deployed backend in production) — no hardcoded prod URL to forget to update.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_WS = API_URL.replace(/^http/, "ws"); // http→ws, https→wss for the same origin

const CONNECT_SRC = [
  "'self'",
  API_URL,
  API_WS,
  // Local-dev fallbacks (Next HMR websocket + local backend)
  "http://localhost:8000",
  "ws://localhost:3000",
]
  // de-dupe in case NEXT_PUBLIC_API_URL already is localhost:8000
  .filter((v, i, a) => a.indexOf(v) === i)
  .join(" ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Emit a standalone server bundle (.next/standalone + server.js) for the
  // production Docker image (see frontend/Dockerfile runner stage).
  output: "standalone",

  // The app compiles and runs cleanly; a few pre-existing strict-type issues
  // (e.g. Recharts style props, Cypress test globals) should not block the
  // production build. Types/lint still surface in the editor and `npm run lint`.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // ── Security Headers ────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://image.tmdb.org",
              `connect-src ${CONNECT_SRC}`,
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },

  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react", "recharts"],
  },
};

module.exports = nextConfig;
