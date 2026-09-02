"use client";

import { ShieldAlert, Phone, X, Heart, AlertTriangle, Pill, Activity } from "lucide-react";

export default function EmergencyModal({ isOpen, onClose, patient, medications = [], vitals = [] }) {
  if (!isOpen) return null;

  const emergencyContacts = patient?.emergencyContacts || (
    patient?.emergencyPhone ? [{ name: patient.emergencyName || "Emergency Contact", phone: patient.emergencyPhone, relation: patient.emergencyRelation || "Contact" }] : []
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Urgent Emergency Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert size={24} color="white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide uppercase">Emergency Medical ID</h2>
              <p className="text-xs text-red-100">Critical info for first responders & ER doctors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={18} color="white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Identity & Blood Type */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{patient?.name || "Anonymous Patient"}</h3>
              {patient?.dob && (
                <p className="text-xs text-gray-500">DOB: {patient.dob} {patient.gender && `• ${patient.gender}`}</p>
              )}
            </div>
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-3.5 py-1.5 text-center shadow-xs">
              <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider block">Blood Type</span>
              <span className="text-xl font-black text-red-700">{patient?.blood_type || "Unknown"}</span>
            </div>
          </div>

          {/* 1-Tap Emergency Calling */}
          {emergencyContacts.length > 0 ? (
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-3.5 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                <Phone size={13} className="text-red-600" />
                Emergency Contacts (Tap to Call)
              </p>
              <div className="space-y-1.5">
                {emergencyContacts.map((c, i) => (
                  <a
                    key={i}
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-between bg-white border border-red-300 rounded-xl p-2.5 hover:bg-red-50 transition-colors shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.name}</p>
                      <p className="text-[11px] text-gray-500">{c.relation} • {c.phone}</p>
                    </div>
                    <div className="bg-red-600 text-white p-2 rounded-lg flex items-center justify-center shadow-xs">
                      <Phone size={15} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              No emergency contacts added yet. Tap "Edit Medical ID" in the profile to add one.
            </div>
          )}

          {/* Severe Allergies */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide mb-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Allergies & Drug Reactions</span>
            </div>
            {patient?.allergies ? (
              <p className="text-sm font-semibold text-red-700 bg-white border border-amber-300 rounded-lg p-2">
                ⚠️ {patient.allergies}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">No known drug allergies reported</p>
            )}
          </div>

          {/* Chronic Conditions & Notes */}
          {patient?.conditions && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs uppercase tracking-wide mb-1">
                <Heart size={14} className="text-rose-500" />
                <span>Medical Conditions</span>
              </div>
              <p className="text-xs text-gray-700">{patient.conditions}</p>
            </div>
          )}

          {/* Active Medications */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-gray-900 font-bold text-xs uppercase tracking-wide">
                <Pill size={14} className="text-indigo-600" />
                Active Medications ({medications.length})
              </span>
            </div>
            {medications.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {medications.map((m) => (
                  <div key={m.id} className="bg-white border rounded-lg px-2.5 py-1.5 text-xs flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{m.name}</span>
                    <span className="text-[11px] text-gray-500">{m.dosage || ""} {m.frequency ? `• ${m.frequency}` : ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No active medications registered</p>
            )}
          </div>

          {/* Organ Donor Status */}
          {patient?.organDonor && (
            <div className="flex items-center gap-2 text-xs text-gray-600 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Registered Organ Donor</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            Close Emergency Screen
          </button>
        </div>
      </div>
    </div>
  );
}
