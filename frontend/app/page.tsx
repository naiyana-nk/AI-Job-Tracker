export const revalidate = 0

import { supabase } from "@/lib/supabase";
import { Job } from "@/lib/types";
import JobTable from "@/components/JobTable";
import ResumeModal from "@/components/ResumeModal";
import ChatBot from "@/components/ChatBot";

export default async function Home() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("date_apply", { ascending: false });
  // console.log("jobs fetched:", data, "error:", error);

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
          </div>
        </div>
        <JobTable initialJobs={jobs} />
      </div>
      <ChatBot jobs={jobs} />
    </main>
  );
}
