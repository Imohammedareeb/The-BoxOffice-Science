"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun, Moon, Bell, Search, User, Menu, X, Zap, LogOut, ChevronDown,
  LayoutDashboard, Brain, FileText, Clapperboard, Archive, TrendingUp,
  Film, AlertTriangle, CheckCircle2, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Oracle",    href: "/oracle" },
  { label: "Scanner",   href: "/scanner" },
  { label: "Slate",     href: "/production" },
  { label: "Vault",     href: "/vault" },
  { label: "Market",    href: "/market" },
];

interface Notification {
  id: string;
  type: "alert" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "success",
    title: "Ghost Protocol 8",
    message: "Production Phase IV cleared — 91% complete",
    time: "2m ago",
    read: false,
  },
  {
    id: "n2",
    type: "alert",
    title: "Market Pulse Alert",
    message: "East Asia sentiment up +7.8% — recommend Q3 pivot",
    time: "18m ago",
    read: false,
  },
  {
    id: "n3",
    type: "info",
    title: "Oracle Prediction",
    message: "Animation ROI forecast updated to +259%",
    time: "1h ago",
    read: true,
  },
  {
    id: "n4",
    type: "info",
    title: "New IP Match",
    message: "Script Scanner found 3 high-affinity matches for your concept",
    time: "3h ago",
    read: true,
  },
];

const NOTIF_ICON: Record<Notification["type"], React.ReactNode> = {
  success: <CheckCircle2 size={13} className="text-[#00A841] shrink-0" />,
  alert:   <AlertTriangle size={13} className="text-[#F6DB35] shrink-0" />,
  info:    <Film size={13} className="text-[#4C69F6] shrink-0" />,
};

