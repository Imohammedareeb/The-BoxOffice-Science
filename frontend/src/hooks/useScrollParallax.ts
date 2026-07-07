"use client";

import { useRef } from "react";
import {
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";

interface ParallaxOptions {
  /** Speed factor: < 1 = slower (background), > 1 = faster (foreground) */
  speed?: number;
  /** Input scroll range [start, end] in 0-1 */
  inputRange?: [number, number];
  /** Output y translation range in pixels */
  outputRange?: [number, number];
  /** Add spring smoothing */
  spring?: boolean;
}

/** Returns a MotionValue<number> for the y-offset of a parallax element */
export function useScrollParallax(
  options: ParallaxOptions = {}
): { ref: React.RefObject<HTMLElement>; y: MotionValue<number> } {
  const {
    speed = 0.5,
    outputRange = [-60 * speed, 60 * speed],
    spring = true,
  } = options;

  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], outputRange);
  const smoothY = useSpring(rawY, { stiffness: 60, damping: 20 });

  return { ref, y: spring ? smoothY : rawY };
}

/** Returns a page-level scroll progress MotionValue */
export function usePageScroll() {
  const { scrollYProgress, scrollY } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });
  return { scrollY, scrollYProgress, smoothProgress };
}

/** Scroll-triggered entrance: returns opacity + y for an element */
export function useScrollEntrance(delay = 0) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0.1 1", "0.4 1"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const smoothOpacity = useSpring(opacity, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(y, { stiffness: 80, damping: 20 });

  return { ref, opacity: smoothOpacity, y: smoothY };
}
