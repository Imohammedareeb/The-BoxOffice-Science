"use client";

import { motion } from "framer-motion";
import { RevenuePredictionEngine } from "@/components/features/RevenuePredictionEngine";
import { CinematicBudgetVisualizer } from "@/components/features/CinematicBudgetVisualizer";

export default function OraclePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Page Header */}
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        <div className="absolute top-0 right-0 w-1/3 h-full halftone-red pointer-events-none" />
        <div className="flex items-end gap-4 mb-3">
          <span className="bg-[#EE5454] text-white px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">
            PHASE 02
          </span>
          <motion.h1
            className="headline-bleed kinetic-text-blue text-on-background dark:text-dark-on-background"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            The Oracle
          </motion.h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-[#EE5454]" />
          <p className="font-label font-bold text-[#EE5454] tracking-[0.2em] text-sm uppercase">
            Revenue Prediction & ROI Intelligence
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenuePredictionEngine />
        <CinematicBudgetVisualizer />
      </div>
    </motion.div>
  );
}
