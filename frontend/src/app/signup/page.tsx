"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Zap, AlertTriangle, CheckCircle2, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail, isStrongPassword } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { register } from "@/lib/api";
import { storeToken } from "@/lib/cookies";

// FIX-ROLE-UI: Removed misleading role selector — backend always assigns Analyst
// Roles are upgraded via admin. The UI previously implied users could self-select Executive.

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

export default function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [errors,      setErrors]      = useState<FormErrors>({});

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const pwStrong = isStrongPassword(password);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim() || name.trim().length < 2) {
      next.name = "Name must be at least 2 characters.";
    }
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (!pwStrong) {
      next.password = "Min 8 chars, one uppercase, one number.";
    }
    if (password !== confirm) {
      next.confirm = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const data = await register({
        email: email.trim().toLowerCase(),
        display_name: name.trim(),
        password,
        tier: "Analyst",   // Backend enforces this anyway — no ambiguity
      });

      storeToken(data.access_token);

      login({
        id: data.user.id,
        name: data.user.display_name,
        email: data.user.email,
        role: data.user.tier.toLowerCase() as "analyst" | "executive",
      });

      router.replace("/?welcome=true");
    } catch (err) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(ellipse, #EE5454 0%, transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-[#EE5454]/40 shadow-[8px_8px_0_0_rgba(0,0,0,0.12)] dark:shadow-[8px_8px_0_0_#EE5454]">
          <div className="h-2 bg-[#EE5454]" />

          <div className="p-8">
            {/* FIX-BRAND-01: Consistent brand name — was "Box Office Sci." */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#EE5454] flex items-center justify-center border-2 border-black shrink-0">
                <Zap size={20} className="text-white fill-white" />
              </div>
              <div>
                <p className="font-headline font-black text-xl uppercase tracking-tight leading-none">
                  Box Office Science.
                </p>
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant dark:text-dark-on-surface-variant leading-none mt-0.5">
                  New Investor Account
                </p>
              </div>
            </div>

            <h1 className="font-headline font-black text-3xl uppercase mb-1 tracking-tight">
              Join the Studio
            </h1>
            <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6">
              Create your account to start making data-driven film investments.
            </p>

            <AnimatePresence>
              {errors.general && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-[#EE5454]/10 border-l-4 border-[#EE5454] mb-5"
                >
                  <AlertTriangle size={14} className="text-[#EE5454] shrink-0" />
                  <p className="font-label text-xs text-[#EE5454] uppercase tracking-wide">
                    {errors.general}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Your Name"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={cn(
                    "w-full bg-surface-container dark:bg-dark-surface-container-high",
                    "border-b-[3px] px-3 py-2.5 font-label text-sm tracking-wide outline-none",
                    "placeholder:text-on-surface-variant/40 transition-colors focus:border-[#EE5454]",
                    errors.name ? "border-[#EE5454]" : "border-black/20 dark:border-white/20"
                  )}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="analyst@studio.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(
                    "w-full bg-surface-container dark:bg-dark-surface-container-high",
                    "border-b-[3px] px-3 py-2.5 font-label text-sm tracking-wide outline-none",
                    "placeholder:text-on-surface-variant/40 transition-colors focus:border-[#EE5454]",
                    errors.email ? "border-[#EE5454]" : "border-black/20 dark:border-white/20"
                  )}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* FIX-ROLE-UI: Removed self-select role — show info instead */}
              <div className="flex items-start gap-2 p-3 bg-[#4C69F6]/08 border border-[#4C69F6]/20">
                <Info size={13} className="text-[#4C69F6] shrink-0 mt-0.5" />
                <p className="font-label text-[10px] text-on-surface-variant dark:text-dark-on-surface-variant leading-relaxed">
                  All new accounts start as <span className="font-bold text-[#4C69F6]">Venture Analyst</span>.
                  Executive access can be requested after sign-up.
                </p>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="Min 8 chars, uppercase + number"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={cn(
                      "w-full bg-surface-container dark:bg-dark-surface-container-high",
                      "border-b-[3px] px-3 py-2.5 pr-10 font-label text-sm tracking-wide outline-none",
                      "placeholder:text-on-surface-variant/40 transition-colors focus:border-[#EE5454]",
                      errors.password ? "border-[#EE5454]" : "border-black/20 dark:border-white/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={cn("h-1 flex-1", pwStrong ? "bg-[#00A841]" : "bg-[#EE5454]")} />
                    <span className={cn("font-label text-[9px] uppercase tracking-widest", pwStrong ? "text-[#008f37]" : "text-[#EE5454]")}>
                      {pwStrong ? "Strong" : "Weak"}
                    </span>
                    {pwStrong && <CheckCircle2 size={11} className="text-[#008f37]" />}
                  </div>
                )}
                {errors.password && (
                  <p id="password-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm"
                  className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
                    }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? "confirm-error" : undefined}
                    className={cn(
                      "w-full bg-surface-container dark:bg-dark-surface-container-high",
                      "border-b-[3px] px-3 py-2.5 pr-10 font-label text-sm tracking-wide outline-none",
                      "placeholder:text-on-surface-variant/40 transition-colors focus:border-[#EE5454]",
                      errors.confirm ? "border-[#EE5454]" : "border-black/20 dark:border-white/20"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirm && (
                  <p id="confirm-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">
                    {errors.confirm}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 font-headline font-black text-sm uppercase tracking-widest",
                  "bg-[#EE5454] text-white border-4 border-black dark:border-white/20",
                  "shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                  "flex items-center justify-center gap-2",
                  "disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                )}
                whileHover={isLoading ? {} : { x: -2, y: -2, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
                whileTap={isLoading ? {} : { x: 2, y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                transition={{ duration: 0.1 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Account…
                  </>
                ) : (
                  "Create Account →"
                )}
              </motion.button>
            </form>

            <p className="text-center font-label text-xs text-on-surface-variant dark:text-dark-on-surface-variant mt-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#EE5454] font-bold border-b border-[#EE5454]/40 hover:border-[#EE5454] transition-colors"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
