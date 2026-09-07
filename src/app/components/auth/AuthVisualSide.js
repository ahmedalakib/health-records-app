"use client";

import { Shield, Lock, Activity, Heart, Sparkles, CheckCircle2, FileText, Bell } from "lucide-react";

export default function AuthVisualSide({ isSignup = false }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden rounded-3xl m-3 shadow-2xl">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top section: Brand Tagline */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md mb-6">
          <Sparkles size={14} className="text-sky-300 animate-pulse" />
          <span>Next-Generation Clinical EHR</span>
        </div>
        <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
          Your complete medical life, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-200">secure and connected.</span>
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-md">
          Centralize your prescriptions, doctor visits, diagnostic tests, and daily vitals with instant AI clinical insights.
        </p>
      </div>

      {/* Middle section: Interactive-style Preview Card */}
      <div className="relative z-10 my-8">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 shadow-xl space-y-4 max-w-md">
          {/* Mock Health Metric Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300">
                <Heart size={20} className="text-rose-400 fill-rose-400/30" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Active Vital Tracking</p>
                <p className="text-[11px] text-slate-400">BP: 118/76 mmHg • Normal</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Optimal
            </span>
          </div>

          {/* Quick Features Checklist */}
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
              <span>Smart Prescription OCR with AI schedule parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
              <span>Emergency QR code with offline paramedic view</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
              <span>Doctor-ready PDF summaries in 1 click</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Privacy & Security Assurance */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-sky-400" />
          <span>256-bit AES End-to-End Encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-indigo-300" />
          <span>Private Health Vault</span>
        </div>
      </div>
    </div>
  );
}
