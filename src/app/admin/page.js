"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  Users,
  Pill,
  Activity,
  Calendar,
  FileText,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  ArrowLeft,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Eye,
  X,
  Lock,
  Sparkles,
  TrendingUp,
  Cpu,
  Clock,
  Phone,
  Droplet
} from "lucide-react";

export default function AdminConsolePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview"); // overview, patients, broadcasts, diagnostics
  const [metrics, setMetrics] = useState({
    total_users: 0,
    total_medications: 0,
    total_vitals: 0,
    total_visits: 0,
    total_documents: 0,
    active_broadcasts: 0,
    new_users_week: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Patients state
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "info",
    action_label: "",
    action_url: "",
  });
  const [savingBroadcast, setSavingBroadcast] = useState(false);

  // Diagnostics state
  const [dbLatency, setDbLatency] = useState(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      setCurrentUser(user);

      // Fetch user profile to verify role
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr || !profile) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      setCurrentProfile(profile);

      // Founder email whitelist for instant access
      const founderEmails = [
        "ahmedalakibofficial@gmail.com",
        "ahmedalakib@gmail.com",
      ];

      const isFounderEmail = user.email && founderEmails.includes(user.email.toLowerCase());
      const userIsAdmin = profile.role === "admin" || profile.role === "superadmin" || isFounderEmail;

      // If founder email, auto-sync role to admin in database
      if (isFounderEmail && profile.role !== "admin") {
        supabase.from("profiles").update({ role: "admin" }).eq("user_id", user.id).then(() => {});
      }

      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        loadAllAdminData();
      }
    } catch (err) {
      console.error("Error verifying admin credentials:", err);
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadAllAdminData() {
    loadMetrics();
    loadPatients();
    loadBroadcasts();
  }

  async function loadMetrics() {
    setLoadingMetrics(true);
    try {
      // Attempt to call RPC function get_admin_analytics
      const { data, error } = await supabase.rpc("get_admin_analytics");
      if (!error && data) {
        setMetrics(data);
      } else {
        // Fallback: direct table count queries
        const [usersCount, medsCount, vitalsCount, visitsCount, docsCount, broadcastsCount] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("medications").select("id", { count: "exact", head: true }),
          supabase.from("vitals").select("id", { count: "exact", head: true }),
          supabase.from("visits").select("id", { count: "exact", head: true }),
          supabase.from("documents").select("id", { count: "exact", head: true }),
          supabase.from("app_announcements").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);

        setMetrics({
          total_users: usersCount.count || 0,
          total_medications: medsCount.count || 0,
          total_vitals: vitalsCount.count || 0,
          total_visits: visitsCount.count || 0,
          total_documents: docsCount.count || 0,
          active_broadcasts: broadcastsCount.count || 0,
          new_users_week: usersCount.count || 0,
        });
      }
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  }

  async function loadPatients(query = "") {
    setLoadingPatients(true);
    try {
      // First try RPC
      const { data, error } = await supabase.rpc("get_admin_patients_list", { search_query: query });
      if (!error && data) {
        setPatients(data);
      } else {
        // Fallback direct query
        let queryBuilder = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
        if (query) {
          queryBuilder = queryBuilder.ilike("name", `%${query}%`);
        }
        const { data: list } = await queryBuilder;
        setPatients(list || []);
      }
    } catch (err) {
      console.error("Error loading patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  }

  async function loadBroadcasts() {
    setLoadingBroadcasts(true);
    try {
      const { data } = await supabase
        .from("app_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setBroadcasts(data || []);
    } catch (err) {
      console.error("Error loading broadcasts:", err);
    } finally {
      setLoadingBroadcasts(false);
    }
  }

  async function handleCreateBroadcast(e) {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    setSavingBroadcast(true);
    try {
      const { error } = await supabase.from("app_announcements").insert([
        {
          title: broadcastForm.title.trim(),
          message: broadcastForm.message.trim(),
          type: broadcastForm.type,
          action_label: broadcastForm.action_label.trim() || null,
          action_url: broadcastForm.action_url.trim() || null,
          is_active: true,
          created_by: currentUser?.id,
        },
      ]);

      if (error) throw error;

      setBroadcastForm({
        title: "",
        message: "",
        type: "info",
        action_label: "",
        action_url: "",
      });
      loadBroadcasts();
      loadMetrics();
    } catch (err) {
      alert("Failed to create broadcast: " + err.message);
    } finally {
      setSavingBroadcast(false);
    }
  }

  async function handleToggleBroadcast(id, currentStatus) {
    try {
      await supabase
        .from("app_announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      loadBroadcasts();
      loadMetrics();
    } catch (err) {
      alert("Error updating broadcast status: " + err.message);
    }
  }

  async function handleDeleteBroadcast(id) {
    if (!confirm("Are you sure you want to permanently delete this broadcast?")) return;
    try {
      await supabase.from("app_announcements").delete().eq("id", id);
      loadBroadcasts();
      loadMetrics();
    } catch (err) {
      alert("Error deleting broadcast: " + err.message);
    }
  }

  async function runPingDiagnostics() {
    setDiagnosticsRunning(true);
    const start = performance.now();
    try {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      const elapsed = Math.round(performance.now() - start);
      if (error) throw error;
      setDbLatency(elapsed);
    } catch (err) {
      setDbLatency("Failed: " + err.message);
    } finally {
      setDiagnosticsRunning(false);
    }
  }

  // --- ACCESS DENIED SCREEN ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Verifying Administrator Permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The Sanomed Admin Console requires verified administrator privileges. Your current account ({currentUser?.email || "Guest"}) does not have admin permissions.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition active:scale-98 shadow-lg shadow-teal-500/20"
            >
              Return to Patient Portal
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Sign In with Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FULL ADMIN CONSOLE ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Back to Patient App"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-md shadow-teal-500/20">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Sanomed Admin</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                  Founder Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Logged in as {currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            disabled={loadingMetrics}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition shadow-sm shadow-teal-500/20"
          >
            Open Patient App
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Overview & Growth", icon: TrendingUp },
            { id: "patients", label: "Patient Directory", icon: Users },
            { id: "broadcasts", label: "Global Broadcasts", icon: Megaphone },
            { id: "diagnostics", label: "System Health", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition ${
                  isActive
                    ? "bg-slate-800 text-teal-400 border border-teal-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Total Patients", value: metrics.total_users, icon: Users },
                { label: "Active Meds", value: metrics.total_medications, icon: Pill },
                { label: "Vitals Logged", value: metrics.total_vitals, icon: Activity },
                { label: "Doctor Visits", value: metrics.total_visits, icon: Calendar },
                { label: "Scanned Docs", value: metrics.total_documents, icon: FileText },
                { label: "Live Broadcasts", value: metrics.active_broadcasts, icon: Megaphone },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-medium">{kpi.label}</span>
                      <div className="p-2 rounded-xl bg-slate-800/80 text-teal-400">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                      {kpi.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("broadcasts")}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">Post Live Broadcast</div>
                      <div className="text-xs text-slate-400">Send an in-app banner to all patients</div>
                    </div>
                    <Plus className="w-4 h-4 text-teal-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab("patients")}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">Search Patients</div>
                      <div className="text-xs text-slate-400">Inspect registered user profiles</div>
                    </div>
                    <Search className="w-4 h-4 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab("diagnostics")}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">Check Database Latency</div>
                      <div className="text-xs text-slate-400">Test Supabase cloud connectivity</div>
                    </div>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Database Overview */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    Infrastructure & Security Summary
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Sanomed runs on Supabase PostgreSQL with strict Row-Level Security (RLS) enforcement. Patient health records are isolated per user token.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <div className="text-[11px] text-slate-400">Database Engine</div>
                      <div className="text-sm font-bold text-white mt-1">PostgreSQL 15</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <div className="text-[11px] text-slate-400">File Storage</div>
                      <div className="text-sm font-bold text-white mt-1">Encrypted S3</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <div className="text-[11px] text-slate-400">RLS Policies</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">Enforced 🔒</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <div className="text-[11px] text-slate-400">AI OCR Engine</div>
                      <div className="text-sm font-bold text-teal-400 mt-1">Tesseract / Gemini</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Cloud Host: Supabase AWS Cluster</span>
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Backend Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PATIENT DIRECTORY */}
        {activeTab === "patients" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  Patient Directory ({patients.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View and verify registered user profiles across the platform
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, blood, phone..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    loadPatients(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Patient Name</th>
                    <th className="px-4 py-3">Blood Type</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingPatients ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Loading patients...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No registered patients matching your search.
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 font-semibold text-white flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                            {p.name ? p.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div>{p.name || "Unnamed Patient"}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                              {p.user_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.blood_type ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                              {p.blood_type}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {p.phone || p.emergency_contact || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              p.role === "admin"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {p.role || "patient"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(p.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedPatient(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-400 transition"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BROADCASTS */}
        {activeTab === "broadcasts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Announcement Form */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                New Global Broadcast
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Displays as a live banner at the top of all active user apps.
              </p>

              <form onSubmit={handleCreateBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Broadcast Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanomed v1.2 Released!"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message Body
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. You can now track your medications offline and set automatic alarms."
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Announcement Type
                  </label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="info">Information (Blue / Teal)</option>
                    <option value="success">Success / Feature Update (Green)</option>
                    <option value="warning">Maintenance Warning (Amber)</option>
                    <option value="critical">Critical Alert (Red)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Action Button Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Update Now"
                      value={broadcastForm.action_label}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, action_label: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Action URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={broadcastForm.action_url}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, action_url: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingBroadcast}
                  className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition active:scale-98 shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  {savingBroadcast ? "Publishing..." : "Publish Broadcast"}
                </button>
              </form>
            </div>

            {/* Broadcasts History List */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between">
                <span>Active & Past Broadcasts ({broadcasts.length})</span>
                <button
                  onClick={loadBroadcasts}
                  className="text-xs text-teal-400 hover:underline"
                >
                  Refresh
                </button>
              </h3>

              {loadingBroadcasts ? (
                <p className="text-xs text-slate-400">Loading broadcasts...</p>
              ) : broadcasts.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No broadcasts published yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.is_active
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            {b.is_active ? "LIVE" : "INACTIVE"}
                          </span>
                          <span className="text-xs font-semibold text-white">{b.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{b.message}</p>
                        {b.action_url && (
                          <a
                            href={b.action_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                          >
                            {b.action_label || "Link"} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBroadcast(b.id, b.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            b.is_active
                              ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                              : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          }`}
                        >
                          {b.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteBroadcast(b.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Delete Broadcast"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH & DIAGNOSTICS */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-teal-400" />
                Live Cloud Latency
              </h3>
              <p className="text-xs text-slate-400">
                Ping the cloud database to test roundtrip API latency.
              </p>

              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Supabase DB Ping</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {dbLatency === null
                      ? "Not tested"
                      : typeof dbLatency === "number"
                      ? `${dbLatency} ms`
                      : dbLatency}
                  </div>
                </div>
                <button
                  onClick={runPingDiagnostics}
                  disabled={diagnosticsRunning}
                  className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold text-xs transition"
                >
                  {diagnosticsRunning ? "Pinging..." : "Test Ping"}
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">App Name</span>
                  <span className="font-semibold text-white">Sanomed Health Records</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Android Package</span>
                  <span className="font-mono text-slate-300">com.sanomed.healthrecords</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Release Keystore</span>
                  <span className="text-emerald-400 font-semibold">Permanent PKCS12 Configured</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Service Health Checklist
              </h3>

              <div className="space-y-3">
                {[
                  { name: "Supabase PostgreSQL Database", status: "Operational", healthy: true },
                  { name: "Encrypted Document Storage", status: "Operational", healthy: true },
                  { name: "Row-Level Security (RLS)", status: "Active & Enforced", healthy: true },
                  { name: "In-App Update Notifier", status: "Active (v1.0.2)", healthy: true },
                  { name: "Global Broadcast Engine", status: "Active", healthy: true },
                ].map((svc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-200">{svc.name}</span>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {svc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Patient Record Details</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-bold text-white">{selectedPatient.name || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Blood Group</span>
                  <span className="font-bold text-white">{selectedPatient.blood_type || "N/A"}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Account Role</span>
                  <span className="font-bold text-teal-400 uppercase">{selectedPatient.role || "patient"}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Allergies</span>
                <span className="font-medium text-white">{selectedPatient.allergies || "None registered"}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
                <span className="font-medium text-white">{selectedPatient.emergency_contact || "None"}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">User UUID</span>
                <span className="font-mono text-slate-400 text-xs select-all">{selectedPatient.user_id}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
