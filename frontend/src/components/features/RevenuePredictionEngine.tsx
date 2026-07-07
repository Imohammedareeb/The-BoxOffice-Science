"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BentoCard } from "@/components/ui/BentoCard";
import { MorphButton, ComicButton } from "@/components/ui/ComicButton";
import {
  DollarSign, Film, Users, Calendar, TrendingUp,
  AlertTriangle, CheckCircle2, X, ChevronDown, RotateCcw,
} from "lucide-react";
import { cn, formatCurrency, roiColor } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { predictRevenue } from "@/lib/api";
import { sleep } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────
interface FormState {
  budget: number;
  genre: string;
  cast_tier: string;
  target_demographic: string;
  release_season: string;
  distributor_split: number;
  tax_rate: number;
}

interface ResultState {
  predicted_revenue: number;
  roi_percentage: number;
  net_profit: number;
  distributor_share: number;
  tax_deduction: number;
  confidence: number;
  risk_level: "Low" | "Medium" | "High";
}

// ── Local fallback (used only when backend is unreachable) ─
function _localFallback(form: FormState): ResultState {
  const gm = ({ Action:2.8,"Sci-Fi":2.4,Animation:3.1,Comedy:1.9,Drama:1.5,Horror:2.2,Thriller:1.8,Fantasy:2.6,Romance:1.4 } as Record<string,number>)[form.genre] ?? 2.0;
  const cm = ({ "A-List":1.8,"B-List":1.3,Mixed:1.5,Newcomer:0.9 } as Record<string,number>)[form.cast_tier] ?? 1.3;
  const sm = ({ Summer:1.4,Holiday:1.5,Spring:1.1,Fall:1.0,Winter:0.9 } as Record<string,number>)[form.release_season] ?? 1.0;
  const gross = form.budget * gm * cm * sm * (1 + Math.random() * 0.16 - 0.08);
  const distShare = (gross * form.distributor_split) / 100;
  const studioGross = gross - distShare;
  const taxDed = (studioGross * form.tax_rate) / 100;
  const netProfit = studioGross - taxDed - form.budget;
  const roi = (netProfit / form.budget) * 100;
  return {
    predicted_revenue: Math.round(gross),
    roi_percentage:    Math.round(roi * 10) / 10,
    net_profit:        Math.round(netProfit),
    distributor_share: Math.round(distShare),
    tax_deduction:     Math.round(taxDed),
    confidence:        Math.min(95, Math.round(60 + gm * 8 + cm * 5 + Math.random() * 8)),
    risk_level:        roi > 150 ? "Low" : roi > 50 ? "Medium" : "High",
  };
}

// ── Options ────────────────────────────────────────────────
const GENRES       = ["Action","Sci-Fi","Animation","Comedy","Drama","Horror","Thriller","Fantasy","Romance"];
const CAST_TIERS   = ["A-List","B-List","Mixed","Newcomer"];
const DEMOGRAPHICS = ["Under 18","18–24","18–34","25–44","35–54","55+","All Ages","Family"];
const SEASONS      = ["Summer","Holiday","Spring","Fall","Winter"];

// ── Sub-components ─────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-label text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5 block">
      {children}
    </label>
  );
}

function BudgetSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [5, 10, 25, 50, 100, 150, 200, 300, 500];
  const pct = (steps.indexOf(Math.round(value / 1_000_000)) / (steps.length - 1)) * 100;
  return (
    <div>
      <FieldLabel>Production Budget</FieldLabel>
      <div className="flex items-center justify-between mb-2">
        <span className="font-headline font-black text-3xl text-[#4C69F6]">
          {formatCurrency(value, "USD", true)}
        </span>
        <span className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">
          Production Cost
        </span>
      </div>
      <div className="relative h-3 bg-surface-container dark:bg-dark-surface-container-high w-full">
        <div className="absolute top-0 left-0 h-full bg-[#4C69F6] transition-all duration-200" style={{ width: `${pct}%` }} />
        <input
          type="range" min={1000} max={500000000} step={5000000} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-[#4C69F6] border-2 border-black dark:border-white/20 shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] transition-all duration-200"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant">$5M</span>
        <span className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant">$500M</span>
      </div>
    </div>
  );
}

