import Stripe from 'stripe'
import { env } from '@/lib/env'

// Server-side only Stripe client
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    return null
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })
}

// Verify this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported server-side')
}
