"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { TrendingUp, TrendingDown, Globe, Sparkles, BarChart3, Zap, RefreshCw } from "lucide-react";
import { cn, formatPct } from "@/lib/utils";
import { useMarketSentiment } from "@/hooks/useApi";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// Static sentiment history — would come from a time-series endpoint in production
const SENTIMENT_HISTORY = [
  { week: "W1", score: 52 }, { week: "W2", score: 58 }, { week: "W3", score: 55 },
  { week: "W4", score: 63 }, { week: "W5", score: 61 }, { week: "W6", score: 67 },
  { week: "W7", score: 71 }, { week: "W8", score: 69 }, { week: "W9", score: 74 },
  { week: "W10", score: 78 },
];

// Genre → brand colour mapping
const GENRE_PALETTE: Record<string, string> = {
  "Science Fiction": "#4C69F6", "Sci-Fi": "#4C69F6",
  "Action":          "#EE5454",
  "Animation":       "#F6DB35", "Family": "#F6DB35",
  "Horror":          "#714B96",
  "Thriller":        "#00A841",
  "Drama":           "#757686",
  "Comedy":          "#757686",
  "Crime":           "#EE5454",
  "Adventure":       "#4C69F6",
};

// Region flags for top_markets from the API
const REGION_FLAGS: Record<string, string> = {
  "North America": "🇺🇸", "East Asia": "🇨🇳", "Europe": "🇪🇺",
  "South Asia": "🇮🇳", "Middle East": "🌍", "Latin America": "🇧🇷",
};


