"use client";

import { Printer, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function DoctorSummaryPrint({
  isOpen,
  onClose,
  patient,
  medications = [],
  vitals = [],
  visits = [],
}) {
  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex flex-col items-center justify-center p-2 sm:p-6 overflow-y-auto">
      {/* Container */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold">Doctor Appointment Health Summary</h3>
              <p className="text-[11px] text-gray-300">Ready for clinical review and PDF export</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-doctor-summary" className="p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6 text-gray-800 bg-white">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">HEALTHKEEP</h1>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
                Comprehensive Patient Medical Summary
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p className="font-semibold text-gray-800">Generated: {currentDate}</p>
              <p>Confidential Medical Record</p>
            </div>
          </div>

          {/* Patient Demographics Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Patient Full Name</span>
              <strong className="text-sm text-gray-900">{patient?.name || "Not provided"}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Blood Type</span>
              <strong className="text-sm text-red-600">{patient?.blood_type || "Unknown"}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Known Allergies</span>
              <strong className={`text-sm ${patient?.allergies ? "text-red-600 font-bold" : "text-gray-700"}`}>
                {patient?.allergies || "None reported"}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Emergency Contact</span>
              <strong className="text-xs text-gray-800">
                {patient?.emergencyName ? `${patient.emergencyName} (${patient.emergencyPhone || ""})` : "Not listed"}
              </strong>
            </div>
          </div>

          {/* Chronic Conditions */}
          {patient?.conditions && (
            <div className="border-l-4 border-amber-500 bg-amber-50/50 p-3 rounded-r-xl text-xs">
              <span className="font-bold text-amber-900 uppercase tracking-wide text-[10px] block mb-0.5">
                Documented Chronic Conditions / Notes
              </span>
              <p className="text-gray-800">{patient.conditions}</p>
            </div>
          )}

          {/* Section 1: Current Active Medications */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-1.5 mb-2.5 flex items-center justify-between">
              <span>Current Medications ({medications.length})</span>
              <span className="text-[10px] font-normal text-gray-500">Active Regimen</span>
            </h2>

            {medications.length > 0 ? (
              <table className="w-full text-xs text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-gray-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5 border-b">Medication</th>
                    <th className="p-2.5 border-b">Dosage</th>
                    <th className="p-2.5 border-b">Frequency / Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medications.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="p-2.5 font-bold text-gray-900">{m.name}</td>
                      <td className="p-2.5 text-gray-700">{m.dosage || "—"}</td>
                      <td className="p-2.5 text-gray-700">{m.frequency || "As directed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 italic p-2">No active medications registered.</p>
            )}
          </div>

          {/* Section 2: Recent Vital Signs */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-1.5 mb-2.5 flex items-center justify-between">
              <span>Recent Vitals History</span>
              <span className="text-[10px] font-normal text-gray-500">Latest Measurements</span>
            </h2>

            {vitals.length > 0 ? (
              <table className="w-full text-xs text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-gray-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5 border-b">Measurement</th>
                    <th className="p-2.5 border-b">Recorded Value</th>
                    <th className="p-2.5 border-b">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vitals.slice(0, 8).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/40">
                      <td className="p-2.5 font-semibold text-gray-800">{v.type}</td>
                      <td className="p-2.5 font-bold text-gray-900">{v.value}</td>
                      <td className="p-2.5 text-gray-600">{v.recorded_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 italic p-2">No vital records logged.</p>
            )}
          </div>

          {/* Section 3: Past Doctor Visits */}
          {visits.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-1.5 mb-2.5">
                Past Doctor Consultations ({visits.length})
              </h2>
              <div className="space-y-2">
                {visits.slice(0, 5).map((v) => (
                  <div key={v.id} className="border border-gray-200 rounded-lg p-2.5 text-xs bg-slate-50/30">
                    <div className="flex justify-between items-start">
                      <strong className="text-gray-900">{v.doctor_name || "Doctor Consultation"}</strong>
                      <span className="text-gray-500 text-[11px]">{v.visit_date}</span>
                    </div>
                    {v.reason && <p className="text-gray-700 mt-1">Reason: {v.reason}</p>}
                    {v.notes && <p className="text-gray-600 text-[11px] mt-0.5">Notes: {v.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinician Signature / Notes footer */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs text-gray-500">
            <div>
              <p className="border-b border-gray-400 pb-8"></p>
              <p className="mt-1 font-semibold">Physician Signature & Date</p>
            </div>
            <div>
              <p className="border-b border-gray-400 pb-8"></p>
              <p className="mt-1 font-semibold">Attending Clinic / Facility Notes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
