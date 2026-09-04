"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabaseClient";
import Profile from "./Profile";
import Medications from "./Medications";
import Vitals from "./Vitals";
import Visits from "./Visits";
import Documents from "./Documents";
import PrescriptionUpload from "./PrescriptionUpload";
import HomeDashboard from "./HomeDashboard";
import GlobalSearchModal from "./components/GlobalSearchModal";
import HealthChatbot from "./components/HealthChatbot";
import { HeartPulse, Home, Pill, Activity, Folder, User, Stethoscope, ShieldAlert, Search } from "lucide-react";

export default function HomePage() {
  const [profile, setProfile] = useState(null);
  const [docCount, setDocCount] = useState(0);
  const [medCount, setMedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState({ medications: [], vitals: [], visits: [], documents: [] });
  const router = useRouter();

  useEffect(() => {
    loadData();

    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { count } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: medications } = await supabase
      .from("medications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const [medsRes, vitalsRes, visitsRes, docsRes] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user.id),
      supabase.from("vitals").select("*").eq("user_id", user.id),
      supabase.from("visits").select("*").eq("user_id", user.id),
      supabase.from("documents").select("*").eq("user_id", user.id),
    ]);

    setSearchData({
      medications: medsRes.data || [],
      vitals: vitalsRes.data || [],
      visits: visitsRes.data || [],
      documents: docsRes.data || [],
    });

    setProfile(data);
    setDocCount(count || 0);
    setMedCount(medications || 0);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </main>
    );
  }

  const initial = profile?.name ? profile.name[0].toUpperCase() : "?";

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "medications", label: "Meds", icon: Pill },
    { id: "visits", label: "Visits", icon: Stethoscope },
    { id: "vitals", label: "Vitals", icon: Activity },
    { id: "documents", label: "Docs", icon: Folder },
    { id: "profile", label: "Medical ID", icon: ShieldAlert },
  ];

  const isHomeGroup = activeTab === "home" || activeTab === "home-scan";

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Top nav */}
      <header
        className="glass-surface border-b px-5 py-3 flex justify-between items-center sticky top-0 z-30 shadow-xs transition-all"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-sky-600/20 transition-all duration-200 group-hover:scale-105 bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 p-2">
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Shield Outline */}
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.75" />
              {/* Biometric DNA Wave Curves */}
              <path d="M9 7.5c1.5 1.5 4.5 1.5 6 0" strokeWidth="2" stroke="white" />
              <path d="M15 12c-1.5 1.5-4.5 1.5-6 0" strokeWidth="2" stroke="white" />
              <path d="M9 16.5c1.5 1.5 4.5 1.5 6 0" strokeWidth="2" stroke="white" />
              {/* Center Core Dot */}
              <circle cx="12" cy="12" r="1.25" fill="white" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight block leading-tight text-slate-900">
                Sanomed
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block tracking-wide">
              Medical Health Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Emergency Medical ID button */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Open Emergency Medical ID"
          >
            <ShieldAlert size={13} className="text-red-600 animate-pulse-subtle" />
            <span>Emergency ID</span>
          </button>

          {/* User Avatar */}
          <div
            onClick={() => setActiveTab("profile")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer overflow-hidden shrink-0 ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all shadow-xs"
            style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-dark)" }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.textContent = initial;
                }}
              />
            ) : (
              initial
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "home" && profile && (
          <HomeDashboard
            profile={profile}
            docCount={docCount}
            medCount={medCount}
            onNavigate={setActiveTab}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}

        {activeTab === "home-scan" && profile && (
          <div>
            <button
              onClick={() => setActiveTab("home")}
              className="text-sm mb-4"
              style={{ color: "var(--color-primary)" }}
            >
              ← Back
            </button>
            <PrescriptionUpload userId={profile.user_id} onSaved={loadData} />
          </div>
        )}

        {activeTab === "medications" && profile && (
          <Medications userId={profile.user_id} />
        )}

        {activeTab === "visits" && profile && (
          <Visits userId={profile.user_id} />
        )}

        {activeTab === "vitals" && profile && (
          <Vitals userId={profile.user_id} />
        )}

        {activeTab === "documents" && profile && (
          <Documents userId={profile.user_id} />
        )}

        {activeTab === "profile" && profile && (
          <Profile
            userId={profile.user_id}
            initialName={profile.name}
            initialBloodType={profile.blood_type}
            initialAllergies={profile.allergies}
            initialAvatarUrl={profile.avatar_url}
            onLogout={handleLogout}
            onProfileUpdate={loadData}
          />
        )}
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 glass-surface border-t flex justify-around items-center py-2 px-2 z-30 shadow-lg"
        style={{ borderColor: "var(--color-border)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === "home" ? isHomeGroup : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
              }}
            >
              <Icon
                size={19}
                color={isActive ? "var(--color-primary)" : "var(--color-text-muted)"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-semibold tracking-tight"
                style={{ color: isActive ? "var(--color-primary-dark)" : "var(--color-text-muted)" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Universal Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={setActiveTab}
        medications={searchData.medications}
        vitals={searchData.vitals}
        visits={searchData.visits}
        documents={searchData.documents}
      />

      {/* Sanomed AI Health Assistant Chatbot (Floating) */}
      <HealthChatbot />
    </main>
  );
}