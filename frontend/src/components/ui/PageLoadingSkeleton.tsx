"use client";

import { motion } from "framer-motion";

interface PageLoadingSkeletonProps {
  accentColor?: string;
  phase?: string;
  title?: string;
}

export function PageLoadingSkeleton({
  accentColor = "#4C69F6",
  phase = "01",
  title = "Loading...",
}: PageLoadingSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header skeleton */}
      <div className="mb-10 p-8 bg-surface-container-lowest dark:bg-dark-surface-container animate-pulse">
        <div className="flex items-end gap-4 mb-3">
          <div
            className="px-3 py-1 text-[10px] font-headline font-black tracking-widest uppercase text-white"
            style={{ background: accentColor }}
          >
            PHASE {phase}
          </div>
          <div className="h-10 w-64 bg-surface-container dark:bg-dark-surface-container-high rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24" style={{ background: accentColor }} />
          <div className="h-3 w-48 bg-surface-container dark:bg-dark-surface-container-high rounded" />
        </div>
      </div>

      {/* Card skeletons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-white/10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_#4C69F6] p-6 animate-pulse"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="h-3 w-20 bg-surface-container dark:bg-dark-surface-container-high rounded mb-3" />
            <div className="h-8 w-36 bg-surface-container dark:bg-dark-surface-container-high rounded mb-4" />
            <div className="space-y-2">
              <div className="h-2 w-full bg-surface-container dark:bg-dark-surface-container-high rounded" />
              <div className="h-2 w-4/5 bg-surface-container dark:bg-dark-surface-container-high rounded" />
              <div className="h-2 w-2/3 bg-surface-container dark:bg-dark-surface-container-high rounded" />
            </div>
            {/* Bottom accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accentColor }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
