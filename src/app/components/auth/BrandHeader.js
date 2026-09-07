"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function BrandHeader({ subtitle = "Secure Personal Medical Records" }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-600/30 p-2.5 transition-transform group-hover:scale-105">
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
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">Sanomed</span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 border border-sky-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Health Hub
            </span>
          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </Link>

      <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
        <ShieldCheck size={13} className="text-emerald-600" />
        <span>HIPAA Ready</span>
      </div>
    </div>
  );
}
