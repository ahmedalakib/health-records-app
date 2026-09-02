"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  Stethoscope,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  HelpCircle,
  CheckSquare,
  Square,
  ArrowRight,
  FileCheck
} from "lucide-react";

export default function Visits({ userId }) {
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past"

  // Past visits loaded from Supabase
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upcoming appointments stored in localStorage
  const [appointments, setAppointments] = useState([]);

  // Add forms
  const [addingUpcoming, setAddingUpcoming] = useState(false);
  const [addingPast, setAddingPast] = useState(false);

  // Form states for Upcoming Appointment
  const [docName, setDocName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptReason, setApptReason] = useState("");
  const [prepQuestions, setPrepQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  // Form states for Past Visit
  const [pastDoctorName, setPastDoctorName] = useState("");
  const [pastReason, setPastReason] = useState("");
  const [pastNotes, setPastNotes] = useState("");
  const [pastVisitDate, setPastVisitDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Completing appointment modal state
  const [completingAppt, setCompletingAppt] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const appointmentsStorageKey = `healthkeep_appointments_${userId}`;

  useEffect(() => {
    loadVisits();
    loadAppointments();
  }, [userId]);

  function loadAppointments() {
    if (!userId || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(appointmentsStorageKey);
      if (saved) {
        setAppointments(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading appointments", e);
    }
  }

  function saveAppointments(updated) {
    setAppointments(updated);
    try {
      localStorage.setItem(appointmentsStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving appointments", e);
    }
  }

  async function loadVisits() {
    const { data } = await supabase
      .from("visits")
      .select("*")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false });

    setVisits(data || []);
    setLoading(false);
  }

  // Handle adding an upcoming appointment
  function handleAddUpcoming(e) {
    e.preventDefault();
    if (!docName.trim() || !apptDate) return;

    const newAppt = {
      id: `appt_${Date.now()}`,
      doctor_name: docName.trim(),
      specialty: specialty.trim(),
      clinic: clinic.trim(),
      date: apptDate,
      time: apptTime || "Morning",
      reason: apptReason.trim(),
      questions: prepQuestions.map((q) => ({ id: `q_${Date.now()}_${Math.random()}`, text: q, checked: false })),
      created_at: new Date().toISOString(),
    };

    const updated = [...appointments, newAppt].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    saveAppointments(updated);

    // Reset form
    setDocName("");
    setSpecialty("");
    setClinic("");
    setApptDate("");
    setApptTime("");
    setApptReason("");
    setPrepQuestions([]);
    setAddingUpcoming(false);
  }

  function handleAddQuestion() {
    if (!newQuestion.trim()) return;
    setPrepQuestions([...prepQuestions, newQuestion.trim()]);
    setNewQuestion("");
  }

  function toggleApptQuestion(apptId, questionId) {
    const updated = appointments.map((appt) => {
      if (appt.id !== apptId) return appt;
      return {
        ...appt,
        questions: appt.questions.map((q) => (q.id === questionId ? { ...q, checked: !q.checked } : q)),
      };
    });
    saveAppointments(updated);
  }

  function addQuestionToExistingAppt(apptId, text) {
    if (!text.trim()) return;
    const updated = appointments.map((appt) => {
      if (appt.id !== apptId) return appt;
      return {
        ...appt,
        questions: [...(appt.questions || []), { id: `q_${Date.now()}`, text: text.trim(), checked: false }],
      };
    });
    saveAppointments(updated);
  }

  function handleDeleteUpcoming(id) {
    if (!confirm("Cancel and delete this scheduled appointment?")) return;
    const updated = appointments.filter((a) => a.id !== id);
    saveAppointments(updated);
  }

  // Completing appointment -> saves to Supabase past visits
  async function handleConfirmComplete(e) {
    e.preventDefault();
    if (!completingAppt) return;
    setSaving(true);

    await supabase.from("visits").insert({
      user_id: userId,
      doctor_name: completingAppt.doctor_name,
      reason: completingAppt.reason || "Consultation",
      notes: completionNotes || (completingAppt.clinic ? `Clinic: ${completingAppt.clinic}` : ""),
      visit_date: completingAppt.date,
    });

    // Remove from upcoming
    const updated = appointments.filter((a) => a.id !== completingAppt.id);
    saveAppointments(updated);

    setCompletingAppt(null);
    setCompletionNotes("");
    setSaving(false);
    loadVisits();
    setActiveTab("past");
  }

  // Handle manual past visit add
  async function handleAddPast(e) {
    e.preventDefault();
    setSaving(true);

    await supabase.from("visits").insert({
      user_id: userId,
      doctor_name: pastDoctorName,
      reason: pastReason,
      notes: pastNotes,
      visit_date: pastVisitDate || new Date().toISOString().split("T")[0],
    });

    setPastDoctorName("");
    setPastReason("");
    setPastNotes("");
    setPastVisitDate("");
    setSaving(false);
    setAddingPast(false);
    loadVisits();
  }

  async function handleDeletePast(id) {
    if (!confirm("Delete this past visit record?")) return;
    await supabase.from("visits").delete().eq("id", id);
    loadVisits();
  }

  function formatApptCountdown(dateStr, timeStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Today ${timeStr ? "at " + timeStr : ""}`;
    if (diffDays === 1) return `Tomorrow ${timeStr ? "at " + timeStr : ""}`;
    if (diffDays < 0) return `Completed / Due for review`;
    return `In ${diffDays} days (${dateStr})`;
  }

  return (
    <section className="mt-6 space-y-5">
      {/* Header & Tabs */}
      <div className="bg-white rounded-3xl p-5 border shadow-xs" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: "var(--color-primary-light)" }}
            >
              <Stethoscope size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
                Doctor Visits & Appointments
              </h2>
              <p className="text-[11px] text-gray-500">
                {appointments.length} upcoming • {visits.length} past records
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeTab === "upcoming") setAddingUpcoming(true);
              else setAddingPast(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={15} />
            <span>{activeTab === "upcoming" ? "Book Appointment" : "Log Past Visit"}</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl p-1 bg-slate-100 border border-gray-200">
          <button
            onClick={() => setActiveTab("upcoming")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: activeTab === "upcoming" ? "white" : "transparent",
              color: activeTab === "upcoming" ? "var(--color-primary-dark)" : "var(--color-text-muted)",
              boxShadow: activeTab === "upcoming" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            🗓️ Upcoming Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: activeTab === "past" ? "white" : "transparent",
              color: activeTab === "past" ? "var(--color-primary-dark)" : "var(--color-text-muted)",
              boxShadow: activeTab === "past" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            📁 Past Consultations ({visits.length})
          </button>
        </div>
      </div>

      {/* 1. UPCOMING APPOINTMENTS TAB */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {/* Add Upcoming Appointment Form */}
          {addingUpcoming && (
            <form onSubmit={handleAddUpcoming} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3.5" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Schedule Upcoming Consultation</h3>
                <button type="button" onClick={() => setAddingUpcoming(false)} className="text-xs text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiologist, Dermatologist"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    required
                    className="w-full border rounded-xl px-2.5 py-2 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full border rounded-xl px-2.5 py-2 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Clinic / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. City Hospital, 3rd Fl"
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    className="w-full border rounded-xl px-2.5 py-2 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Chief Complaint / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Annual wellness checkup, BP follow-up"
                  value={apptReason}
                  onChange={(e) => setApptReason(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              {/* Doctor Prep Checklist builder */}
              <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                <label className="text-[11px] font-bold text-gray-700 block mb-1.5">
                  📝 Questions to ask the doctor (Prep Checklist)
                </label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Can we lower my medication dosage?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
                    className="flex-1 border rounded-xl px-3 py-1.5 text-xs bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-gray-700"
                  >
                    + Add
                  </button>
                </div>

                {prepQuestions.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                    {prepQuestions.map((q, i) => (
                      <div key={i} className="text-xs text-gray-700 flex items-center justify-between">
                        <span>• {q}</span>
                        <button
                          type="button"
                          onClick={() => setPrepQuestions(prepQuestions.filter((_, idx) => idx !== i))}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Save Scheduled Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setAddingUpcoming(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium border text-gray-500"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Appointments List */}
          {appointments.length === 0 && !addingUpcoming && (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed p-6" style={{ borderColor: "var(--color-border)" }}>
              <Calendar size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No upcoming appointments scheduled.</p>
              <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
                Prepare questions in advance so you never forget anything during consultation.
              </p>
              <button
                onClick={() => setAddingUpcoming(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                + Schedule Appointment
              </button>
            </div>
          )}

          <div className="space-y-3.5">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-3xl p-5 border shadow-xs space-y-3.5 transition-all hover:shadow-sm"
                style={{ borderColor: "var(--color-border)" }}
              >
                {/* Appointment Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
                      {formatApptCountdown(appt.date, appt.time)}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{appt.doctor_name}</h3>
                    {appt.specialty && (
                      <p className="text-xs font-semibold text-emerald-800">{appt.specialty}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteUpcoming(appt.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Cancel appointment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Details Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-gray-200">
                    <Calendar size={13} className="text-gray-400" />
                    <strong>{appt.date}</strong>
                  </span>
                  {appt.time && (
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-gray-200">
                      <Clock size={13} className="text-gray-400" />
                      <span>{appt.time}</span>
                    </span>
                  )}
                  {appt.clinic && (
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-gray-200">
                      <MapPin size={13} className="text-gray-400" />
                      <span>{appt.clinic}</span>
                    </span>
                  )}
                </div>

                {appt.reason && (
                  <p className="text-xs text-gray-700 bg-slate-50/70 p-2.5 rounded-xl border border-gray-100">
                    <strong>Reason:</strong> {appt.reason}
                  </p>
                )}

                {/* Interactive Doctor Prep Checklist */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <HelpCircle size={13} className="text-blue-500" />
                      Questions for the Doctor ({appt.questions?.filter((q) => q.checked).length || 0}/{appt.questions?.length || 0})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(appt.questions || []).map((q) => (
                      <div
                        key={q.id}
                        onClick={() => toggleApptQuestion(appt.id, q.id)}
                        className="flex items-center gap-2 text-xs cursor-pointer select-none p-1.5 rounded-lg hover:bg-slate-50"
                      >
                        {q.checked ? (
                          <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-gray-300 shrink-0" />
                        )}
                        <span className={q.checked ? "line-through text-gray-400" : "text-gray-800"}>
                          {q.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add question inline */}
                  <div className="flex gap-1.5 mt-2">
                    <input
                      type="text"
                      placeholder="+ Add a question to ask..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          addQuestionToExistingAppt(appt.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 border border-dashed rounded-lg bg-slate-50/50 outline-none"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                </div>

                {/* Mark as completed action */}
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      setCompletingAppt(appt);
                      setCompletionNotes("");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Complete & Save Notes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PAST CONSULTATIONS TAB */}
      {activeTab === "past" && (
        <div className="space-y-4">
          {/* Add Past Visit Form */}
          {addingPast && (
            <form onSubmit={handleAddPast} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Log Past Consultation</h3>
                <button type="button" onClick={() => setAddingPast(false)} className="text-xs text-gray-400">
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Doctor's name"
                value={pastDoctorName}
                onChange={(e) => setPastDoctorName(e.target.value)}
                required
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Reason (e.g. Checkup, Flu)"
                  value={pastReason}
                  onChange={(e) => setPastReason(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <input
                  type="date"
                  value={pastVisitDate}
                  onChange={(e) => setPastVisitDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              <textarea
                placeholder="Doctor's advice, diagnosis & notes..."
                value={pastNotes}
                onChange={(e) => setPastNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-xl px-3 py-2 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {saving ? "Saving..." : "Save Past Visit"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingPast(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border text-gray-500"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Past Visits List */}
          {visits.length === 0 && !addingPast && (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed p-6" style={{ borderColor: "var(--color-border)" }}>
              <FileCheck size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No past doctor visits recorded.</p>
              <button
                onClick={() => setAddingPast(true)}
                className="mt-2 text-xs font-bold underline"
                style={{ color: "var(--color-primary)" }}
              >
                + Log a consultation
              </button>
            </div>
          )}

          <div className="space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl p-4 border flex justify-between items-start transition-all hover:shadow-xs"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{v.doctor_name}</h3>
                    <span className="text-[11px] text-gray-400">• {v.visit_date}</span>
                  </div>
                  {v.reason && (
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">Reason: {v.reason}</p>
                  )}
                  {v.notes && (
                    <p className="text-xs text-gray-600 mt-1 bg-slate-50 p-2 rounded-xl border border-gray-100">
                      {v.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeletePast(v.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal to complete appointment and add notes */}
      {completingAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">
              Complete Visit: {completingAppt.doctor_name}
            </h3>
            <p className="text-xs text-gray-500">
              Record the doctor's diagnosis, recommended advice, or test prescriptions to move this visit into your permanent history.
            </p>

            <textarea
              rows={3}
              placeholder="Doctor's instructions, treatment plan, next follow-up..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full border rounded-xl p-3 text-xs bg-slate-50 outline-none"
              style={{ borderColor: "var(--color-border)" }}
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmComplete}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "Saving to History..." : "Save to Visit History"}
              </button>
              <button
                onClick={() => setCompletingAppt(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}