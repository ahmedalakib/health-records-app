"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  ShieldAlert,
  Printer,
  UserPlus,
  Users,
  Camera,
  Edit3,
  LogOut,
  Palette,
  Phone,
  Droplet,
  AlertTriangle,
  Heart,
  User,
  ChevronRight,
  Check,
  X,
  FileText
} from "lucide-react";
import EmergencyModal from "./components/EmergencyModal";
import DoctorSummaryPrint from "./components/DoctorSummaryPrint";

const THEMES = [
  { id: "teal", label: "Teal", color: "#0F6E56" },
  { id: "blue", label: "Blue", color: "#185FA5" },
  { id: "coral", label: "Coral", color: "#993C1D" },
  { id: "purple", label: "Purple", color: "#534AB7" },
];

export default function Profile({
  userId,
  initialName,
  initialBloodType,
  initialAllergies,
  initialAvatarUrl,
  onLogout,
  onProfileUpdate,
}) {
  const [editing, setEditing] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDoctorSummary, setShowDoctorSummary] = useState(false);

  // Core profile fields
  const [name, setName] = useState(initialName || "");
  const [bloodType, setBloodType] = useState(initialBloodType || "");
  const [allergies, setAllergies] = useState(initialAllergies || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");

  // Extended Emergency Medical ID fields (saved in localStorage synced with user)
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Spouse");
  const [conditions, setConditions] = useState("");
  const [dob, setDob] = useState("");
  const [organDonor, setOrganDonor] = useState(false);

  // Family Members Management
  const [familyMembers, setFamilyMembers] = useState([]);
  const [activeMemberId, setActiveMemberId] = useState("self");
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("Child");
  const [newMemberBlood, setNewMemberBlood] = useState("");
  const [newMemberAllergies, setNewMemberAllergies] = useState("");

  // Clinical data for Doctor Summary
  const [medications, setMedications] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [visits, setVisits] = useState([]);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(
    typeof window !== "undefined" ? localStorage.getItem("app-theme") || "teal" : "teal"
  );

  const emergencyStorageKey = `healthkeep_emergency_${userId}`;
  const familyStorageKey = `healthkeep_family_${userId}`;

  // Load extra emergency info & family members
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    try {
      const savedEmerg = localStorage.getItem(emergencyStorageKey);
      if (savedEmerg) {
        const parsed = JSON.parse(savedEmerg);
        setEmergencyName(parsed.emergencyName || "");
        setEmergencyPhone(parsed.emergencyPhone || "");
        setEmergencyRelation(parsed.emergencyRelation || "Contact");
        setConditions(parsed.conditions || "");
        setDob(parsed.dob || "");
        setOrganDonor(Boolean(parsed.organDonor));
      }

      const savedFamily = localStorage.getItem(familyStorageKey);
      if (savedFamily) {
        setFamilyMembers(JSON.parse(savedFamily));
      }
    } catch (e) {
      console.error("Error reading extended profile data", e);
    }

    loadClinicalRecords();
  }, [userId]);

  async function loadClinicalRecords() {
    if (!userId) return;
    const [medsRes, vitalsRes, visitsRes] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", userId),
      supabase.from("vitals").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }),
      supabase.from("visits").select("*").eq("user_id", userId).order("visit_date", { ascending: false }),
    ]);

    setMedications(medsRes.data || []);
    setVitals(vitalsRes.data || []);
    setVisits(visitsRes.data || []);
  }

  // Active person being viewed (either Self or a Family Member)
  const activeMember =
    activeMemberId === "self"
      ? {
          name,
          blood_type: bloodType,
          allergies,
          emergencyName,
          emergencyPhone,
          emergencyRelation,
          conditions,
          dob,
          organDonor,
          avatar_url: avatarUrl,
        }
      : familyMembers.find((m) => m.id === activeMemberId) || {
          name,
          blood_type: bloodType,
          allergies,
        };

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);

    if (activeMemberId === "self") {
      // Save primary user to Supabase
      await supabase
        .from("profiles")
        .update({ name, blood_type: bloodType, allergies })
        .eq("user_id", userId);

      // Save extended emergency fields to localStorage
      const emergData = {
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        conditions,
        dob,
        organDonor,
      };
      localStorage.setItem(emergencyStorageKey, JSON.stringify(emergData));
      if (onProfileUpdate) onProfileUpdate();
    } else {
      // Update family member
      const updated = familyMembers.map((m) =>
        m.id === activeMemberId
          ? {
              ...m,
              name,
              blood_type: bloodType,
              allergies,
              emergencyName,
              emergencyPhone,
              conditions,
            }
          : m
      );
      setFamilyMembers(updated);
      localStorage.setItem(familyStorageKey, JSON.stringify(updated));
    }

    setSaving(false);
    setEditing(false);
  }

  function handleAddFamilyMember(e) {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember = {
      id: `fam_${Date.now()}`,
      name: newMemberName.trim(),
      relation: newMemberRelation,
      blood_type: newMemberBlood.trim(),
      allergies: newMemberAllergies.trim(),
      emergencyName: name,
      emergencyPhone: emergencyPhone || "",
    };

    const updated = [...familyMembers, newMember];
    setFamilyMembers(updated);
    localStorage.setItem(familyStorageKey, JSON.stringify(updated));

    setNewMemberName("");
    setNewMemberBlood("");
    setNewMemberAllergies("");
    setAddingMember(false);
    setActiveMemberId(newMember.id);
  }

  function handleSelectMember(id) {
    setActiveMemberId(id);
    if (id === "self") {
      setName(initialName || "");
      setBloodType(initialBloodType || "");
      setAllergies(initialAllergies || "");
    } else {
      const mem = familyMembers.find((m) => m.id === id);
      if (mem) {
        setName(mem.name || "");
        setBloodType(mem.blood_type || "");
        setAllergies(mem.allergies || "");
        setConditions(mem.conditions || "");
      }
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploadingPhoto(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
    setAvatarUrl(publicUrl);
    setUploadingPhoto(false);
    if (onProfileUpdate) onProfileUpdate();
  }

  function handleThemeChange(themeId) {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("app-theme", themeId);
    supabase.from("profiles").update({ theme: themeId }).eq("user_id", userId);
  }

  return (
    <div className="space-y-4">
      {/* 1. Family Profile Switcher Bar */}
      <div className="bg-white rounded-2xl p-3 border" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-text)" }}>
            <Users size={14} color="var(--color-primary)" />
            <span>Family Profiles</span>
          </div>
          <button
            onClick={() => setAddingMember(true)}
            className="text-[11px] font-semibold flex items-center gap-1 hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            <UserPlus size={12} /> + Add Member
          </button>
        </div>

        {/* Member selection chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleSelectMember("self")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: activeMemberId === "self" ? "var(--color-primary)" : "var(--color-bg)",
              color: activeMemberId === "self" ? "white" : "var(--color-text)",
              border: activeMemberId === "self" ? "none" : "1px solid var(--color-border)",
            }}
          >
            <User size={13} />
            <span>{initialName ? `${initialName.split(" ")[0]} (Self)` : "Self"}</span>
          </button>

          {familyMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectMember(m.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeMemberId === m.id ? "var(--color-primary)" : "var(--color-bg)",
                color: activeMemberId === m.id ? "white" : "var(--color-text)",
                border: activeMemberId === m.id ? "none" : "1px solid var(--color-border)",
              }}
            >
              <span>{m.name}</span>
              <span className="text-[10px] opacity-75">({m.relation})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Family Member Modal */}
      {addingMember && (
        <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Add Family Member</h4>
            <button onClick={() => setAddingMember(false)} className="text-xs text-gray-400">
              Cancel
            </button>
          </div>
          <form onSubmit={handleAddFamilyMember} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
                className="w-full border rounded-xl px-2.5 py-1.5 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
              <select
                value={newMemberRelation}
                onChange={(e) => setNewMemberRelation(e.target.value)}
                className="w-full border rounded-xl px-2.5 py-1.5 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="Child">Child</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Blood Type (e.g. A+)"
                value={newMemberBlood}
                onChange={(e) => setNewMemberBlood(e.target.value)}
                className="w-full border rounded-xl px-2.5 py-1.5 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
              <input
                type="text"
                placeholder="Allergies (if any)"
                value={newMemberAllergies}
                onChange={(e) => setNewMemberAllergies(e.target.value)}
                className="w-full border rounded-xl px-2.5 py-1.5 text-xs bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Add Family Member
              </button>
              <button
                type="button"
                onClick={() => setAddingMember(false)}
                className="px-3 py-2 text-xs font-medium text-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Emergency Medical ID Card (Featured Component) */}
      <section className="bg-white rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "#FCA5A5" }}>
        {/* Red Medical ID Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldAlert size={18} color="white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-red-100 block leading-none">
                Emergency ICE Card
              </span>
              <h3 className="text-sm font-bold tracking-tight mt-0.5">
                Medical ID: {activeMember.name || "Patient"}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-2.5 py-1.5 bg-white text-red-700 rounded-xl text-[11px] font-bold shadow-xs hover:bg-red-50 transition-colors shrink-0"
          >
            Paramedic View
          </button>
        </div>

        {/* Quick Medical Snapshot Body */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {/* Blood Type */}
            <div className="rounded-xl p-2.5 bg-red-50/70 border border-red-200">
              <div className="flex items-center gap-1 text-red-800 text-[10px] font-bold uppercase">
                <Droplet size={12} className="text-red-600" />
                <span>Blood Type</span>
              </div>
              <p className="text-lg font-black text-red-700 mt-0.5">
                {activeMember.blood_type || "Unknown"}
              </p>
            </div>

            {/* Allergies */}
            <div className="rounded-xl p-2.5 bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-1 text-amber-800 text-[10px] font-bold uppercase">
                <AlertTriangle size={12} className="text-amber-600" />
                <span>Allergies</span>
              </div>
              <p className="text-xs font-bold text-red-700 mt-1 truncate">
                {activeMember.allergies || "No known allergies"}
              </p>
            </div>
          </div>

          {/* Emergency Contact Bar with 1-Tap Call */}
          {activeMember.emergencyPhone ? (
            <div className="bg-slate-50 border rounded-xl p-2.5 flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">In Case of Emergency</span>
                <p className="text-xs font-bold text-gray-900">
                  {activeMember.emergencyName || "Contact"} ({activeMember.emergencyRelation || "ICE"})
                </p>
              </div>
              <a
                href={`tel:${activeMember.emergencyPhone}`}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Phone size={13} /> Call
              </a>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed rounded-xl p-2.5 text-center" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-[11px] text-gray-500">No emergency phone listed.</p>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-semibold text-red-600 underline mt-0.5"
              >
                + Add Emergency Contact
              </button>
            </div>
          )}

          {/* Chronic Conditions & Active Meds preview */}
          {activeMember.conditions && (
            <div className="text-xs text-gray-700 bg-slate-50 rounded-xl p-2.5 border" style={{ borderColor: "var(--color-border)" }}>
              <span className="text-[10px] font-bold uppercase text-gray-500 block mb-0.5">Medical Conditions</span>
              <p className="text-xs">{activeMember.conditions}</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Doctor Appointment Summary & PDF Export Action */}
      <section
        onClick={() => setShowDoctorSummary(true)}
        className="bg-white rounded-2xl p-4 border cursor-pointer hover:shadow-xs transition-all flex items-center justify-between"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--color-primary-light)" }}
          >
            <Printer size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Export Doctor Appointment Summary</h4>
            <p className="text-[11px] text-gray-500">
              Printable PDF report of your meds, vitals & visit history
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          View & Print
        </div>
      </section>

      {/* 4. Edit Medical ID / Personal Info Form */}
      {editing ? (
        <section className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Edit Medical ID & Details
            </h3>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-400">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Blood Type</label>
                <input
                  type="text"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  placeholder="e.g. O+, A-, B+"
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">Known Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Peanuts, Sulfa"
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">Chronic Conditions / Health Notes</label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Asthma, Hypertension, Diabetes Type 2, Pacemaker"
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>

            {/* Emergency Contact Sub-section */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2">Emergency Contact</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="col-span-1 border rounded-xl px-2.5 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="col-span-1 border rounded-xl px-2.5 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="col-span-1 border rounded-xl px-2.5 py-2 text-xs bg-white"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "Saving..." : "Save Medical ID"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 rounded-xl py-2.5 text-xs font-medium border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        /* 5. User Profile Header with Avatar & Actions */
        <section className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
          <div className="h-14" style={{ backgroundColor: "var(--color-primary)" }} />
          <div className="px-5 pb-4 -mt-7 flex justify-between items-end">
            <div className="relative w-16 h-16">
              <div
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "var(--color-primary-light)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold" style={{ color: "var(--color-primary-dark)" }}>
                    {name ? name[0].toUpperCase() : "?"}
                  </span>
                )}
              </div>
              <label
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Camera size={10} color="white" />
                <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
              </label>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border hover:bg-slate-50 transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
            >
              <Edit3 size={13} /> Edit ID
            </button>
          </div>

          <div className="px-5 pb-3">
            <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              {uploadingPhoto ? "Uploading photo..." : name}
            </h3>
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              Primary Account Holder
            </p>
          </div>
        </section>
      )}

      {/* 6. App Settings, Theme Picker & Logout */}
      <section className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {/* Theme Picker */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <Palette size={18} color="var(--color-primary)" />
          <span className="text-xs font-semibold flex-1" style={{ color: "var(--color-text)" }}>App Theme</span>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                aria-label={t.label}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: t.color,
                  border: currentTheme === t.id ? `2px solid ${t.color}` : "2px solid transparent",
                  boxShadow: currentTheme === t.id ? `0 0 0 2px white, 0 0 0 3px ${t.color}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50/50 transition-colors">
          <LogOut size={18} color="#D85A30" />
          <span className="text-xs font-semibold flex-1 text-left" style={{ color: "#D85A30" }}>
            Log out
          </span>
        </button>
      </section>

      {/* Paramedic Fullscreen Emergency Modal */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        patient={activeMember}
        medications={medications}
        vitals={vitals}
      />

      {/* Doctor Printable Summary Modal */}
      <DoctorSummaryPrint
        isOpen={showDoctorSummary}
        onClose={() => setShowDoctorSummary(false)}
        patient={activeMember}
        medications={medications}
        vitals={vitals}
        visits={visits}
      />
    </div>
  );
}