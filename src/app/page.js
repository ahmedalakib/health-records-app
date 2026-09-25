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
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Safe lookup of profile
      let { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // If profile doesn't exist yet for new user, create it on-the-fly
      if (!userProfile) {
        const defaultName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split("@")[0] : "Patient");

        try {
          const { data: createdProfile } = await supabase
            .from("profiles")
            .upsert(
              {
                user_id: user.id,
                name: defaultName,
                blood_type: "",
                allergies: "",
                emergency_contact: "",
                role: "patient",
                theme: "teal",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            )
            .select()
            .maybeSingle();

          userProfile = createdProfile || {
            user_id: user.id,
            name: defaultName,
            blood_type: "",
            allergies: "",
            emergency_contact: "",
            role: "patient",
          };
        } catch (upsertErr) {
          console.warn("Notice during profile initialization:", upsertErr);
          userProfile = {
            user_id: user.id,
            name: defaultName,
            blood_type: "",
            allergies: "",
            emergency_contact: "",
            role: "patient",
          };
        }
      }

      const [medsRes, vitalsRes, visitsRes, docsRes] = await Promise.all([
        supabase.from("medications").select("*").eq("user_id", user.id),
        supabase.from("vitals").select("*").eq("user_id", user.id),
        supabase.from("visits").select("*").eq("user_id", user.id),
        supabase.from("documents").select("*").eq("user_id", user.id),
      ]);

      const medsList = medsRes.data || [];
      const vitalsList = vitalsRes.data || [];
      const visitsList = visitsRes.data || [];
      const docsList = docsRes.data || [];

      setSearchData({
        medications: medsList,
        vitals: vitalsList,
        visits: visitsList,
        documents: docsList,
      });

      setProfile(userProfile);
      setDocCount(docsList.length);
      setMedCount(medsList.length);
    } catch (err) {
      console.error("Error loading application state:", err);
    } finally {
      setLoading(false);
    }
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
    <main className="min-h-screen pb-28 mesh-gradient-bg">
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block tracking-wide">
              Medical Health Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Emergency Medical ID button with pulse beacon */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-red-700 bg-red-50/90 border border-red-200 hover:bg-red-100 transition-all cursor-pointer shadow-xs active:scale-95 animate-beacon"
            title="Open Emergency Medical ID"
          >
            <ShieldAlert size={14} className="text-red-600 animate-pulse" />
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

      {/* Floating Dock Bottom Navigation */}
      <nav className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-lg floating-dock rounded-2xl sm:rounded-3xl flex justify-around items-center py-2 px-2 z-40 transition-all duration-300">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === "home" ? isHomeGroup : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer relative ${
                isActive
                  ? "bg-sky-500/15 text-sky-700 font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/60"
              }`}
            >
              {isActive && (
                <span className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
              )}
              <Icon
                size={20}
                className={isActive ? "text-sky-600 scale-105 transition-transform" : "text-slate-400"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? "text-sky-800 font-bold" : "text-slate-500 font-medium"
                }`}
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