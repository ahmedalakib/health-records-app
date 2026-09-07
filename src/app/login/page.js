"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import BrandHeader from "../components/auth/BrandHeader";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";
import AuthVisualSide from "../components/auth/AuthVisualSide";
import ConfigAlert from "../components/auth/ConfigAlert";
import { Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function Login() {
  const [authMode, setAuthMode] = useState("password"); // "password" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data?.user) {
        router.push("/");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address to receive a magic link.");
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase is not configured yet. Add keys to .env.local to enable email magic links.");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = typeof window !== "undefined" ? window.location.origin + "/" : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Secure magic link sent! Check your email inbox to sign in instantly.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Unable to send magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Outer Card / Split Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex overflow-hidden min-h-[640px]">
        {/* Left Side: Branded Medical Visuals (Desktop only) */}
        <AuthVisualSide isSignup={false} />

        {/* Right Side: Auth Form Container */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <BrandHeader subtitle="Access Your Medical Records" />

            <ConfigAlert />

            {/* Header copy */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to view your prescriptions, lab reports, doctor visits, and vitals.
              </p>
            </div>

            {/* Social Login Options */}
            <div className="mb-6">
              <SocialAuthButtons onError={(err) => setErrorMessage(err)} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Auth Mode Tabs (Password vs Magic Link) */}
            <div className="flex p-1 mb-5 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode("password"); setErrorMessage(""); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === "password"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("magic"); setErrorMessage(""); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === "magic"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Passwordless Magic Link
              </button>
            </div>

            {/* Password Login Form */}
            {authMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode("magic")}
                      className="text-[11px] font-semibold text-sky-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Verifying Credentials..." : "Sign In to Sanomed"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            {/* Magic Link Form */}
            {authMode === "magic" && (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    We will send a one-time secure sign-in link to this address. No password needed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Sending Magic Link..." : "Send Secure Login Link"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </form>
            )}

            {/* Notifications */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}
          </div>

          {/* Footer link */}
          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have a Sanomed account?{" "}
              <Link href="/signup" className="text-sky-600 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
