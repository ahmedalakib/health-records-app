"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, X, ExternalLink } from "lucide-react";

export default function GlobalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  async function fetchActiveAnnouncement() {
    try {
      const { data, error } = await supabase
        .from("app_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return;
      }

      // Check if user dismissed this specific announcement
      const dismissedId = localStorage.getItem("sanomed_dismissed_announcement");
      if (dismissedId === data.id) {
        return;
      }

      setAnnouncement(data);
      setDismissed(false);
    } catch (err) {
      // Graceful fallback if table doesn't exist yet
      console.warn("Could not load global announcements:", err);
    }
  }

  function handleDismiss() {
    if (announcement?.id) {
      localStorage.setItem("sanomed_dismissed_announcement", announcement.id);
    }
    setDismissed(true);
  }

  if (dismissed || !announcement) return null;

  const typeConfig = {
    info: {
      bg: "bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-blue-500/15 border-teal-500/30 text-teal-200",
      icon: <Info className="w-5 h-5 text-teal-400 shrink-0" />,
      badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 border-amber-500/30 text-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
    critical: {
      bg: "bg-gradient-to-r from-rose-500/20 via-red-500/15 to-pink-500/20 border-rose-500/40 text-rose-200",
      icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />,
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    },
    success: {
      bg: "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-green-500/15 border-emerald-500/30 text-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    },
  };

  const style = typeConfig[announcement.type] || typeConfig.info;

  return (
    <div className="w-full px-4 pt-3 pb-1 z-30 transition-all duration-300">
      <div className={`max-w-4xl mx-auto backdrop-blur-md border rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-start sm:items-center justify-between gap-3 ${style.bg}`}>
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
            {style.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
                Announcement
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                {announcement.title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              {announcement.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {announcement.action_url && announcement.action_label && (
            <a
              href={announcement.action_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-xl border border-slate-600 shadow-sm"
            >
              {announcement.action_label}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
