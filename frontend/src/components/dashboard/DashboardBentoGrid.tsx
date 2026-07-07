"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BentoCard, BentoGrid } from "@/components/ui/BentoCard";
import { KineticText, AnimatedNumber } from "@/components/ui/KineticText";
import { ComicButton } from "@/components/ui/ComicButton";
import { useDashboardStats, useApiHealth, useVentures, useMarketSentiment } from "@/hooks/useApi";
import {
  TrendingUp, TrendingDown, Zap, Brain, Film, Globe, ArrowRight,
  BarChart3, Sparkles,
} from "lucide-react";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis,
} from "recharts";

// ── Static chart data (illustrative only — see label below) ───────────
const PORTFOLIO_DATA = [
  { month: "Jan", revenue: 42, profit: 18 },
  { month: "Feb", revenue: 58, profit: 26 },
  { month: "Mar", revenue: 51, profit: 21 },
  { month: "Apr", revenue: 74, profit: 38 },
  { month: "May", revenue: 89, profit: 52 },
  { month: "Jun", revenue: 96, profit: 61 },
  { month: "Jul", revenue: 120, profit: 78 },
  { month: "Aug", revenue: 148, profit: 101 },
];

// FIX-M03: Fallback used ONLY when API has not returned yet
const ACTIVE_VENTURES_FALLBACK = [
  { title: "NEON NIGHTS",    phase: "Production Phase III", status: "on-track", pct: 72 },
  { title: "GHOST PROTOCOL", phase: "Post-Production",      status: "at-risk",  pct: 91 },
  { title: "VOID SEEKER",    phase: "Initial Casting",      status: "on-track", pct: 18 },
  { title: "CHROME DEITY",   phase: "Script Development",   status: "on-track", pct:  5 },
];

const MARKET_REGIONS_FALLBACK = [
  { region: "NORTH AMERICA", growth: 4.1,  trending: true },
  { region: "EAST ASIA",     growth: 7.8,  trending: true },
  { region: "EUROPE",        growth: 2.3,  trending: true },
  { region: "SOUTH ASIA",    growth: 9.1,  trending: true },
];

const AI_INSIGHT_FALLBACK =
  "Neural analysis detects +14% demographic shift toward Neo-Noir and Afrofuturism in APAC markets. Recommend genre pivot for Q4 releases.";

