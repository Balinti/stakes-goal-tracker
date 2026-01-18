import Link from 'next/link'
import { Target, ArrowLeft, CreditCard, LogOut } from 'lucide-react'
import { AuthForm } from '@/components/AuthForm'
import { createClient } from '@/lib/supabase/server'
import { features } from '@/lib/env'
import { redirect } from 'next/navigation'

async function SignOutButton() {
  'use server'
  // This is handled client-side
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  let user = null
  let subscription = null

  if (features.hasSupabase) {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser

      if (user) {
        // Get subscription
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        subscription = data
      }
    } catch {
      // Auth not configured or failed
    }
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
              href="/app"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Pricing
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-16">
        {user ? (
          /* Logged in view */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Account ID
                  </label>
                  <p className="text-gray-500 text-sm font-mono">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription
              </h2>

              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {subscription.status === 'active' ? 'Pro Plan' : 'Inactive'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {subscription.status}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>

                  {subscription.current_period_end && (
                    <p className="text-sm text-gray-500">
                      Current period ends:{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}

                  <ManageBillingButton />
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    You&apos;re on the free plan. Upgrade to Pro for real
                    deposit-backed sprints and cloud sync.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    View Plans
                  </Link>
                </div>
              )}
            </div>

            {/* Sign out */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SignOutSection />
            </div>
          </div>
        ) : (
          /* Not logged in */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-600">
                Sign up to sync your data across devices and unlock premium features.
              </p>
            </div>
            <div className="flex justify-center">
              <AuthForm redirectTo={searchParams.redirect} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function ManageBillingButton() {
  return (
    <form action="/api/stripe/portal" method="POST">
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <CreditCard className="h-4 w-4" />
        Manage Billing
      </button>
    </form>
  )
}

function SignOutSection() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign Out</h2>
      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 border border-danger-300 rounded-lg font-medium text-danger-600 hover:bg-danger-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </form>
    </div>
  )
}
