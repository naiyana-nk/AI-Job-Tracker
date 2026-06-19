"use client";

import React, { useState } from "react";
import { Job, ApplyStatus } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import AddJobModal from "@/components/AddJobModal";
import EditJobModal from "@/components/EditJobModal";
import StatusSelect from "./StatusSelect";

const STATUS_OPTIONS = [
  { value: "Applied", label: "Applied", style: "bg-blue-500/20 text-blue-400" },
  {
    value: "Interviewing",
    label: "Interviewing",
    style: "bg-amber-500/20 text-amber-400",
  },
  {
    value: "Ghosted",
    label: "Ghosted",
    style: "bg-slate-500/20 text-slate-400",
  },
  {
    value: "Rejected",
    label: "Rejected",
    style: "bg-rose-500/20 text-rose-400",
  },
];

const CONTRACT_OPTIONS = [
  {
    value: "Full-time",
    label: "Full-time",
    style: "bg-violet-500/20 text-violet-400",
  },
  {
    value: "Contractual",
    label: "Contractual",
    style: "bg-orange-500/20 text-orange-400",
  },
];

const WORKPLACE_OPTIONS = [
  { value: "On-site", label: "On-site", style: "bg-rose-500/20 text-rose-400" },
  { value: "Hybrid", label: "Hybrid", style: "bg-green-500/20 text-green-400" },
  { value: "Remote", label: "Remote", style: "bg-cyan-500/20 text-cyan-400" },
];

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  Interviewing: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Ghosted: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  Rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  Offer: "bg-green-500/10 text-green-400 border border-green-500/20",
};

const contractStyles: Record<string, string> = {
  "Full-time": "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  Contractual: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

const workplaceStyles: Record<string, string> = {
  "On-site": "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  Hybrid: "bg-green-500/10 text-green-400 border border-green-500/20",
  Remote: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
};

function Badge({
  label,
  styles,
}: {
  label: string;
  styles: Record<string, string>;
}) {
  const style =
    styles[label] ??
    "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${style}`}
    >
      {label}
    </span>
  );
}

