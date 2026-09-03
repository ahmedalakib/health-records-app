"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { ArrowRight, ShieldCheck, Mail } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handlePasswordSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        name: "",
        blood_type: "",
        allergies: "",
      });
    }

    setLoading(false);
    router.push("/");
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
    setMessage(error ? error.message : "Check your inbox for a secure signup link.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 relative overflow-hidden">
      {/* Background ambient medical glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100 rounded-full blur-3xl pointer-events-none opacity-60" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 flex items-center justify-center shadow-md shadow-sky-600/30 p-2.5">
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.75" />
              <path d="M9 7.5c1.5 1.5 4.5 1.5 6 0" strokeWidth="2" stroke="white" />
              <path d="M15 12c-1.5 1.5-4.5 1.5-6 0" strokeWidth="2" stroke="white" />
              <path d="M9 16.5c1.5 1.5 4.5 1.5 6 0" strokeWidth="2" stroke="white" />
              <circle cx="12" cy="12" r="1.25" fill="white" />
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
          <h2 className="text-lg font-bold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500 mt-0.5">Start tracking health vitals, appointments, and prescriptions.</p>
        </div>

        <form onSubmit={handlePasswordSignup} className="space-y-3.5">
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
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Get Started with Sanomed"}
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
          <span>Sign up with Magic Link</span>
        </button>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 text-center">
            {message}
          </div>
        )}

        <p className="text-xs text-center mt-6 text-slate-500">
          Already have an account?{" "}
          <a href="/login" className="text-sky-600 font-bold hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}