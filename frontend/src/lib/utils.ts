import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency */
export function formatCurrency(
  value: number,
  currency: "USD" | "INR" = "USD",
  compact = false
): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format percentage */
export function formatPct(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/** Get ROI color class */
export function roiColor(roi: number): string {
  if (roi >= 200) return "text-[#00A841]";
  if (roi >= 50) return "text-[#4C69F6]";
  if (roi >= 0) return "text-[#F6DB35]";
  return "text-[#EE5454]";
}

/** Get similarity score color */
export function similarityColor(score: number): string {
  if (score >= 0.8) return "text-[#00A841]";
  if (score >= 0.6) return "text-[#4C69F6]";
  if (score >= 0.4) return "text-[#F6DB35]";
  return "text-on-surface-variant";
}

/** Map genre to a brand color */
export const GENRE_COLORS: Record<string, string> = {
  Action: "#EE5454",
  "Sci-Fi": "#4C69F6",
  Drama: "#714B96",
  Comedy: "#F6DB35",
  Horror: "#1a1c1e",
  Thriller: "#00A841",
  Animation: "#F6DB35",
  Fantasy: "#714B96",
  Romance: "#EE5454",
  Documentary: "#4C69F6",
};

/** Clamp a number between min and max */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Delay helper */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
