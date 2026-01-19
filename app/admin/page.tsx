import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Target, Shield, Users, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { features, isAdmin } from '@/lib/env'

export default async function AdminPage() {
  // Check if admin feature is enabled
  if (!features.hasAdmin) {
    notFound()
  }

  // Check if user is authenticated and is admin
  if (!features.hasSupabase) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    notFound()
  }

  // Fetch some basic stats
  let stats = {
    totalUsers: 0,
    totalCommitments: 0,
    activeSubscriptions: 0,
  }

  try {
    const [usersResult, commitmentsResult, subscriptionsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('commitments').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    stats = {
      totalUsers: usersResult.count || 0,
      totalCommitments: commitmentsResult.count || 0,
      activeSubscriptions: subscriptionsResult.count || 0,
    }
  } catch {
    // Stats failed to load
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Target className="h-7 w-7 text-primary-600" />
              <span className="font-bold text-lg text-gray-900">Stakes</span>
            </Link>
            <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs font-semibold rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Dashboard
            </Link>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-600">Total Users</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-600">Commitments</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCommitments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-600">Active Subscriptions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
          </div>
        </div>

        {/* Admin actions placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Week Override (Coming Soon)
          </h2>
          <p className="text-gray-600">
            Admin overrides for week statuses will be available here. This allows
            manually marking weeks as pass/fail/grace for edge cases.
          </p>
        </div>
      </div>
    </main>
  )
}
