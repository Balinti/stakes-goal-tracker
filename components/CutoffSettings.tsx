'use client'

import { useState } from 'react'
import { Settings, Save } from 'lucide-react'
import { type Commitment, setCommitment, getCommitment } from '@/lib/storage'
import { DAYS_OF_WEEK, COMMON_TIMEZONES, getDefaultTimezone } from '@/lib/time'
import { cn } from '@/lib/utils'

interface CutoffSettingsProps {
  commitment: Commitment
  onSave: (commitment: Commitment) => void
}

export function CutoffSettings({ commitment, onSave }: CutoffSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timezone, setTimezone] = useState(commitment.timezone)
  const [dayOfWeek, setDayOfWeek] = useState(commitment.cutoffDow)
  const [time, setTime] = useState(commitment.cutoffTime)
  const [tagPattern, setTagPattern] = useState(commitment.tagPattern || '')

  const handleSave = () => {
    const updated: Commitment = {
      ...commitment,
      timezone,
      cutoffDow: dayOfWeek,
      cutoffTime: time,
      tagPattern: tagPattern || null,
    }
    setCommitment(updated)
    onSave(updated)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Settings className="h-4 w-4" />
        Settings
      </button>
    )
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
      <h4 className="font-medium text-gray-900">Cutoff Settings</h4>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          >
            {!COMMON_TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="day-of-week" className="block text-sm font-medium text-gray-700 mb-1">
            Cutoff Day
          </label>
          <select
            id="day-of-week"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cutoff-time" className="block text-sm font-medium text-gray-700 mb-1">
            Cutoff Time
          </label>
          <input
            type="time"
            id="cutoff-time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="tag-pattern" className="block text-sm font-medium text-gray-700 mb-1">
            Tag Pattern (optional)
          </label>
          <input
            type="text"
            id="tag-pattern"
            value={tagPattern}
            onChange={(e) => setTagPattern(e.target.value)}
            placeholder="e.g., ^v\d+\.\d+\.\d+$"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Regex pattern to filter releases by tag name
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
