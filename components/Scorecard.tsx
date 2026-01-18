'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Clock, AlertCircle, ExternalLink, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type WeekData, type Commitment, getWeeks, updateWeek, setEngagementFlag } from '@/lib/storage'
import { calculateWeekWindows, formatWeekRange, type WeekWindow, type CutoffSettings } from '@/lib/time'
import { fetchReleases, hasReleaseInWindow, releaseToProof, type GitHubRelease } from '@/lib/github'
import { EvidenceModal } from './EvidenceModal'

interface ScorecardProps {
  commitment: Commitment
  onRefresh?: () => void
}

interface WeekWithData extends WeekWindow {
  data: WeekData | null
}

export function Scorecard({ commitment, onRefresh }: ScorecardProps) {
  const [weeks, setWeeks] = useState<WeekWithData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evidenceModalWeek, setEvidenceModalWeek] = useState<WeekWithData | null>(null)

  // Load weeks data
  const loadWeeks = useCallback(() => {
    const settings: CutoffSettings = {
      dayOfWeek: commitment.cutoffDow,
      time: commitment.cutoffTime,
      timezone: commitment.timezone,
    }

    const windows = calculateWeekWindows(settings)
    const storedWeeks = getWeeks()

    const weeksWithData: WeekWithData[] = windows.map(window => {
      const stored = storedWeeks.find(
        w => w.weekStart === window.start.toISOString() && w.weekEnd === window.end.toISOString()
      )
      return {
        ...window,
        data: stored || null,
      }
    })

    setWeeks(weeksWithData)
    setIsLoading(false)
    setEngagementFlag('hasViewedScorecard', true)
  }, [commitment])

  useEffect(() => {
    loadWeeks()
  }, [loadWeeks])

  // Check releases for all weeks
  const checkReleases = async () => {
    setIsChecking(true)
    setError(null)

    try {
      const result = await fetchReleases(commitment.repoOwner, commitment.repoName)

      if (!result.success) {
        setError(result.error || 'Failed to fetch releases')
        setIsChecking(false)
        return
      }

      setEngagementFlag('hasFetchedReleases', true)

      // Evaluate each week
      for (const week of weeks) {
        if (week.isCurrent) {
          // Current week is always pending until cutoff
          const checkResult = hasReleaseInWindow(
            result.releases,
            week.start,
            week.end,
            commitment.tagPattern
          )

          const weekData: WeekData = {
            weekStart: week.start.toISOString(),
            weekEnd: week.end.toISOString(),
            status: checkResult.pass ? 'pass' : 'pending',
            proof: checkResult.release ? releaseToProof(checkResult.release) : null,
            evidenceUrl: week.data?.evidenceUrl || null,
            note: week.data?.note || null,
            evaluatedAt: new Date().toISOString(),
          }
          updateWeek(weekData)
        } else {
          // Past weeks: pass or fail
          const checkResult = hasReleaseInWindow(
            result.releases,
            week.start,
            week.end,
            commitment.tagPattern
          )

          // Keep existing status if it was manually set to grace, or has evidence
          const existingStatus = week.data?.status
          const hasEvidence = week.data?.evidenceUrl

          let status: WeekData['status']
          if (checkResult.pass) {
            status = 'pass'
          } else if (existingStatus === 'grace' || hasEvidence) {
            status = existingStatus || 'grace'
          } else {
            status = 'fail'
          }

          const weekData: WeekData = {
            weekStart: week.start.toISOString(),
            weekEnd: week.end.toISOString(),
            status,
            proof: checkResult.release ? releaseToProof(checkResult.release) : (week.data?.proof || null),
            evidenceUrl: week.data?.evidenceUrl || null,
            note: week.data?.note || null,
            evaluatedAt: new Date().toISOString(),
          }
          updateWeek(weekData)
        }
      }

      loadWeeks()
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsChecking(false)
    }
  }

  // Get status badge
  const getStatusBadge = (week: WeekWithData) => {
    const status = week.data?.status || (week.isCurrent ? 'pending' : 'pending')

    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-success-100 text-success-600">
            <Check className="h-4 w-4" />
            Shipped
          </span>
        )
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-danger-100 text-danger-600">
            <X className="h-4 w-4" />
            Missed
          </span>
        )
      case 'grace':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-600">
            <AlertCircle className="h-4 w-4" />
            Grace
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        )
    }
  }

  // Handle evidence save
  const handleEvidenceSave = (url: string, note: string) => {
    if (!evidenceModalWeek) return

    const weekData: WeekData = {
      weekStart: evidenceModalWeek.start.toISOString(),
      weekEnd: evidenceModalWeek.end.toISOString(),
      status: evidenceModalWeek.data?.status || 'grace',
      proof: evidenceModalWeek.data?.proof || null,
      evidenceUrl: url || null,
      note: note || null,
      evaluatedAt: new Date().toISOString(),
    }

    // If adding evidence to a failed week, change to grace
    if (url && weekData.status === 'fail') {
      weekData.status = 'grace'
    }

    updateWeek(weekData)
    setEngagementFlag('hasAddedEvidence', true)
    loadWeeks()
    setEvidenceModalWeek(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Calculate sprint summary
  const pastWeeks = weeks.filter(w => !w.isCurrent).slice(0, 4)
  const passCount = pastWeeks.filter(w => w.data?.status === 'pass').length
  const failCount = pastWeeks.filter(w => w.data?.status === 'fail').length
  const graceCount = pastWeeks.filter(w => w.data?.status === 'grace').length

  return (
    <div className="space-y-6">
      {/* Header with check button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Scorecard</h3>
          <p className="text-sm text-gray-500">
            Tracking releases for {commitment.repoOwner}/{commitment.repoName}
          </p>
        </div>
        <button
          onClick={checkReleases}
          disabled={isChecking}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            isChecking
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Releases'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-danger-50 border border-danger-200">
          <p className="text-sm text-danger-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
          <p className="text-sm text-danger-500 mt-1">
            You can add evidence links manually for each week.
          </p>
        </div>
      )}

      {/* Sprint summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-success-50 border border-success-200 text-center">
          <p className="text-2xl font-bold text-success-600">{passCount}</p>
          <p className="text-sm text-success-600">Shipped</p>
        </div>
        <div className="p-4 rounded-lg bg-warning-50 border border-warning-200 text-center">
          <p className="text-2xl font-bold text-warning-600">{graceCount}</p>
          <p className="text-sm text-warning-600">Grace</p>
        </div>
        <div className="p-4 rounded-lg bg-danger-50 border border-danger-200 text-center">
          <p className="text-2xl font-bold text-danger-600">{failCount}</p>
          <p className="text-sm text-danger-600">Missed</p>
        </div>
      </div>

      {/* Week list */}
      <div className="space-y-3">
        {weeks.map((week) => (
          <div
            key={week.weekNumber}
            className={cn(
              'p-4 rounded-lg border',
              week.isCurrent ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {week.label}
                  {week.isCurrent && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary-200 text-primary-700">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {formatWeekRange(week.start, week.end, commitment.timezone)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(week)}
                <button
                  onClick={() => setEvidenceModalWeek(week)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Add evidence"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Proof or evidence details */}
            {(week.data?.proof || week.data?.evidenceUrl) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {week.data.proof && (
                  <a
                    href={week.data.proof.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {week.data.proof.tag_name}
                    {week.data.proof.name && ` - ${week.data.proof.name}`}
                  </a>
                )}
                {week.data.evidenceUrl && (
                  <a
                    href={week.data.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 ml-4"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Evidence link
                  </a>
                )}
                {week.data.note && (
                  <p className="text-sm text-gray-500 mt-1">{week.data.note}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evidence Modal */}
      {evidenceModalWeek && (
        <EvidenceModal
          week={evidenceModalWeek}
          initialUrl={evidenceModalWeek.data?.evidenceUrl || ''}
          initialNote={evidenceModalWeek.data?.note || ''}
          onSave={handleEvidenceSave}
          onClose={() => setEvidenceModalWeek(null)}
          timezone={commitment.timezone}
        />
      )}
    </div>
  )
}