function SentimentGauge({ score }: { score: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const angle = (score / 100) * 180 - 90; // -90 to +90 degrees
  const color = score >= 65 ? "#00A841" : score >= 45 ? "#F6DB35" : "#EE5454";
  const label = score >= 65 ? "BULLISH" : score >= 45 ? "NEUTRAL" : "BEARISH";

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden mb-2">
        {/* Gauge track */}
        <svg viewBox="0 0 200 100" className="w-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="16" strokeLinecap="butt" />
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="butt"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={inView ? { strokeDashoffset: 251.2 * (1 - score / 100) } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
          {/* Needle */}
          <motion.line
            x1="100" y1="100"
            x2="100" y2="28"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="square"
            initial={{ rotate: -90, originX: "100px", originY: "100px" }}
            animate={inView ? { rotate: angle } : { rotate: -90 }}
            transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1], delay: 0.4 }}
            style={{ transformOrigin: "100px 100px" }}
          />
          <circle cx="100" cy="100" r="6" fill={color} />
        </svg>
      </div>
      <p className="font-headline font-black text-4xl" style={{ color }}>{score}%</p>
      <p className="font-label font-black text-sm uppercase tracking-[0.2em]" style={{ color }}>{label}</p>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function MarketPage() {
  const { data: sentiment, isLoading, refetch } = useMarketSentiment();

  // Derive display values with fallbacks
  const sentimentScore = Math.round((sentiment?.overall_sentiment ?? 0.74) * 100);
  const genreTrends = sentiment?.genre_trends ?? [];
  const topMarkets  = sentiment?.top_markets  ?? [];
  const aiInsight   = sentiment?.ai_insight   ?? "Awaiting signal data…";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        <div className="absolute top-0 right-0 w-1/3 h-full halftone-yellow pointer-events-none" />
        <div className="flex items-end gap-4 mb-3">
          <span className="bg-[#F6DB35] text-black px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">PHASE 06</span>
          <h1 className="headline-bleed text-on-background dark:text-dark-on-background kinetic-text-yellow">
            Market Pulse
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-[#F6DB35]" />
          <p className="font-label font-bold text-[#6c5e00] dark:text-[#F6DB35] tracking-[0.2em] text-sm uppercase">
            Global Sentiment & Genre Intelligence
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: isLoading ? "#F6DB35" : "#00A841" }} />
              <span style={{ color: isLoading ? "#F6DB35" : "#00A841" }}>
                {isLoading ? "Fetching..." : "Live Signal"}
              </span>
            </span>
            <motion.button
              onClick={refetch}
              className="p-1.5 border-2 border-black/10 dark:border-white/10 hover:border-[#F6DB35] hover:text-[#6c5e00] dark:hover:text-[#F6DB35] transition-colors text-on-surface-variant dark:text-dark-on-surface-variant"
              whileTap={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              title="Refresh sentiment data"
            >
              <RefreshCw size={12} />
            </motion.button>
          </div>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="md:col-span-1">
        <BentoCard variant="dark" className="flex flex-col items-center justify-center min-h-[260px] gap-4">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }} />
          <p className="font-label text-[10px] uppercase tracking-widest text-white/50 relative z-10">
            Overall Market Sentiment
          </p>
          <div className="relative z-10">
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-32 h-16 bg-white/10 rounded-t-full mb-3" />
                <div className="h-6 w-16 bg-white/10 rounded mb-2" />
                <div className="h-2 w-10 bg-white/10 rounded" />
              </div>
            ) : (
              <SentimentGauge score={sentimentScore} />
            )}
          </div>
          <p className="font-body text-xs text-white/50 text-center max-w-[200px] relative z-10">
            Based on 14 global exchange hubs · Updated hourly
          </p>
        </BentoCard>
      </motion.div>

        {/* ── Sentiment Trend Line ── */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2">
          <BentoCard className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[#4C69F6]" />
                <h3 className="font-headline font-black text-lg uppercase">10-Week Sentiment Trend</h3>
              </div>
              <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant/50 dark:text-dark-on-surface-variant/50 bg-surface-container dark:bg-dark-surface-container-high px-2 py-1">
                Illustrative
              </span>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={SENTIMENT_HISTORY} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A841" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00A841" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: "Plus Jakarta Sans", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: "#757686" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: "#1a1c1e", border: "2px solid #00A841", borderRadius: 0, fontFamily: "Space Grotesk", fontSize: 11 }} labelStyle={{ color: "#F6DB35" }} />
                  <Area type="monotone" dataKey="score" stroke="#00A841" strokeWidth={3} fill="url(#sentimentGrad)" name="Sentiment" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>
        </motion.div>

        {/* ── Genre Trend List ── */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-1">
          <BentoCard className="h-full">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={16} className="text-[#F6DB35]" />
              <h3 className="font-headline font-black text-lg uppercase">Genre Momentum</h3>
            </div>
            <div className="space-y-3">
              {(isLoading ? Array.from({ length: 5 }) : genreTrends).map((g: any, i: number) =>
                isLoading ? (
                  <div key={i} className="h-10 shimmer-loading" />
                ) : (
                <motion.div
                  key={g.genre}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-2 h-8 shrink-0" style={{ background: GENRE_PALETTE[g.genre] ?? "#757686" }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-headline font-black text-xs uppercase">{g.genre}</span>
                      <span className={cn("font-headline font-black text-sm", g.trend >= 0 ? "text-[#00A841]" : "text-[#EE5454]")}>
                        {g.trend >= 0 ? "+" : ""}{g.trend.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-container dark:bg-dark-surface-container-high w-full">
                      <motion.div
                        className="h-full"
                        style={{ background: GENRE_PALETTE[g.genre] ?? "#757686" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(g.trend) * 10, 100)}%` }}
                        transition={{ duration: 0.7, delay: 0.5 + i * 0.07 }}
                      />
                    </div>
                  </div>
                  {g.trend > 0
                    ? <TrendingUp size={14} className="text-[#00A841] shrink-0" />
                    : <TrendingDown size={14} className="text-[#EE5454] shrink-0" />
                  }
                </motion.div>
              ))}
            </div>
          </BentoCard>
        </motion.div>

        {/* ── Global Markets Grid ── */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-2">
          <BentoCard noPadding>
            <div className="p-6 border-b-2 border-black/10 dark:border-white/10 flex items-center gap-2">
              <Globe size={16} className="text-[#4C69F6]" />
              <h3 className="font-headline font-black text-lg uppercase">Global Market Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black/10 dark:bg-white/5">
              {topMarkets.map((m) => (
                <motion.div
                  key={m.region}
                  className="bg-surface-container-lowest dark:bg-dark-surface-container p-5 group hover:bg-surface-container dark:hover:bg-dark-surface-container-high transition-colors cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{REGION_FLAGS[m.region] ?? "🌐"}</span>
                    {m.growth >= 0
                      ? <TrendingUp size={14} className="text-[#00A841]" />
                      : <TrendingDown size={14} className="text-[#EE5454]" />
                    }
                  </div>
                  <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-0.5">{m.region}</p>
                  <p className={cn("font-headline font-black text-2xl", m.growth >= 0 ? "text-[#4C69F6]" : "text-[#EE5454]")}>
                    {m.growth >= 0 ? "+" : ""}{m.growth}%
                  </p>
                </motion.div>
              ))}
            </div>
          </BentoCard>
        </motion.div>

        {/* ── AI Insights Feed ── */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-3">
          <BentoCard variant="blue" className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[#F6DB35]" />
              <h3 className="font-headline font-black text-xl uppercase">Oracle Intelligence Feed</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live AI insight from the sentiment API */}
              <motion.div
                className="glass-dark p-4 border border-white/10 md:col-span-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="flex items-start gap-3">
                  <span className="font-headline font-black text-[#F6DB35] text-xs mt-0.5 shrink-0">#01</span>
                  <p className="font-body text-sm text-white/80 leading-relaxed italic">"{aiInsight}"</p>
                </div>
              </motion.div>
              {/* Static supplementary insights */}
              {[
                "Summer window saturation predicted at 89% capacity. Holiday slate has 2.3× higher break-even probability.",
                "Ensemble casts outperforming solo-lead films by +31% in franchise-starter scenarios.",
                "Streaming vs. theatrical split reaching inflection point: day-and-date releases showing +18% total revenue.",
              ].map((insight, i) => (
                <motion.div
                  key={i}
                  className="glass-dark p-4 border border-white/10"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-headline font-black text-[#F6DB35] text-xs mt-0.5 shrink-0">
                      #{String(i + 2).padStart(2, "0")}
                    </span>
                    <p className="font-body text-sm text-white/80 leading-relaxed italic">"{insight}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </BentoCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
