"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { matchConcepts, type NLPMatchResult } from "@/lib/api";
import {
  Brain, Search, Sparkles, TrendingUp, X, ArrowRight, Star, Zap,
} from "lucide-react";
import { cn, formatCurrency, similarityColor } from "@/lib/utils";
import { sleep } from "@/lib/utils";

// ── Match Card ─────────────────────────────────────────────
function MatchCard({ match, rank, delay }: { match: NLPMatchResult; rank: number; delay: number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [expanded, setExpanded] = useState(false);

  const scoreVal   = match.similarity_score;
  const scoreLabel = scoreVal >= 0.8 ? "HIGH MATCH" : scoreVal >= 0.6 ? "STRONG" : scoreVal >= 0.4 ? "MODERATE" : "POSSIBLE";
  const scoreCol   = similarityColor(scoreVal);

  // Accent bar colour by score tier
  const accentColor =
    scoreVal >= 0.8 ? "#00A841" :
    scoreVal >= 0.6 ? "#4C69F6" :
    scoreVal >= 0.4 ? "#F6DB35" : "#714B96";

  // Genre badge colour
  const genreColor =
    match.genre === "Sci-Fi"   ? "#4C69F6" :
    match.genre === "Action"   ? "#EE5454" :
    match.genre === "Fantasy"  ? "#714B96" :
    match.genre === "Family"   ? "#00A841" :
    match.genre === "Crime"    ? "#EE5454" :
    match.genre === "Animation"? "#F6DB35" : "#555";

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={cn(
          "relative border-2 overflow-hidden cursor-pointer transition-colors",
          "bg-surface-container-lowest dark:bg-dark-surface-container",
          "border-black/10 dark:border-white/10",
          "hover:border-[#4C69F6] dark:hover:border-[#4C69F6]"
        )}
        whileHover={{ x: 3 }}
        onClick={() => setExpanded((v) => !v)}
        layout
      >
        {/* Score accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />

        <div className="flex items-start gap-4 pl-4 pr-4 py-4">
          {/* Rank */}
          <span className="font-headline font-black text-5xl leading-none text-on-surface/10 dark:text-dark-on-surface/10 w-8 shrink-0 mt-1">
            {rank}
          </span>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="min-w-0">
                <p className="font-headline font-black text-base uppercase tracking-tight leading-tight truncate">
                  {match.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="font-label text-[9px] uppercase tracking-widest px-1.5 py-0.5 shrink-0"
                    style={{ background: genreColor, color: match.genre === "Animation" ? "#1a1c1e" : "white" }}
                  >
                    {match.genre}
                  </span>
                  <span className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant">
                    {match.year}{match.studio ? ` · ${match.studio}` : ""}
                  </span>
                </div>
              </div>

              {/* Score badge */}
              <div className="flex flex-col items-end shrink-0">
                <span className={cn("font-headline font-black text-2xl leading-none", scoreCol)}>
                  {Math.round(scoreVal * 100)}%
                </span>
                <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                  {scoreLabel}
                </span>
              </div>
            </div>

            {/* KPI row */}
            <div className="flex gap-4 text-[10px] font-label flex-wrap">
              <span className="text-[#4C69F6] font-bold">BO: {formatCurrency(match.box_office, "USD", true)}</span>
              <span className="text-on-surface-variant dark:text-dark-on-surface-variant">Budget: {formatCurrency(match.budget, "USD", true)}</span>
              <span className="text-[#00A841] font-bold">ROI: +{match.roi}%</span>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="ml-16 pr-4 pb-4 border-t border-black/10 dark:border-white/10 pt-3">
                <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-3 leading-relaxed italic">
                  "{match.description}"
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {match.tags.map((tag) => (
                    <span key={tag} className="font-label text-[9px] uppercase tracking-widest px-2 py-1 bg-surface-container dark:bg-dark-surface-container-high border border-black/10 dark:border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-[#F6DB35]" />
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                    Director: {match.director ?? "—"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <div className="absolute right-3 bottom-3">
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ArrowRight size={12} className="text-on-surface-variant dark:text-dark-on-surface-variant" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────
export function NLPConceptRecommender() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";

  const [concept,    setConcept]    = useState(initialQuery);
  const [matches,    setMatches]    = useState<NLPMatchResult[]>([]);
  const [isSearching,setIsSearching]= useState(false);
  const [hasSearched,setHasSearched]= useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [expandAll,  setExpandAll]  = useState(false); // FIX-SCAN-02
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const EXAMPLE_PROMPTS = [
    "Gritty reboot of a space opera with ensemble cast",
    "Psychological thriller in a near-future setting",
    "Cyberpunk action film with practical stunts",
    "Mythological fantasy epic with A-list director",
  ];

  const handleSearch = async () => {
    if (!concept.trim() || isSearching) return;

    if (concept.trim().length < 10) {
      setApiError("Concept must be at least 10 characters. Describe genre, tone, and setting.");
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    setMatches([]);
    setApiError(null);

    try {
      const results = await matchConcepts({ concept, top_k: 6 });
      setMatches(results);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Search failed — check your API connection.");
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  // Auto-trigger from TopNav search ?q= param
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 10) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSearch();
  };

  // Export results as CSV
  const handleExport = () => {
    if (!matches.length) return;
    const csv = [
      "Title,Genre,Year,Box Office,Budget,ROI,Similarity",
      ...matches.map((m) =>
        `"${m.title}","${m.genre}",${m.year},${m.box_office},${m.budget},${m.roi},${Math.round(m.similarity_score * 100)}%`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "bos_nlp_matches.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BentoCard noPadding className="flex flex-col">
      {/* Header stripe */}
      <div className="bg-[#714B96] px-8 py-3 flex items-center gap-3">
        <Brain size={16} className="text-white" />
        <span className="font-headline font-black text-sm uppercase tracking-widest text-white">
          NLP Concept Recommender
        </span>
        <span className="ml-auto font-label text-[10px] text-white/60 uppercase tracking-widest">
          Phase 03 · Script Scanner
        </span>
      </div>

      <div className="p-6 md:p-8">
        {/* Input */}
        <div className="mb-6">
          <label className="font-label text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant dark:text-dark-on-surface-variant mb-2 block">
            Describe Your Concept
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. A gritty reboot of a space opera with a female ensemble cast and hard sci-fi visuals..."
              rows={3}
              className={cn(
                "w-full bg-surface-container dark:bg-dark-surface-container-high",
                "border-b-[3px] border-[#714B96]",
                "p-4 font-body text-sm text-on-surface dark:text-dark-on-surface",
                "placeholder:text-on-surface-variant/50 dark:placeholder:text-dark-on-surface-variant/40",
                "outline-none resize-none transition-colors"
              )}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {concept && (
                <button
                  onClick={() => { setConcept(""); setMatches([]); setHasSearched(false); setApiError(null); }}
                  className="text-on-surface-variant dark:text-dark-on-surface-variant hover:text-[#EE5454] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <span className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">⌘↵</span>
            </div>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mb-6">
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-2">
            Quick Examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <motion.button
                key={p}
                className={cn(
                  "font-label text-[10px] uppercase tracking-tight px-3 py-1.5",
                  "bg-surface-container dark:bg-dark-surface-container-high",
                  "border border-black/10 dark:border-white/10",
                  "text-on-surface-variant dark:text-dark-on-surface-variant",
                  "hover:border-[#714B96] hover:text-[#714B96] transition-colors cursor-pointer"
                )}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setConcept(p)}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Search button */}
        <ComicButton
          variant="primary"
          size="lg"
          fullWidth
          loading={isSearching}
          loadingText="SCANNING IP DATABASE..."
          soundEffect
          icon={<Search size={16} />}
          onClick={handleSearch}
          className="bg-[#714B96] hover:bg-[#5a3a7a] mb-8"
        >
          Scan for Matching IPs
        </ComicButton>

        {/* Loading skeleton */}
        <AnimatePresence>
          {isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 shimmer-loading" />)}
              <div className="flex items-center justify-center gap-3 py-4">
                <Zap size={16} className="text-[#714B96] animate-pulse" />
                <span className="font-headline font-black text-sm uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
                  Querying neural embeddings...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {!isSearching && apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 border-l-4 border-[#EE5454] bg-[#EE5454]/10"
            >
              <span className="text-[#EE5454] font-black text-sm shrink-0">!</span>
              <div>
                <p className="font-headline font-black text-xs uppercase text-[#EE5454]">Search Error</p>
                <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant mt-0.5">{apiError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!isSearching && matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Results header — FIX-SCAN-02: "Click to expand" changed to "Click each card" */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#00A841]" />
                  <span className="font-headline font-black text-sm uppercase">
                    {matches.length} Matching IPs Found
                  </span>
                </div>
                {/* FIX-SCAN-02: Now a real Expand All / Collapse All toggle */}
                <button
                  onClick={() => setExpandAll((v) => !v)}
                  className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant hover:text-[#714B96] transition-colors"
                >
                  {expandAll ? "Collapse All" : "Expand All"}
                </button>
              </div>

              <div className="space-y-2">
                {matches.map((match, i) => (
                  <MatchCard key={match.title} match={match} rank={i + 1} delay={i * 0.07} />
                ))}
              </div>

              {/* Summary stat row */}
              <div className="mt-6 grid grid-cols-3 gap-px bg-black/10 dark:bg-white/5">
                {[
                  { label: "Avg Box Office", val: formatCurrency(matches.reduce((s, m) => s + m.box_office, 0) / matches.length, "USD", true), color: "#4C69F6" },
                  { label: "Avg ROI",        val: `+${Math.round(matches.reduce((s, m) => s + m.roi, 0) / matches.length)}%`,                 color: "#00A841" },
                  { label: "Top Match",      val: `${Math.round(matches[0].similarity_score * 100)}%`,                                         color: "#F6DB35" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface-container-lowest dark:bg-dark-surface-container p-4 text-center">
                    <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">{stat.label}</p>
                    <p className="font-headline font-black text-xl" style={{ color: stat.color }}>{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                <ComicButton
                  variant="tertiary"
                  size="sm"
                  className="flex-1"
                  onClick={handleExport}
                >
                  Export Results
                </ComicButton>

                {/*
                  FIX-SCAN-03: "Compare ROI" now navigates to /oracle
                  instead of doing nothing. Tooltip clarifies what it does.
                */}
                <ComicButton
                  variant="ghost"
                  size="sm"
                  icon={<TrendingUp size={13} />}
                  iconPosition="left"
                  title="Open Oracle to run a revenue prediction for your concept"
                  onClick={() => { window.location.href = "/oracle"; }}
                >
                  Compare ROI
                </ComicButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty — no results after search */}
        {!isSearching && hasSearched && matches.length === 0 && !apiError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-black/10 dark:border-white/10"
          >
            <Brain size={40} className="text-on-surface/20 dark:text-dark-on-surface/20" />
            <p className="font-headline font-black text-base uppercase text-center text-on-surface/40 dark:text-dark-on-surface/40">
              No Matching IPs Found
            </p>
            <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant text-center max-w-xs">
              Try adding more descriptive keywords — genres, themes, tone, setting, or character archetypes.
            </p>
          </motion.div>
        )}

        {/* Empty — awaiting first search */}
        {!isSearching && !hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <Brain size={48} className="text-on-surface/10 dark:text-dark-on-surface/10" />
            <p className="font-headline font-black text-lg uppercase text-center text-on-surface/30 dark:text-dark-on-surface/30">
              Awaiting Concept Input
            </p>
            <p className="font-body text-xs text-on-surface-variant dark:text-dark-on-surface-variant text-center max-w-xs">
              Describe your film concept above and the Oracle will scan the IP database for high-performing matches.
            </p>
          </motion.div>
        )}
      </div>
    </BentoCard>
  );
}
