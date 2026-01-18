'use client'

import { useState } from 'react'
import { X, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatWeekRange, type WeekWindow } from '@/lib/time'

interface EvidenceModalProps {
  week: WeekWindow
  initialUrl: string
  initialNote: string
  onSave: (url: string, note: string) => void
  onClose: () => void
  timezone: string
}

export function EvidenceModal({
  week,
  initialUrl,
  initialNote,
  onSave,
  onClose,
  timezone,
}: EvidenceModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const [note, setNote] = useState(initialNote)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(url, note)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Add Evidence</h3>
            <p className="text-sm text-gray-500">
              {week.label} ({formatWeekRange(week.start, week.end, timezone)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="evidence-url" className="block text-sm font-medium text-gray-700 mb-1">
              Evidence URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="evidence-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Link to a blog post, tweet, demo, or any proof of shipping
            </p>
          </div>

          <div>
            <label htmlFor="evidence-note" className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              id="evidence-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Brief description of what you shipped..."
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Save Evidence
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
