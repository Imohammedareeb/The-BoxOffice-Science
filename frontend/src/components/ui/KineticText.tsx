"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

type KineticVariant = "default" | "red" | "blue" | "yellow" | "green" | "white";

const SHADOW_MAP: Record<KineticVariant, string> = {
  default: "4px 4px 0px #EE5454",
  red: "4px 4px 0px #EE5454",
  blue: "4px 4px 0px #4C69F6",
  yellow: "5px 5px 0px #F6DB35",
  green: "3px 3px 0px #00A841",
  white: "4px 4px 0px rgba(255,255,255,0.3)",
};

interface KineticTextProps {
  children: React.ReactNode;
  className?: string;
  /** Size preset */
  size?: "sm" | "md" | "lg" | "xl" | "display";
  variant?: KineticVariant;
  /** Animate each word individually */
  wordByWord?: boolean;
  /** Delay for staggered entrances */
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

const SIZE_CLASSES = {
  sm: "text-xl md:text-2xl font-black tracking-tight",
  md: "text-3xl md:text-4xl font-black tracking-tight",
  lg: "text-4xl md:text-6xl font-black tracking-tighter",
  xl: "text-5xl md:text-7xl font-black tracking-tighter",
  display: "text-6xl md:text-9xl font-black tracking-tighter leading-none",
};

export function KineticText({
  children,
  className,
  size = "md",
  variant = "default",
  wordByWord = false,
  delay = 0,
  tag: Tag = "h2",
}: KineticTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  if (wordByWord && typeof children === "string") {
    const words = children.split(" ");
    return (
      <Tag
        ref={ref as React.Ref<any>}
        className={cn(
          "font-headline uppercase",
          SIZE_CLASSES[size],
          className
        )}
        style={{ textShadow: SHADOW_MAP[variant] }}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            initial={{ opacity: 0, y: 20, skewX: -5 }}
            animate={inView ? { opacity: 1, y: 0, skewX: 0 } : {}}
            transition={{
              delay: delay + i * 0.06,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </Tag>
    );
  }

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      aria-label={typeof children === "string" ? children : undefined}
      initial={{ opacity: 0, y: 24, skewX: -3 }}
      animate={inView ? { opacity: 1, y: 0, skewX: 0 } : {}}
      transition={{
        delay,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Tag
        className={cn(
          "font-headline uppercase",
          SIZE_CLASSES[size],
          className
        )}
        style={{ textShadow: SHADOW_MAP[variant] }}
      >
        {children}
      </Tag>
    </motion.div>
  );
}

// ── Stat number that counts up on mount ───────────────────
interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function CountUpNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  duration = 1.5,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={cn("font-headline font-black tabular-nums", className)}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        onUpdate={(latest) => {
          if (ref.current && "opacity" in latest) {
            // handled by framer
          }
        }}
      >
        {prefix}
        <motion.span
          initial={{ textContent: "0" } as any}
          animate={inView ? { textContent: value.toFixed(decimals) } as any : {}}
          transition={{ duration, ease: "easeOut" }}
          onUpdate={(latest) => {
            if (ref.current) {
              const num = parseFloat(String(latest.textContent || 0));
              ref.current.textContent = prefix + num.toFixed(decimals) + suffix;
            }
          }}
        />
        {suffix}
      </motion.span>
    </motion.span>
  );
}

// Simpler version using useEffect
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <span ref={ref} className={cn("font-headline font-black tabular-nums", className)}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      >
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </motion.span>
    </span>
  );
}
