"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Shield, Sparkles, Lock, ArrowRight, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/");
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setMessage("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    setLoading(false);
    setMessage(error ? error.message : "Check your inbox for a secure login link.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 relative overflow-hidden">
      {/* Background ambient medical glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-100 rounded-full blur-3xl pointer-events-none opacity-60" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center shadow-md shadow-sky-500/25">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 7v6" strokeWidth="2.5" />
              <path d="M9 10h6" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Sanomed
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Clinical Hub
              </span>
            </h1>
            <p className="text-xs text-slate-500">Secure Personal Medical Records</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Welcome back</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sign in to manage your prescriptions, visits, and vitals.</p>
        </div>

        <form onSubmit={handlePasswordLogin} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In to Sanomed"}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          onClick={handleMagicLink}
          disabled={loading}
          type="button"
          className="w-full rounded-xl py-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center gap-2 shadow-2xs"
        >
          <Mail size={14} className="text-slate-500" />
          <span>Send Magic Link to Email</span>
        </button>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 text-center">
            {message}
          </div>
        )}

        <p className="text-xs text-center mt-6 text-slate-500">
          New to Sanomed?{" "}
          <a href="/signup" className="text-sky-600 font-bold hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}