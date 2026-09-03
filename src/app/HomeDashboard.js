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
    if (!profile) return;
    setLoadingActivity(true);

    const [meds, vitals, docs, visits] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }),
      supabase.from("vitals").select("*").eq("user_id", profile.user_id).order("recorded_at", { ascending: false }),
      supabase.from("documents").select("id, file_name, category, created_at").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(4),
      supabase.from("visits").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
    ]);

    setAllMedications(meds.data || []);
    setVisitsCount(visits.count || 0);
    setVitalsCount(vitals.data?.length || 0);

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

  // Connected Health Categories list structure (matching the Health Summary mockup)
  const healthCategories = [
    {
      id: "allergies",
      label: "Allergies & Contraindications",
      icon: ShieldAlert,
      count: profile?.allergies ? profile.allergies.split(",").length : 0,
      badge: profile?.allergies ? "ACTIVE" : null,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      action: () => onNavigate("profile"),
    },
    {
      id: "medications",
      label: "Active Prescriptions & Meds",
      icon: Pill,
      count: allMedications.length,
      badge: allMedications.length > 0 ? `${allMedications.length} RX` : null,
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      action: () => onNavigate("medications"),
    },
    {
      id: "vitals",
      label: "Vitals & Lab Biometrics",
      icon: HeartPulse,
      count: vitalsCount,
      badge: latestVital ? `${latestVital.type}: ${latestVital.value}` : null,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      action: () => onNavigate("vitals"),
    },
    {
      id: "visits",
      label: "Doctor Consultations & Visits",
      icon: Stethoscope,
      count: visitsCount,
      badge: nextAppointment ? "APPT SCHEDULED" : null,
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      action: () => onNavigate("visits"),
    },
    {
      id: "documents",
      label: "Clinical Records & Lab Reports",
      icon: FileText,
      count: docCount || 0,
      badge: docCount > 0 ? `${docCount} FILES` : null,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      action: () => onNavigate("documents"),
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Welcoming Hero Greeting Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {todayStr}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <ShieldCheck size={13} className="text-sky-600" />
              <span>Sanomed Clinical Cloud • End-to-end encrypted</span>
            </p>
          </div>

          <div
            onClick={() => onNavigate("profile")}
            className="cursor-pointer group flex flex-col items-center"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-sky-500/20 group-hover:ring-sky-500/40 transition-all shadow-xs bg-sky-50 text-sky-700">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold">
                  {firstName[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold text-slate-400 mt-1 group-hover:text-slate-600 transition-colors">
              Medical ID
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Universal Search Bar Trigger */}
      <div
        onClick={onOpenSearch}
        className="bg-white rounded-2xl px-4 py-3 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-sky-300 hover:shadow-xs transition-all shadow-2xs group"
      >
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <Search size={16} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
          <span className="group-hover:text-slate-600 transition-colors">Search medications, vitals, doctors, documents...</span>
        </div>
        <kbd className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
          ⌘K
        </kbd>
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
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon size={18} className="text-slate-600 group-hover:text-sky-600 transition-colors" />
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
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors group-hover:translate-x-0.5" />
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
    </div>
  );
}