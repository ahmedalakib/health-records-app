"use client";

import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { ScanText, X, Check, Plus } from "lucide-react";

export default function PrescriptionUpload({ userId, onSaved }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError("");
    setImageFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    setAnalyzing(true);

    let mergedDoctorName = null;
    let mergedSpecialty = null;
    let mergedDate = null;
    let mergedMedications = [];
    let hadError = false;

    for (let i = 0; i < files.length; i++) {
      setProgress(files.length > 1 ? `Reading page ${i + 1} of ${files.length}...` : "Reading prescription...");

      try {
        const base64 = await fileToBase64(files[i]);
        const res = await fetch("/api/extract-prescription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: files[i].type }),
        });
        const result = await res.json();

        if (result.success) {
          if (!mergedDoctorName && result.data.doctorName) mergedDoctorName = result.data.doctorName;
          if (!mergedSpecialty && result.data.specialty) mergedSpecialty = result.data.specialty;
          if (!mergedDate && result.data.date) mergedDate = result.data.date;
          mergedMedications = [...mergedMedications, ...(result.data.medications || [])];
        } else {
          hadError = true;
        }
      } catch (err) {
        hadError = true;
      }
    }

    if (hadError && mergedMedications.length === 0) {
      setError("Couldn't read the prescription. You can still upload it and fill in details manually.");
    }

    setExtracted({
      doctorName: mergedDoctorName || "",
      specialty: mergedSpecialty || "",
      date: mergedDate || "",
      medications: mergedMedications.map((m) => ({ ...m, selected: true })),
    });

    setAnalyzing(false);
    setProgress("");
  }

  function handleAddMorePages(e) {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    handleFileSelect({ target: { files: [...imageFiles, ...newFiles] } });
  }

  async function handleConfirmSave() {
    setSaving(true);

    const folderName = extracted.doctorName
      ? `Dr. ${extracted.doctorName}${extracted.specialty ? " (" + extracted.specialty + ")" : ""}`
      : "Unlabeled";

    for (const file of imageFiles) {
      const filePath = `${userId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        setError("Upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }

      await supabase.from("documents").insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        category: folderName,
      });
    }

    for (const med of extracted.medications) {
      if (med.name && med.selected) {
        await supabase.from("medications").insert({
          user_id: userId,
          name: med.name,
          dosage: med.dosage || "",
          frequency: med.instructions || "",
        });
      }
    }

    setSaving(false);
    setExtracted(null);
    setImageFiles([]);
    setPreviewUrls([]);
    if (onSaved) onSaved();
  }

  function handleCancel() {
    setExtracted(null);
    setImageFiles([]);
    setPreviewUrls([]);
    setError("");
  }

  function updateField(field, value) {
    setExtracted({ ...extracted, [field]: value });
  }

  function updateMedication(index, field, value) {
    const updated = [...extracted.medications];
    updated[index] = { ...updated[index], [field]: value };
    setExtracted({ ...extracted, medications: updated });
  }

  function removeMedication(index) {
    const updated = extracted.medications.filter((_, i) => i !== index);
    setExtracted({ ...extracted, medications: updated });
  }

  function toggleMedication(index) {
    const updated = [...extracted.medications];
    updated[index] = { ...updated[index], selected: !updated[index].selected };
    setExtracted({ ...extracted, medications: updated });
  }

  return (
    <section className="mt-6 bg-white rounded-2xl p-6 border" style={{ borderColor: "var(--color-border)" }}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
        <ScanText size={20} color="var(--color-primary)" />
        Scan a Prescription
      </h2>

      {!extracted && (
        <label
          className="block w-full text-center rounded-lg py-3 text-sm font-medium text-white cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {analyzing ? progress || "Reading prescription..." : "Upload prescription photo(s)"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={analyzing}
            className="hidden"
          />
        </label>
      )}

      {!extracted && (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--color-text-muted)" }}>
          Multiple pages? Select them all at once.
        </p>
      )}

      {error && !extracted && (
        <p className="text-sm mt-2 text-red-500">{error}</p>
      )}

      {extracted && (
        <div className="space-y-4">
          {error && <p className="text-sm text-orange-500">{error}</p>}

          {previewUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {previewUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={url}
                    alt={`Page ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </a>
              ))}
              <label
                className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer shrink-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Plus size={20} color="var(--color-text-muted)" />
                <input type="file" accept="image/*" multiple onChange={handleAddMorePages} className="hidden" />
              </label>
            </div>
          )}

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Review what we found — edit anything that's wrong before saving.
          </p>

          <div>
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>Doctor's name</label>
            <input
              type="text"
              value={extracted.doctorName || ""}
              onChange={(e) => updateField("doctorName", e.target.value)}
              placeholder="e.g. Dr. Rahman"
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>Specialty / designation</label>
            <input
              type="text"
              value={extracted.specialty || ""}
              onChange={(e) => updateField("specialty", e.target.value)}
              placeholder="e.g. Cardiologist"
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          {extracted.medications && extracted.medications.length > 0 && (
            <div>
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Medications found — {extracted.medications.filter((m) => m.selected).length} of {extracted.medications.length} selected
              </label>
              <div className="space-y-2 mt-1">
                {extracted.medications.map((med, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="checkbox"
                      checked={med.selected}
                      onChange={() => toggleMedication(i)}
                      className="mt-2 w-4 h-4 shrink-0"
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                    <div className={`grid grid-cols-3 gap-2 flex-1 ${!med.selected ? "opacity-40" : ""}`}>
                      <input
                        type="text"
                        value={med.name || ""}
                        onChange={(e) => updateMedication(i, "name", e.target.value)}
                        placeholder="Name"
                        className="border rounded-lg px-2 py-1.5 text-xs"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                      <input
                        type="text"
                        value={med.dosage || ""}
                        onChange={(e) => updateMedication(i, "dosage", e.target.value)}
                        placeholder="Dosage"
                        className="border rounded-lg px-2 py-1.5 text-xs"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                      <input
                        type="text"
                        value={med.instructions || ""}
                        onChange={(e) => updateMedication(i, "instructions", e.target.value)}
                        placeholder="Instructions"
                        className="border rounded-lg px-2 py-1.5 text-xs"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                    <button onClick={() => removeMedication(i)} className="p-1.5 shrink-0">
                      <X size={14} color="#EF4444" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleConfirmSave}
              disabled={saving}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Check size={16} />
              {saving ? "Saving..." : "Confirm & Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 rounded-lg py-2 text-sm font-medium flex items-center gap-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}