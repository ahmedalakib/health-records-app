"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  ScanText,
  Pill,
  Activity,
  Droplet,
  FileText,
  Upload,
  ChevronRight,
  Sparkles,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  HelpCircle
} from "lucide-react";
import DailyMedTracker from "./components/DailyMedTracker";
import { evaluateVital } from "./lib/healthStandards";
import { checkDrugAllergy } from "./lib/drugSafety";

export default function HomeDashboard({ profile, docCount, medCount, onNavigate, onOpenSearch }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [allergyAlerts, setAllergyAlerts] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const firstName = profile?.name ? profile.name.split(" ")[0] : "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    loadRecentActivity();
  }, [profile]);

  async function loadRecentActivity() {
    if (!profile) return;
    setLoadingActivity(true);

    const [meds, vitals, docs] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }),
      supabase.from("vitals").select("*").eq("user_id", profile.user_id).order("recorded_at", { ascending: false }),
      supabase.from("documents").select("id, file_name, category, created_at").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(4),
    ]);

    setAllMedications(meds.data || []);
    if (vitals.data && vitals.data.length > 0) {
      setLatestVital(vitals.data[0]);
    }

    // Check next upcoming appointment from localStorage
    try {
      const savedAppts = localStorage.getItem(`healthkeep_appointments_${profile.user_id}`);
      if (savedAppts) {
        const appts = JSON.parse(savedAppts);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcoming = appts
          .filter((a) => new Date(a.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (upcoming.length > 0) {
          setNextAppointment(upcoming[0]);
        }
      }
    } catch (e) {
      console.error("Error reading upcoming appointment", e);
    }

    // Check allergy conflicts across active medications
    if (profile.allergies && meds.data) {
      const conflicts = meds.data
        .map((m) => ({ med: m, warning: checkDrugAllergy(m.name, profile.allergies) }))
        .filter((item) => item.warning && item.warning.hasWarning);
      setAllergyAlerts(conflicts);
    }

    const combined = [
      ...(meds.data || []).slice(0, 3).map((m) => ({ type: "medication", label: `${m.name} added`, sub: m.dosage || "Medication", time: m.created_at })),
      ...(vitals.data || []).slice(0, 3).map((v) => ({ type: "vital", label: `${v.type} recorded`, sub: v.value, time: v.created_at })),
      ...(docs.data || []).map((d) => ({ type: "document", label: "Document uploaded", sub: d.category || d.file_name, time: d.created_at })),
    ];

    combined.sort((a, b) => new Date(b.time) - new Date(a.time));
    setRecentActivity(combined.slice(0, 4));
    setLoadingActivity(false);
  }

  function timeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const icons = {
    medication: { icon: Pill, bg: "bg-emerald-50", text: "text-emerald-700" },
    vital: { icon: Activity, bg: "bg-rose-50", text: "text-rose-700" },
    document: { icon: Upload, bg: "bg-amber-50", text: "text-amber-700" },
  };

  const vitalEval = latestVital ? evaluateVital(latestVital.type, latestVital.value) : null;

  return (
    <div className="space-y-5">
      {/* 1. Welcoming Hero Greeting Banner */}
      <div className="bg-white rounded-3xl p-5 border shadow-xs relative overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-20 pointer-events-none blur-2xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {todayStr}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Personal medical records encrypted & active</span>
            </p>
          </div>

          <div
            onClick={() => onNavigate("profile")}
            className="cursor-pointer group flex flex-col items-center"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all shadow-xs"
              style={{ backgroundColor: "var(--color-primary-light)" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold" style={{ color: "var(--color-primary-dark)" }}>
                  {firstName[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">
              Medical ID
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Universal Search Bar Trigger */}
      <div
        onClick={onOpenSearch}
        className="bg-white rounded-2xl px-4 py-3 border flex items-center justify-between cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all shadow-xs"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5 text-xs text-gray-400">
          <Search size={16} className="text-gray-400" />
          <span>Search medications, vitals, doctors, documents...</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-slate-100 px-2 py-0.5 rounded-md border border-gray-200">
          ⌘K
        </span>
      </div>

      {/* 3. Drug-Allergy Warning Alert Banner (Visible if any conflicts detected) */}
      {allergyAlerts.length > 0 && (
        <div
          onClick={() => onNavigate("medications")}
          className="bg-red-50 border-2 border-red-300 rounded-3xl p-4 cursor-pointer hover:bg-red-100/60 transition-colors shadow-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>CLINICAL ALLERGY ALERT DETECTED ({allergyAlerts.length})</span>
          </div>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">
            {allergyAlerts.map((a) => a.med.name).join(", ")} may trigger an adverse reaction with your reported allergies. Tap to inspect.
          </p>
        </div>
      )}

      {/* 4. Upcoming Doctor Appointment Countdown Widget */}
      {nextAppointment && (
        <div
          onClick={() => onNavigate("visits")}
          className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-3xl p-4.5 cursor-pointer hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100/90 border border-blue-200 px-2.5 py-0.5 rounded-full">
              🗓️ Next Consultation
            </span>
            <span className="text-xs font-bold text-blue-900">
              {nextAppointment.date} {nextAppointment.time ? `• ${nextAppointment.time}` : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-800 transition-colors">
                {nextAppointment.doctor_name}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {nextAppointment.specialty || "Medical Consultation"} {nextAppointment.clinic && `• ${nextAppointment.clinic}`}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1.5 rounded-xl shadow-xs">
                <HelpCircle size={12} />
                <span>{nextAppointment.questions?.length || 0} questions prep →</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Eye-Catching AI Prescription Scanner Hero Card */}
      <div
        onClick={() => onNavigate("home-scan")}
        className="rounded-3xl p-5 text-white cursor-pointer relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] group"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
        }}
      >
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-24 h-24 rounded-full bg-white/5 blur-lg pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs tracking-wider uppercase border border-white/20">
              <Sparkles size={11} className="animate-spin-slow" /> AI Prescription Scanner
            </span>
            <span className="text-xs text-white/80 font-medium">Instant OCR</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold tracking-tight mb-1">
            Scan Prescription or Lab Report
          </h2>
          <p className="text-xs text-white/80 mb-4 max-w-md leading-relaxed">
            Snap a photo — automatically extract doctor info, dosage schedule, and save to your records in seconds.
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-xs font-bold shadow-md transition-all group-hover:translate-x-1" style={{ color: "var(--color-primary-dark)" }}>
              <ScanText size={16} />
              <span>Scan Prescription Now</span>
              <ArrowRight size={14} />
            </span>

            <span className="text-[11px] text-white/70 hidden sm:inline">
              Zero manual typing needed
            </span>
          </div>
        </div>
      </div>

      {/* 6. Daily Medication Checklist */}
      <DailyMedTracker
        userId={profile.user_id}
        medications={allMedications}
        onNavigateToMeds={onNavigate}
      />

      {/* 7. Four-Grid Interactive Quick Action Hub */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: "var(--color-text-muted)" }}>
          Quick Health Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate("medications")}
            className="bg-white rounded-2xl p-3.5 border text-left transition-all duration-200 hover:shadow-xs hover:border-emerald-300 active:scale-95 cursor-pointer group"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Pill size={18} />
            </div>
            <p className="text-xs font-bold text-gray-900 leading-tight">Log Medication</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Track daily dose</p>
          </button>

          <button
            onClick={() => onNavigate("vitals")}
            className="bg-white rounded-2xl p-3.5 border text-left transition-all duration-200 hover:shadow-xs hover:border-rose-300 active:scale-95 cursor-pointer group"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </div>
            <p className="text-xs font-bold text-gray-900 leading-tight">Record Vitals</p>
            <p className="text-[10px] text-gray-500 mt-0.5">BP, Sugar, Pulse</p>
          </button>

          <button
            onClick={() => onNavigate("visits")}
            className="bg-white rounded-2xl p-3.5 border text-left transition-all duration-200 hover:shadow-xs hover:border-blue-300 active:scale-95 cursor-pointer group"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Stethoscope size={18} />
            </div>
            <p className="text-xs font-bold text-gray-900 leading-tight">Doctor Visit</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Upcoming & Notes</p>
          </button>

          <button
            onClick={() => onNavigate("documents")}
            className="bg-white rounded-2xl p-3.5 border text-left transition-all duration-200 hover:shadow-xs hover:border-amber-300 active:scale-95 cursor-pointer group"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
            <p className="text-xs font-bold text-gray-900 leading-tight">Add Document</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Lab tests, scans</p>
          </button>
        </div>
      </div>

      {/* 8. Health Overview Matrix */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: "var(--color-text-muted)" }}>
          Health Snapshot
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Blood Type */}
          <div className="bg-white rounded-2xl p-3.5 border hover:shadow-xs transition-shadow" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Group</span>
              <Droplet size={15} className="text-red-500" />
            </div>
            <p className="text-xl font-black text-gray-900 mt-1">
              {profile?.blood_type || "—"}
            </p>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Medical ID badge</span>
          </div>

          {/* Active Meds */}
          <div
            onClick={() => onNavigate("medications")}
            className="bg-white rounded-2xl p-3.5 border cursor-pointer hover:shadow-xs transition-all"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Meds</span>
              <Pill size={15} style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="text-xl font-black text-gray-900 mt-1">
              {medCount}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Active regimen</span>
          </div>

          {/* Latest Vital with clinical badge */}
          <div
            onClick={() => onNavigate("vitals")}
            className="bg-white rounded-2xl p-3.5 border cursor-pointer hover:shadow-xs transition-all"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latest Vital</span>
              <Activity size={15} className="text-rose-500" />
            </div>
            {latestVital ? (
              <div>
                <p className="text-base font-bold text-gray-900 mt-1 truncate">
                  {latestVital.value}
                </p>
                {vitalEval ? (
                  <span
                    className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 uppercase"
                    style={{
                      backgroundColor: vitalEval.badgeBg,
                      color: vitalEval.badgeText,
                      border: `0.5px solid ${vitalEval.borderColor}`,
                    }}
                  >
                    {vitalEval.status}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500">{latestVital.type}</span>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xl font-black text-gray-400 mt-1">—</p>
                <span className="text-[10px] text-gray-400">No logs yet</span>
              </div>
            )}
          </div>

          {/* Documents */}
          <div
            onClick={() => onNavigate("documents")}
            className="bg-white rounded-2xl p-3.5 border cursor-pointer hover:shadow-xs transition-all"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Records</span>
              <FileText size={15} style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="text-xl font-black text-gray-900 mt-1">
              {docCount}
            </p>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Stored documents</span>
          </div>
        </div>
      </div>

      {/* 9. Recent Health Timeline Feed */}
      <div className="bg-white rounded-3xl p-5 border shadow-xs" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text)" }}>
            Recent Activity Feed
          </p>
          <span className="text-[11px] font-semibold text-gray-400">Latest updates</span>
        </div>

        {loadingActivity && (
          <p className="text-xs p-4 text-center text-gray-400">Loading timeline...</p>
        )}

        {!loadingActivity && recentActivity.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-2xl" style={{ borderColor: "var(--color-border)" }}>
            <Clock size={20} className="mx-auto text-gray-300 mb-1" />
            <p className="text-xs text-gray-500 font-medium">No activity logged yet.</p>
            <p className="text-[11px] text-gray-400">Log a medication or vital to begin your health history.</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {recentActivity.map((item, i) => {
            const conf = icons[item.type] || icons.document;
            const Icon = conf.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-3 hover:bg-slate-50/50 rounded-xl px-2 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${conf.bg} ${conf.text}`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {item.sub}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 shrink-0">
                  {timeAgo(item.time)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}