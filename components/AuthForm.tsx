'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataForMigration, markMigrated } from '@/lib/storage'
import { features } from '@/lib/env'

interface AuthFormProps {
  redirectTo?: string
}

export function AuthForm({ redirectTo }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if Supabase is configured
  if (!features.hasSupabase) {
    return (
      <div className="p-6 rounded-lg bg-warning-50 border border-warning-200">
        <p className="text-warning-700 text-center">
          Authentication is not configured. Running in local-only mode.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.user) {
          // Migrate local data
          await migrateLocalData(data.user.id)
          setSuccess('Check your email for a confirmation link!')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          // Migrate local data on sign in too (in case they had local data)
          await migrateLocalData(data.user.id)

          // Redirect after successful sign in
          window.location.href = redirectTo || '/app'
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const migrateLocalData = async (userId: string) => {
    const data = getDataForMigration()
    if (!data || !data.commitment) {
      markMigrated(userId)
      return
    }

    try {
      const supabase = createClient()

      // Create commitment
      const { data: commitmentData, error: commitmentError } = await supabase
        .from('commitments')
        .insert({
          user_id: userId,
          repo_owner: data.commitment.repoOwner,
          repo_name: data.commitment.repoName,
          timezone: data.commitment.timezone,
          cutoff_dow: data.commitment.cutoffDow,
          cutoff_time: data.commitment.cutoffTime,
          tag_pattern: data.commitment.tagPattern,
          created_at: data.commitment.createdAt,
        })
        .select()
        .single()

      if (commitmentError) {
        console.error('Failed to migrate commitment:', commitmentError)
        return
      }

      // Create weeks
      if (data.weeks.length > 0 && commitmentData) {
        const weeks = data.weeks.map(week => ({
          commitment_id: commitmentData.id,
          week_start: week.weekStart,
          week_end: week.weekEnd,
          status: week.status,
          proof: week.proof,
          evidence_url: week.evidenceUrl,
          note: week.note,
          evaluated_at: week.evaluatedAt,
        }))

        const { error: weeksError } = await supabase
          .from('weeks')
          .insert(weeks)

        if (weeksError) {
          console.error('Failed to migrate weeks:', weeksError)
        }
      }

      markMigrated(userId)
    } catch (err) {
      console.error('Migration error:', err)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => {
            setMode('signin')
            setError(null)
            setSuccess(null)
          }}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            mode === 'signin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setMode('signup')
            setError(null)
            setSuccess(null)
          }}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            mode === 'signup'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
            <p className="text-sm text-danger-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-success-50 border border-success-200">
            <p className="text-sm text-success-600">{success}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>
          {mode === 'signup' && (
            <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors',
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </>
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500 text-center">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => {
                setMode('signin')
                setError(null)
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}
