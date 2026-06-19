'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/types'

type Props = {
  job: Job
  onUpdated: (job: Job) => void
}

export default function EditJobModal({ job, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    company_name: job.company_name,
    job_title: job.job_title,
    job_desc: job.job_desc,
    job_contract: job.job_contract,
    job_type: job.job_type,
    company_address: job.company_address,
    apply_status: job.apply_status,
    date_apply: job.date_apply,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    const { data, error: sbError } = await supabase
      .from('applications')
      .update({ ...form, date_update: new Date().toISOString().split('T')[0] })
      .eq('id', job.id)
      .select()
      .single()

    if (sbError || !data) {
      setError('Failed to update. Please try again.')
      setSaving(false)
      return
    }

    onUpdated(data as Job)
    setOpen(false)
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        ✏️ Edit
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">Edit Application</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Company Name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Position</label>
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 text-xs font-medium">Address</label>
            <input
              name="company_address"
              value={form.company_address}
              onChange={handleChange}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Date */}
          <div className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Date Applied</label>
              <input
                type="date"
                name="date_apply"
                value={form.date_apply}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 text-xs font-medium">Job Description</label>
            <textarea
              name="job_desc"
              value={form.job_desc}
              onChange={handleChange}
              rows={4}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}