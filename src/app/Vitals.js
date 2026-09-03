"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  Activity,
  Plus,
  Trash2,
  Heart,
  Scale,
  Droplet,
  Thermometer,
  Pin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  ListFilter
} from "lucide-react";
import VitalsChart from "./components/VitalsChart";
import { evaluateVital } from "./lib/healthStandards";

const VITAL_CONFIGS = [
  { id: "Blood Pressure", label: "Blood Pressure", shortLabel: "BP", icon: Activity, unit: "mmHg", target: "120/80", placeholder: "e.g. 120/80" },
  { id: "Glucose", label: "Blood Glucose", shortLabel: "Glucose", icon: Droplet, unit: "mmol/L or mg/dL", target: "4.0 - 7.0", placeholder: "e.g. 5.4 or 95" },
  { id: "Heart Rate", label: "Heart Rate", shortLabel: "Pulse", icon: Heart, unit: "bpm", target: "60 - 100", placeholder: "e.g. 72" },
  { id: "Temperature", label: "Body Temperature", shortLabel: "Temp", icon: Thermometer, unit: "°F", target: "97.8 - 99.1", placeholder: "e.g. 98.6" },
  { id: "Weight", label: "Body Weight", shortLabel: "Weight", icon: Scale, unit: "kg / lbs", target: "Stable", placeholder: "e.g. 70" },
];

export default function Vitals({ userId }) {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedChartVital, setSelectedChartVital] = useState("Blood Pressure");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All"); // "All", "Clinical", "Devices"

  const [type, setType] = useState("Blood Pressure");
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVitals();
  }, [userId]);

  async function loadVitals() {
    const { data } = await supabase
      .from("vitals")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    setVitals(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);

    await supabase.from("vitals").insert({
      user_id: userId,
      type,
      value,
      recorded_at: recordedAt || new Date().toISOString().split("T")[0],
    });

    setValue("");
    setRecordedAt("");
    setSaving(false);
    setAdding(false);
    loadVitals();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this reading?")) return;
    await supabase.from("vitals").delete().eq("id", id);
    loadVitals();
  }

  // Get most recent reading for each vital type
  const latestByType = VITAL_CONFIGS.map((cfg) => {
    const readings = vitals.filter((v) => {
      const vType = (v.type || "").toLowerCase();
      if (cfg.id === "Blood Pressure") return vType.includes("pressure") || vType === "bp";
      return vType.includes(cfg.id.toLowerCase());
    });

    const latest = readings.length > 0 ? readings[0] : null;
    const evaluation = latest ? evaluateVital(latest.type, latest.value) : null;

    return {
      ...cfg,
      latestReading: latest,
      evaluation,
      count: readings.length,
    };
  });

  return (
    <section className="mt-6 space-y-5">
      {/* Header & Category Tabs (All | Clinical | Devices) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Vitals & Biometrics
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Last updated {vitals[0]?.recorded_at || "recently"} • {vitals.length} logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>Log Vital</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (All, Clinical, Devices) */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
          {["All", "Clinical", "Devices"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategoryFilter(tab)}
              className="px-3 py-1.5 text-xs font-bold transition-all relative"
              style={{
                color: activeCategoryFilter === tab ? "#0284C7" : "#64748B",
              }}
            >
              {tab}
              {activeCategoryFilter === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Pinned Vitals Cards Grid (Matching the uploaded reference mockup) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Pin size={12} className="rotate-45" /> Pinned Vitals
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Tap to view curve</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {latestByType.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isSelected = selectedChartVital === item.id;
            const evalStatus = item.evaluation?.status;
            const isAbnormal = evalStatus === "High" || evalStatus === "Stage 1 HTN" || evalStatus === "Stage 2 HTN" || evalStatus === "Elevated";

            return (
              <div
                key={item.id}
                onClick={() => setSelectedChartVital(item.id)}
                className={`bg-white rounded-3xl p-4 border transition-all cursor-pointer relative smooth-card ${
                  isSelected
                    ? "ring-2 ring-sky-500 border-sky-400 shadow-md shadow-sky-500/10"
                    : "border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                {/* Pin and Drag Icon */}
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                    <Icon size={16} className={isSelected ? "text-sky-600" : "text-slate-600"} />
                  </div>
                  <Pin size={12} className="text-slate-300" />
                </div>

                <p className="text-xs font-bold text-slate-700">{item.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {item.latestReading ? item.latestReading.value : "--"}
                  </span>
                </div>

                {/* Range Tag */}
                <div className="mt-2.5">
                  {item.latestReading ? (
                    isAbnormal ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        ! {evalStatus || "Out of range"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ In range
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">No record yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Reading Modal / Form */}
      {adding && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-lg space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Log New Metric</h3>
            <button
              onClick={() => setAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Measurement Type
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {VITAL_CONFIGS.map((vt) => {
                  const Icon = vt.icon;
                  const isSel = type === vt.id;
                  return (
                    <button
                      key={vt.id}
                      type="button"
                      onClick={() => {
                        setType(vt.id);
                        setSelectedChartVital(vt.id);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-center transition-all ${
                        isSel
                          ? "bg-sky-50 border-sky-500 text-sky-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Icon size={15} />
                      <span className="text-[10px] truncate w-full">{vt.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Value ({VITAL_CONFIGS.find((v) => v.id === type)?.unit})
                </label>
                <input
                  type="text"
                  placeholder={VITAL_CONFIGS.find((v) => v.id === type)?.placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs"
              >
                {saving ? "Saving..." : "Save Reading"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visual Clinical Trend Chart (Deep Indigo Modern Style) */}
      <VitalsChart data={vitals} vitalType={selectedChartVital} />

      {/* Recent Measurement Logs List with Range Bar Indicators */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Logs & Lab History</h3>
          <span className="text-[11px] text-slate-400 font-semibold">{vitals.length} total</span>
        </div>

        {vitals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No vital readings logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {vitals.slice(0, 8).map((v) => {
              const evalRes = evaluateVital(v.type, v.value);
              const isNormal = evalRes?.status === "Normal" || evalRes?.status === "Optimal";

              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{v.type}</p>
                    <span className="text-[10px] text-slate-400">{v.recorded_at}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">{v.value}</span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            isNormal
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {evalRes?.status || "Logged"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}