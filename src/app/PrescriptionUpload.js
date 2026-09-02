"use client";

import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { ScanText, X, Check } from "lucide-react";

export default function PrescriptionUpload({ userId, onSaved }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setImageFile(file);
    setAnalyzing(true);

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/extract-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      const result = await res.json();

      if (!result.success) {
        setError("Couldn't read the prescription. You can still upload it and fill in details manually.");
        setExtracted({ doctorName: "", specialty: "", date: "", medications: [] });
      } else {
        setExtracted(result.data);
      }
    } catch (err) {
      setError("Something went wrong analyzing the image.");
      setExtracted({ doctorName: "", specialty: "", date: "", medications: [] });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmSave() {
    setSaving(true);

    const folderName = extracted.doctorName
      ? `Dr. ${extracted.doctorName}${extracted.specialty ? " (" + extracted.specialty + ")" : ""}`
      : "Unlabeled";

    const filePath = `${userId}/${Date.now()}_${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, imageFile);

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setSaving(false);
      return;
    }

    await supabase.from("documents").insert({
      user_id: userId,
      file_name: imageFile.name,
      file_path: filePath,
      category: folderName,
    });

    for (const med of extracted.medications) {
      if (med.name) {
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
    setImageFile(null);
    if (onSaved) onSaved();
  }

  function handleCancel() {
    setExtracted(null);
    setImageFile(null);
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
          {analyzing ? "Reading prescription..." : "Upload prescription photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={analyzing}
            className="hidden"
          />
        </label>
      )}

      {error && !extracted && (
        <p className="text-sm mt-2 text-red-500">{error}</p>
      )}

      {extracted && (
        <div className="space-y-4">
          {error && <p className="text-sm text-orange-500">{error}</p>}

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
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>Medications found</label>
              <div className="space-y-2 mt-1">
                {extracted.medications.map((med, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
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