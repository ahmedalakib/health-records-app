"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Pill, Activity, Stethoscope, Folder, ArrowRight, Sparkles } from "lucide-react";

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigate,
  medications = [],
  vitals = [],
  visits = [],
  documents = [],
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic across all collections
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    const matchedMeds = medications.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.dosage || "").toLowerCase().includes(q) ||
        (m.frequency || "").toLowerCase().includes(q)
    );

    const matchedVisits = visits.filter(
      (v) =>
        (v.doctor_name || "").toLowerCase().includes(q) ||
        (v.reason || "").toLowerCase().includes(q) ||
        (v.notes || "").toLowerCase().includes(q) ||
        (v.clinic || "").toLowerCase().includes(q)
    );

    const matchedVitals = vitals.filter(
      (v) =>
        (v.type || "").toLowerCase().includes(q) ||
        (v.value || "").toLowerCase().includes(q) ||
        (v.recorded_at || "").toLowerCase().includes(q)
    );

    const matchedDocs = documents.filter(
      (d) =>
        (d.file_name || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q)
    );

    const totalCount =
      matchedMeds.length + matchedVisits.length + matchedVitals.length + matchedDocs.length;

    return {
      medications: matchedMeds,
      visits: matchedVisits,
      vitals: matchedVitals,
      documents: matchedDocs,
      totalCount,
    };
  }, [query, medications, vitals, visits, documents]);

  if (!isOpen) return null;

  function handleSelect(tabId) {
    onNavigate(tabId);
    onClose();
  }

  const QUICK_SUGGESTIONS = ["Blood Pressure", "Glucose", "Meds", "Prescription", "Visit"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:pt-16 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-slate-50/50">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search medications, vitals, doctors, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            >
              <X size={14} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-xs">
            ESC
          </span>
          <button onClick={onClose} className="sm:hidden p-1 text-gray-500">
            Cancel
          </button>
        </div>

        {/* Results / Empty View */}
        <div className="p-4 overflow-y-auto space-y-4">
          {!results ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Universal Medical Search</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Type any drug name, doctor, clinical reading, or test report
                </p>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {QUICK_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-medium text-gray-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.totalCount === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">
              No matching records found for <strong className="text-gray-900">"{query}"</strong>.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Medications Results */}
              {results.medications.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Pill size={13} className="text-emerald-600" />
                      Medications ({results.medications.length})
                    </span>
                    <button
                      onClick={() => handleSelect("medications")}
                      className="text-emerald-700 hover:underline capitalize"
                    >
                      View in Meds →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {results.medications.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelect("medications")}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{m.name}</p>
                          <p className="text-[11px] text-gray-500">{m.dosage} • {m.frequency}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visits Results */}
              {results.visits.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-blue-600" />
                      Doctor Visits & Appointments ({results.visits.length})
                    </span>
                    <button
                      onClick={() => handleSelect("visits")}
                      className="text-blue-700 hover:underline capitalize"
                    >
                      View in Visits →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {results.visits.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelect("visits")}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{v.doctor_name || "Doctor Visit"}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-sm">
                            {v.visit_date} {v.reason && `• ${v.reason}`}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals Results */}
              {results.vitals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} className="text-rose-600" />
                      Vitals Readings ({results.vitals.length})
                    </span>
                    <button
                      onClick={() => handleSelect("vitals")}
                      className="text-rose-700 hover:underline capitalize"
                    >
                      View in Vitals →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {results.vitals.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelect("vitals")}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/40 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{v.type}: {v.value}</p>
                          <p className="text-[11px] text-gray-500">{v.recorded_at}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Results */}
              {results.documents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Folder size={13} className="text-amber-600" />
                      Medical Documents ({results.documents.length})
                    </span>
                    <button
                      onClick={() => handleSelect("documents")}
                      className="text-amber-700 hover:underline capitalize"
                    >
                      View Docs →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {results.documents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelect("documents")}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 truncate max-w-sm">{d.file_name}</p>
                          <p className="text-[11px] text-gray-500">{d.category || "General Document"}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
