"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { useGenreBreakdown } from "@/hooks/useApi";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";

// ── Mock data ─────────────────────────────────────────────
const GENRE_DATA = [
  { genre: "Action", budget: 145, revenue: 412, profit: 267, roi: 184 },
  { genre: "Sci-Fi", budget: 180, revenue: 448, profit: 268, roi: 149 },
  { genre: "Animation", budget: 160, revenue: 510, profit: 350, roi: 219 },
  { genre: "Comedy", budget: 60, revenue: 144, profit: 84, roi: 140 },
  { genre: "Drama", budget: 45, revenue: 98, profit: 53, roi: 118 },
  { genre: "Horror", budget: 25, revenue: 88, profit: 63, roi: 252 },
  { genre: "Thriller", budget: 70, revenue: 168, profit: 98, roi: 140 },
  { genre: "Fantasy", budget: 210, revenue: 588, profit: 378, roi: 180 },
];

const RADAR_DATA = [
  { metric: "ROI", Action: 184, Horror: 252, Animation: 219 },
  { metric: "Risk", Action: 60, Horror: 30, Animation: 50 },
  { metric: "Audience", Action: 90, Horror: 70, Animation: 95 },
  { metric: "Longevity", Action: 75, Horror: 60, Animation: 90 },
  { metric: "Franchise\nPotential", Action: 88, Horror: 55, Animation: 92 },
  { metric: "Awards", Action: 40, Horror: 35, Animation: 70 },
];

const SEASON_PERFORMANCE = [
  { season: "Summer", avgRevenue: 410, releases: 48, hit_rate: 68 },
  { season: "Holiday", avgRevenue: 380, releases: 32, hit_rate: 72 },
  { season: "Spring", avgRevenue: 240, releases: 44, hit_rate: 52 },
  { season: "Fall", avgRevenue: 195, releases: 56, hit_rate: 48 },
  { season: "Winter", avgRevenue: 145, releases: 38, hit_rate: 40 },
];

const SCATTER_DATA = GENRE_DATA.map((g) => ({
  x: g.budget,
  y: g.revenue,
  z: g.roi,
  name: g.genre,
}));

const GENRE_COLORS: Record<string, string> = {
  Action: "#EE5454",
  "Sci-Fi": "#4C69F6",
  Animation: "#F6DB35",
  Comedy: "#00A841",
  Drama: "#714B96",
  Horror: "#1a1c1e",
  Thriller: "#00A841",
  Fantasy: "#4C69F6",
};

