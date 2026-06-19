'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/types'

type Props = {
  onJobAdded: (job: Job) => void
}

const defaultForm = {
  company_name: '',
  job_title: '',
  job_desc: '',
  job_contract: 'Full-time',
  job_type: 'On-site',
  company_address: '',
  apply_status: 'Applied',
  date_apply: new Date().toISOString().split('T')[0],
}

export default function AddJobModal({ onJobAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [summarizing, setSummarizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSummarize = async () => {
    if (!form.job_desc.trim()) return
    setSummarizing(true)
    try {
      const res = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.job_desc }),
      })
      const data = await res.json()
      setForm({ ...form, job_desc: data.summary })
    } catch {
      setError('Failed to summarize. Is the backend running?')
    } finally {
      setSummarizing(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.company_name || !form.job_title) {
      setError('Company name and position are required.')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: sbError } = await supabase
      .from('applications')
      .insert([{ ...form, date_update: new Date().toISOString() }])
      .select()
      .single()

    if (sbError || !data) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    onJobAdded(data as Job)
    setForm(defaultForm)
    setOpen(false)
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Add Application
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">Add Application</h2>
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
              <label className="text-slate-300 text-xs font-medium">Company Name *</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="e.g. Google"
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Position *</label>
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer"
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Type & Workplace */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Type</label>
              <select
                name="job_contract"
                value={form.job_contract}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              >
                <option>Full-time</option>
                <option>Contractual</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Workplace</label>
              <select
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              >
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 text-xs font-medium">Address</label>
            <input
              name="company_address"
              value={form.company_address}
              onChange={handleChange}
              placeholder="e.g. 123 Sukhumvit Road, Bangkok"
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-medium">Status</label>
              <select
                name="apply_status"
                value={form.apply_status}
                onChange={handleChange}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
              >
                <option>Applied</option>
                <option>Interviewing</option>
                <option>Ghosted</option>
                <option>Rejected</option>
              </select>
            </div>
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
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-xs font-medium">Job Description</label>
              <button
                onClick={handleSummarize}
                disabled={summarizing || !form.job_desc.trim()}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg transition-colors"
              >
                {summarizing ? 'Summarizing...' : '✨ AI Summarize'}
              </button>
            </div>
            <textarea
              name="job_desc"
              value={form.job_desc}
              onChange={handleChange}
              placeholder="Paste the full job description here, then click AI Summarize..."
              rows={5}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 resize-none"
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
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </div>
    </div>
  )
}