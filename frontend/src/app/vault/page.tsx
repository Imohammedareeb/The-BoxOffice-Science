"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { Search, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTopFilms } from "@/hooks/useApi";
import type { TopFilm } from "@/lib/api";

const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  "Action":          { bg: "#EE5454", text: "#fff" },
  "Sci-Fi":          { bg: "#4C69F6", text: "#fff" },
  "Science Fiction": { bg: "#4C69F6", text: "#fff" },
  "Fantasy":         { bg: "#714B96", text: "#fff" },
  "Horror":          { bg: "#1a1c1e", text: "#fff" },
  "Animation":       { bg: "#F6DB35", text: "#1a1c1e" },
  "Family":          { bg: "#F6DB35", text: "#1a1c1e" },
  "Thriller":        { bg: "#00A841", text: "#fff" },
  "Crime":           { bg: "#EE5454", text: "#fff" },
  "Adventure":       { bg: "#4C69F6", text: "#fff" },
  "Drama":           { bg: "#714B96", text: "#fff" },
};

function fmtM(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

// Deterministic skeleton widths — avoids Next.js SSR/CSR hydration mismatch
const SKELETON_WIDTHS = [
  [72, 55, 35, 65, 70, 45, 80, 60],
  [85, 50, 35, 60, 75, 50, 65, 55],
  [68, 60, 35, 70, 68, 40, 90, 50],
  [78, 55, 35, 55, 80, 55, 72, 65],
  [90, 50, 35, 65, 72, 45, 60, 70],
  [70, 65, 35, 75, 65, 50, 85, 55],
];

function TableSkeleton() {
  return (
    <>
      {SKELETON_WIDTHS.map((cols, i) => (
        <tr key={i} className="border-t border-black/05 dark:border-white/05">
          {cols.map((w, j) => (
            <td key={j} className="px-5 py-4">
              <div
                className="shimmer-loading h-3 rounded-none"
                style={{ width: `${w}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function exportToCSV(rows: any[], filename = "studio_vault.csv") {
  if (!rows.length) {
    // Show user feedback instead of silently doing nothing
    alert("No records to export. The Studio Vault is empty — seed the database first.");
    return;
  }
  const headers = ["Title", "Genre", "Year", "Budget ($)", "Box Office ($)", "ROI (%)", "Director", "Studio"];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csvLines = [
    headers.join(","),
    ...rows.map((r: any) =>
      [r.title, r.genre, r.year, r.budget, r.box_office, r.roi.toFixed(2), r.director ?? "", r.studio ?? ""]
        .map(escape)
        .join(",")
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function VaultPage() {
  const [search,  setSearch]  = useState("");
  const [genre,   setGenre]   = useState("All");
  const [sortBy,  setSortBy]  = useState<"roi" | "box_office" | "year">("roi");

  const { data: films, isLoading, error, refetch } = useTopFilms(50, sortBy);

  // All unique genres from the live data
  const genres = useMemo(() => {
    if (!films) return ["All"];
    const unique = Array.from(new Set(films.map((f) => f.genre))).sort();
    return ["All", ...unique];
  }, [films]);

  const filtered: TopFilm[] = useMemo(() => {
    if (!films) return [];
    return films
      .filter((r) => genre === "All" || r.genre === genre)
      .filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.director ?? "").toLowerCase().includes(search.toLowerCase())
      );
  }, [films, genre, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        <div
          className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #00A841 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            opacity: 0.1,
          }}
        />
        <div className="flex items-end gap-4 mb-3">
          <span className="bg-[#00A841] text-white px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">
            PHASE 05
          </span>
          <h1
            className="headline-bleed text-on-background dark:text-dark-on-background"
            style={{ textShadow: "4px 4px 0px #00A841" }}
          >
            Studio Vault
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-[#00A841]" />
          <p className="font-label font-bold text-[#00A841] tracking-[0.2em] text-sm uppercase">
            Historical IP & Financial Archive
          </p>
          {/* Live DB indicator */}
          <span className="ml-auto flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: error ? "#EE5454" : "#00A841" }}
            />
            <span style={{ color: error ? "#EE5454" : "#00A841" }}>
              {error ? "Offline" : "Live DB"}
            </span>
          </span>
        </div>
      </header>

      {/* Controls */}
      <BentoCard className="mb-6" noPadding>
        <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="flex items-center gap-2 border-b-[3px] border-[#00A841] pb-1.5 flex-1">
            <Search size={14} className="text-[#008f37]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH TITLE OR DIRECTOR..."
              className="bg-transparent font-label text-xs uppercase tracking-widest outline-none text-on-surface dark:text-dark-on-surface placeholder:text-on-surface-variant/40 flex-1"
            />
          </div>
          {/* Sort */}
          <div className="flex items-center gap-2">
            {(["roi", "box_office", "year"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "font-label text-[10px] uppercase tracking-widest px-3 py-2 border-2 transition-colors",
                  sortBy === s
                    ? "bg-[#00A841] text-white border-black"
                    : "border-black/10 dark:border-white/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:border-[#00A841]"
                )}
              >
                {s === "box_office" ? "Revenue" : s}
              </button>
            ))}
            <motion.button
              onClick={refetch}
              className="p-2 border-2 border-black/10 dark:border-white/10 text-on-surface-variant dark:text-dark-on-surface-variant hover:border-[#00A841] hover:text-[#00A841] transition-colors"
              whileTap={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              title="Refresh from DB"
            >
              <RefreshCw size={14} />
            </motion.button>
          </div>
        </div>
        {/* Dynamic genre tabs from live data — MED-02 FIX: flex-shrink-0 prevents compression */}
        <div className="flex overflow-x-auto no-scrollbar border-t-2 border-black/10 dark:border-white/10">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={cn(
                "px-5 py-3 font-label text-[10px] uppercase tracking-widest font-bold whitespace-nowrap border-b-[3px] -mb-[2px] transition-colors flex-shrink-0",
                genre === g
                  ? "border-[#00A841] text-[#00A841]"
                  : "border-transparent text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface dark:hover:text-dark-on-surface"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* Records table */}
      <BentoCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full font-label text-[11px]">
            <thead>
              <tr className="bg-surface-container dark:bg-dark-surface-container-high">
                {["Title", "Genre", "Year", "Budget", "Box Office", "ROI", "Director", "Studio"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left uppercase tracking-widest font-bold text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((r, i) => {
                    const gc = GENRE_COLORS[r.genre] ?? { bg: "#4C69F6", text: "#fff" };
                    const roiColor =
                      r.roi >= 300 ? "#00A841" :
                      r.roi >= 150 ? "#4C69F6" :
                      r.roi >= 50  ? "#F6DB35" : "#EE5454";
                    return (
                      <motion.tr
                        key={r.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                        className="border-t border-black/05 dark:border-white/05 hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-4 font-headline font-black text-xs uppercase group-hover:text-[#4C69F6] transition-colors whitespace-nowrap">
                          {r.title}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="px-2 py-0.5 text-[9px] font-black uppercase whitespace-nowrap"
                            style={{ background: gc.bg, color: gc.text }}
                          >
                            {r.genre}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant dark:text-dark-on-surface-variant">
                          {r.year}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">
                          {fmtM(r.budget)}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#4C69F6] whitespace-nowrap">
                          {fmtM(r.box_office)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-black text-sm" style={{ color: roiColor }}>
                            +{r.roi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">
                          {r.director ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">
                          {r.studio ?? "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && !error && (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <p className="font-headline font-black text-xl text-on-surface/20 dark:text-dark-on-surface/20 uppercase">
                No Records Found
              </p>
              <Link href="/scanner">
                <ComicButton variant="primary" size="sm">
                  Scan New Concept →
                </ComicButton>
              </Link>
            </div>
          )}

          {error && (
            <div className="py-10 px-6 flex flex-col items-center gap-3">
              <p className="font-headline font-black text-sm uppercase text-[#EE5454]">
                Could Not Reach Database
              </p>
              <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant text-center max-w-xs">
                {error}
              </p>
              <ComicButton variant="secondary" size="sm" onClick={refetch}>
                Retry
              </ComicButton>
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-surface-container dark:bg-dark-surface-container-high border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
            {isLoading ? "Loading..." : `${filtered.length} of ${films?.length ?? 0} records · Sorted by ${sortBy.toUpperCase()}`}
          </p>
          <ComicButton variant="ghost" size="sm" onClick={() => exportToCSV(filtered)}>Export CSV</ComicButton>
        </div>
      </BentoCard>
    </motion.div>
  );
}
