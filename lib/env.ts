// Environment variables and feature flags
// All env vars are typed and feature-flagged

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Price IDs (optional - feature flags)
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID || '',

  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://stakes-goal-tracker.vercel.app',

  // Admin
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || '',
}

// Feature flags based on env vars
export const features = {
  hasSupabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  hasStripe: Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  hasProPricing: Boolean(env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID),
  hasProPlusPricing: Boolean(env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID),
  hasWebhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
  hasServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  hasAdmin: Boolean(env.ADMIN_EMAILS),
}

// Get admin emails as array
export function getAdminEmails(): string[] {
  if (!env.ADMIN_EMAILS) return []
  return env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
}

// Check if email is admin
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const admins = getAdminEmails()
  return admins.includes(email.toLowerCase())
}
