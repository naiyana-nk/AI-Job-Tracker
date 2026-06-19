import { supabase } from "@/lib/supabase";
import { Job } from "@/lib/types";
import JobTable from "@/components/JobTable";
import ResumeModal from "@/components/ResumeModal";

export default async function Home() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("date_apply", { ascending: false });
  console.log("jobs fetched:", data, "error:", error);

  if (error) {
    console.error(error);
    return <div>Failed to load jobs.</div>;
  }

  const jobs = (data as Job[]) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Job Tracker</h1>
            <p className="text-slate-400 mt-1 mb-2 text-sm">
              Track and tailor your job applications
            </p>
            <ResumeModal />

            {/* Stats */}
            <div className="w-full mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total", count: jobs.length, color: "text-white" },
                {
                  label: "Applied",
                  count: jobs.filter((j) => j.apply_status === "Applied")
                    .length,
                  color: "text-blue-400",
                },
                {
                  label: "Interviewing",
                  count: jobs.filter((j) => j.apply_status === "Interviewing")
                    .length,
                  color: "text-amber-400",
                },
                {
                  label: "Ghosted",
                  count: jobs.filter((j) => j.apply_status === "Ghosted")
                    .length,
                  color: "text-slate-400",
                },
                {
                  label: "Rejected",
                  count: jobs.filter((j) => j.apply_status === "Rejected")
                    .length,
                  color: "text-rose-400",
                },
              ].map((stat) => (
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
          </div>
        </div>
        <JobTable initialJobs={jobs} />
      </div>
    </main>
  );
}
