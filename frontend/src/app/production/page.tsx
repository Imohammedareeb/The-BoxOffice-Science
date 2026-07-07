"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { ComicButton } from "@/components/ui/ComicButton";
import {
  CheckCircle2, Circle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Film, Users, DollarSign,
  RefreshCw, Inbox, Calendar, User, BarChart3, Plus, X,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useVentures } from "@/hooks/useApi";
import { createVenture, type Venture, type VenturePhase, type VentureCreate } from "@/lib/api";

// ── Risk colour map ──────────────────────────────────────────
const RISK_STYLES: Record<string, string> = {
  Low:    "text-[#00A841] border-[#00A841] bg-[#00A841]/10",
  Medium: "text-[#F6DB35] border-[#F6DB35] bg-[#F6DB35]/10",
  High:   "text-[#EE5454] border-[#EE5454] bg-[#EE5454]/10",
};

const PHASE_SHORT: Record<string, string> = {
  Development:      "DEV",
  "Pre-Production": "PRE",
  Production:       "PROD",
  "Post-Production":"POST",
  Distribution:     "DIST",
};

// ── Skeleton ─────────────────────────────────────────────────
function VentureCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <BentoCard noPadding className="overflow-hidden">
        <div className="h-1 bg-surface-container-high dark:bg-dark-surface-container-high" />
        <div className="p-6 space-y-4 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-14 bg-surface-container rounded" />
                <div className="h-5 w-20 bg-surface-container rounded" />
              </div>
              <div className="h-7 w-48 bg-surface-container rounded" />
              <div className="h-3 w-32 bg-surface-container rounded" />
            </div>
            <div className="h-12 w-16 bg-surface-container rounded" />
          </div>
          <div className="h-2 w-full bg-surface-container rounded" />
          <div className="flex items-start gap-1 mt-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-7 h-7 bg-surface-container rounded" />
                <div className="h-2 w-10 bg-surface-container rounded hidden sm:block" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container rounded" />)}
          </div>
        </div>
      </BentoCard>
    </motion.div>
  );
}

