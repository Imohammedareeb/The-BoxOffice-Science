"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardBentoGrid } from "@/components/dashboard/DashboardBentoGrid";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Page Header */}
      <header className="mb-10 relative overflow-hidden p-8 bg-surface-container-lowest dark:bg-dark-surface-container">
        {/* Halftone decorative layer */}
        <div className="absolute top-0 right-0 w-1/3 h-full halftone-hero pointer-events-none" />

        <div className="flex items-end gap-4 mb-3">
          <span className="bg-secondary text-white px-2 py-1 font-headline font-black text-[10px] tracking-widest uppercase">
            PHASE 01
          </span>
          <motion.h1
            className="headline-bleed kinetic-text text-on-background dark:text-dark-on-background"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            The Command
            <br />
            Center
          </motion.h1>
        </div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="h-1 w-24 bg-primary" />
          <p className="font-label font-bold text-primary tracking-[0.2em] text-sm uppercase">
            Real-time Venture Intelligence
          </p>
        </motion.div>
      </header>

      {/* Main Bento Grid */}
      <DashboardBentoGrid />

      {/* Welcome Toast */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[9999] bg-[#00A841] text-white px-8 py-4 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex items-center gap-3"
          >
            <CheckCircle2 size={24} />
            <div>
              <p className="font-headline font-black text-lg uppercase leading-none">Welcome to the Studio</p>
              <p className="font-label text-[10px] uppercase tracking-widest mt-1 opacity-80">Registration Successful · Access Granted</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
