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
  ShieldAlert,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  HelpCircle,
  Phone,
  PhoneCall,
  ClipboardList,
  Syringe,
  FileCheck,
  HeartPulse
} from "lucide-react";
import DailyMedTracker from "./components/DailyMedTracker";
import MedicalDisclaimer from "./components/MedicalDisclaimer";
import { evaluateVital } from "./lib/healthStandards";
import { checkDrugAllergy } from "./lib/drugSafety";

export default function HomeDashboard({ profile, docCount, medCount, onNavigate, onOpenSearch }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [allMedications, setAllMedications] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [allergyAlerts, setAllergyAlerts] = useState([]);
  const [visitsCount, setVisitsCount] = useState(0);
  const [vitalsCount, setVitalsCount] = useState(0);
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
    if (!profile || !profile.user_id) {
      setLoadingActivity(false);
      return;
    }
    setLoadingActivity(true);

    try {
      const [meds, vitals, docs, visits] = await Promise.all([
        supabase.from("medications").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }),
        supabase.from("vitals").select("*").eq("user_id", profile.user_id).order("recorded_at", { ascending: false }),
        supabase.from("documents").select("id, file_name, category, created_at").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(4),
        supabase.from("visits").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
      ]);

      const medsList = meds.data || [];
      const vitalsList = vitals.data || [];
      const docsList = docs.data || [];

      setAllMedications(medsList);
      setVisitsCount(visits.count || 0);
      setVitalsCount(vitalsList.length);

      if (vitalsList.length > 0) {
        setLatestVital(vitalsList[0]);
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
      if (profile.allergies && medsList.length > 0) {
        const conflicts = medsList
          .map((m) => ({ med: m, warning: checkDrugAllergy(m.name, profile.allergies) }))
          .filter((item) => item.warning && item.warning.hasWarning);
        setAllergyAlerts(conflicts);
      }

      const combined = [
        ...medsList.slice(0, 3).map((m) => ({ type: "medication", label: `${m.name} added`, sub: m.dosage || "Medication", time: m.created_at })),
        ...vitalsList.slice(0, 3).map((v) => ({ type: "vital", label: `${v.type} recorded`, sub: v.value, time: v.created_at })),
        ...docsList.map((d) => ({ type: "document", label: "Document uploaded", sub: d.category || d.file_name, time: d.created_at })),
      ];

      combined.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(combined.slice(0, 4));
    } catch (err) {
      console.warn("Could not load recent activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  }

  // Connected Health Categories list structure with vibrant healthcare palette
  const healthCategories = [
    {
      id: "allergies",
      label: "Allergies & Contraindications",
      icon: ShieldAlert,
      count: profile?.allergies ? profile.allergies.split(",").length : 0,
      badge: profile?.allergies ? "ACTIVE" : null,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-50 text-rose-600",
      action: () => onNavigate("profile"),
    },
    {
      id: "medications",
      label: "Active Prescriptions & Meds",
      icon: Pill,
      count: allMedications.length,
      badge: allMedications.length > 0 ? `${allMedications.length} RX` : null,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      iconBg: "bg-sky-50 text-sky-600",
      action: () => onNavigate("medications"),
    },
    {
      id: "vitals",
      label: "Vitals & Lab Biometrics",
      icon: HeartPulse,
      count: vitalsCount,
      badge: latestVital ? `${latestVital.type}: ${latestVital.value}` : null,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600",
      action: () => onNavigate("vitals"),
    },
    {
      id: "visits",
      label: "Doctor Consultations & Visits",
      icon: Stethoscope,
      count: visitsCount,
      badge: nextAppointment ? "APPT SCHEDULED" : null,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconBg: "bg-indigo-50 text-indigo-600",
      action: () => onNavigate("visits"),
    },
    {
      id: "documents",
      label: "Clinical Records & Lab Reports",
      icon: FileText,
      count: docCount || 0,
      badge: docCount > 0 ? `${docCount} FILES` : null,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      iconBg: "bg-purple-50 text-purple-600",
      action: () => onNavigate("documents"),
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Welcoming Hero Greeting Banner with Luminous Glow */}
      <div className="bg-gradient-to-br from-white/95 via-sky-50/40 to-indigo-50/30 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden smooth-card">
        {/* Ambient Gradient Orbs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400/20 to-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Sync
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {todayStr}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {greeting}, <span className="text-gradient-cyan">{firstName}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-sky-600" />
              <span>Sanomed Clinical Cloud • End-to-end encrypted</span>
            </p>
          </div>

          <div
            onClick={() => onNavigate("profile")}
            className="cursor-pointer group flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-sky-500/20 group-hover:ring-sky-500/50 transition-all shadow-sm bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-base">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{firstName[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-1 group-hover:text-sky-600 transition-colors uppercase tracking-wider">
              Profile
            </span>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div
            onClick={() => onNavigate("medications")}
            className="p-2.5 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white hover:border-sky-300 transition-all cursor-pointer text-center group"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Meds</span>
            <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
              {allMedications.length}
            </span>
          </div>
          <div
            onClick={() => onNavigate("vitals")}
            className="p-2.5 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer text-center group"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Vitals</span>
            <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              {vitalsCount}
            </span>
          </div>
          <div
            onClick={() => onNavigate("visits")}
            className="p-2.5 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer text-center group"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Visits</span>
            <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              {visitsCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Universal Search Bar Trigger */}
      <div
        onClick={onOpenSearch}
        className="glass-surface-subtle rounded-2xl px-4 py-3.5 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-sky-400 hover:shadow-md transition-all shadow-xs group"
      >
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search size={15} />
          </div>
          <span className="group-hover:text-slate-700 transition-colors font-medium">Search prescriptions, doctors, lab results...</span>
        </div>
        <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* 3. Fast Action Quick Launch Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: "Scan Prescription",
            desc: "AI OCR Parsing",
            icon: ScanText,
            color: "from-sky-500 to-cyan-500",
            action: () => onNavigate("home-scan"),
          },
          {
            label: "Add Medication",
            desc: "Dose & Reminders",
            icon: Pill,
            color: "from-indigo-500 to-purple-500",
            action: () => onNavigate("medications"),
          },
          {
            label: "Record Vitals",
            desc: "BP, Glucose, Pulse",
            icon: Activity,
            color: "from-rose-500 to-pink-500",
            action: () => onNavigate("vitals"),
          },
          {
            label: "Doctor Visit",
            desc: "Notes & Advice",
            icon: Stethoscope,
            color: "from-emerald-500 to-teal-500",
            action: () => onNavigate("visits"),
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer smooth-card"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform mb-2.5`}>
                <Icon size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-sky-700 transition-colors leading-snug">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Clinical Allergy Warning Alert Banner if Detected */}
      {allergyAlerts.length > 0 && (
        <div
          onClick={() => onNavigate("medications")}
          className="bg-red-50/95 border-2 border-red-300 rounded-3xl p-4.5 cursor-pointer shadow-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>CLINICAL ALLERGY ALERT DETECTED ({allergyAlerts.length})</span>
          </div>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">
            {allergyAlerts.map((a) => a.med.name).join(", ")} may conflict with your reported allergies. Tap to review.
          </p>
        </div>
      )}

      {/* 4. Upcoming Doctor Consultation Countdown Widget with 1-Tap Call */}
      {nextAppointment && (
        <div className="bg-gradient-to-r from-sky-50/90 to-indigo-50/90 border border-sky-200 rounded-3xl p-4.5 hover:shadow-xs transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100/90 border border-sky-200 px-2.5 py-0.5 rounded-full">
              🗓️ Next Consultation
            </span>
            <span className="text-xs font-bold text-sky-900">
              {nextAppointment.date} {nextAppointment.time ? `• ${nextAppointment.time}` : ""}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div onClick={() => onNavigate("visits")} className="cursor-pointer flex-1">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors">
                {nextAppointment.doctor_name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {nextAppointment.specialty || "Medical Consultation"} {nextAppointment.clinic && `• ${nextAppointment.clinic}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {nextAppointment.phone && (
                <a
                  href={`tel:${nextAppointment.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <PhoneCall size={12} className="animate-pulse" />
                  <span>Call {nextAppointment.phone}</span>
                </a>
              )}
              <span
                onClick={() => onNavigate("visits")}
                className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-white border border-sky-200 px-2.5 py-1.5 rounded-xl shadow-xs"
              >
                <HelpCircle size={12} />
                <span>{nextAppointment.questions?.length || 0} questions prep →</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Health Summary Hub Banner & Category Rows (Matching Reference UI Screen 2) */}
      <div className="space-y-3">
        {/* Blue Info Header Box */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 shadow-md shadow-indigo-950/20 border border-indigo-800/40">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <ClipboardList size={20} className="text-sky-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Health Summary Hub</h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Your connected clinical records grouped by health domain.
            </p>
          </div>
        </div>

        {/* Clean Category Record Rows with Chevron Navigation */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {healthCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={cat.action}
                className="flex items-center justify-between p-4 hover:bg-slate-50/90 transition-all cursor-pointer group smooth-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl ${cat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-sky-900 transition-colors">
                      {cat.label} ({cat.count})
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cat.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cat.badgeColor}`}
                    >
                      {cat.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. AI Prescription Scanner Hero Card */}
      <div
        onClick={() => onNavigate("home-scan")}
        className="rounded-3xl p-5 text-white cursor-pointer relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.008] active:scale-[0.99] group bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800"
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-xs font-bold text-sky-800 shadow-md transition-all group-hover:translate-x-1">
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

      {/* 7. Daily Medication Checklist */}
      <DailyMedTracker
        userId={profile.user_id}
        medications={allMedications}
        onNavigateToMeds={onNavigate}
      />

      {/* 8. Medical Safety & Clinical Disclaimer */}
      <MedicalDisclaimer
        variant="subtle"
        text="Sanomed health records and safety checks are for personal reference and tracking only. Always consult your doctor or pharmacist regarding drug allergies, side effects, or changes to your prescribed treatment plan."
      />
    </div>
  );
}