// ── Phase Timeline ────────────────────────────────────────────
function PhaseTimeline({ phases }: { phases: VenturePhase[] }) {
  return (
    <div className="mt-5 mb-1">
      <div className="relative flex items-center">
        <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-black/10 dark:bg-white/10" />
        {(() => {
          const lastDoneIdx = phases.reduce((acc, p, i) => (p.status !== "upcoming" ? i : acc), -1);
          const pct = lastDoneIdx >= 0 ? ((lastDoneIdx) / (phases.length - 1)) * 100 : 0;
          return (
            <div
              className="absolute top-3.5 left-3.5 h-0.5 bg-[#00A841] transition-all duration-700"
              style={{ width: `calc(${pct}% * ${(phases.length - 1) / phases.length})` }}
            />
          );
        })()}
        {phases.map((phase) => (
          <div key={phase.id} className="flex-1 flex flex-col items-center gap-2 relative z-10">
            <div className={cn(
              "w-7 h-7 flex items-center justify-center border-2 shrink-0 transition-all",
              phase.status === "done"     && "bg-[#00A841] border-[#00A841]",
              phase.status === "active"   && "bg-[#4C69F6] border-[#4C69F6] ring-4 ring-[#4C69F6]/20",
              phase.status === "upcoming" && "bg-surface-container dark:bg-dark-surface-container border-black/20 dark:border-white/20",
            )}>
              {phase.status === "done"     && <CheckCircle2 size={13} className="text-white" />}
              {phase.status === "active"   && (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Clock size={13} className="text-white" />
                </motion.div>
              )}
              {phase.status === "upcoming" && <Circle size={10} className="text-black/20 dark:text-white/20" />}
            </div>
            <div className="flex flex-col items-center gap-0.5 px-0.5">
              <span className={cn(
                "font-label text-center leading-tight font-bold hidden sm:block text-[8px] uppercase tracking-widest",
                phase.status === "active"   && "text-[#4C69F6]",
                phase.status === "done"     && "text-[#00A841]",
                phase.status === "upcoming" && "text-on-surface-variant/40 dark:text-dark-on-surface-variant/40",
              )}>
                {phase.label}
              </span>
              <span className={cn(
                "font-label text-center leading-tight font-bold block sm:hidden text-[8px] uppercase tracking-tight",
                phase.status === "active"   && "text-[#4C69F6]",
                phase.status === "done"     && "text-[#00A841]",
                phase.status === "upcoming" && "text-on-surface-variant/30 dark:text-dark-on-surface-variant/30",
              )}>
                {PHASE_SHORT[phase.label] ?? phase.label.slice(0, 4)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Venture Card ──────────────────────────────────────────────
function VentureCard({ venture, delay }: { venture: Venture; delay: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <BentoCard noPadding className="overflow-hidden">
        <div className="h-1.5" style={{ background: venture.status_color }} />
        <div className="p-6">
          {/* Demo badge for placeholder ventures */}
          {venture.is_demo && (
            <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-[#F6DB35]/10 border-l-4 border-[#F6DB35]">
              <span className="font-label text-[9px] uppercase tracking-widest text-[#b8a020] font-bold">
                Demo Preview
              </span>
              <span className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant">
                — Create your first real venture with the + New Venture button
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5 text-white shrink-0"
                  style={{ background: venture.status_color }}
                >
                  {venture.genre}
                </span>
                <span className={cn(
                  "font-label text-[9px] uppercase tracking-widest px-2 py-0.5 border shrink-0",
                  RISK_STYLES[venture.risk]
                )}>
                  {venture.risk} Risk
                </span>
              </div>
              <h3 className="font-headline font-black text-2xl uppercase leading-tight truncate">
                {venture.title}
              </h3>
              <p className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest mt-0.5">
                {venture.current_phase}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div
                className="font-headline font-black text-4xl leading-none tabular-nums"
                style={{ color: venture.status_color }}
              >
                {venture.progress}%
              </div>
              <p className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">
                Complete
              </p>
            </div>
          </div>

          <div className="h-2 bg-surface-container dark:bg-dark-surface-container-high w-full mb-2 relative overflow-hidden">
            <motion.div
              className="h-full"
              style={{ background: venture.status_color }}
              initial={{ width: 0 }}
              animate={{ width: `${venture.progress}%` }}
              transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <PhaseTimeline phases={venture.phases} />

          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { icon: <DollarSign size={11} />, label: "Budget",    val: formatCurrency(venture.budget, "USD", true) },
              { icon: <BarChart3 size={11} />,  label: "Projected", val: formatCurrency(venture.projected_revenue, "USD", true) },
              {
                icon: <Users size={11} />,
                label: "Team",
                // BUG-06 FIX: venture.team_size can be undefined — safe guard
                val: venture.team_size != null ? `${venture.team_size} ppl` : "TBA",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-surface-container dark:bg-dark-surface-container-high p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1 text-on-surface-variant dark:text-dark-on-surface-variant">
                  {kpi.icon}
                  <span className="font-label text-[8px] uppercase tracking-widest">{kpi.label}</span>
                </div>
                <span className="font-headline font-black text-sm leading-none" style={{ color: venture.status_color }}>
                  {kpi.val}
                </span>
              </div>
            ))}
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t-2 border-black/10 dark:border-white/10 grid grid-cols-2 gap-4">
                  {[
                    { icon: <User size={11} />,     label: "Director",   val: venture.director },
                    { icon: <Users size={11} />,    label: "Cast Tier",  val: venture.cast_tier },
                    { icon: <Calendar size={11} />, label: "Start Date", val: venture.start_date },
                    { icon: <Film size={11} />,     label: "Release",    val: venture.release_date },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center gap-1 text-on-surface-variant dark:text-dark-on-surface-variant mb-0.5">
                        {item.icon}
                        <p className="font-label text-[9px] uppercase tracking-widest">{item.label}</p>
                      </div>
                      <p className="font-headline font-black text-sm">{item.val || "—"}</p>
                    </div>
                  ))}
                </div>
                {/*
                  BUG-06 FIX: Removed venture.data_source reference.
                  The Venture TypeScript interface has no data_source field.
                  Accessing it caused TypeScript errors and runtime undefined.
                */}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-black/10 dark:border-white/10">
            <ComicButton
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              icon={expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              iconPosition="right"
            >
              {expanded ? "Less" : "Details"}
            </ComicButton>
            <div className="flex-1" title="Venture detail pages — coming in v2">
              <ComicButton
                variant="primary"
                size="sm"
                className="w-full opacity-40 cursor-not-allowed pointer-events-none"
              >
                Open Venture
              </ComicButton>
            </div>
          </div>
        </div>
      </BentoCard>
    </motion.div>
  );
}

// ── Summary Strip ─────────────────────────────────────────────
function SummaryStrip({ ventures }: { ventures: Venture[] }) {
  // Only count real ventures (not demo placeholders) for summary
  const realVentures = ventures.filter(v => !v.is_demo);
  const totalBudget    = realVentures.reduce((s, v) => s + v.budget, 0);
  const totalProjected = realVentures.reduce((s, v) => s + v.projected_revenue, 0);
  const avgProgress    = realVentures.length
    ? Math.round(realVentures.reduce((s, v) => s + v.progress, 0) / realVentures.length)
    : 0;

  const stats = [
    { label: "Active Ventures",   val: `${realVentures.length}`,                    color: "#4C69F6" },
    { label: "Total Budget",      val: formatCurrency(totalBudget, "USD", true),     color: "#EE5454" },
    { label: "Projected Revenue", val: formatCurrency(totalProjected, "USD", true),  color: "#00A841" },
    { label: "Avg Progress",      val: `${avgProgress}%`,                            color: "#F6DB35" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <BentoCard key={s.label} className="py-4">
          <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
            {s.label}
          </p>
          <p className="font-headline font-black text-3xl leading-none" style={{ color: s.color }}>
            {s.val}
          </p>
        </BentoCard>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="col-span-2 py-20 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-surface-container dark:bg-dark-surface-container-high flex items-center justify-center border-4 border-black/10 dark:border-white/10">
        <Inbox size={28} className="text-on-surface-variant dark:text-dark-on-surface-variant" />
      </div>
      <p className="font-headline font-black text-xl uppercase text-on-surface/20 dark:text-dark-on-surface/20">
        No Active Ventures
      </p>
      <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant max-w-xs">
        Create your first venture to start tracking production progress.
      </p>
      <ComicButton variant="primary" size="sm" onClick={onNew} icon={<Plus size={13} />}>
        New Venture
      </ComicButton>
    </div>
  );
}

// ── New Venture Modal ─────────────────────────────────────────
const GENRES = ["Action", "Sci-Fi", "Animation", "Comedy", "Drama", "Horror", "Thriller", "Fantasy", "Romance", "Documentary"];
const PHASES = ["Development", "Pre-Production", "Production", "Post-Production", "Distribution"];
const RISKS  = ["Low", "Medium", "High"];

function NewVentureModal({ onClose, onCreated, initialData }: {
  onClose: () => void; onCreated: () => void; initialData?: VentureCreate;
}) {
  const [form, setForm] = useState<VentureCreate>(initialData ?? {
    title: "",
    genre: "Action",
    budget: 50_000_000,
    projected_revenue: 0,
    director: "",
    cast_tier: "Mixed",
    current_phase: "Development",
    progress: 0,
    risk: "Medium",
    start_date: "",
    release_date: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (form.budget <= 0)   { setError("Budget must be greater than 0."); return; }
    setIsLoading(true);
    setError(null);
    try {
      await createVenture(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venture.");
    } finally {
      setIsLoading(false);
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1">
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-surface-container dark:bg-dark-surface-container-high border-b-2 border-black/20 dark:border-white/20 px-2 py-2 font-label text-sm outline-none focus:border-[#4C69F6] transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-[#4C69F6] shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="h-1.5 bg-[#4C69F6]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline font-black text-xl uppercase">New Venture</h2>
            <button onClick={onClose} className="text-on-surface-variant hover:text-[#EE5454] transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-[#EE5454]/10 border-l-4 border-[#EE5454]">
              <AlertTriangle size={13} className="text-[#EE5454] shrink-0" />
              <p className="font-label text-xs text-[#EE5454] uppercase tracking-wide">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {field("Title *", (
              <input
                className={inputCls}
                placeholder="E.g. NEON NIGHTS"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            ))}

            <div className="grid grid-cols-2 gap-4">
              {field("Genre", (
                <select className={inputCls} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              ))}
              {field("Risk Level", (
                <select className={inputCls} value={form.risk ?? "Medium"} onChange={e => setForm(f => ({ ...f, risk: e.target.value }))}>
                  {RISKS.map(r => <option key={r}>{r}</option>)}
                </select>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field("Budget ($) *", (
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="50000000"
                  value={form.budget || ""}
                  onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                />
              ))}
              {field("Projected Revenue ($)", (
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="150000000"
                  value={form.projected_revenue || ""}
                  onChange={e => setForm(f => ({ ...f, projected_revenue: Number(e.target.value) }))}
                />
              ))}
            </div>

            {field("Current Phase", (
              <select className={inputCls} value={form.current_phase ?? "Development"} onChange={e => setForm(f => ({ ...f, current_phase: e.target.value }))}>
                {PHASES.map(p => <option key={p}>{p}</option>)}
              </select>
            ))}

            <div className="grid grid-cols-2 gap-4">
              {field("Director", (
                <input className={inputCls} placeholder="Director Name" value={form.director ?? ""} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} />
              ))}
              {field("Progress (%)", (
                <input className={inputCls} type="number" min={0} max={100} placeholder="0" value={form.progress || ""} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field("Start Date", (
                <input className={inputCls} placeholder="Jan 2024" value={form.start_date ?? ""} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              ))}
              {field("Release Date", (
                <input className={inputCls} placeholder="Nov 2024" value={form.release_date ?? ""} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <ComicButton variant="primary" size="md" className="flex-1" onClick={handleCreate}>
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create Venture →"}
            </ComicButton>
            <ComicButton variant="ghost" size="md" onClick={onClose}>Cancel</ComicButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function ProductionPage() {
  const searchParams = useSearchParams();
  const { data: ventures, isLoading, error, refetch } = useVentures();
  const [showNewModal, setShowNewModal] = useState(false);
  const [prefill, setPrefill] = useState<VentureCreate | undefined>();

  useEffect(() => {
    if (searchParams.get("autoOpen") === "true") {
      setPrefill({
        title: "",
        genre: searchParams.get("genre") ?? "Action",
        budget: Number(searchParams.get("budget")) || 50_000_000,
        projected_revenue: Number(searchParams.get("rev")) || 0,
        director: "",
        cast_tier: searchParams.get("cast") ?? "Mixed",
        current_phase: "Development",
        progress: 0,
        risk: searchParams.get("risk") ?? "Medium",
        start_date: "",
        release_date: "",
        notes: "Automated transition from Oracle prediction.",
      });
      setShowNewModal(true);
    }
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        <div
          className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #4C69F6 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            opacity: 0.1,
          }}
        />
        <div className="flex items-end gap-4 mb-3">
          <span className="bg-[#4C69F6] text-white px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">
            PHASE 04
          </span>
          <h1 className="headline-bleed kinetic-text-blue text-on-background dark:text-dark-on-background">
            Production
          </h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-1 w-24 bg-[#4C69F6]" />
          <p className="font-label font-bold text-[#4C69F6] tracking-[0.2em] text-sm uppercase">
            Active Venture Tracker
          </p>
          <span className="ml-auto flex items-center gap-1.5 font-label text-[9px] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full" style={{ background: error ? "#EE5454" : "#4C69F6" }} />
            <span style={{ color: error ? "#EE5454" : "#4C69F6" }}>
              {error ? "Offline" : "Live DB"}
            </span>
          </span>
          <motion.button
            onClick={refetch}
            className="p-2 border-2 border-black/10 dark:border-white/10 text-on-surface-variant hover:border-[#4C69F6] hover:text-[#4C69F6] transition-colors"
            whileTap={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            title="Refresh ventures"
          >
            <RefreshCw size={14} />
          </motion.button>
          {/* New Venture button */}
          <ComicButton
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setShowNewModal(true)}
          >
            New Venture
          </ComicButton>
        </div>
      </header>

      {/* ── Summary Strip ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <BentoCard key={i} className="py-4 animate-pulse">
              <div className="h-2 w-24 bg-surface-container rounded mb-2" />
              <div className="h-8 w-16 bg-surface-container rounded" />
            </BentoCard>
          ))}
        </div>
      ) : (
        <SummaryStrip ventures={ventures ?? []} />
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-6 p-4 border-l-4 border-[#EE5454] bg-[#EE5454]/5 flex items-center gap-3">
          <AlertTriangle size={16} className="text-[#EE5454] shrink-0" />
          <p className="font-label text-xs uppercase tracking-widest text-[#EE5454] flex-1">
            Could not reach API — showing cached data
          </p>
          <ComicButton variant="secondary" size="sm" onClick={refetch}>Retry</ComicButton>
        </div>
      )}

      {/* ── Venture Cards Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <VentureCardSkeleton key={i} delay={i * 0.08} />)
        ) : ventures && ventures.length > 0 ? (
          ventures.map((v, i) => (
            <VentureCard key={v.id} venture={v} delay={i * 0.08} />
          ))
        ) : (
          !error && <EmptyState onNew={() => setShowNewModal(true)} />
        )}
      </div>

      {/* ── New Venture Modal ── */}
      <AnimatePresence>
        {showNewModal && (
          <NewVentureModal
            onClose={() => { setShowNewModal(false); setPrefill(undefined); }}
            onCreated={refetch}
            initialData={prefill}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
