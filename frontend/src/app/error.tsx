"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to monitoring service in production
    console.error("[BOS Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 relative">
      {/* Halftone */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #EE5454 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          opacity: 0.04,
        }}
      />

      <motion.div
        className="text-center max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Sound effect */}
        <motion.p
          className="font-headline font-black text-5xl uppercase italic mb-2"
          style={{ color: "#EE5454", textShadow: "4px 4px 0 #1a1c1e" }}
          initial={{ rotate: -5, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          SYSTEM CRASH!
        </motion.p>

        <h2 className="font-headline font-black text-2xl uppercase mb-3 text-on-surface dark:text-white">
          Something Exploded
        </h2>

        <p className="font-body text-sm text-on-surface-variant dark:text-[#c5c4d6] mb-2 leading-relaxed">
          An unexpected error occurred in this module.
        </p>

        {/* Error code */}
        {error.digest && (
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50 dark:text-[#c5c4d6]/40 mb-8">
            Error ID: {error.digest}
          </p>
        )}

        {/* Error message in dev */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-3 bg-[#EE5454]/10 border-l-4 border-[#EE5454] text-left">
            <p className="font-label text-[10px] uppercase tracking-widest text-[#EE5454] mb-1">
              Dev — Error Message:
            </p>
            <p className="font-body text-xs text-[#EE5454]/80 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <motion.button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 font-headline font-black text-sm uppercase tracking-widest text-white bg-[#EE5454] border-4 border-black"
            style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
            whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
            whileTap={{ x: 2, y: 2 }}
          >
            <RefreshCw size={14} />
            Try Again
          </motion.button>

          <motion.a
            href="/"
            className="flex items-center gap-2 px-6 py-3 font-headline font-black text-sm uppercase tracking-widest border-4 border-black dark:border-white/30 text-on-surface dark:text-white"
            style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,0.3)" }}
            whileHover={{ x: -2, y: -2 }}
            whileTap={{ x: 2, y: 2 }}
          >
            <Home size={14} />
            Dashboard
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
