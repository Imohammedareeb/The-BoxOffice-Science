"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, Brain, FileText, Clapperboard,
  Archive, TrendingUp, Plus, ChevronRight, LogOut, User, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard",      href: "/",           icon: LayoutDashboard, phase: "01", description: "Command Center" },
  { label: "The Oracle",     href: "/oracle",      icon: Brain,           phase: "02", description: "Revenue Prediction" },
  { label: "Script Scanner", href: "/scanner",     icon: FileText,        phase: "03", description: "NLP Concept Match" },
  { label: "Production",     href: "/production",  icon: Clapperboard,    phase: "04", description: "Active Ventures" },
  { label: "Studio Vault",   href: "/vault",       icon: Archive,         phase: "05", description: "Historical Data" },
  { label: "Market Pulse",   href: "/market",      icon: TrendingUp,      phase: "06", description: "Sentiment Engine" },
];

const ROLE_LABELS: Record<string, string> = {
  analyst:   "Venture Analyst",
  executive: "Studio Executive",
  admin:     "Platform Admin",
};

interface SideNavProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function SideNav({ mobileOpen = false, onClose }: SideNavProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User / Studio Badge */}
      <div className="px-5 py-6 border-b-2 border-black/10 dark:border-white/10">
        {/* FIX-PROFILE-LINK: Profile link on avatar click */}
        <Link href="/profile" onClick={onClose}>
          <div className="flex items-center gap-3 mb-4 group cursor-pointer">
            <div className="w-10 h-10 bg-[#4C69F6] flex items-center justify-center text-white font-headline font-black text-sm border-2 border-black dark:border-white/20 shrink-0 group-hover:bg-[#3a54d4] transition-colors">
              {user ? user.name.slice(0, 2).toUpperCase() : <User size={16} />}
            </div>
            <div className="min-w-0">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant leading-none mb-1">
                {user ? ROLE_LABELS[user.role] ?? user.role : "Guest"}
              </p>
              <p className="font-headline font-black text-sm tracking-tight text-on-surface dark:text-dark-on-surface uppercase leading-none truncate group-hover:text-[#4C69F6] transition-colors">
                {user?.name ?? "Not signed in"}
              </p>
            </div>
          </div>
        </Link>

        {/* New Venture CTA */}
        <Link href="/oracle" onClick={onClose}>
          <motion.div
            className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-white font-headline font-black text-xs tracking-widest uppercase border-2 border-black dark:border-white/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_#4C69F6] cursor-pointer"
            whileHover={{ x: 2, boxShadow: "5px 5px 0 0 rgba(0,0,0,1)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12 }}
          >
            <Plus size={14} />
            New Venture
          </motion.div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col py-4 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <motion.div
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 cursor-pointer group relative",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-[#EE5454] text-white"
                    : "text-on-surface dark:text-dark-on-surface hover:bg-[#F6DB35] hover:text-black dark:hover:bg-[#F6DB35] dark:hover:text-black"
                )}
                whileHover={isActive ? {} : { x: 3 }}
                transition={{ duration: 0.12 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bar"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#F6DB35]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-white" : "text-on-surface-variant dark:text-dark-on-surface-variant group-hover:text-black"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-black text-sm uppercase tracking-tight leading-none">
                    {item.label}
                  </p>
                  <p className={cn(
                    "text-[10px] font-label tracking-wide mt-0.5 leading-none",
                    isActive ? "text-white/70" : "text-on-surface-variant dark:text-dark-on-surface-variant group-hover:text-black/60"
                  )}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight size={14} className={cn("shrink-0 transition-transform", isActive ? "text-white/60 translate-x-0.5" : "opacity-0 group-hover:opacity-40")} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t-2 border-black/10 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
            System Status
          </span>
          <span className="flex items-center gap-1 font-label text-[9px] font-bold text-[#00A841] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A841] animate-pulse" />
            Online
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant">
            Prediction Engine
          </span>
          <span className="font-label text-[9px] font-bold text-[#4C69F6] uppercase tracking-widest bg-[#4C69F6]/10 px-1.5 py-0.5">
            Multiplier Model
          </span>
        </div>

        {/* FIX-PROFILE-NAV: Profile link in footer */}
        <Link href="/profile" onClick={onClose}>
          <button className="w-full flex items-center gap-2 py-1.5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant hover:text-[#4C69F6] transition-colors">
            <UserCircle size={13} />
            My Profile
          </button>
        </Link>

        {/* Sign Out */}
        <button
          onClick={logout}
          data-testid="logout-button"
          className="w-full flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant hover:text-[#EE5454] transition-colors"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 z-40 bg-surface-container-lowest dark:bg-dark-surface-container border-r-4 border-black dark:border-[#4C69F6]/30 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-surface-container-lowest dark:bg-dark-surface-container border-r-4 border-black overflow-hidden"
            >
              <div className="h-16 bg-[#4C69F6] border-b-4 border-black flex items-center px-5">
                <span className="font-headline font-black text-xl text-white uppercase italic tracking-tighter">
                  BOX OFFICE <span className="text-[#F6DB35]">SCIENCE.</span>
                </span>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
