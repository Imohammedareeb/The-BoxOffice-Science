"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#121318] px-4 relative overflow-hidden">
      {/* Halftone bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          opacity: 0.04,
        }}
      />

      <motion.div
        className="text-center relative z-10 max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Big 404 */}
        <motion.div
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
        >
          <p
            className="font-headline font-black uppercase leading-none select-none"
            style={{
              fontSize: "clamp(8rem, 25vw, 16rem)",
              color: "#EE5454",
              textShadow: "8px 8px 0 #4C69F6",
              letterSpacing: "-0.06em",
            }}
          >
            404
          </p>
        </motion.div>

        {/* Comic sound effect */}
        <motion.span
          className="inline-block font-headline font-black text-3xl uppercase italic mb-6"
          style={{
            color: "#F6DB35",
            textShadow: "3px 3px 0 #1a1c1e",
            transform: "rotate(-3deg)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
        >
          PLOT HOLE!
        </motion.span>

        <h2 className="font-headline font-black text-2xl uppercase mb-3 text-on-surface dark:text-white">
          Scene Not Found
        </h2>
        <p className="font-body text-sm text-on-surface-variant dark:text-[#c5c4d6] mb-8 leading-relaxed">
          The page you're looking for doesn't exist in this universe.
          It may have been cut in post-production.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 px-6 py-3 font-headline font-black text-sm uppercase tracking-widest text-white bg-[#4C69F6] border-4 border-black cursor-pointer"
              style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,1)" }}
              whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
              whileTap={{ x: 2, y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
            >
              <Home size={14} />
              Command Center
            </motion.div>
          </Link>

          <button onClick={() => window.history.back()}>
            <motion.div
              className="flex items-center gap-2 px-6 py-3 font-headline font-black text-sm uppercase tracking-widest bg-transparent border-4 border-black dark:border-white/30 cursor-pointer text-on-surface dark:text-white"
              style={{ boxShadow: "4px 4px 0 0 rgba(0,0,0,0.4)" }}
              whileHover={{ x: -2, y: -2 }}
              whileTap={{ x: 2, y: 2 }}
            >
              <ArrowLeft size={14} />
              Go Back
            </motion.div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
