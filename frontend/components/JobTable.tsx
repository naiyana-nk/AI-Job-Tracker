"use client";

import React, { useState } from "react";
import { Job, ApplyStatus } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import AddJobModal from "@/components/AddJobModal";
import EditJobModal from "@/components/EditJobModal";
import StatusSelect from "./StatusSelect";
import ConfirmModal from "./ConfirmModal";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tailor`, {
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

        {/* AI Tools */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-3">
          {error && (
            <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
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
            {(job.tailored_resume || job.cover_letter) && (
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    activeTab === "resume"
                      ? (job.tailored_resume ?? "")
                      : (job.cover_letter ?? ""),
                  )
                }
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                📋 Copy
              </button>
            )}
            <EditJobModal job={job} onUpdated={onUpdated} />
            <button
              onClick={() => setConfirmOpen(true)}
              className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              🗑️ Delete
            </button>
            <ConfirmModal
              open={confirmOpen}
              title="Delete Application"
              message={`Are you sure you want to delete ${job.company_name} — ${job.job_title}? This cannot be undone.`}
              confirmLabel="Delete"
              onCancel={() => setConfirmOpen(false)}
              onConfirm={async () => {
                await supabase.from("applications").delete().eq("id", job.id);
                onDeleted(job.id);
                setConfirmOpen(false);
              }}
            />
          </div>

          {/* AI Output Accordion */}
          {(job.tailored_resume || job.cover_letter) && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors self-start"
              >
                <span>{aiOpen ? "▲" : "▼"}</span>
                <span>AI Output</span>
              </button>

              {aiOpen && (
                <div className="flex flex-col gap-2">
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
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function JobTable({ initialJobs }: { initialJobs: Job[] }) {
  const sortJobs = (list: Job[]) =>
    [...list].sort(
      (a, b) =>
        new Date(b.date_apply).getTime() - new Date(a.date_apply).getTime(),
    );

  const [jobs, setJobs] = useState<Job[]>(sortJobs(initialJobs));

  type SortKey =
    | "company_name"
    | "job_title"
    | "job_contract"
    | "job_type"
    | "date_apply"
    | "apply_status"
    | "date_update";

  const [sortKey, setSortKey] = useState<SortKey>("date_apply");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? result : -result;
  });

  const filteredJobs = sortedJobs.filter(
    (j) =>
      j.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      j.job_type?.toLowerCase().includes(search.toLowerCase()) ||
      j.job_contract?.toLowerCase().includes(search.toLowerCase()) ||
      j.apply_status?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
    setJobs(
      sortJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j))),
    );
  };

  const handleDeleted = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
    setExpandedId(null);
  };

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const stats = [
    { label: "Total", count: jobs.length, color: "text-white" },
    {
      label: "Applied",
      count: jobs.filter((j) => j.apply_status === "Applied").length,
      color: "text-blue-400",
    },
    {
      label: "Interviewing",
      count: jobs.filter((j) => j.apply_status === "Interviewing").length,
      color: "text-amber-400",
    },
    {
      label: "Ghosted",
      count: jobs.filter((j) => j.apply_status === "Ghosted").length,
      color: "text-slate-400",
    },
    {
      label: "Rejected",
      count: jobs.filter((j) => j.apply_status === "Rejected").length,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1"
          >
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              {stat.label}
            </span>
            <span className={`text-2xl font-bold ${stat.color}`}>
              {stat.count}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 flex-wrap">
          <p className="text-slate-400 text-sm">{jobs.length} applications</p>
          <input
            type="text"
            placeholder="Search company, position, status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 w-72"
          />
          <AddJobModal
            onJobAdded={(job) => setJobs(sortJobs([job, ...jobs]))}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-950/80 border-b border-indigo-900/50">
                {[
                  { label: "Company", key: "company_name" },
                  { label: "Position", key: "job_title" },
                  { label: "Type", key: "job_contract" },
                  { label: "Workplace", key: "job_type" },
                  { label: "Date Applied", key: "date_apply" },
                  { label: "Status", key: "apply_status" },
                  { label: "Date Update", key: "date_update" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as SortKey)}
                    className="text-left text-indigo-300 font-semibold px-4 py-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap select-none"
                  >
                    {col.label}
                    <span className="ml-1 text-xs opacity-50">
                      {sortKey === col.key
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : "⇅"}
                    </span>
                  </th>
                ))}
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
              {paginatedJobs.map((job, i) => (
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
                              date_update: new Date()
                                .toISOString()
                                .split("T")[0],
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
                              date_update: new Date()
                                .toISOString()
                                .split("T")[0],
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
                              date_update: new Date()
                                .toISOString()
                                .split("T")[0],
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

        {/* Pagination */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span className="text-slate-400 text-xs">
            Page {page} of {totalPages === 0 ? 1 : totalPages} —{" "}
            {filteredJobs.length} total
            {sortedJobs.length} total
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
