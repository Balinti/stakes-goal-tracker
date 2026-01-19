import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { env, features } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    // Get price ID from request
    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get user if authenticated
    let userId: string | null = null
    let email: string | undefined = undefined

    if (features.hasSupabase) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
        email = user?.email || undefined
      } catch {
        // User not authenticated
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      customer_email: email,
      metadata: {
        app_name: 'stakes-goal-tracker',
        user_id: userId || 'anonymous',
      },
      subscription_data: {
        metadata: {
          app_name: 'stakes-goal-tracker',
          user_id: userId || 'anonymous',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