const TOP_NLP_MATCHES = [
  { title: "THE ETERNAL GLOW", score: 0.94, genre: "Sci-Fi",   revenue: "$892M" },
  { title: "NEON PROTOCOL",    score: 0.87, genre: "Action",   revenue: "$634M" },
  { title: "FRACTURED SKY",    score: 0.81, genre: "Thriller", revenue: "$441M" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// ─────────────────────────────────────────────────────────
export function DashboardBentoGrid() {
  const [hoveredVenture, setHoveredVenture] = useState<number | null>(null);
  const { data: stats } = useDashboardStats();
  const { online } = useApiHealth();
  // FIX-M03: Use live venture data with fallback only when null
  const { data: ventures } = useVentures();
  const { data: sentiment } = useMarketSentiment();

  // Normalize live Venture[] into the display shape used below (title/phase/status/pct);
  // fall back to the static list only when the API returns nothing.
  const activeVenturesList = ventures
    ? ventures.map((v) => ({
        title: v.title,
        phase: v.current_phase,
        status:
          v.risk === "High" ? "delayed" :
          v.risk === "Medium" ? "at-risk" : "on-track",
        pct: v.progress,
      }))
    : ACTIVE_VENTURES_FALLBACK;
  const aiInsightText = sentiment?.ai_insight ?? AI_INSIGHT_FALLBACK;

  // Market regions — live with fallback
  const marketRegions = sentiment?.top_markets?.map((m) => ({
    region: m.region.toUpperCase(),
    growth: m.growth,
    trending: m.growth >= 0,
  })) ?? MARKET_REGIONS_FALLBACK;

  const totalRevenue  = stats?.total_predicted_revenue ?? 1_240_000_000;
  const avgROI        = stats?.average_roi             ?? 248.4;
  const sentimentLbl  = stats?.market_sentiment_label  ?? "BULLISH";
  const topGenre      = stats?.top_genre               ?? "Animation";
  const topGenreROI   = stats?.top_genre_roi           ?? 259.0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-min"
    >
      {/* ── 1. HERO: Portfolio ROI Chart ── */}
      <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-4 row-span-2">
        <BentoCard className="h-full min-h-[420px] flex flex-col justify-between" tilt>
          <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
            <TrendingUp size={160} strokeWidth={1} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
                <span className="w-8 h-8 bg-secondary flex items-center justify-center text-white text-base italic font-black">
                  !
                </span>
                Film Portfolio ROI
              </h2>
              {/* FIX-M02: "Illustrative" label so demo chart isn't misleading */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-label text-[9px] uppercase tracking-widest bg-surface-container dark:bg-dark-surface-container-high px-2 py-1">
                  FY 2024
                </span>
                <span className="font-label text-[8px] uppercase tracking-widest text-on-surface-variant/50 dark:text-dark-on-surface-variant/50">
                  Illustrative
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
                  Projected Annual Yield
                </p>
                <p className="font-headline font-black text-4xl text-[#4C69F6]">
                  +{avgROI.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
                  Active Risk Factor
                </p>
                <p className="font-headline font-black text-4xl text-[#00A841]">
                  LOW
                </p>
              </div>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PORTFOLIO_DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4C69F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4C69F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A841" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00A841" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "Work Sans", fill: "#757686" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1c1e", border: "2px solid #4C69F6",
                    borderRadius: 0, fontFamily: "Space Grotesk",
                    fontSize: 11, fontWeight: 700,
                  }}
                  formatter={(v: number, name: string) => [`$${v}M`, name === "revenue" ? "Revenue" : "Profit"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4C69F6" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                <Area type="monotone" dataKey="profit"  stroke="#00A841" strokeWidth={2}   fill="url(#profGrad)"  dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-black/10 dark:border-white/10">
            <p className="font-label text-[10px] uppercase tracking-widest text-center text-on-surface-variant/40 dark:text-dark-on-surface-variant/40">
              Performance Data
            </p>
          </div>
        </BentoCard>
      </motion.div>

      {/* ── 2. Active Ventures ── */}
      <motion.div variants={itemVariants} className="md:col-span-2 row-span-2">
        <BentoCard variant="hero" className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-black text-xl uppercase italic">
              Active Ventures
            </h2>
            <span className="font-label text-[9px] text-white/70 uppercase tracking-widest bg-black/20 px-2 py-1">
              {activeVenturesList.length} Active
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {activeVenturesList.map((v, i) => (
              <motion.div
                key={v.title}
                className="flex items-center justify-between gap-2 bg-black/15 px-3 py-2.5 cursor-pointer hover:bg-black/25 transition-colors group"
                onHoverStart={() => setHoveredVenture(i)}
                onHoverEnd={() => setHoveredVenture(null)}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.1 }}
              >
                <div className="min-w-0">
                  <p className="font-headline font-black text-sm text-white uppercase leading-none truncate">
                    {v.title}
                  </p>
                  <p className="font-label text-[8px] text-white/60 uppercase tracking-widest mt-0.5">
                    {v.phase}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        v.status === "delayed"  ? "#EE5454" :
                        v.status === "at-risk"  ? "#F6DB35" :
                        v.pct < 10              ? "#F6DB35" :   // very early stage — amber
                                                  "#00A841",    // on-track — green
                    }}
                    title={
                      v.status === "delayed"  ? "Delayed"  :
                      v.status === "at-risk"  ? "At Risk"  :
                      v.pct < 10              ? "Early Stage" : "On Track"
                    }
                  />
                  <ArrowRight size={13} className="text-white/40 group-hover:text-white/80 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>

          <Link href="/production" className="mt-4">
            <motion.div
              className="flex items-center justify-center gap-2 py-2.5 font-label text-[10px] text-white uppercase tracking-widest border-2 border-white/30 hover:bg-white/10 transition-colors cursor-pointer"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.1 }}
            >
              View All →
            </motion.div>
          </Link>
        </BentoCard>
      </motion.div>

      {/* ── 3. AI Prediction Pulse ── */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard className="h-full">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-[#4C69F6]" />
            <h2 className="font-headline font-black text-sm uppercase">
              AI Prediction Pulse
            </h2>
          </div>

          <div className="space-y-3 mb-4">
            {[
              { label: "Sensorial Reach",    pct: 92, color: "#4C69F6" },
              { label: "Narrative Cohesion", pct: 78, color: "#F6DB35" },
              { label: "Market Penetration", pct: 84, color: "#00A841" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                    {m.label}
                  </span>
                  <span className="font-headline font-black text-xs" style={{ color: m.color }}>
                    {m.pct}%
                  </span>
                </div>
                <div className="h-2 bg-surface-container dark:bg-dark-surface-container-high">
                  <motion.div
                    className="h-full"
                    style={{ background: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-surface-container dark:bg-dark-surface-container-high border-l-4 border-[#4C69F6]">
            <Sparkles size={11} className="text-[#4C69F6] mb-1.5" />
            <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant leading-relaxed italic">
              "{aiInsightText}"
            </p>
          </div>
        </BentoCard>
      </motion.div>

      {/* ── 4. Global Market Trends ── */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard className="h-full">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-[#F6DB35]" />
            <h2 className="font-headline font-black text-sm uppercase">
              Global Market Trends
            </h2>
          </div>

          <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant mb-4 leading-relaxed">
            Aggregated intelligence from 14 global exchange hubs and real-time sentiment feeds.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {marketRegions.slice(0, 4).map((r) => (
              <div key={r.region} className="bg-surface-container dark:bg-dark-surface-container-high p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Globe size={10} className="text-[#4C69F6]" />
                  <span className="font-label text-[8px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                    {r.region}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="font-headline font-black text-base"
                    style={{ color: r.trending ? "#00A841" : "#EE5454" }}
                  >
                    {r.growth >= 0 ? "+" : ""}{r.growth}%
                  </span>
                  {r.trending
                    ? <TrendingUp size={12} className="text-[#00A841]" />
                    : <TrendingDown size={12} className="text-[#EE5454]" />
                  }
                </div>
              </div>
            ))}
          </div>

          <Link href="/market">
            <ComicButton variant="ghost" size="sm" fullWidth>
              View Deep Scan →
            </ComicButton>
          </Link>
        </BentoCard>
      </motion.div>

      {/* ── 5. Top NLP Matches ── */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard variant="dark" className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#F6DB35]" />
            <h2 className="font-headline font-black text-sm uppercase text-white">
              Top NLP Matches
            </h2>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {TOP_NLP_MATCHES.map((m, i) => (
              <div key={m.title} className="flex items-center gap-3 bg-white/5 px-3 py-2.5">
                <span className="font-headline font-black text-2xl text-white/10 w-6 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-black text-xs text-white uppercase truncate">
                    {m.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-label text-[8px] text-white/50 uppercase tracking-widest">
                      {m.genre}
                    </span>
                    <span className="font-label text-[8px] text-[#4C69F6] uppercase tracking-widest">
                      {m.revenue}
                    </span>
                  </div>
                </div>
                <span
                  className="font-headline font-black text-base shrink-0"
                  style={{ color: m.score >= 0.9 ? "#00A841" : "#4C69F6" }}
                >
                  {Math.round(m.score * 100)}%
                </span>
              </div>
            ))}
          </div>

          <Link href="/scanner" className="mt-4">
            <ComicButton variant="tertiary" size="sm" fullWidth>
              Scan New Concept
            </ComicButton>
          </Link>
        </BentoCard>
      </motion.div>

      {/* ── 6. KPI Row (bottom) ── */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard>
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
            Total Predicted Revenue
          </p>
          <p className="font-headline font-black text-3xl text-[#4C69F6]">
            {formatCurrency(totalRevenue, "USD", true)}
          </p>
          <p className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 uppercase tracking-widest">
            Top genre: {topGenre}
          </p>
          <TrendingUp size={14} className="absolute top-6 right-6 text-[#4C69F6]" />
        </BentoCard>
      </motion.div>

      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard>
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
            Average ROI
          </p>
          <p className="font-headline font-black text-3xl text-[#00A841]">
            {avgROI.toFixed(1)}%
          </p>
          <p className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 uppercase tracking-widest">
            {topGenre} leads at +{topGenreROI.toFixed(0)}%
          </p>
          <BarChart3 size={14} className="absolute top-6 right-6 text-[#00A841]" />
        </BentoCard>
      </motion.div>

      <motion.div variants={itemVariants} className="md:col-span-2">
        <BentoCard>
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
            Market Sentiment
          </p>
          <p
            className="font-headline font-black text-3xl"
            style={{ color: sentimentLbl === "BULLISH" ? "#F6DB35" : sentimentLbl === "NEUTRAL" ? "#4C69F6" : "#EE5454" }}
          >
            {sentimentLbl}
          </p>
          <p className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant mt-1 uppercase tracking-widest">
            Live DB signal
          </p>
          <Sparkles size={14} className="absolute top-6 right-6 text-[#F6DB35]" />
        </BentoCard>
      </motion.div>
    </motion.div>
  );
}
