import Link from 'next/link'
import { Target, ArrowLeft } from 'lucide-react'
import { PricingCards } from '@/components/PricingCards'
import { createClient } from '@/lib/supabase/server'
import { env, features } from '@/lib/env'

export default async function PricingPage() {
  let userId: string | null = null
  let hasSubscription = false

  // Try to get user session if Supabase is configured
  if (features.hasSupabase) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null

      if (userId) {
        // Check for existing subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()

        hasSubscription = !!subscription
      }
    } catch {
      // Auth not available or failed
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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
              href="/account"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Account
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you&apos;re ready for real accountability.
            All plans include unlimited release checks.
          </p>
        </div>

        <PricingCards
          proPriceId={env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null}
          proPlusPriceId={env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || null}
          userId={userId}
          hasSubscription={hasSubscription}
        />

        <div className="mt-16 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                What counts as &quot;shipping&quot;?
              </h3>
              <p className="text-gray-600 text-sm">
                Publishing a GitHub Release on your connected repository. This
                includes tagged releases, pre-releases, and standard releases.
                We check for non-draft releases only.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                What if I can&apos;t ship a release but still worked?
              </h3>
              <p className="text-gray-600 text-sm">
                You can add a &quot;grace&quot; evidence link pointing to a blog post,
                tweet, demo video, or any proof of work. Grace weeks don&apos;t count
                against your sprint.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                How do deposit-backed sprints work?
              </h3>
              <p className="text-gray-600 text-sm">
                In Pro, you can optionally start a 4-week sprint with a deposit.
                Ship all 4 weeks and it&apos;s refunded. Miss a week without grace
                evidence and it&apos;s forfeited (donated to charity in the future).
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes. You can cancel your subscription at any time from your
                account page. You&apos;ll keep access until the end of your billing
                period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Questions? Reach out on{' '}
            <a href="https://twitter.com" className="text-primary-600 hover:underline">
              Twitter
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}