// ── Custom Tooltip ────────────────────────────────────────
const ComicTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1c1e] border-3 border-[#4C69F6] p-3 font-headline shadow-[4px_4px_0_0_#4C69F6]">
      <p className="text-[#F6DB35] font-black text-xs uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-[11px]">
          <span style={{ color: p.color }} className="uppercase tracking-wide">{p.name}</span>
          <span className="text-white font-black">{typeof p.value === "number" ? `$${p.value}M` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Chart 1: Genre Budget vs Revenue Bars ─────────────────
function GenreBudgetChart({ data }: { data: typeof GENRE_DATA }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="h-72">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="genre"
              tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans", fill: "#757686" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip content={<ComicTooltip />} />
            <Bar dataKey="budget" name="Budget" fill="#714B96" radius={[0, 0, 0, 0]} maxBarSize={18} />
            <Bar dataKey="revenue" name="Revenue" fill="#4C69F6" radius={[0, 0, 0, 0]} maxBarSize={18} />
            <Bar dataKey="profit" name="Profit" fill="#00A841" radius={[0, 0, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

// ── Chart 2: Radar / Genre DNA ────────────────────────────
function GenreRadarChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="h-72">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="rgba(0,0,0,0.1)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans", fontWeight: 700 }}
            />
            <Radar name="Action" dataKey="Action" stroke="#EE5454" fill="#EE5454" fillOpacity={0.18} strokeWidth={2} />
            <Radar name="Horror" dataKey="Horror" stroke="#714B96" fill="#714B96" fillOpacity={0.18} strokeWidth={2} />
            <Radar name="Animation" dataKey="Animation" stroke="#F6DB35" fill="#F6DB35" fillOpacity={0.18} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

// ── Chart 3: Season Performance ───────────────────────────
function SeasonChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const SEASON_COLORS = {
    Summer: "#EE5454",
    Holiday: "#4C69F6",
    Spring: "#00A841",
    Fall: "#F6DB35",
    Winter: "#714B96",
  };

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <div className="space-y-3">
        {SEASON_PERFORMANCE.map((s, i) => {
          const color = SEASON_COLORS[s.season as keyof typeof SEASON_COLORS];
          const pct = (s.avgRevenue / 450) * 100;
          return (
            <motion.div
              key={s.season}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4"
            >
              <span
                className="font-headline font-black text-xs uppercase w-16 shrink-0"
                style={{ color }}
              >
                {s.season}
              </span>
              <div className="flex-1 h-8 bg-surface-container dark:bg-dark-surface-container-high relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 flex items-center justify-end pr-3"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${pct}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-headline font-black text-xs text-white/90">
                    ${s.avgRevenue}M
                  </span>
                </motion.div>
              </div>
              <div className="w-20 text-right">
                <span className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">
                  {s.hit_rate}% hit
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Chart 4: Budget vs Revenue scatter ───────────────────
function BudgetScatter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="h-72">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="x"
              name="Budget"
              tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <YAxis
              dataKey="y"
              name="Revenue"
              tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans", fill: "#757686" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <ZAxis dataKey="z" range={[60, 300]} name="ROI" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[#1a1c1e] border-2 border-[#4C69F6] p-3 font-headline text-xs">
                    <p className="text-[#F6DB35] font-black uppercase mb-1">{d.name}</p>
                    <p className="text-white">Budget: ${d.x}M</p>
                    <p className="text-[#4C69F6]">Revenue: ${d.y}M</p>
                    <p className="text-[#00A841]">ROI: +{d.z}%</p>
                  </div>
                );
              }}
            />
            <Scatter data={SCATTER_DATA} isAnimationActive>
              {SCATTER_DATA.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={GENRE_COLORS[entry.name] ?? "#4C69F6"}
                  opacity={0.85}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

// ── ROI Leaderboard ───────────────────────────────────────
function ROILeaderboard({ data }: { data: typeof GENRE_DATA }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const sorted = [...data].sort((a, b) => b.roi - a.roi);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="space-y-2">
      {sorted.map((g, i) => (
        <motion.div
          key={g.genre}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="flex items-center gap-3 p-3 bg-surface-container dark:bg-dark-surface-container-high group hover:bg-surface-container-high dark:hover:bg-dark-surface-container-highest transition-colors"
        >
          <span className="font-headline font-black text-2xl text-on-surface/15 dark:text-dark-on-surface/15 w-6 shrink-0">
            {i + 1}
          </span>
          <div
            className="w-2 h-8 shrink-0"
            style={{ background: GENRE_COLORS[g.genre] ?? "#4C69F6" }}
          />
          <span className="font-headline font-black text-sm uppercase flex-1">{g.genre}</span>
          <div className="text-right">
            <p className="font-headline font-black text-lg" style={{ color: GENRE_COLORS[g.genre] ?? "#4C69F6" }}>
              +{g.roi}%
            </p>
            <p className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase">
              Avg ROI
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
const CHART_VIEWS = [
  { id: "budget-revenue", label: "Budget vs Revenue", icon: <BarChart3 size={14} /> },
  { id: "genre-dna", label: "Genre DNA Radar", icon: <TrendingUp size={14} /> },
  { id: "season", label: "Season Performance", icon: <DollarSign size={14} /> },
  { id: "scatter", label: "Budget Scatter", icon: <BarChart3 size={14} /> },
  { id: "roi-rank", label: "ROI Leaderboard", icon: <TrendingUp size={14} /> },
];

export function CinematicBudgetVisualizer() {
  const [activeView, setActiveView] = useState(0);
  const { data: genreBreakdown } = useGenreBreakdown();

  // Merge live API data with static fallback — live data takes precedence
  const liveGenreData = useMemo(() => {
    if (!genreBreakdown?.length) return GENRE_DATA;
    return genreBreakdown.map((g) => ({
      genre: g.genre,
      budget:  g.avg_budget,
      revenue: g.avg_revenue,
      profit:  Math.max(0, g.avg_revenue - g.avg_budget),
      roi:     g.avg_roi,
    }));
  }, [genreBreakdown]);

  const prev = () => setActiveView((v) => (v - 1 + CHART_VIEWS.length) % CHART_VIEWS.length);
  const next = () => setActiveView((v) => (v + 1) % CHART_VIEWS.length);

  return (
    <BentoCard noPadding className="flex flex-col">
      {/* Header stripe */}
      <div className="bg-[#EE5454] px-8 py-3 flex items-center gap-3">
        <BarChart3 size={16} className="text-white" />
        <span className="font-headline font-black text-sm uppercase tracking-widest text-white">
          Cinematic Budget Visualizer
        </span>
        <span className="ml-auto font-label text-[10px] text-white/60 uppercase tracking-widest">
          Phase 04 · Analytics
        </span>
      </div>

      {/* Tab nav */}
      <div className="flex overflow-x-auto no-scrollbar border-b-2 border-black/10 dark:border-white/10 bg-surface-container dark:bg-dark-surface-container-high">
        {CHART_VIEWS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setActiveView(i)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 font-label text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors border-b-[3px] -mb-[2px]",
              activeView === i
                ? "border-[#EE5454] text-[#EE5454] bg-surface-container-lowest dark:bg-dark-surface-container"
                : "border-transparent text-on-surface-variant dark:text-dark-on-surface-variant hover:text-on-surface dark:hover:text-dark-on-surface"
            )}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 flex-1">
        {/* Chart title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-headline font-black text-xl uppercase">
              {CHART_VIEWS[activeView].label}
            </h3>
            <p className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mt-0.5">
              Based on 1,240+ historical releases · FY 2019–2024
            </p>
          </div>
          {/* Prev/Next arrows */}
          <div className="flex gap-2">
            <motion.button
              onClick={prev}
              className="w-8 h-8 flex items-center justify-center bg-surface-container dark:bg-dark-surface-container-high border-2 border-black/10 dark:border-white/10 hover:border-[#EE5454] transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={14} />
            </motion.button>
            <motion.button
              onClick={next}
              className="w-8 h-8 flex items-center justify-center bg-surface-container dark:bg-dark-surface-container-high border-2 border-black/10 dark:border-white/10 hover:border-[#EE5454] transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>

        {/* Chart area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeView === 0 && (
              <>
                {/* Legend */}
                <div className="flex gap-4 mb-4">
                  {[
                    { label: "Budget", color: "#714B96" },
                    { label: "Revenue", color: "#4C69F6" },
                    { label: "Profit", color: "#00A841" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3" style={{ background: l.color }} />
                      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
                <GenreBudgetChart data={liveGenreData} />
              </>
            )}
            {activeView === 1 && (
              <>
                <div className="flex gap-4 mb-4">
                  {[
                    { label: "Action", color: "#EE5454" },
                    { label: "Horror", color: "#714B96" },
                    { label: "Animation", color: "#F6DB35" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
                <GenreRadarChart />
              </>
            )}
            {activeView === 2 && (
              <>
                <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-5">
                  Average box office revenue by release window, based on 6-year dataset.
                </p>
                <SeasonChart />
              </>
            )}
            {activeView === 3 && (
              <>
                <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-2">
                  Bubble size = ROI%. Hover for details.
                </p>
                <BudgetScatter />
              </>
            )}
            {activeView === 4 && (
              <>
                <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-5">
                  Historical average ROI by genre — ranked highest to lowest.
                </p>
                <ROILeaderboard data={liveGenreData} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Page dots */}
        <div className="flex justify-center gap-2 mt-6">
          {CHART_VIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveView(i)}
              className={cn(
                "transition-all duration-200",
                activeView === i
                  ? "w-6 h-2 bg-[#EE5454]"
                  : "w-2 h-2 bg-surface-container-high dark:bg-dark-surface-container-highest hover:bg-outline"
              )}
            />
          ))}
        </div>
      </div>
    </BentoCard>
  );
}