function ExpandedRow({
  job,
  onTailored,
  onUpdated,
  onDeleted,
}: {
  job: Job;
  onTailored: (
    id: string,
    tailored_resume: string,
    cover_letter: string,
  ) => void;
  onUpdated: (job: Job) => void;
  onDeleted: (id: string) => void;
}) {
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"resume" | "cover">("resume");

  const handleTailor = async () => {
    if (!job.job_desc) {
      setError("This job has no description to tailor from.");
      return;
    }
    setTailoring(true);
    setError("");
    console.log("Sending to tailor:", {
      job_id: job.id,
      job_desc: job.job_desc,
      job_title: job.job_title,
      company_name: job.company_name,
    });
    try {
      const res = await fetch("http://localhost:8000/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          job_desc: job.job_desc,
          job_title: job.job_title,
          company_name: job.company_name,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        onTailored(job.id, data.tailored_resume, data.cover_letter);
      }
    } catch {
      setError("Failed to tailor. Is the backend running?");
    } finally {
      setTailoring(false);
    }
  };

  return (
    <tr>
      <td
        colSpan={8}
        className="bg-slate-800/80 border-b border-slate-700 px-6 py-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Address
            </span>
            <span className="text-slate-200 text-sm">
              {job.company_address || "—"}
            </span>
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Job Description
            </span>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {job.job_desc || "—"}
            </p>
          </div>
        </div>

        {/* AI Output */}
        {(job.tailored_resume || job.cover_letter) && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("resume")}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "resume"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                Tailored Resume
              </button>
              <button
                onClick={() => setActiveTab("cover")}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "cover"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                Cover Letter
              </button>
            </div>

            {/* Content */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
              <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                {activeTab === "resume"
                  ? job.tailored_resume
                  : job.cover_letter}
              </pre>
            </div>

            {/* Copy button */}
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  activeTab === "resume"
                    ? (job.tailored_resume ?? "")
                    : (job.cover_letter ?? ""),
                )
              }
              className="self-start text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}

        {/* AI Tools */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-2">
          {error && (
            <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleTailor}
              disabled={tailoring}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {tailoring
                ? "✨ Tailoring..."
                : job.tailored_resume
                  ? "✨ Re-tailor Resume"
                  : "✨ Tailor Resume"}
            </button>
            <EditJobModal job={job} onUpdated={onUpdated} />
            <button
              onClick={async () => {
                if (!confirm(`Delete ${job.company_name} — ${job.job_title}?`))
                  return;
                await supabase.from("applications").delete().eq("id", job.id);
                onDeleted(job.id);
              }}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function JobTable({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleTailored = (
    id: string,
    tailored_resume: string,
    cover_letter: string,
  ) => {
    setJobs(
      jobs.map((j) =>
        j.id === id ? { ...j, tailored_resume, cover_letter } : j,
      ),
    );
  };

  const handleUpdated = (updatedJob: Job) => {
    setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const handleDeleted = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
    setExpandedId(null);
  };

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <p className="text-slate-400 text-sm">{jobs.length} applications</p>
        <AddJobModal onJobAdded={(job) => setJobs([job, ...jobs])} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-950/80 border-b border-indigo-900/50">
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Company
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Position
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Type
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Workplace
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Date Applied
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Status
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3">
                Date Update
              </th>
              <th className="text-left text-indigo-300 font-semibold px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 py-16">
                  No applications yet. Add your first one!
                </td>
              </tr>
            )}
            {jobs.map((job, i) => (
              <React.Fragment key={job.id}>
                <tr
                  key={job.id}
                  onClick={() => toggleRow(job.id)}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    job.apply_status === "Ghosted" ||
                    job.apply_status === "Rejected"
                      ? "bg-slate-900/20 opacity-50"
                      : i % 2 === 0
                        ? "bg-slate-800/60"
                        : "bg-slate-800/90"
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                    {job.company_name}
                  </td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {job.job_title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={job.job_contract}
                      options={CONTRACT_OPTIONS}
                      onChange={async (val) => {
                        await supabase
                          .from("applications")
                          .update({
                            job_contract: val,
                            date_update: new Date().toISOString().split("T")[0],
                          })
                          .eq("id", job.id);
                        setJobs(
                          jobs.map((j) =>
                            j.id === job.id ? { ...j, job_contract: val } : j,
                          ),
                        );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={job.job_type}
                      options={WORKPLACE_OPTIONS}
                      onChange={async (val) => {
                        await supabase
                          .from("applications")
                          .update({
                            job_type: val,
                            date_update: new Date().toISOString().split("T")[0],
                          })
                          .eq("id", job.id);
                        setJobs(
                          jobs.map((j) =>
                            j.id === job.id ? { ...j, job_type: val } : j,
                          ),
                        );
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(job.date_apply).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={job.apply_status}
                      options={STATUS_OPTIONS}
                      onChange={async (val) => {
                        const status = val as ApplyStatus;
                        await supabase
                          .from("applications")
                          .update({
                            apply_status: status,
                            date_update: new Date().toISOString().split("T")[0],
                          })
                          .eq("id", job.id);
                        setJobs(
                          jobs.map((j) =>
                            j.id === job.id
                              ? { ...j, apply_status: status }
                              : j,
                          ),
                        );
                      }}
                    />
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="date"
                      value={job.date_update ?? ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await supabase
                          .from("applications")
                          .update({ date_update: val })
                          .eq("id", job.id);
                        setJobs(
                          jobs.map((j) =>
                            j.id === job.id ? { ...j, date_update: val } : j,
                          ),
                        );
                      }}
                      className="bg-transparent text-slate-400 text-xs outline-none cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {expandedId === job.id ? "▲" : "▼"}
                  </td>
                </tr>
                {expandedId === job.id && (
                  <ExpandedRow
                    key={`${job.id}-expanded`}
                    job={job}
                    onTailored={handleTailored}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
