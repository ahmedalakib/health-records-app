"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  Pill,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Calendar,
  Check,
  Clock,
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
  Bell,
  BellOff,
  BellRing
} from "lucide-react";
import { checkDrugAllergy, getMedicationTips } from "./lib/drugSafety";

// Convert base64 url-safe string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Medications({ userId }) {
  const [medications, setMedications] = useState([]);
  const [userAllergies, setUserAllergies] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [reminderTimes, setReminderTimes] = useState([]);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState("");

  // Refill tracking stored in localStorage
  const [refills, setRefills] = useState({});
  const [editingRefillMedId, setEditingRefillMedId] = useState(null);
  const [pillsRemaining, setPillsRemaining] = useState("");
  const [pillsPerDay, setPillsPerDay] = useState("1");

  const refillStorageKey = `healthkeep_refills_${userId}`;

  useEffect(() => {
    loadMedications();
    loadRefills();
    loadProfileAllergies();
    checkPushSubscription();
  }, [userId]);

  // Check push support and current subscription status
  async function checkPushSubscription() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    setPushSupported(true);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      setPushSubscribed(!!existingSubscription);
    } catch (err) {
      console.warn("Service worker registration check error:", err);
    }
  }

  // Request push permission and subscribe
  async function togglePushSubscription() {
    if (!pushSupported) {
      alert("Push notifications are not supported on this browser.");
      return;
    }

    setPushLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (pushSubscribed) {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setPushSubscribed(false);
        }
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Notification permission was denied. Please allow notifications in your browser settings.");
          setPushLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          alert("VAPID public key not configured in environment.");
          setPushLoading(false);
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        // Save subscription in localStorage for this user
        if (typeof window !== "undefined") {
          localStorage.setItem(`healthkeep_push_sub_${userId}`, JSON.stringify(newSubscription));
        }

        setPushSubscribed(true);
      }
    } catch (err) {
      console.error("Failed to subscribe/unsubscribe to push:", err);
      alert("Error configuring notifications: " + (err.message || err));
    } finally {
      setPushLoading(false);
    }
  }

  // Send a test reminder notification
  async function sendTestPush() {
    setTestPushStatus("sending");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        alert("Please enable push notifications first!");
        setTestPushStatus("");
        return;
      }

      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          title: "💊 Medication Reminder Test",
          body: "Great! Your medication notifications are fully working on this device.",
          url: "/",
        }),
      });

      if (res.ok) {
        setTestPushStatus("sent");
        setTimeout(() => setTestPushStatus(""), 4000);
      } else {
        const data = await res.json();
        alert("Failed to send: " + (data.error || "Unknown error"));
        setTestPushStatus("");
      }
    } catch (err) {
      console.error(err);
      alert("Test failed: " + err.message);
      setTestPushStatus("");
    }
  }

  async function loadProfileAllergies() {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("allergies")
      .eq("user_id", userId)
      .single();
    if (data?.allergies) {
      setUserAllergies(data.allergies);
    }
  }

  function loadRefills() {
    if (typeof window === "undefined" || !userId) return;
    try {
      const saved = localStorage.getItem(refillStorageKey);
      if (saved) setRefills(JSON.parse(saved));
    } catch (e) {
      console.error("Error reading refills", e);
    }
  }

  function saveRefillData(medId, count, perDay) {
    const updated = {
      ...refills,
      [medId]: {
        pillsRemaining: parseInt(count, 10) || 0,
        pillsPerDay: parseFloat(perDay) || 1,
        updatedAt: new Date().toISOString(),
      },
    };
    setRefills(updated);
    try {
      localStorage.setItem(refillStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving refills", e);
    }
    setEditingRefillMedId(null);
  }

  async function loadMedications() {
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setMedications(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);

    const reminderTimesString = reminderTimes.length > 0 ? reminderTimes.sort().join(",") : null;

    await supabase.from("medications").insert({
      user_id: userId,
      name,
      dosage,
      frequency,
      reminder_times: reminderTimesString,
    });

    setName("");
    setDosage("");
    setFrequency("");
    setReminderTimes([]);
    setCustomTimeInput("");
    setSaving(false);
    setAdding(false);
    loadMedications();
  }

  function toggleReminderTime(timeStr) {
    if (reminderTimes.includes(timeStr)) {
      setReminderTimes(reminderTimes.filter((t) => t !== timeStr));
    } else {
      setReminderTimes([...reminderTimes, timeStr].sort());
    }
  }

  function addCustomTime() {
    if (!customTimeInput) return;
    if (!reminderTimes.includes(customTimeInput)) {
      setReminderTimes([...reminderTimes, customTimeInput].sort());
    }
    setCustomTimeInput("");
  }

  async function handleDelete(id) {
    if (!confirm("Remove this medication?")) return;
    await supabase.from("medications").delete().eq("id", id);
    loadMedications();
  }

  // Quick frequency chips
  const FREQ_PRESETS = ["1x daily", "2x daily", "Morning", "Bedtime", "With meals", "As needed"];

  // Real-time typed drug allergy check
  const typedAllergyWarning = checkDrugAllergy(name, userAllergies);

  return (
    <section className="mt-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-3xl p-5 border shadow-xs" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Pill size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              Active Medications
            </h2>
            <p className="text-[11px] text-gray-500">
              {medications.length} prescriptions on record {userAllergies && `• Allergy monitor active`}
            </p>
          </div>
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs font-bold flex items-center gap-1 px-3.5 py-2 rounded-xl text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={16} /> Add Medication
          </button>
        )}
      </div>

      {/* Push Notification Banner */}
      <div
        className="rounded-3xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: pushSubscribed ? "#F0FDF4" : "#F8FAFC",
          borderColor: pushSubscribed ? "#BBF7D0" : "var(--color-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: pushSubscribed ? "#DCFCE7" : "#EDF2F7",
              color: pushSubscribed ? "#16A34A" : "#64748B",
            }}
          >
            {pushSubscribed ? <BellRing size={20} /> : <Bell size={20} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              Medication Push Reminders
              {pushSubscribed && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 max-w-md">
              {pushSubscribed
                ? "Your browser is set up to receive alerts at your scheduled reminder times."
                : "Receive alerts directly on this device so you never miss a dose."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {pushSubscribed && (
            <button
              onClick={sendTestPush}
              disabled={testPushStatus === "sending"}
              className="text-xs font-semibold px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {testPushStatus === "sending"
                ? "Sending..."
                : testPushStatus === "sent"
                ? "✓ Alert Sent!"
                : "Send Test Alert"}
            </button>
          )}

          <button
            onClick={togglePushSubscription}
            disabled={pushLoading}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95 text-white"
            style={{
              backgroundColor: pushSubscribed ? "#EF4444" : "var(--color-primary)",
            }}
          >
            {pushLoading
              ? "Updating..."
              : pushSubscribed
              ? "Disable on this Device"
              : "Enable Reminders"}
          </button>
        </div>
      </div>

      {/* Add Medication Form */}
      {adding && (
        <form onSubmit={handleAdd} className="space-y-3.5 bg-white rounded-3xl p-5 border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              New Medication
            </h3>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Medication Name</label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin, Lisinopril, Metformin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          {/* Real-time Allergy Warning Banner */}
          {typedAllergyWarning && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
                <span>ALLERGY ALERT: {typedAllergyWarning.drugClass}</span>
              </div>
              <p className="text-red-700 leading-relaxed">{typedAllergyWarning.message}</p>
              <p className="text-[11px] font-bold text-red-900 bg-red-100/80 px-2 py-1 rounded-lg">
                ⚠️ Conflicts with your reported allergy: "{typedAllergyWarning.allergen}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 10mg, 500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Frequency / Instructions</label>
              <input
                type="text"
                placeholder="e.g. 2x daily"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>

          {/* Quick Frequency Chips */}
          <div>
            <span className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase">Common schedules:</span>
            <div className="flex flex-wrap gap-1.5">
              {FREQ_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFrequency(p)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg border hover:bg-slate-50 transition-colors"
                  style={{
                    borderColor: frequency === p ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: frequency === p ? "var(--color-primary-light)" : "white",
                    color: frequency === p ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Times Section */}
          <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 flex items-center gap-1">
              <Clock size={12} /> Scheduled Reminder Times
            </label>
            
            {/* Quick time presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: "Morning (08:00)", time: "08:00" },
                { label: "Noon (12:00)", time: "12:00" },
                { label: "Evening (18:00)", time: "18:00" },
                { label: "Night (21:00)", time: "21:00" },
              ].map((slot) => {
                const isSelected = reminderTimes.includes(slot.time);
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => toggleReminderTime(slot.time)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors flex items-center gap-1"
                    style={{
                      borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: isSelected ? "var(--color-primary-light)" : "white",
                      color: isSelected ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    {slot.label}
                  </button>
                );
              })}
            </div>

            {/* Custom time picker */}
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={customTimeInput}
                onChange={(e) => setCustomTimeInput(e.target.value)}
                className="border rounded-xl px-2.5 py-1 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
              <button
                type="button"
                onClick={addCustomTime}
                disabled={!customTimeInput}
                className="px-3 py-1 rounded-xl text-xs font-semibold border hover:bg-slate-50 transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                + Add Time
              </button>
            </div>

            {/* Selected times display */}
            {reminderTimes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {reminderTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary-dark)",
                    }}
                  >
                    ⏰ {t}
                    <button
                      type="button"
                      onClick={() => toggleReminderTime(t)}
                      className="hover:opacity-75 ml-0.5 text-xs font-black"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {saving ? "Saving..." : "Save Medication"}
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
      )}

      {/* Medication List with Allergy Monitor & Refill Info */}
      <div className="space-y-3.5">
        {loading && (
          <p className="text-xs p-4 text-center text-gray-400">
            Loading medications...
          </p>
        )}

        {!loading && medications.length === 0 && !adding && (
          <div className="text-center py-10 bg-white border border-dashed rounded-3xl" style={{ borderColor: "var(--color-border)" }}>
            <Pill size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-700 font-bold">No medications on record.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Add your current prescriptions or scan a prescription photo.
            </p>
          </div>
        )}

        {medications.map((med) => {
          const refillInfo = refills[med.id];
          let daysLeft = null;
          let isLowSupply = false;

          if (refillInfo && refillInfo.pillsRemaining != null && refillInfo.pillsPerDay > 0) {
            daysLeft = Math.floor(refillInfo.pillsRemaining / refillInfo.pillsPerDay);
            isLowSupply = daysLeft <= 5;
          }

          const isEditingRefill = editingRefillMedId === med.id;

          // Cross-reference against user allergies & get clinical tips
          const allergyCheck = checkDrugAllergy(med.name, userAllergies);
          const administrationTip = getMedicationTips(med.name);

          return (
            <div
              key={med.id}
              className="bg-white rounded-3xl p-5 border transition-all hover:shadow-sm"
              style={{
                borderColor: allergyCheck
                  ? "#FCA5A5"
                  : isLowSupply
                  ? "#FDBA74"
                  : "var(--color-border)",
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {med.name}
                    </h3>
                    {med.dosage && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-dark)" }}
                      >
                        {med.dosage}
                      </span>
                    )}

                    {/* Safety Badge */}
                    {allergyCheck ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <AlertTriangle size={11} className="text-red-600" /> Allergy Risk
                      </span>
                    ) : userAllergies ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck size={11} /> Allergy Safe
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400" />
                      <span>{med.frequency || "Schedule as directed"}</span>
                    </p>

                    {med.reminder_times && (
                      <div className="flex flex-wrap items-center gap-1">
                        {med.reminder_times.split(",").map((time) => (
                          <span
                            key={time}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            🔔 {time}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clinical Tip if applicable */}
                  {administrationTip && (
                    <div className="mt-2 text-[11px] text-blue-800 bg-blue-50/80 border border-blue-200 p-2 rounded-xl flex items-start gap-1.5">
                      <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{administrationTip}</span>
                    </div>
                  )}

                  {/* Allergy Warning if flagged */}
                  {allergyCheck && (
                    <div className="mt-2 text-[11px] text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <strong>⚠️ Clinical Warning:</strong> {allergyCheck.message} (Matches: {allergyCheck.allergen})
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(med.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove medication"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Refill / Pill Count Status Bar */}
              <div className="mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: "var(--color-border)" }}>
                {refillInfo && daysLeft != null ? (
                  <div className="flex items-center gap-2">
                    <Package size={13} className={isLowSupply ? "text-red-500" : "text-gray-500"} />
                    <span className="text-[11px] text-gray-600">
                      Supply: <strong className="text-gray-900">{refillInfo.pillsRemaining} pills</strong> ({daysLeft} days left)
                    </span>
                    {isLowSupply && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <AlertCircle size={10} /> Refill soon
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Package size={13} /> Supply tracking not set
                  </span>
                )}

                <button
                  onClick={() => {
                    if (isEditingRefill) {
                      setEditingRefillMedId(null);
                    } else {
                      setEditingRefillMedId(med.id);
                      setPillsRemaining(refillInfo?.pillsRemaining ?? "");
                      setPillsPerDay(refillInfo?.pillsPerDay ?? "1");
                    }
                  }}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isEditingRefill ? "Close" : refillInfo ? "Update supply" : "+ Track supply"}
                </button>
              </div>

              {/* Refill input sub-form */}
              {isEditingRefill && (
                <div className="mt-2.5 p-3 rounded-2xl border bg-slate-50/70" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-[11px] font-bold text-gray-700 mb-2">Configure Pill Inventory</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Pills remaining</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 30"
                        value={pillsRemaining}
                        onChange={(e) => setPillsRemaining(e.target.value)}
                        className="w-full bg-white border rounded-lg px-2 py-1 text-xs"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Doses per day</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="e.g. 1 or 2"
                        value={pillsPerDay}
                        onChange={(e) => setPillsPerDay(e.target.value)}
                        className="w-full bg-white border rounded-lg px-2 py-1 text-xs"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => saveRefillData(med.id, pillsRemaining, pillsPerDay)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      Save Supply
                    </button>
                    <button
                      onClick={() => setEditingRefillMedId(null)}
                      className="px-2.5 py-1 rounded-lg text-xs text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}