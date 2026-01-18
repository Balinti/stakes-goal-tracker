'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  priceId: string | null
  popular?: boolean
}

interface PricingCardsProps {
  proPriceId: string | null
  proPlusPriceId: string | null
  userId?: string | null
  hasSubscription?: boolean
}

export function PricingCards({
  proPriceId,
  proPlusPriceId,
  userId,
  hasSubscription,
}: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const tiers: PricingTier[] = [
    {
      name: 'Free',
      price: '$0',
      description: 'Try before you commit',
      features: [
        'Track 1 repository',
        'View 4-week scorecard',
        'Simulated sprints',
        'Manual evidence links',
        'Local storage only',
      ],
      priceId: null,
    },
    {
      name: 'Pro',
      price: '$9/mo',
      description: 'For serious shippers',
      features: [
        'Track unlimited repos',
        'Cloud sync across devices',
        'Real deposit-backed sprints',
        'Email reminders (coming soon)',
        'Priority support',
      ],
      priceId: proPriceId,
      popular: true,
    },
    {
      name: 'Pro+',
      price: '$19/mo',
      description: 'Maximum accountability',
      features: [
        'Everything in Pro',
        'Team accountability',
        'Custom cutoff schedules',
        'API access',
        'Dedicated support',
      ],
      priceId: proPlusPriceId,
    },
  ]

  const handleUpgrade = async (tier: PricingTier) => {
    if (!tier.priceId) return

    if (!userId) {
      // Redirect to account page to sign up first
      window.location.href = '/account?redirect=pricing'
      return
    }

    setLoadingTier(tier.name)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: tier.priceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={cn(
            'relative rounded-2xl border p-6',
            tier.popular
              ? 'border-primary-500 bg-primary-50 shadow-lg'
              : 'border-gray-200 bg-white'
          )}
        >
          {tier.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
              Most Popular
            </span>
          )}

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{tier.description}</p>
          </div>

          <ul className="space-y-3 mb-6">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {tier.name === 'Free' ? (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-500 cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : tier.priceId ? (
            <button
              onClick={() => handleUpgrade(tier)}
              disabled={loadingTier !== null || hasSubscription}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg font-medium transition-colors',
                tier.popular
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800',
                (loadingTier !== null || hasSubscription) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loadingTier === tier.name ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : hasSubscription ? (
                'Already subscribed'
              ) : (
                `Upgrade to ${tier.name}`
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-lg font-medium border border-gray-300 text-gray-500 cursor-not-allowed"
            >
              Coming Soon
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
