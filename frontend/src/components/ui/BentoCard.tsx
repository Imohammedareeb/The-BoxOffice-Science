"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type BentoVariant =
  | "default"    // white / dark-surface card
  | "hero"       // Action Red — primary focus panel
  | "blue"       // Hero Blue
  | "yellow"     // Classic Yellow
  | "green"      // Toxic Green
  | "purple"     // Villain Purple
  | "dark"       // Dark / inverted panel
  | "glass";     // Glassmorphic overlay

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: BentoVariant;
  /** Enable 3D tilt on hover */
  tilt?: boolean;
  /** Span columns: e.g. "md:col-span-2" */
  colSpan?: string;
  /** Span rows: e.g. "row-span-2" */
  rowSpan?: string;
  noPadding?: boolean;
  onClick?: () => void;
  as?: "section" | "div" | "article";
}

const VARIANT_STYLES: Record<BentoVariant, string> = {
  default:
    "bg-surface-container-lowest dark:bg-dark-surface-container text-on-surface dark:text-dark-on-surface border-4 border-black dark:border-white/10 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_#4C69F6]",
  hero:
    "bg-[#EE5454] text-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
  blue:
    "bg-[#4C69F6] text-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
  yellow:
    "bg-[#F6DB35] text-[#1a1c1e] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
  green:
    "bg-[#00A841] text-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
  purple:
    "bg-[#714B96] text-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]",
  dark:
    "bg-[#1a1c1e] text-white border-4 border-black shadow-[8px_8px_0_0_#4C69F6]",
  glass:
    "glass-card border border-white/30 dark:border-white/10 shadow-glass text-on-surface dark:text-dark-on-surface",
};

export function BentoCard({
  children,
  className,
  variant = "default",
  tilt = false,
  colSpan,
  rowSpan,
  noPadding = false,
  onClick,
  as: Tag = "div",
}: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 3D tilt tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const normalX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalX);
    y.set(normalY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative overflow-hidden",
        VARIANT_STYLES[variant],
        !noPadding && "p-6 md:p-8",
        colSpan,
        rowSpan,
        onClick && "cursor-pointer",
        className
      )}
      style={tilt ? { rotateX, rotateY, transformStyle: "preserve-3d" } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={
        tilt
          ? { z: 8 }
          : { x: -2, y: -2 }
      }
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.3,
      }}
      onClick={onClick}
    >
      {/* Halftone decorative overlay — faint, adds depth */}
      {(variant === "hero" || variant === "blue" || variant === "dark") && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            opacity: 0.4,
          }}
          aria-hidden
        />
      )}

      {children}
    </motion.div>
  );
}

// ── BentoGrid wrapper ──────────────────────────────────────
interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 3 | 4 | 6 | 12;
}

export function BentoGrid({ children, className, columns = 6 }: BentoGridProps) {
  const colClass = {
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    12: "grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12",
  }[columns];

  return (
    <div className={cn("grid gap-6 auto-rows-min", colClass, className)}>
      {children}
    </div>
  );
}
