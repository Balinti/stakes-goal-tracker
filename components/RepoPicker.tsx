'use client'

import { useState } from 'react'
import { Github, Check, AlertCircle, Loader2 } from 'lucide-react'
import { parseRepoUrl, fetchReleases } from '@/lib/github'
import { setCommitment, setEngagementFlag } from '@/lib/storage'
import { getDefaultTimezone } from '@/lib/time'
import { cn } from '@/lib/utils'

interface RepoPickerProps {
  onRepoSelected: (owner: string, name: string) => void
  initialOwner?: string
  initialName?: string
}

export function RepoPicker({ onRepoSelected, initialOwner, initialName }: RepoPickerProps) {
  const [input, setInput] = useState(
    initialOwner && initialName ? `${initialOwner}/${initialName}` : ''
  )
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [releaseCount, setReleaseCount] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = parseRepoUrl(input)
    if (!parsed) {
      setError('Please enter a valid GitHub repository URL or owner/name')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)

    const result = await fetchReleases(parsed.owner, parsed.name)

    if (!result.success) {
      setError(result.error || 'Failed to fetch repository')
      setStatus('error')
      return
    }

    setReleaseCount(result.releases.length)
    setStatus('success')
    setEngagementFlag('hasFetchedReleases', true)

    // Save commitment with default settings
    const commitment = {
      repoOwner: parsed.owner,
      repoName: parsed.name,
      timezone: getDefaultTimezone(),
      cutoffDow: 0, // Sunday
      cutoffTime: '23:59',
      tagPattern: null,
      createdAt: new Date().toISOString(),
    }
    setCommitment(commitment)

    onRepoSelected(parsed.owner, parsed.name)
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository (public)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Github className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="repo"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setStatus('idle')
                setError(null)
              }}
              placeholder="owner/repo or https://github.com/owner/repo"
              className={cn(
                'block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900',
                status === 'error' ? 'border-danger-500' : 'border-gray-300'
              )}
            />
            {status === 'success' && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Check className="h-5 w-5 text-success-500" />
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
          {status === 'success' && releaseCount !== null && (
            <p className="mt-2 text-sm text-success-600">
              Found {releaseCount} release{releaseCount !== 1 ? 's' : ''} in this repository
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || !input.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors',
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Checking repository...
            </>
          ) : status === 'success' ? (
            <>
              <Check className="h-5 w-5" />
              Repository connected
            </>
          ) : (
            'Connect Repository'
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500 text-center">
        Your repository must be public. We&apos;ll check for GitHub Releases to verify your shipping.
      </p>
    </div>
  )
}