function ComicSelect({ value, options, onChange, icon }: {
  value: string; options: string[]; onChange: (v: string) => void; icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 border-b-[3px] border-[#4C69F6] pb-2">
        {icon && <span className="text-[#4C69F6] shrink-0">{icon}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent flex-1 font-headline font-black text-sm uppercase tracking-tight text-on-surface dark:text-dark-on-surface outline-none cursor-pointer appearance-none"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-surface dark:bg-dark-surface-container font-headline">{o}</option>
          ))}
        </select>
        <ChevronDown size={14} className="text-on-surface-variant dark:text-dark-on-surface-variant shrink-0" />
      </div>
    </div>
  );
}

function PercentInput({ label, value, onChange, min = 0, max = 100, color = "#4C69F6" }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-container dark:bg-dark-surface-container-high relative">
          <div
            className="absolute top-0 left-0 h-full transition-all"
            style={{ width: `${((value - min) / (max - min)) * 100}%`, background: color }}
          />
          <input
            type="range" min={min} max={max} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="font-headline font-black text-xl w-14 text-right" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

// ── Results Panel ──────────────────────────────────────────
// FIX-ORC-01: ResultsPanel is ONLY rendered here — never rendered inline outside portal
// FIX-ORC-02: Added no-scrollbar class to modal overflow container
function ResultsPanel({
  result, budget, genre, cast_tier, onClose, onReset, onSave,
}: {
  result: ResultState; budget: number; genre: string; cast_tier: string;
  onClose: () => void; onReset: () => void; onSave: () => void;
}) {
  const router = useRouter();
  const riskColors = { Low: "#00A841", Medium: "#F6DB35", High: "#EE5454" };
  const riskColor  = riskColors[result.risk_level];

  const bars = [
    { label: "Gross Revenue",    value: result.predicted_revenue,                     color: "#4C69F6", max: result.predicted_revenue },
    { label: "Distributor Cut",  value: result.distributor_share,                     color: "#714B96", max: result.predicted_revenue },
    { label: "Tax Deduction",    value: result.tax_deduction,                         color: "#EE5454", max: result.predicted_revenue },
    { label: "Production Budget",value: budget,                                       color: "#F6DB35", max: result.predicted_revenue },
    { label: "Net Profit",       value: Math.max(0, result.net_profit),               color: "#00A841", max: result.predicted_revenue },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* FIX-ORC-02: no-scrollbar class added — removes unstyled OS scrollbar */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-[#4C69F6] shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_#4C69F6]">

        {/* Header */}
        <div className="bg-[#1a1c1e] p-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }} />
          <div className="flex items-start justify-between">
            <div>
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center gap-2 bg-[#00A841] text-white px-3 py-1 font-headline font-black text-xs uppercase tracking-widest mb-3"
              >
                <CheckCircle2 size={12} />
                PREDICTION COMPLETE
              </motion.div>
              <h2 className="font-headline font-black text-3xl md:text-4xl uppercase text-white leading-none" style={{ textShadow: "3px 3px 0 #4C69F6" }}>
                ORACLE<br />RESULTS
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors mt-1">
              <X size={22} />
            </button>
          </div>

          {/* Big ROI */}
          <div className="mt-6 flex items-end gap-6 flex-wrap">
            <div>
              <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-1">Net ROI</p>
              <motion.p
                className={cn("font-headline font-black text-6xl leading-none", roiColor(result.roi_percentage))}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}
              >
                +{result.roi_percentage.toFixed(1)}%
              </motion.p>
            </div>
            <div>
              <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-1">Net Profit</p>
              <motion.p
                className="font-headline font-black text-4xl text-[#00A841] leading-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {formatCurrency(result.net_profit, "USD", true)}
              </motion.p>
            </div>
            <div className="flex flex-col">
              <p className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-1">Risk Level</p>
              <span
                className="font-headline font-black text-2xl uppercase px-3 py-1 border-2"
                style={{ color: riskColor, borderColor: riskColor }}
              >
                {result.risk_level}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="p-6 space-y-4">
          <h3 className="font-headline font-black text-lg uppercase mb-5">Financial Breakdown</h3>
          {bars.map((bar, i) => (
            <div key={bar.label}>
              <div className="flex justify-between font-label text-[11px] font-bold uppercase tracking-widest mb-1.5">
                <span className="text-on-surface-variant dark:text-dark-on-surface-variant">{bar.label}</span>
                <span style={{ color: bar.color }}>{formatCurrency(bar.value, "USD", true)}</span>
              </div>
              <div className="h-4 bg-surface-container dark:bg-dark-surface-container-high w-full">
                <motion.div
                  className="h-full"
                  style={{ background: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(bar.value / bar.max) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}

          {/* Confidence + Gross */}
          <div className="mt-6 p-4 bg-surface-container dark:bg-dark-surface-container-high border-l-4 border-[#4C69F6] flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-0.5">
                AI Confidence Score
              </p>
              <p className="font-headline font-black text-2xl text-[#4C69F6]">{result.confidence}%</p>
            </div>
            <div className="text-right">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-0.5">
                Gross Revenue
              </p>
              <p className="font-headline font-black text-2xl">
                {formatCurrency(result.predicted_revenue, "USD", true)}
              </p>
            </div>
          </div>

          {result.risk_level === "High" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-4 bg-[#EE5454]/10 border-l-4 border-[#EE5454]"
            >
              <AlertTriangle size={16} className="text-[#EE5454] mt-0.5 shrink-0" />
              <p className="font-body text-sm text-on-surface dark:text-dark-on-surface">
                High-risk investment detected. Consider adjusting cast tier or targeting a higher-performing genre to improve ROI projections.
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <ComicButton variant="primary" size="md" className="flex-1" onClick={onSave}>
            Save to History
          </ComicButton>
          <ComicButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => {
              const params = new URLSearchParams({
                autoOpen: "true",
                budget: budget.toString(),
                genre: genre,
                cast: cast_tier,
                rev: result.predicted_revenue.toString(),
                risk: result.risk_level
              });
              router.push(`/production?${params.toString()}`);
            }}
          >
            Track in Production →
          </ComicButton>
          <ComicButton variant="ghost" size="md" onClick={onReset} icon={<RotateCcw size={14} />}>
            Reset
          </ComicButton>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────
export function RevenuePredictionEngine() {
  const { setPredictionResult } = useStore();

  const [form, setForm] = useState<FormState>({
    budget: 50_000_000,
    genre: "Action",
    cast_tier: "B-List",
    target_demographic: "18–34",
    release_season: "Summer",
    distributor_split: 45,
    tax_rate: 30,
  });

  const [isLoading,   setIsLoading]   = useState(false);
  const [isDone,      setIsDone]      = useState(false);
  const [result,      setResult]      = useState<ResultState | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [savedToast,  setSavedToast]  = useState(false);

  const handleSave = () => {
    if (result) {
      setPredictionResult(result as any);
      setSavedToast(true);
      setTimeout(() => { setSavedToast(false); setShowResults(false); }, 1800);
    }
  };

  const handleCrunch = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsDone(false);
    // FIX-ORC-01: Close any existing results before opening new ones
    setShowResults(false);
    setResult(null);

    try {
      const data = await predictRevenue({
        budget:             form.budget,
        genre:              form.genre,
        cast_tier:          form.cast_tier as any,
        target_demographic: form.target_demographic,
        release_season:     form.release_season as any,
        distributor_split:  form.distributor_split,
        tax_rate:           form.tax_rate,
      });
      const mapped: ResultState = {
        predicted_revenue: data.predicted_revenue,
        roi_percentage:    data.roi_percentage,
        net_profit:        data.net_profit,
        distributor_share: data.distributor_share,
        tax_deduction:     data.tax_deduction,
        confidence:        data.confidence,
        risk_level:        data.risk_level,
      };
      setResult(mapped);
      setPredictionResult(data as any);
    } catch {
      const fallback = _localFallback(form);
      setResult(fallback);
      setPredictionResult(fallback as any);
    } finally {
      setIsLoading(false);
      setIsDone(true);
      await sleep(400);
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setResult(null);
    setIsDone(false);
  };

  return (
    <>
      <BentoCard className="relative" noPadding>
        {/* Header stripe */}
        <div className="bg-[#4C69F6] px-8 py-3 flex items-center gap-3">
          <TrendingUp size={16} className="text-white" />
          <span className="font-headline font-black text-sm uppercase tracking-widest text-white">
            Revenue Prediction Engine
          </span>
          <span className="ml-auto font-label text-[10px] text-white/60 uppercase tracking-widest">
            Phase 02 · Oracle
          </span>
        </div>

        <div className="p-6 md:p-8">
          {/* Budget */}
          <div className="mb-8">
            <BudgetSlider value={form.budget} onChange={(v) => setForm((f) => ({ ...f, budget: v }))} />
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <FieldLabel>Genre</FieldLabel>
              <ComicSelect value={form.genre} options={GENRES} onChange={(v) => setForm((f) => ({ ...f, genre: v }))} icon={<Film size={15} />} />
            </div>
            <div>
              <FieldLabel>Cast Tier</FieldLabel>
              <ComicSelect value={form.cast_tier} options={CAST_TIERS} onChange={(v) => setForm((f) => ({ ...f, cast_tier: v }))} icon={<Users size={15} />} />
            </div>
            <div>
              <FieldLabel>Target Demographic</FieldLabel>
              <ComicSelect value={form.target_demographic} options={DEMOGRAPHICS} onChange={(v) => setForm((f) => ({ ...f, target_demographic: v }))} icon={<Users size={15} />} />
            </div>
            <div>
              <FieldLabel>Release Season</FieldLabel>
              <ComicSelect value={form.release_season} options={SEASONS} onChange={(v) => setForm((f) => ({ ...f, release_season: v }))} icon={<Calendar size={15} />} />
            </div>
          </div>

          {/* Percent sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-5 bg-surface-container dark:bg-dark-surface-container-high">
            <PercentInput label="Distributor Split" value={form.distributor_split} onChange={(v) => setForm((f) => ({ ...f, distributor_split: v }))} min={30} max={60} color="#714B96" />
            <PercentInput label="Tax Rate" value={form.tax_rate} onChange={(v) => setForm((f) => ({ ...f, tax_rate: v }))} min={10} max={50} color="#EE5454" />
          </div>

          {/* Live preview strip */}
          <div className="mb-6 flex gap-px">
            {[
              { label: "Budget", val: formatCurrency(form.budget, "USD", true), color: "#4C69F6" },
              { label: "Genre",  val: form.genre,          color: "#EE5454" },
              { label: "Cast",   val: form.cast_tier,      color: "#F6DB35" },
              { label: "Season", val: form.release_season, color: "#00A841" },
            ].map((tag) => (
              <div key={tag.label} className="flex-1 py-2 px-3 flex flex-col items-center bg-surface-container dark:bg-dark-surface-container-high" style={{ borderBottom: `3px solid ${tag.color}` }}>
                <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">{tag.label}</span>
                <span className="font-headline font-black text-xs mt-0.5" style={{ color: tag.color }}>{tag.val}</span>
              </div>
            ))}
          </div>

          <MorphButton
            label="⚡ CRUNCH THE NUMBERS"
            loadingLabel="ORACLE IS THINKING..."
            isLoading={isLoading}
            isDone={isDone}
            onClick={handleCrunch}
            className="w-full text-base"
          />
        </div>
      </BentoCard>

      {/*
        FIX-ORC-01: ResultsPanel is rendered ONLY via portal — zero inline renders.
        The portal renders into document.body, so position:fixed works correctly
        inside the scrollable main layout without double-mounting.

        Pattern: AnimatePresence wraps the conditional render inside the portal.
        No ResultsPanel JSX exists outside this portal block anywhere in this file.
      */}
      {typeof window !== "undefined" &&
        createPortal(
          <>
            <AnimatePresence mode="wait">
              {showResults && result && (
                <ResultsPanel
                  key="oracle-results-panel"
                  result={result}
                  budget={form.budget}
                  genre={form.genre}
                  cast_tier={form.cast_tier}
                  onClose={() => setShowResults(false)}
                  onReset={handleReset}
                  onSave={handleSave}
                />
              )}
            </AnimatePresence>

            {/* Save confirmation toast */}
            <AnimatePresence>
              {savedToast && (
                <motion.div
                  key="save-toast"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-[#00A841] text-white px-6 py-3 font-headline font-black text-sm uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                >
                  ✓ Analysis Saved to Session
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
