import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { env, features } from '@/lib/env'
import Stripe from 'stripe'

// Disable body parsing, we need raw body for signature verification
export const runtime = 'nodejs'

// Type for subscription with current_period_end
interface SubscriptionData {
  id: string
  status: string
  current_period_end?: number
  items: {
    data: Array<{
      price: {
        id: string
      }
    }>
  }
  metadata?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      console.log('Stripe not configured, acknowledging webhook')
      return NextResponse.json({ received: true })
    }

    // Read raw body
    const rawBody = await request.text()

    let event: Stripe.Event

    // Verify signature if webhook secret is present
    if (features.hasWebhookSecret) {
      const signature = request.headers.get('stripe-signature')
      if (!signature) {
        console.error('Missing Stripe signature')
        return NextResponse.json({ received: true })
      }

      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ received: true })
      }
    } else {
      // Parse without verification (less secure, but allows testing)
      try {
        event = JSON.parse(rawBody) as Stripe.Event
      } catch {
        console.error('Failed to parse webhook body')
        return NextResponse.json({ received: true })
      }
    }

    // Check if this event is for our app
    const metadata = (event.data.object as { metadata?: Record<string, string> })?.metadata
    if (metadata?.app_name && metadata.app_name !== 'stakes-goal-tracker') {
      // Not for us, acknowledge and ignore
      return NextResponse.json({ received: true })
    }

    // Handle events
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as unknown as SubscriptionData)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as unknown as SubscriptionData)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (err) {
      console.error('Error handling webhook event:', err)
      // Still return 200 to acknowledge receipt
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!features.hasServiceRole) {
    console.log('Service role not configured, skipping database update')
    return
  }

  const userId = session.metadata?.user_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId || userId === 'anonymous') {
    console.log('No user ID in session metadata')
    return
  }

  const supabase = await createServiceClient()

  // Get subscription details from Stripe
  const stripe = getStripe()
  if (!stripe) return

  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  // Cast to our flexible type
  const subscription = subscriptionResponse as unknown as SubscriptionData

  // Upsert subscription record
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Failed to upsert subscription:', error)
  } else {
    console.log('Subscription created/updated for user:', userId)
  }
}

async function handleSubscriptionUpdated(subscription: SubscriptionData) {
  if (!features.hasServiceRole) {
    console.log('Service role not configured, skipping database update')
    return
  }

  const userId = subscription.metadata?.user_id
  if (!userId || userId === 'anonymous') {
    console.log('No user ID in subscription metadata')
    return
  }

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription:', error)
  } else {
    console.log('Subscription updated:', subscription.id)
  }
}

async function handleSubscriptionDeleted(subscription: SubscriptionData) {
  if (!features.hasServiceRole) {
    console.log('Service role not configured, skipping database update')
    return
  }

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update canceled subscription:', error)
  } else {
    console.log('Subscription canceled:', subscription.id)
  }
}
