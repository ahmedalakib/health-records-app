"use client";

import { AlertTriangle, Key, ExternalLink } from "lucide-react";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function ConfigAlert() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs shadow-xs">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 flex items-center gap-1.5">
            Database Setup Required
            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded-md">
              Demo Mode
            </span>
          </p>
          <p className="text-amber-800 leading-relaxed">
            Real authentication and cloud sync require your Supabase keys in <code className="bg-amber-100/90 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-950">.env.local</code>.
          </p>
          <div className="pt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-950 hover:underline"
            >
              Open Supabase Dashboard
              <ExternalLink size={11} />
            </a>
            <span className="text-amber-400">•</span>
            <span className="text-amber-700">See <code className="font-mono">supabase/README.md</code> for schema</span>
          </div>
        </div>
      </div>
    </div>
  );
}
