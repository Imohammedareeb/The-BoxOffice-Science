"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "./TopNav";
import { SideNav } from "./SideNav";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Brain, FileText, Clapperboard, Archive, TrendingUp } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Must keep in sync with SideNav NAV_ITEMS
// ISS-06 FIX: Added Market Pulse (/market) — was missing, unreachable on mobile
// Swapped Production (already accessible via TopNav "Slate") for Market
const MOBILE_NAV = [
  { icon: LayoutDashboard, label: "Home",    href: "/" },
  { icon: Brain,           label: "Oracle",  href: "/oracle" },
  { icon: FileText,        label: "Scripts", href: "/scanner" },
  { icon: Archive,         label: "Vault",   href: "/vault" },
  { icon: TrendingUp,      label: "Market",  href: "/market" },
];
export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-on-surface dark:text-dark-on-surface transition-colors duration-300">

      {/* ── Kinetic Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 origin-left z-[9999]"
        style={{
          scaleX,
          background: "linear-gradient(90deg, #F6DB35 0%, #EE5454 50%, #4C69F6 100%)",
        }}
      />

      {/* ── Global Halftone Background Layer ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          opacity: 0.04,
        }}
      />

      {/* ── Ambient Glow ── */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 opacity-[0.04] dark:opacity-[0.06]"
        aria-hidden
        style={{ background: "radial-gradient(circle at top right, #4C69F6 0%, transparent 70%)" }}
      />

      {/* ── Top Navigation ── */}
      <TopNav
        onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* ── Side Navigation ── */}
      <SideNav
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <main
        id="main-content"
        className={cn(
          "relative z-10",
          !isAuthPage && "pt-16 md:pl-64",
          "min-h-screen overflow-y-auto",
          "bg-surface dark:bg-dark-surface transition-colors duration-300"
        )}
      >
        <div className={cn(
          "px-4 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto",
          isAuthPage && "px-0 py-0 max-w-none"
        )}>
          {children}
        </div>

        {/* ── Mobile Bottom Nav (hidden on auth pages) ── */}
        {!isAuthPage && <MobileBottomNav />}
      </main>

      {/* ── FAB (Desktop only, hidden on auth pages) ── */}
      {!isAuthPage && (
        <motion.button
          onClick={() => router.push("/oracle")}
          className={cn(
            "hidden md:flex fixed bottom-8 right-8 z-30",
            "w-14 h-14 items-center justify-center",
            "bg-[#F6DB35] text-black",
            "border-4 border-black dark:border-white/20",
            "shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#4C69F6]",
            "font-headline font-black text-xl"
          )}
          whileHover={{ y: -4, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
          whileTap={{ y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
          transition={{ type: "spring", bounce: 0.5 }}
          title="New Venture — Open Oracle"
          aria-label="New Venture"
        >
          +
        </motion.button>
      )}
    </div>
  );
}

// ── Mobile Bottom Navigation ──────────────────────────────
function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 bg-surface-container-lowest dark:bg-dark-surface-container border-t-4 border-black dark:border-[#4C69F6]/60 flex items-center justify-around px-1">
      {MOBILE_NAV.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[3rem] transition-colors py-1",
              isActive ? "text-[#EE5454]" : "text-on-surface-variant dark:text-dark-on-surface-variant"
            )}
            aria-label={item.label}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[9px] font-headline font-black uppercase tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
