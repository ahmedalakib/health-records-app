"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import BrandHeader from "../components/auth/BrandHeader";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";
import AuthVisualSide from "../components/auth/AuthVisualSide";
import ConfigAlert from "../components/auth/ConfigAlert";
import { Lock, Mail, ArrowRight, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  async function handlePasswordSignup(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Safe profile creation using upsert to prevent primary-key/trigger collision
      if (data?.user) {
        try {
          await supabase.from("profiles").upsert(
            {
              user_id: data.user.id,
              name: fullName.trim() || "",
              blood_type: "",
              allergies: "",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (profileErr) {
          console.warn("Profile upsert notice:", profileErr);
        }
      }

      // Check if email confirmation is required by Supabase project settings
      if (data?.session) {
        router.push("/");
      } else {
        setSuccessMessage("Account created successfully! Check your email to confirm your account and log in.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage(err.message || "An error occurred during account creation.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Outer Card / Split Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex overflow-hidden min-h-[640px]">
        {/* Left Side: Branded Medical Visuals */}
        <AuthVisualSide isSignup={true} />

        {/* Right Side: Auth Form Container */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <BrandHeader subtitle="Create Your Secure Health Account" />

            <ConfigAlert />

            {/* Header copy */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
              <p className="text-xs text-slate-500 mt-1">
                Start managing your prescriptions, lab tests, and doctor visits in one private vault.
              </p>
            </div>

            {/* Social Auth Buttons */}
            <div className="mb-6">
              <SocialAuthButtons onError={(err) => setErrorMessage(err)} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or register with email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Signup Form */}
            <form onSubmit={handlePasswordSignup} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900"
                  />
                </div>
              </div>

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
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Creating Health Account..." : "Create Sanomed Account"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </form>

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
              Already have an account?{" "}
              <Link href="/login" className="text-sky-600 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
