"use client";

import { ShieldAlert, Info } from "lucide-react";

export default function MedicalDisclaimer({ variant = "card", text, className = "" }) {
  const defaultText =
    "Sanomed is designed for personal health tracking and informational reference only. It does not provide medical diagnoses, treatment plans, or emergency services. Always consult a licensed healthcare professional or pharmacist regarding your medications, symptoms, and vital readings.";

  if (variant === "inline") {
    return (
      <p className={`text-[10px] text-slate-400 flex items-center gap-1.5 leading-tight ${className}`}>
        <Info className="w-3 h-3 text-slate-400 shrink-0" />
        <span>{text || "Not a substitute for professional clinical advice. Consult your doctor."}</span>
      </p>
    );
  }

  if (variant === "subtle") {
    return (
      <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {text || "Educational reference only. Do not adjust prescribed medication dosages without consulting your physician."}
        </p>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-2.5 ${className}`}>
      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 block">
          Clinical & Safety Notice
        </span>
        <p className="text-[11px] leading-relaxed text-amber-900/90">
          {text || defaultText}
        </p>
      </div>
    </div>
  );
}
