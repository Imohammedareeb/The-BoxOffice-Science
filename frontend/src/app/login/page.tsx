"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { login as loginAPI } from "@/lib/api";
import { storeToken } from "@/lib/cookies";

const DEMO_EMAIL    = "demo@boxofficescience.ai";
const DEMO_PASSWORD = "Demo@1234";

interface FormErrors { email?: string; password?: string; general?: string; }

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router      = useRouter();
  const searchParams= useSearchParams();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [errors,       setErrors]       = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!email.trim())          next.email    = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password)              next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const data = await loginAPI({ email: email.trim().toLowerCase(), password });
      storeToken(data.access_token);
      login({
        id:    data.user.id,
        name:  data.user.display_name,
        email: data.user.email,
        role:  (data.user.tier?.toLowerCase() ?? "analyst") as "analyst" | "executive",
      });

      // FIX-SEC-OPEN-REDIRECT: Only redirect to internal paths.
      // If "from" is missing or doesn't start with "/", default to dashboard.
      const from = searchParams?.get("from") ?? "/";
      const safeFrom = from.startsWith("/") ? from : "/";
      router.replace(safeFrom);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "Invalid credentials. Try the demo account below.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // FIX-UX-DEMO-AUTOFILL: Fill AND auto-submit so user lands on dashboard in one click
  async function fillDemoAndSubmit() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    // Slight delay so React state settles before we read form values
    await new Promise((r) => setTimeout(r, 50));
    // Directly call API with known demo creds instead of relying on state
    setIsLoading(true);
    try {
      const data = await loginAPI({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      storeToken(data.access_token);
      login({
        id:    data.user.id,
        name:  data.user.display_name,
        email: data.user.email,
        role:  (data.user.tier?.toLowerCase() ?? "analyst") as "analyst" | "executive",
      });
      router.replace("/");
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "Demo login failed. Is the backend running?",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)", backgroundSize: "14px 14px" }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(ellipse, #4C69F6 0%, transparent 70%)" }}
      />

      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md relative">
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container border-4 border-black dark:border-[#4C69F6]/40 shadow-[8px_8px_0_0_rgba(0,0,0,0.12)] dark:shadow-[8px_8px_0_0_#4C69F6]">
          <div className="h-2 bg-[#4C69F6]" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#4C69F6] flex items-center justify-center border-2 border-black shrink-0">
                <Zap size={20} className="text-white fill-white" />
              </div>
              <div>
                {/* FIX-BRAND: Consistent full name on login page */}
                <p className="font-headline font-black text-xl uppercase tracking-tight leading-none">Box Office Science.</p>
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant dark:text-dark-on-surface-variant leading-none mt-0.5">Investor Portal</p>
              </div>
            </div>

            <h1 className="font-headline font-black text-3xl uppercase mb-1 tracking-tight">Welcome Back</h1>
            <p className="font-body text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-6">
              Sign in to access your venture intelligence dashboard.
            </p>

            <AnimatePresence>
              {errors.general && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-[#EE5454]/10 border-l-4 border-[#EE5454] mb-5"
                  role="alert" aria-live="assertive">
                  <AlertTriangle size={14} className="text-[#EE5454] shrink-0" />
                  <p className="font-label text-xs text-[#EE5454] uppercase tracking-wide">{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5">
                  Email Address
                </label>
                <input id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="analyst@studio.com" autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  className={cn("w-full bg-surface-container dark:bg-dark-surface-container-high border-b-[3px] px-3 py-2.5 font-label text-sm tracking-wide outline-none placeholder:text-on-surface-variant/40 transition-colors focus:border-[#4C69F6]",
                    errors.email ? "border-[#EE5454]" : "border-black/20 dark:border-white/20")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="••••••••" autoComplete="current-password"
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-invalid={!!errors.password}
                    className={cn("w-full bg-surface-container dark:bg-dark-surface-container-high border-b-[3px] px-3 py-2.5 pr-10 font-label text-sm tracking-wide outline-none placeholder:text-on-surface-variant/40 transition-colors focus:border-[#4C69F6]",
                      errors.password ? "border-[#EE5454]" : "border-black/20 dark:border-white/20")}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="font-label text-[10px] text-[#EE5454] mt-1 uppercase tracking-wide">{errors.password}</p>
                )}
              </div>

              <motion.button type="submit" disabled={isLoading}
                className={cn("w-full py-3.5 font-headline font-black text-sm uppercase tracking-widest bg-[#4C69F6] text-white border-4 border-black dark:border-white/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_#2e4edc] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity")}
                whileHover={isLoading ? {} : { x: -2, y: -2, boxShadow: "6px 6px 0 0 rgba(0,0,0,1)" }}
                whileTap={isLoading ? {} : { x: 2, y: 2, boxShadow: "2px 2px 0 0 rgba(0,0,0,1)" }}
                transition={{ duration: 0.1 }}>
                {isLoading ? <><Loader2 size={16} className="animate-spin" />Authenticating…</> : "Access Dashboard →"}
              </motion.button>
            </form>

            {/* Demo credentials — FIX: auto-fill + auto-submit in one click */}
            <div className="mt-5 p-4 bg-[#F6DB35]/10 border-2 border-[#F6DB35]/40">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant dark:text-dark-on-surface-variant mb-2">
                🎬 Portfolio Demo Credentials
              </p>
              <p className="font-label text-xs mb-1">
                <span className="text-on-surface-variant dark:text-dark-on-surface-variant">Email:</span>{" "}
                <span className="font-bold text-[#4C69F6]">{DEMO_EMAIL}</span>
              </p>
              <p className="font-label text-xs mb-3">
                <span className="text-on-surface-variant dark:text-dark-on-surface-variant">Password:</span>{" "}
                <span className="font-bold text-[#4C69F6]">{DEMO_PASSWORD}</span>
              </p>
              {/* FIX-UX-AUTOFILL: Button now auto-submits, no extra click needed */}
              <button type="button" onClick={fillDemoAndSubmit} disabled={isLoading}
                className="font-label text-[10px] uppercase tracking-widest text-[#F6DB35] border-b border-[#F6DB35]/40 hover:border-[#F6DB35] transition-colors disabled:opacity-60">
                {isLoading ? "Logging in…" : "↗ One-Click Demo Login"}
              </button>
            </div>

            <p className="text-center font-label text-xs text-on-surface-variant dark:text-dark-on-surface-variant mt-5">
              No account?{" "}
              <Link href="/signup" className="text-[#4C69F6] font-bold border-b border-[#4C69F6]/40 hover:border-[#4C69F6] transition-colors">
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
