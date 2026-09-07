"use client";

import { useState, useEffect } from "react";
import { Download, Sparkles, X, RefreshCw, ExternalLink } from "lucide-react";

// Current installed version in this build
const CURRENT_VERSION = "1.0.1";
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/ahmedalakib/health-records-app/main/version.json";
const DISMISS_KEY = "sanomed_update_dismissed_until";

export default function InAppUpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if dismissed recently (within 12 hours)
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch (e) {}

    // Check for updates online
    async function checkForUpdates() {
      try {
        const res = await fetch(VERSION_CHECK_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (data?.version && data.version !== CURRENT_VERSION) {
          // Compare versions (semver check)
          const currentParts = CURRENT_VERSION.split(".").map(Number);
          const remoteParts = data.version.split(".").map(Number);

          let isNewer = false;
          for (let i = 0; i < 3; i++) {
            const r = remoteParts[i] || 0;
            const c = currentParts[i] || 0;
            if (r > c) {
              isNewer = true;
              break;
            } else if (r < c) {
              break;
            }
          }

          if (isNewer) {
            setUpdateAvailable(data);
            setIsDismissed(false);
          }
        }
      } catch (err) {
        // Silently fail if offline
      }
    }

    // Run check 3 seconds after app launch
    const timer = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    setIsDismissed(true);
    try {
      // Dismiss for 12 hours
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 12 * 60 * 60 * 1000));
    } catch (e) {}
  }

  function handleUpdateNow() {
    if (updateAvailable?.downloadUrl) {
      window.open(updateAvailable.downloadUrl, "_blank");
    } else {
      window.open("https://github.com/ahmedalakib/health-records-app/releases/latest", "_blank");
    }
  }

  if (isDismissed || !updateAvailable) return null;

  return (
    <aside aria-label="App update available" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white p-4 shadow-2xl border border-sky-400/30 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-300">
            <Sparkles size={18} className="animate-pulse text-sky-300" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Update Available
              </span>
              <span className="text-[10px] font-bold bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/20">
                v{updateAvailable.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {updateAvailable.notes || "New features and performance improvements are available."}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleUpdateNow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-xs font-bold text-slate-950 transition-all shadow-md cursor-pointer"
              >
                <Download size={13} />
                <span>Update App</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
