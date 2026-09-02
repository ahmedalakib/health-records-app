"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { Activity, Plus, Trash2, Heart, Scale, Droplet, Thermometer } from "lucide-react";
import VitalsChart from "./components/VitalsChart";
import { evaluateVital } from "./lib/healthStandards";

const VITAL_TYPES = [
  { id: "Blood Pressure", label: "BP", icon: Activity, placeholder: "e.g. 120/80" },
  { id: "Glucose", label: "Glucose", icon: Droplet, placeholder: "e.g. 95 mg/dL" },
  { id: "Heart Rate", label: "Pulse", icon: Heart, placeholder: "e.g. 72 bpm" },
  { id: "Weight", label: "Weight", icon: Scale, placeholder: "e.g. 70 kg or 155 lbs" },
  { id: "Temperature", label: "Temp", icon: Thermometer, placeholder: "e.g. 98.6 F" },
];

export default function Vitals({ userId }) {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedChartVital, setSelectedChartVital] = useState("Blood Pressure");
  const [historyFilter, setHistoryFilter] = useState("All");

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

  const activeVitalConfig = VITAL_TYPES.find((v) => v.id === type) || VITAL_TYPES[0];

  const filteredHistory = vitals.filter((v) => {
    if (historyFilter === "All") return true;
    const isBP = historyFilter === "Blood Pressure";
    const vType = (v.type || "").toLowerCase();
    if (isBP) return vType.includes("pressure") || vType === "bp";
    return vType.includes(historyFilter.toLowerCase());
  });

  return (
    <section className="mt-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Activity size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              Vitals & Health Metrics
            </h2>
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {vitals.length} total readings recorded
            </p>
          </div>
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs font-semibold flex items-center gap-1 px-3 py-2 rounded-xl transition-all"
            style={{ color: "white", backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={16} /> Log Reading
          </button>
        )}
      </div>

      {/* Add Reading Modal / Form */}
      {adding && (
        <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Log New Reading
            </h3>
            <button
              onClick={() => setAdding(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            {/* Quick Vital Type Selector */}
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Measurement Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {VITAL_TYPES.map((vt) => {
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
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all"
                      style={{
                        backgroundColor: isSel ? "var(--color-primary-light)" : "var(--color-bg)",
                        borderColor: isSel ? "var(--color-primary)" : "var(--color-border)",
                      }}
                    >
                      <Icon size={16} color={isSel ? "var(--color-primary)" : "var(--color-text-muted)"} />
                      <span
                        className="text-[10px] font-medium truncate w-full"
                        style={{ color: isSel ? "var(--color-primary-dark)" : "var(--color-text-muted)" }}
                      >
                        {vt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Value</label>
                <input
                  type="text"
                  placeholder={activeVitalConfig.placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "Saving reading..." : "Save Reading"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-4 rounded-xl py-2.5 text-xs font-medium border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chart Section */}
      <div>
        {/* Vital Type Selector for Chart */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {VITAL_TYPES.map((vt) => {
            const isSel = selectedChartVital === vt.id;
            return (
              <button
                key={vt.id}
                onClick={() => setSelectedChartVital(vt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all"
                style={{
                  backgroundColor: isSel ? "var(--color-primary)" : "white",
                  color: isSel ? "white" : "var(--color-text-muted)",
                  border: isSel ? "none" : "1px solid var(--color-border)",
                  boxShadow: isSel ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <vt.icon size={13} color={isSel ? "white" : "var(--color-primary)"} />
                <span>{vt.id}</span>
              </button>
            );
          })}
        </div>

        {/* Visual Trend Chart */}
        <VitalsChart data={vitals} vitalType={selectedChartVital} />
      </div>

      {/* Logged History List */}
      <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            History Logs
          </h3>

          {/* Filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {["All", "Blood Pressure", "Glucose", "Heart Rate"].map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className="px-2 py-0.5 text-[10px] font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: historyFilter === f ? "var(--color-primary-light)" : "transparent",
                  color: historyFilter === f ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                }}
              >
                {f === "Blood Pressure" ? "BP" : f}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <p className="text-xs p-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            Loading vitals history...
          </p>
        )}

        {!loading && filteredHistory.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-xl" style={{ borderColor: "var(--color-border)" }}>
            <Activity size={22} className="mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">No vitals logged for this filter.</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredHistory.map((v) => {
            const ev = evaluateVital(v.type, v.value);
            return (
              <div
                key={v.id}
                className="flex justify-between items-center border rounded-xl px-3.5 py-2.5 hover:bg-slate-50/50 transition-colors"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {v.type}: {v.value}
                    </p>
                    {ev && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: ev.badgeBg,
                          color: ev.badgeText,
                          border: `0.5px solid ${ev.borderColor}`,
                        }}
                      >
                        {ev.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{v.recorded_at}</span>
                    {ev?.desc && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-500 truncate">{ev.desc}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                  title="Delete reading"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}