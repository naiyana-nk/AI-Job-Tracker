export type ApplyStatus = 'Applied' | 'Replied' | 'Interviewing' | 'Ghosted' | 'Rejected' | 'Offer'

export type Job = {
  id: string
  company_name: string
  job_title: string
  job_desc: string
  job_contract: string
  job_type: string
  company_address: string
  apply_status: ApplyStatus
  date_apply: string
  date_update: string
  tailored_resume: string | null
  cover_letter: string | null
}