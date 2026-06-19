"use client";

import { useState } from "react";
import { Job, ApplyStatus } from "@/lib/types";
import AddJobModal from "@/components/AddJobModal";

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

export default function JobTable({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

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
                Address
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
              <tr
                key={job.id}
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
                  <Badge label={job.job_contract} styles={contractStyles} />
                </td>
                <td className="px-4 py-3">
                  <Badge label={job.job_type} styles={workplaceStyles} />
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                  {job.company_address}
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                  {new Date(job.date_apply).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Badge label={job.apply_status} styles={statusStyles} />
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                  {job.date_update
                    ? new Date(job.date_update).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
