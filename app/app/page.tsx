'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, Github, ArrowLeft, Sparkles } from 'lucide-react'
import { RepoPicker } from '@/components/RepoPicker'
import { Scorecard } from '@/components/Scorecard'
import { CutoffSettings } from '@/components/CutoffSettings'
import { AuthGateSoftPrompt } from '@/components/AuthGateSoftPrompt'
import { type Commitment, getCommitment } from '@/lib/storage'

export default function AppPage() {
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load commitment from localStorage
    const stored = getCommitment()
    setCommitment(stored)
    setIsLoaded(true)
  }, [])

  const handleRepoSelected = (owner: string, name: string) => {
    // Reload commitment from storage after selection
    const updated = getCommitment()
    setCommitment(updated)
  }

  const handleSettingsSave = (updated: Commitment) => {
    setCommitment(updated)
  }

  const handleChangeRepo = () => {
    setCommitment(null)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Target className="h-7 w-7 text-primary-600" />
            <span className="font-bold text-lg text-gray-900">Stakes</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Upgrade
            </Link>
            <Link
              href="/account"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Account
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Simulation banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-900">Simulation Mode</p>
              <p className="text-sm text-primary-700">
                You&apos;re running a free simulation. Your data is stored locally.{' '}
                <Link href="/account" className="underline hover:no-underline">
                  Create an account
                </Link>{' '}
                to enable real stakes and sync across devices.
              </p>
            </div>
          </div>
        </div>

        {!commitment ? (
          /* Repo selection view */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <Github className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Repository
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter the URL or owner/name of a public GitHub repository. We&apos;ll
                track your releases to verify you&apos;re shipping weekly.
              </p>
            </div>
            <div className="flex justify-center">
              <RepoPicker onRepoSelected={handleRepoSelected} />
            </div>
          </div>
        ) : (
          /* Scorecard view */
          <div className="space-y-6">
            {/* Repo info and settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Github className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <a
                      href={`https://github.com/${commitment.repoOwner}/${commitment.repoName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {commitment.repoOwner}/{commitment.repoName}
                    </a>
                    <p className="text-sm text-gray-500">
                      Cutoff: {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][commitment.cutoffDow]} at {commitment.cutoffTime} ({commitment.timezone})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CutoffSettings commitment={commitment} onSave={handleSettingsSave} />
                  <button
                    onClick={handleChangeRepo}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change repo
                  </button>
                </div>
              </div>
            </div>

            {/* Scorecard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <Scorecard commitment={commitment} />
            </div>

            {/* Sprint info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                About Sprints
              </h3>
              <div className="prose prose-sm text-gray-600">
                <p>
                  A sprint is a 4-week commitment period. You commit a deposit at
                  the start, and get it refunded if you ship every week.
                </p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <strong>Pass:</strong> You shipped a GitHub Release during
                    the week.
                  </li>
                  <li>
                    <strong>Grace:</strong> No release found, but you added
                    evidence of shipping (link to blog, tweet, etc.).
                  </li>
                  <li>
                    <strong>Fail:</strong> No release or evidence. A fail forfeits
                    your deposit (in real mode).
                  </li>
                </ul>
                <p className="mt-4">
                  Right now you&apos;re running a <strong>simulation</strong> based on
                  your real release history. When ready,{' '}
                  <Link href="/pricing" className="text-primary-600 hover:underline">
                    upgrade to Pro
                  </Link>{' '}
                  to start a real deposit-backed sprint.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Soft auth prompt */}
      <AuthGateSoftPrompt />
    </main>
  )
}
