"use client";

import { motion } from "framer-motion";
import { NLPConceptRecommender } from "@/components/features/NLPConceptRecommender";

export default function ScannerPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        <div
          className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #714B96 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            opacity: 0.12,
          }}
        />
        <div className="flex items-end gap-4 mb-3">
          <span className="bg-[#714B96] text-white px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">
            PHASE 03
          </span>
          <motion.h1
            className="headline-bleed text-on-background dark:text-dark-on-background"
            style={{ textShadow: "4px 4px 0px #714B96" }}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Script Scanner
          </motion.h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-[#714B96]" />
          <p className="font-label font-bold text-[#714B96] tracking-[0.2em] text-sm uppercase">
            NLP Concept Matching Engine
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <NLPConceptRecommender />
      </div>
    </motion.div>
  );
}
