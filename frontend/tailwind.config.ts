import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────
      // THE KINETIC CHRONICLE — Classic Superhero Palette
      // Material Design 3 Semantic Token System
      // ─────────────────────────────────────────────────
      colors: {
        // Brand: Action Triad
        "action-red": "#EE5454",
        "hero-blue": "#4C69F6",
        "classic-yellow": "#F6DB35",
        "villain-purple": "#714B96",
        "toxic-green": "#008f37",       // AA-compliant — matches CSS variable --toxic-green

        // Material Design 3 Surface Hierarchy (Light)
        primary: "#2e4edc",
        "on-primary": "#ffffff",
        "primary-container": "#4c69f6",
        "on-primary-container": "#ffffff",
        "primary-fixed": "#dee1ff",
        "primary-fixed-dim": "#bac3ff",
        "inverse-primary": "#bac3ff",
        "on-primary-fixed": "#001159",
        "on-primary-fixed-variant": "#0031c5",

        secondary: "#b2282e",
        "on-secondary": "#ffffff",
        "secondary-container": "#ff605f",
        "on-secondary-container": "#65000c",
        "secondary-fixed": "#ffdad7",
        "secondary-fixed-dim": "#ffb3af",
        "on-secondary-fixed": "#410005",
        "on-secondary-fixed-variant": "#900a1a",

        tertiary: "#6c5e00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#c3ab00",
        "on-tertiary-container": "#493f00",
        "tertiary-fixed": "#fee33d",
        "tertiary-fixed-dim": "#e1c71c",
        "on-tertiary-fixed": "#211c00",
        "on-tertiary-fixed-variant": "#514700",

        // Surface Tokens
        background: "#f9f9fc",
        "on-background": "#1a1c1e",
        surface: "#f9f9fc",
        "on-surface": "#1a1c1e",
        "surface-variant": "#e2e2e5",
        "on-surface-variant": "#444655",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f6",
        "surface-container": "#eeeef0",
        "surface-container-high": "#e8e8ea",
        "surface-container-highest": "#e2e2e5",
        "surface-bright": "#f9f9fc",
        "surface-dim": "#dadadc",
        "surface-tint": "#2f4edc",
        "inverse-surface": "#2f3133",
        "inverse-on-surface": "#f0f0f3",

        // Outline
        outline: "#757686",
        "outline-variant": "#c4c5d7",

        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Dark mode surface tokens
        "dark-background": "#121318",
        "dark-surface": "#121318",
        "dark-surface-container-lowest": "#0d0e13",
        "dark-surface-container-low": "#1a1c21",
        "dark-surface-container": "#1e2026",
        "dark-surface-container-high": "#282a30",
        "dark-surface-container-highest": "#33353b",
        "dark-on-surface": "#e3e2ea",
        "dark-on-surface-variant": "#c5c4d6",
        "dark-on-background": "#e3e2ea",
      },

      // ─────────────────────────────────────────────────
      // TYPOGRAPHY — The Kinetic Chronicle System
      // ─────────────────────────────────────────────────
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Work Sans", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"],
      },

      fontSize: {
        "display-lg": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-md": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-sm": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "headline-lg": ["2rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "headline-md": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },

      // ─────────────────────────────────────────────────
      // GEOMETRY — 0px border radius is our signature
      // ─────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "9999px", // Only for pill badges
      },

      // ─────────────────────────────────────────────────
      // BOX SHADOWS — Brand-tinted, never black
      // ─────────────────────────────────────────────────
      boxShadow: {
        "comic-sm": "4px 4px 0px 0px rgba(0,0,0,1)",
        "comic-md": "6px 6px 0px 0px rgba(0,0,0,1)",
        "comic-lg": "8px 8px 0px 0px rgba(0,0,0,1)",
        "comic-xl": "12px 12px 0px 0px rgba(0,0,0,1)",
        "hero-blue": "8px 8px 0px 0px #4C69F6",
        "action-red": "8px 8px 0px 0px #EE5454",
        "toxic-green": "8px 8px 0px 0px #00A841",
        "classic-yellow": "8px 8px 0px 0px #F6DB35",
        "villain-purple": "8px 8px 0px 0px #714B96",
        "ambient-blue": "0 40px 60px 0 rgba(76, 105, 246, 0.06)",
        "ambient-red": "0 40px 60px 0 rgba(238, 84, 84, 0.06)",
        "glass": "0 8px 32px 0 rgba(76, 105, 246, 0.08)",
      },

      // ─────────────────────────────────────────────────
      // ANIMATIONS
      // ─────────────────────────────────────────────────
      keyframes: {
        "kinetic-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "halftone-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "24px 24px" },
        },
        "speed-line": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "comic-pop": {
          "0%": { transform: "scale(0.8) rotate(-3deg)", opacity: "0" },
          "60%": { transform: "scale(1.05) rotate(1deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "kinetic-pulse": "kinetic-pulse 3s ease-in-out infinite",
        "halftone-drift": "halftone-drift 4s linear infinite",
        "speed-line": "speed-line 0.5s ease-out forwards",
        "comic-pop": "comic-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
      },

      // ─────────────────────────────────────────────────
      // SPACING — Cinematic gutters
      // ─────────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },

      // ─────────────────────────────────────────────────
      // GRID
      // ─────────────────────────────────────────────────
      gridTemplateColumns: {
        "bento-3": "repeat(3, 1fr)",
        "bento-4": "repeat(4, 1fr)",
        "bento-6": "repeat(6, 1fr)",
        "bento-12": "repeat(12, 1fr)",
      },

      transitionTimingFunction: {
        "comic-bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
