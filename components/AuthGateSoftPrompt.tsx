'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Shield } from 'lucide-react'
import Link from 'next/link'
import { hasMeaningfulEngagement, getEngagementFlags, setEngagementFlag } from '@/lib/storage'

export function AuthGateSoftPrompt() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has meaningful engagement and hasn't dismissed prompt
    const flags = getEngagementFlags()
    const hasEngagement = hasMeaningfulEngagement()
    const wasDismissed = flags.promptDismissedAt !== null

    if (hasEngagement && !wasDismissed) {
      // Delay showing the prompt slightly
      const timer = setTimeout(() => {
        setShow(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShow(false)
    setEngagementFlag('promptDismissedAt', new Date().toISOString())
  }

  if (!show || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-40">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-100">
            <Shield className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Save your progress</h4>
            <p className="text-sm text-gray-600 mt-1">
              Create a free account to sync your data across devices and access premium features.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
