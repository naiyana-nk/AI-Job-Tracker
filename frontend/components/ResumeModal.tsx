"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ResumeModal() {
  const [open, setOpen] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) fetchResume();
  }, [open]);

  const fetchResume = async () => {
    setLoading(true);
    const { data } = await supabase.from("resume").select("raw_text").single();
    setResumeText(data?.raw_text ?? null);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResumeText(data.text);
        setSuccess("Resume uploaded successfully!");
      }
    } catch {
      setError("Failed to upload. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        📄 My Resume
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold text-lg">
                My Base Resume
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
              {error && (
                <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  {success}
                </p>
              )}

              {loading ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  Loading...
                </p>
              ) : resumeText ? (
                <>
                  <p className="text-slate-400 text-xs">
                    Your current base resume — this is what the AI uses to
                    tailor applications.
                  </p>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {resumeText}
                    </pre>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Want to update it? Upload a new PDF below.
                  </p>
                </>
              ) : (
                <div className="text-center py-8 flex flex-col gap-2">
                  <p className="text-slate-300 font-medium">
                    No resume uploaded yet
                  </p>
                  <p className="text-slate-500 text-sm">
                    Upload your base resume PDF to enable AI tailoring.
                  </p>
                </div>
              )}

              {/* Upload */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  const fakeEvent = {
                    target: { files: [file] },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleUpload(fakeEvent);
                }}
                className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-2xl">📄</span>
                <span className="text-slate-300 text-sm font-medium">
                  {uploading
                    ? "Uploading..."
                    : resumeText
                      ? "Drop or click to replace PDF"
                      : "Drop or click to upload PDF"}
                </span>
                <span className="text-slate-500 text-xs">PDF files only</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
