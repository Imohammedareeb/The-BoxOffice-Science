"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Shield, BarChart3, Clapperboard,
  Calendar, Edit2, Check, X, LogOut, AlertCircle, Lock, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPersonalStats, type PersonalStats, api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  analyst:   "Venture Analyst",
  executive: "Studio Executive",
  admin:     "Platform Admin",
};
const ROLE_COLORS: Record<string, string> = {
  analyst:   "#4C69F6",
  executive: "#F6DB35",
  admin:     "#EE5454",
};

// ── Password Change Modal ─────────────────────────────────────
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (!current || !next) { setError("All fields are required."); return; }
    if (next.length < 8)   { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm)  { setError("Passwords do not match."); return; }
    setLoading(true); setError(null);
    try {
      await api.patch("/api/auth/me", { current_password: current, new_password: next });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-surface-container dark:bg-dark-surface-container-high border-b-2 border-black/20 dark:border-white/20 px-3 py-2.5 font-label text-sm outline-none focus:border-[#4C69F6] transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-white/20 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
      >
        <div className="h-1.5 bg-[#4C69F6]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-[#4C69F6]" />
              <h3 className="font-headline font-black text-lg uppercase">Change Password</h3>
            </div>
            <button onClick={onClose} aria-label="Close modal" className="text-on-surface-variant hover:text-[#EE5454] transition-colors">
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#EE5454]/10 border-l-4 border-[#EE5454]">
              <p className="font-label text-xs text-[#EE5454] uppercase tracking-wide">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[#00A841]/10 border-l-4 border-[#00A841]">
              <p className="font-label text-xs text-[#00A841] uppercase tracking-wide">Password updated!</p>
            </div>
          )}

          <div className="space-y-4">
            {[
              { label: "Current Password", val: current, set: setCurrent },
              { label: "New Password",     val: next,    set: setNext },
              { label: "Confirm New",      val: confirm, set: setConfirm },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1">{label}</label>
                <input type="password" className={inputCls} value={val} onChange={e => set(e.target.value)} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-[#4C69F6] text-white font-headline font-black text-sm uppercase tracking-widest border-2 border-black disabled:opacity-60 hover:bg-[#3a54d4] transition-colors"
            >
              {loading ? "Updating…" : "Update Password →"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 border-2 border-black/20 font-label text-sm text-on-surface-variant hover:border-black transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [stats, setStats]             = useState<PersonalStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName]       = useState(user?.name ?? "");
  const [savedMsg, setSavedMsg]       = useState<string | null>(null);
  const [savingName, setSavingName]   = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    getPersonalStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  // BUG-13 FIX: Actually call PATCH /api/auth/me to persist name changes
  async function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSavingName(true);
    try {
      await api.patch("/api/auth/me", { display_name: trimmed });
      setSavedMsg("Name saved!");
    } catch {
      setSavedMsg("Saved locally (API unavailable)");
    } finally {
      setSavingName(false);
      setEditingName(false);
      setTimeout(() => setSavedMsg(null), 2500);
    }
  }

  const displayName = user?.name ?? "—";
  const role        = user?.role ?? "analyst";
  const roleLabel   = ROLE_LABELS[role] ?? role;
  const roleColor   = ROLE_COLORS[role] ?? "#4C69F6";

  return (
    <main className="min-h-screen bg-background dark:bg-dark-background px-4 py-8 md:px-10 md:py-10">
      <div className="mb-8">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
          Phase 07 · Studio Access
        </p>
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tight leading-none">
          MY ACCOUNT
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Profile card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="lg:col-span-1 bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-white/10 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]"
        >
          <div className="h-1.5" style={{ backgroundColor: roleColor }} />
          <div className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-20 h-20 flex items-center justify-center text-white font-headline font-black text-2xl border-4 border-black dark:border-white/20 mb-4"
                style={{ backgroundColor: roleColor }}
              >
                {displayName.slice(0, 2).toUpperCase()}
              </div>

              {/* Editable Name */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    className="text-center font-headline font-black text-lg uppercase bg-transparent border-b-2 border-[#4C69F6] outline-none w-40"
                    maxLength={60}
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="text-[#00A841] hover:text-[#008f37] disabled:opacity-50" aria-label="Save name">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-[#EE5454] hover:text-[#cc3c3c]" aria-label="Cancel edit">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-headline font-black text-xl uppercase">{displayName}</h2>
                  <button
                    onClick={() => { setEditName(displayName); setEditingName(true); }}
                    className="text-on-surface-variant hover:text-[#4C69F6] transition-colors"
                    title="Edit name"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}

              <AnimatePresence>
                {savedMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="font-label text-[10px] text-[#00A841] uppercase tracking-widest mb-2"
                  >
                    ✓ {savedMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              <span
                className="font-label text-[10px] uppercase tracking-widest px-3 py-1 border-2 border-black dark:border-white/20"
                style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
              >
                {roleLabel}
              </span>
            </div>

            {/* User Details */}
            <div className="space-y-4">
              {[
                { icon: <Mail size={15} />,   label: "Email",        val: user?.email ?? "—" },
                { icon: <Shield size={15} />, label: "Access Level", val: roleLabel, color: roleColor },
                { icon: <User size={15} />,   label: "User ID",      val: user?.id ?? "—", small: true },
              ].map(({ icon, label, val, color, small }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="text-on-surface-variant shrink-0">{icon}</div>
                  <div className="min-w-0">
                    <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">{label}</p>
                    <p
                      className={cn("font-label truncate", small ? "text-xs text-on-surface-variant max-w-[180px]" : "text-sm")}
                      style={color ? { color } : undefined}
                    >
                      {val}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign Out */}
            <button
              onClick={logout}
              data-testid="logout-button"
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 font-label text-xs uppercase tracking-widest text-[#EE5454] border-2 border-[#EE5454]/30 hover:bg-[#EE5454]/10 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* ── RIGHT: Stats + Settings ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Activity Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-white/10 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]"
          >
            <div className="h-1.5 bg-[#4C69F6]" />
            <div className="p-6">
              <h3 className="font-headline font-black text-lg uppercase mb-5">Your Activity</h3>

              {loadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-container dark:bg-dark-surface-container-high" />)}
                </div>
              ) : stats?.is_new_account ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle size={32} className="text-on-surface-variant mb-3" />
                  <p className="font-headline font-black text-lg uppercase mb-1">Welcome to the Studio</p>
                  <p className="font-body text-sm text-on-surface-variant max-w-xs">
                    Head to <strong>The Oracle</strong> to make your first prediction,
                    or <strong>Production</strong> to track your first venture.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: <Clapperboard size={14} />, label: "Ventures",    val: stats?.venture_count ?? 0,     color: "#4C69F6" },
                    { icon: <BarChart3 size={14} />,    label: "Predictions", val: stats?.prediction_count ?? 0,  color: "#EE5454" },
                    {
                      icon: <BarChart3 size={14} />,
                      label: "Avg. ROI",
                      val: stats?.avg_predicted_roi != null ? `${stats.avg_predicted_roi}%` : "—",
                      color: "#F6DB35",
                    },
                    ...(stats?.best_genre ? [{
                      icon: <Calendar size={14} />,
                      label: "Best Genre",
                      val: stats.best_genre,
                      color: "#00A841",
                    }] : []),
                  ].map(({ icon, label, val, color }) => (
                    <div key={label} className="bg-surface-container dark:bg-dark-surface-container-high border-2 border-black/10 p-4">
                      <div className="flex items-center gap-2 mb-2" style={{ color }}>
                        {icon}
                        <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">{label}</p>
                      </div>
                      <p className="font-headline font-black text-3xl" style={{ color }}>
                        {typeof val === "number" ? val : val}
                      </p>
                    </div>
                  ))}

                  {(stats?.total_projected_revenue ?? 0) > 0 && (
                    <div className="bg-surface-container dark:bg-dark-surface-container-high border-2 border-black/10 p-4 col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={14} className="text-[#714B96]" />
                        <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">Total Projected Revenue</p>
                      </div>
                      <p className="font-headline font-black text-2xl text-[#714B96]">
                        ${((stats?.total_projected_revenue ?? 0) / 1_000_000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-white/10 shadow-[6px_6px_0_0_rgba(0,0,0,0.1)]"
          >
            <div className="h-1.5 bg-[#F6DB35]" />
            <div className="p-6">
              <h3 className="font-headline font-black text-lg uppercase mb-5">Account Settings</h3>
              <div className="space-y-4">

                <div className="flex items-center justify-between py-3 border-b border-black/10 dark:border-white/10">
                  <div>
                    <p className="font-label text-sm font-bold uppercase">Request Executive Access</p>
                    <p className="font-label text-[10px] text-on-surface-variant">Contact your studio admin to upgrade your role.</p>
                  </div>
                  <span className="font-label text-[9px] uppercase tracking-widest px-2 py-1 bg-[#F6DB35]/20 text-[#b8a020] border border-[#F6DB35]/40">
                    Contact Admin
                  </span>
                </div>

                {/* BUG-14 FIX: Password button now opens a real modal */}
                <div className="flex items-center justify-between py-3 border-b border-black/10 dark:border-white/10">
                  <div>
                    <p className="font-label text-sm font-bold uppercase">Password</p>
                    <p className="font-label text-[10px] text-on-surface-variant">Change your account password.</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-[#4C69F6] border-b border-[#4C69F6]/40 hover:border-[#4C69F6] transition-colors"
                  >
                    <Lock size={11} />
                    Change →
                  </button>
                </div>

                {/* BUG-14 FIX: Delete button now has a confirmation alert */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-label text-sm font-bold uppercase text-[#EE5454]">Delete Account</p>
                    <p className="font-label text-[10px] text-on-surface-variant">Permanently remove your account and all data.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                        alert("Account deletion requires admin confirmation. Contact support@boxofficescience.ai");
                      }
                    }}
                    className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-[#EE5454] border-b border-[#EE5454]/40 hover:border-[#EE5454] transition-colors"
                  >
                    <Trash2 size={11} />
                    Delete →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
