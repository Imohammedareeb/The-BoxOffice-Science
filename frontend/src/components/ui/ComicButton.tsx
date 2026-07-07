"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

// Classic comic sound effects shown on click
const SOUND_EFFECTS = ["POW!", "BAM!", "ZAP!", "WHAM!", "KA-BOOM!"];

interface ComicButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  /** Show a random comic sound effect on click */
  soundEffect?: boolean;
  className?: string;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  /** Native tooltip / accessible label shown on hover */
  title?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#4C69F6] text-white border-black dark:border-white/30 hover:bg-[#2e4edc] shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#4C69F6]",
  secondary:
    "bg-[#EE5454] text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
  tertiary:
    "bg-[#F6DB35] text-[#1a1c1e] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
  ghost:
    "bg-transparent text-on-surface dark:text-dark-on-surface border-black dark:border-white/30 hover:bg-surface-container dark:hover:bg-dark-surface-container-high shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]",
  danger:
    "bg-[#ba1a1a] text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs gap-1.5",
  md: "px-5 py-3 text-sm gap-2",
  lg: "px-7 py-4 text-base gap-2.5",
  xl: "px-10 py-5 text-lg gap-3",
};

export function ComicButton({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  loadingText,
  soundEffect = false,
  className,
  onClick,
  type = "button",
  fullWidth = false,
  icon,
  iconPosition = "left",
  title,
}: ComicButtonProps) {
  const [effect, setEffect] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;

    if (soundEffect) {
      const sfx = SOUND_EFFECTS[Math.floor(Math.random() * SOUND_EFFECTS.length)];
      setEffect(sfx);
      setIsAnimating(true);
      setTimeout(() => {
        setEffect(null);
        setIsAnimating(false);
      }, 700);
    }

    await onClick?.();
  };

  return (
    <motion.button
      type={type}
      title={title}
      className={cn(
        "relative inline-flex items-center justify-center",
        "font-headline font-black uppercase tracking-wide",
        "border-3 border-4",
        "transition-colors duration-150",
        "cursor-pointer select-none",
        "overflow-visible",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      whileHover={
        disabled || loading
          ? {}
          : { x: -2, y: -2, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }
      }
      whileTap={
        disabled || loading
          ? {}
          : { x: 2, y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }
      }
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      disabled={disabled || loading}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mr-2"
        >
          <Loader2 size={16} className="animate-spin" />
        </motion.span>
      )}

      {/* Left icon */}
      {!loading && icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}

      {/* Label */}
      <span>{loading && loadingText ? loadingText : children}</span>

      {/* Right icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}

      {/* Sound Effect Pop */}
      <AnimatePresence>
        {effect && (
          <motion.span
            key={effect}
            className="absolute -top-8 left-1/2 -translate-x-1/2 font-headline font-black text-lg uppercase italic pointer-events-none text-[#F6DB35] z-50"
            style={{ textShadow: "2px 2px 0 #1a1c1e" }}
            initial={{ opacity: 0, scale: 0.5, y: 0, rotate: -8 }}
            animate={{ opacity: 1, scale: 1.2, y: -12, rotate: 5 }}
            exit={{ opacity: 0, scale: 0.8, y: -24 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {effect}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Morphing CTA Button ────────────────────────────────────
// Expands into results panel on click (used in RevenuePredictionEngine)
interface MorphButtonProps {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  isDone?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MorphButton({
  label,
  loadingLabel = "CRUNCHING...",
  isLoading = false,
  isDone = false,
  onClick,
  className,
}: MorphButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative flex items-center justify-center gap-3 font-headline font-black uppercase tracking-widest",
        "bg-[#4C69F6] text-white border-4 border-black",
        "shadow-[6px_6px_0_0_rgba(0,0,0,1)]",
        "py-5 cursor-pointer overflow-hidden",
        className
      )}
      onClick={onClick}
      animate={{
        backgroundColor: isDone
          ? "#00A841"
          : isLoading
          ? "#F6DB35"
          : "#4C69F6",
      }}
      whileHover={isLoading ? {} : { x: -2, y: -2, boxShadow: "8px 8px 0 0 rgba(0,0,0,1)" }}
      whileTap={isLoading ? {} : { x: 2, y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 text-black"
          >
            {/* Animated comic loading dots */}
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 bg-black inline-block"
                  animate={{ scaleY: [1, 2, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </span>
            <span>{loadingLabel}</span>
          </motion.span>
        ) : isDone ? (
          <motion.span
            key="done"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-2 text-white"
            transition={{ type: "spring", bounce: 0.5 }}
          >
            ✓ RESULTS READY!
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