interface TopNavProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export function TopNav({ onMobileMenuToggle, mobileMenuOpen }: TopNavProps) {
  const { toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (searchQuery.trim()) {
      router.push(`/scanner?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/scanner");
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) return null;

  return (
    <nav
      className={cn(
        "fixed top-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-6",
        "bg-[#4C69F6] dark:bg-[#0d0e13]",
        "border-b-4 border-black dark:border-[#4C69F6]",
        "shadow-[0_4px_0_0_rgba(0,0,0,1)] dark:shadow-[0_4px_0_0_#4C69F6]",
        "font-headline"
      )}
    >
      {/* ── Left: Logo + Nav Links ── */}
      <div className="flex items-center gap-6">
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer select-none"
            whileHover={{ skewX: -2 }}
            transition={{ duration: 0.15 }}
          >
            <div className="w-8 h-8 bg-[#F6DB35] flex items-center justify-center border-2 border-black">
              <Zap size={16} className="text-black fill-black" />
            </div>
            {/*
              BUG-07 FIX: Changed "BOX OFFICE SCI." to "BOX OFFICE SCIENCE."
              The previous name was truncated — inconsistent with login/signup pages
              and the actual project name. 
            */}
            <span className="text-xl font-black italic tracking-tighter text-white uppercase hidden sm:inline">
              BOX OFFICE
              <span className="text-[#F6DB35]"> SCIENCE.</span>
            </span>
            {/* Mobile: show abbreviated to save space */}
            <span className="text-xl font-black italic tracking-tighter text-white uppercase sm:hidden">
              BOS.
            </span>
          </motion.div>
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden xl:flex items-center gap-4">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.label} href={link.href}>
                <motion.span
                  className={cn(
                    "text-[11px] font-black uppercase tracking-tight transition-all cursor-pointer pb-1",
                    isActive
                      ? "text-[#F6DB35] border-b-4 border-[#F6DB35]"
                      : "text-white/80 hover:text-white border-b-4 border-transparent hover:border-white/40"
                  )}
                  whileHover={{ skewX: -2 }}
                  transition={{ duration: 0.12 }}
                >
                  {link.label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Right: Controls ── */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Search → navigates to /scanner */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              key="search-open"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:flex items-center bg-black/25 px-3 h-9 overflow-hidden"
            >
              <Search size={13} className="text-white/60 mr-2 shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="QUERY DATABASE..."
                className="bg-transparent text-xs text-white placeholder:text-white/40 outline-none font-label tracking-widest w-full"
                onBlur={() => {
                  setTimeout(() => { setSearchOpen(false); setSearchQuery(""); }, 150);
                }}
              />
            </motion.div>
          ) : (
            <motion.button
              key="search-closed"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 bg-black/20 px-3 h-9 text-white/80 hover:text-white hover:bg-black/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Search IP database (opens Scanner)"
            >
              <Search size={14} />
              <span className="text-[10px] font-label tracking-widest">SCAN...</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Notification panel */}
        <div className="relative">
          <motion.button
            className="relative p-2 text-white/80 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 bg-[#F6DB35] rounded-full border border-[#4C69F6] flex items-center justify-center"
              >
                <span className="font-headline font-black text-[8px] text-black leading-none">
                  {unreadCount}
                </span>
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest dark:bg-dark-surface-container border-2 border-black dark:border-white/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#4C69F6] z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell size={13} className="text-[#4C69F6]" />
                    <p className="font-headline font-black text-sm uppercase tracking-tight">Alerts</p>
                    {unreadCount > 0 && (
                      <span className="bg-[#4C69F6] text-white font-label font-black text-[9px] px-1.5 py-0.5">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="font-label text-[10px] text-[#4C69F6] hover:underline uppercase tracking-widest"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto no-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-black/05 dark:border-white/05 transition-colors",
                        !notif.read
                          ? "bg-[#4C69F6]/05 dark:bg-[#4C69F6]/10"
                          : "hover:bg-surface-container dark:hover:bg-dark-surface-container-high"
                      )}
                    >
                      <div className="mt-0.5">{NOTIF_ICON[notif.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-headline font-black text-xs uppercase leading-none">
                            {notif.title}
                          </p>
                          <span className="font-label text-[9px] text-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap shrink-0">
                            {notif.time}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4C69F6] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2.5 bg-surface-container dark:bg-dark-surface-container-high border-t-2 border-black/10 dark:border-white/10">
                  <Link
                    href="/"
                    onClick={() => setNotifOpen(false)}
                    className="font-label text-[10px] uppercase tracking-widest text-[#4C69F6] hover:underline"
                  >
                    View all alerts →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          className="p-2 transition-colors border-2 bg-black/20 border-white/20 text-white hover:bg-black/40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 15 }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun size={16} />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User Menu */}
        {isAuthenticated ? (
          <div className="hidden md:block relative">
            <motion.button
              onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 bg-black/20 border-2 border-white/20 text-white hover:bg-black/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={16} />
              <span className="text-[10px] font-label tracking-widest uppercase hidden lg:block pr-1">
                {user?.name?.split(" ")[0] ?? "User"}
              </span>
              <ChevronDown size={12} className={cn("transition-transform", userMenuOpen && "rotate-180")} />
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest dark:bg-dark-surface-container border-2 border-black dark:border-white/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50"
                >
                  <div className="p-3 border-b border-black/10 dark:border-white/10">
                    <p className="font-headline font-black text-sm uppercase">{user?.name}</p>
                    <p className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant uppercase tracking-widest">
                      {user?.role === "executive" ? "Studio Executive" : "Venture Analyst"}
                    </p>
                    <p className="font-label text-[9px] text-on-surface-variant/50 dark:text-dark-on-surface-variant/50 mt-0.5 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                    <button className="w-full flex items-center gap-2 px-3 py-2 font-label text-xs uppercase tracking-widest text-on-surface dark:text-dark-on-surface hover:bg-surface-container dark:hover:bg-dark-surface-container-high transition-colors">
                      <UserCircle size={13} />
                      View Profile
                    </button>
                  </Link>
                  <div className="border-t border-black/10 dark:border-white/10 my-1" />

                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left font-label text-xs uppercase tracking-widest text-[#EE5454] hover:bg-[#EE5454]/10 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link href="/login" className="hidden md:block">
            <motion.span
              className="flex items-center gap-2 p-1.5 bg-black/20 border-2 border-white/20 text-white hover:bg-black/40 transition-colors font-label text-[10px] tracking-widest uppercase px-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={16} />
              Sign In
            </motion.span>
          </Link>
        )}

        {/* Mobile Hamburger */}
        <motion.button
          className="md:hidden p-2 text-white"
          onClick={onMobileMenuToggle}
          whileTap={{ scale: 0.9 }}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={22} />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu size={22} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </nav>
  );
}
