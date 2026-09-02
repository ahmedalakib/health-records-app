"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { Folder, Trash2, FolderOpen } from "lucide-react";

export default function Documents({ userId }) {
  const [documents, setDocuments] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openFolders, setOpenFolders] = useState({});

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  async function loadDocuments() {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setDocuments(data || []);
    setLoading(false);
    loadThumbnails(data || []);
  }

  async function loadThumbnails(docs) {
    const urls = {};
    for (const doc of docs) {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 3600);
      if (data) urls[doc.id] = data.signedUrl;
    }
    setThumbnails(urls);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    await supabase.from("documents").insert({
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      category: "General",
    });

    setUploading(false);
    loadDocuments();
  }

  async function handleDelete(id, filePath) {
    if (!confirm("Delete this document?")) return;
    await supabase.storage.from("documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", id);
    loadDocuments();
  }

  function toggleFolder(folderName) {
    setOpenFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  }

  const grouped = documents.reduce((acc, doc) => {
    const key = doc.category || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <section className="mt-6 bg-white rounded-2xl p-6 border" style={{ borderColor: "var(--color-border)" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
          <Folder size={20} color="var(--color-primary)" />
          Documents
        </h2>
      </div>

      <label
        className="block w-full text-center rounded-lg py-2 text-sm font-medium text-white cursor-pointer mb-4"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {uploading ? "Uploading..." : "Upload a document"}
        <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>

      {loading && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading...</p>}

      {!loading && documents.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No documents yet.</p>
      )}

      <div className="space-y-3">
        {Object.entries(grouped).map(([folderName, docs]) => (
          <div key={folderName} className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
            <button
              onClick={() => toggleFolder(folderName)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {openFolders[folderName] ? <FolderOpen size={16} color="var(--color-primary)" /> : <Folder size={16} color="var(--color-primary)" />}
                {folderName}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {docs.length} {docs.length === 1 ? "file" : "files"}
              </span>
            </button>

            {openFolders[folderName] && (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {docs.map((doc) => (
                  <div key={doc.id} className="relative">
                    <a href={thumbnails[doc.id]} target="_blank" rel="noopener noreferrer">
                      {thumbnails[doc.id] && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.file_name) ? (
                        <img
                          src={thumbnails[doc.id]}
                          alt={doc.file_name}
                          className="w-full h-28 object-cover rounded-lg border"
                          style={{ borderColor: "var(--color-border)" }}
                        />
                      ) : (
                        <div
                          className="w-full h-28 rounded-lg border flex items-center justify-center"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                        >
                          <Folder size={24} color="var(--color-text-muted)" />
                        </div>
                      )}
                    </a>
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                      {doc.file_name}
                    </p>
                    <button
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      className="absolute top-1 right-1 bg-white rounded-full p-2 shadow-sm"
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}