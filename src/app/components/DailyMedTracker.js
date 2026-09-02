"use client";

import { useState, useEffect, useMemo } from "react";
import { Pill, Check, Circle, Flame, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export default function DailyMedTracker({ userId, medications = [], onNavigateToMeds }) {
  const [doseLogs, setDoseLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const storageKey = `healthkeep_doses_${userId}`;

  // Load dose logs from localStorage
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setDoseLogs(JSON.parse(saved));
    } catch (e) {
      console.error("Error reading dose logs", e);
    }
  }, [userId]);

  // Save dose logs to localStorage
  function saveLogs(newLogs) {
    setDoseLogs(newLogs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLogs));
    } catch (e) {
      console.error("Error saving dose logs", e);
    }
  }

  // Parse frequency into slots: 'Morning', 'Afternoon', 'Evening'
  function getDoseSlots(frequency = "") {
    const f = frequency.toLowerCase();
    if (f.includes("3x") || f.includes("three") || f.includes("tid")) {
      return ["Morning", "Afternoon", "Evening"];
    }
    if (f.includes("2x") || f.includes("twice") || f.includes("bid")) {
      return ["Morning", "Evening"];
    }
    if (f.includes("night") || f.includes("bedtime") || f.includes("evening") || f.includes("pm")) {
      return ["Evening"];
    }
    if (f.includes("noon") || f.includes("afternoon")) {
      return ["Afternoon"];
    }
    // Default 1 daily dose
    return ["Morning"];
  }

  // Generate scheduled list for the selected date
  const scheduledDoses = useMemo(() => {
    if (!medications || medications.length === 0) return [];

    const dateLogs = doseLogs[selectedDate] || {};
    const items = [];

    medications.forEach((med) => {
      const slots = getDoseSlots(med.frequency);
      slots.forEach((slot) => {
        const slotKey = `${med.id}_${slot.toLowerCase()}`;
        const isTaken = Boolean(dateLogs[slotKey]);
        items.push({
          key: slotKey,
          medId: med.id,
          name: med.name,
          dosage: med.dosage,
          slot,
          taken: isTaken,
        });
      });
    });

    return items;
  }, [medications, doseLogs, selectedDate]);

  // Toggle taken state for a specific medication dose slot
  function toggleDose(slotKey) {
    const dateLogs = { ...(doseLogs[selectedDate] || {}) };
    if (dateLogs[slotKey]) {
      delete dateLogs[slotKey];
    } else {
      dateLogs[slotKey] = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const updated = { ...doseLogs, [selectedDate]: dateLogs };
    saveLogs(updated);
  }

  // Compute adherence progress
  const totalDoses = scheduledDoses.length;
  const takenDoses = scheduledDoses.filter((d) => d.taken).length;
  const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // Compute adherence streak (consecutive days with 100% adherence)
  const streak = useMemo(() => {
    if (!medications || medications.length === 0) return 0;
    let count = 0;
    let curr = new Date();

    // Check today: if today isn't finished yet, check if yesterday had doses
    for (let i = 0; i < 30; i++) {
      const dStr = curr.toISOString().split("T")[0];
      const dayLogs = doseLogs[dStr] || {};
      let allTaken = true;

      for (const med of medications) {
        const slots = getDoseSlots(med.frequency);
        for (const slot of slots) {
          const slotKey = `${med.id}_${slot.toLowerCase()}`;
          if (!dayLogs[slotKey]) {
            allTaken = false;
            break;
          }
        }
        if (!allTaken) break;
      }

      if (allTaken) {
        count++;
      } else if (i > 0) {
        // Break streak if an earlier day missed
        break;
      }
      curr.setDate(curr.getDate() - 1);
    }
    return count;
  }, [doseLogs, medications]);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  function shiftDate(offset) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function displayDateLabel(dStr) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dStr === today) return "Today";
    if (dStr === yesterday) return "Yesterday";
    return new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "var(--color-border)" }}>
      {/* Header with Title and Streak */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Pill size={16} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Daily Meds
            </h3>
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {takenDoses} of {totalDoses} doses taken
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Flame size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-semibold text-amber-700">{streak}d streak</span>
            </div>
          )}

          {/* Date Selector */}
          <div className="flex items-center gap-0.5 bg-slate-50 border rounded-lg px-1 py-0.5" style={{ borderColor: "var(--color-border)" }}>
            <button onClick={() => shiftDate(-1)} className="p-0.5 hover:bg-slate-200 rounded">
              <ChevronLeft size={14} className="text-gray-500" />
            </button>
            <span className="text-[11px] font-medium px-1 text-gray-700">
              {displayDateLabel(selectedDate)}
            </span>
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"
            >
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalDoses > 0 && (
        <div className="mb-3.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressPercent === 100 ? "#10B981" : "var(--color-primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* When no medications registered */}
      {medications.length === 0 && (
        <div className="text-center py-5 border border-dashed rounded-xl" style={{ borderColor: "var(--color-border)" }}>
          <Pill size={22} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-600">No active medications scheduled.</p>
          {onNavigateToMeds && (
            <button
              onClick={() => onNavigateToMeds("medications")}
              className="text-xs font-semibold mt-2 underline"
              style={{ color: "var(--color-primary)" }}
            >
              + Add a medication
            </button>
          )}
        </div>
      )}

      {/* Dose Items Checklist */}
      <div className="space-y-2">
        {scheduledDoses.map((item) => (
          <div
            key={item.key}
            onClick={() => toggleDose(item.key)}
            className="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none"
            style={{
              backgroundColor: item.taken ? "var(--color-primary-light)" : "white",
              borderColor: item.taken ? "var(--color-primary)" : "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                  item.taken ? "scale-105" : ""
                }`}
                style={{
                  backgroundColor: item.taken ? "var(--color-primary)" : "transparent",
                  border: item.taken ? "none" : "1.5px solid var(--color-border)",
                }}
              >
                {item.taken ? (
                  <Check size={14} color="white" strokeWidth={3} />
                ) : (
                  <Circle size={10} className="text-gray-300" />
                )}
              </button>

              <div className="truncate">
                <p
                  className={`text-xs font-medium truncate ${
                    item.taken ? "line-through text-gray-500" : "text-gray-800"
                  }`}
                >
                  {item.name} {item.dosage && <span className="text-[11px] font-normal opacity-80">({item.dosage})</span>}
                </p>
                <span
                  className="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium mt-0.5"
                  style={{
                    backgroundColor: item.taken ? "white" : "var(--color-bg)",
                    color: item.taken ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                  }}
                >
                  {item.slot}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className="text-[11px] font-medium"
                style={{ color: item.taken ? "var(--color-primary-dark)" : "var(--color-text-muted)" }}
              >
                {item.taken ? "Taken" : "Tap to log"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Banner */}
      {totalDoses > 0 && progressPercent === 100 && (
        <div className="mt-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-medium animate-fadeIn">
          <Sparkles size={14} className="text-emerald-600" />
          <span>All doses logged for {displayDateLabel(selectedDate).toLowerCase()}! Great job!</span>
        </div>
      )}
    </div>
  );
}
