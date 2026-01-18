# Stakes Goal Tracker

Proof-of-Ship accountability tool for indie builders that verifies weekly shipping via GitHub Releases and runs refundable 4-week deposit sprints (deposit refunded on success; otherwise donated), with a soft, signup-optional trial using localStorage.

## Features

- **GitHub Release Verification**: Automatically verify shipping by checking GitHub Releases
- **Flexible Weekly Cutoffs**: Set your own timezone, day, and time for weekly deadlines
- **4-Week Scorecard**: Track your shipping streak over the last 4 weeks
- **Manual Evidence Links**: Add links to blog posts, tweets, or demos when releases aren't available
- **Local-First**: Try the full experience without signup - data stored in localStorage
- **Cloud Sync**: Create an account to sync across devices and unlock premium features
- **Deposit-Backed Sprints**: Real money stakes for maximum accountability (Pro feature)

## File Structure

```
stakes-goal-tracker/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles
│   ├── app/
│   │   └── page.tsx            # Core app experience
│   ├── pricing/
│   │   └── page.tsx            # Pricing page
│   ├── account/
│   │   └── page.tsx            # Account management
│   ├── admin/
│   │   └── page.tsx            # Admin console (if ADMIN_EMAILS set)
│   ├── auth/
│   │   ├── callback/route.ts   # Auth callback handler
│   │   └── signout/route.ts    # Sign out handler
│   └── api/
│       └── stripe/
│           ├── checkout/route.ts   # Create checkout session
│           ├── portal/route.ts     # Create billing portal session
│           └── webhook/route.ts    # Stripe webhook handler
├── components/
│   ├── TryNowButton.tsx        # CTA button for landing
│   ├── RepoPicker.tsx          # GitHub repo URL input
│   ├── Scorecard.tsx           # Weekly shipping scorecard
│   ├── EvidenceModal.tsx       # Add evidence link modal
│   ├── CutoffSettings.tsx      # Configure cutoff day/time
│   ├── AuthForm.tsx            # Sign in/up form
│   ├── AuthGateSoftPrompt.tsx  # Soft prompt to create account
│   └── PricingCards.tsx        # Pricing tier cards
├── lib/
│   ├── env.ts                  # Environment variables & feature flags
│   ├── utils.ts                # Utility functions (cn)
│   ├── github.ts               # GitHub API for releases
│   ├── time.ts                 # Week window calculations
│   ├── storage.ts              # localStorage schema & helpers
│   ├── stripe.ts               # Server-side Stripe client
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       ├── server.ts           # Server Supabase client
│       └── middleware.ts       # Auth session middleware
├── supabase/
│   ├── schema.sql              # Full schema reference
│   ├── rls.sql                 # RLS policies reference
│   └── migrations/
│       └── 0001_init.sql       # Initial migration
├── middleware.ts               # Next.js middleware for auth
├── tailwind.config.ts          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies
```

## Database Schema

```sql
-- Profiles (extends auth.users)
profiles (
  user_id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ
)

-- Commitments (repo tracking settings)
commitments (
  id UUID PRIMARY KEY,
  user_id UUID,
  repo_owner TEXT,
  repo_name TEXT,
  timezone TEXT,
  cutoff_dow INTEGER (0-6),
  cutoff_time TEXT (HH:MM),
  tag_pattern TEXT,
  created_at TIMESTAMPTZ
)

-- Weeks (weekly shipping status)
weeks (
  id UUID PRIMARY KEY,
  commitment_id UUID,
  week_start TIMESTAMPTZ,
  week_end TIMESTAMPTZ,
  status TEXT (pass|fail|grace|pending),
  proof JSONB,
  evidence_url TEXT,
  note TEXT,
  evaluated_at TIMESTAMPTZ
)

-- Subscriptions (Stripe subscriptions)
subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Admin Overrides (optional)
admin_overrides (
  id UUID PRIMARY KEY,
  week_id UUID,
  admin_email TEXT,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ
)
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Create Stripe billing portal session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/auth/callback` | GET | Handle auth callback from Supabase |
| `/auth/signout` | POST | Sign out user |

## UI Pages

| Path | Description |
|------|-------------|
| `/` | Landing page with value prop and "Try it now" CTA |
| `/app` | Core app: repo setup, scorecard, evidence links |
| `/pricing` | Pricing tiers with upgrade buttons |
| `/account` | Sign up/in, manage subscription |
| `/admin` | Admin console (only if ADMIN_EMAILS set) |

## Environment Variables

### Required (from Vercel shared env)

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (client)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role (server only)
STRIPE_SECRET_KEY=              # Stripe secret key (server only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe publishable key (client)
DATABASE_URL=                   # PostgreSQL connection string
```

### App-Specific

```env
NEXT_PUBLIC_APP_URL=https://stakes-goal-tracker.vercel.app
```

### Optional (feature flags)

```env
STRIPE_WEBHOOK_SECRET=          # Enables webhook signature verification
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=      # Enables Pro upgrade button
NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID= # Enables Pro+ upgrade button
ADMIN_EMAILS=admin@example.com  # Comma-separated, enables /admin
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Deploy to Vercel

```bash
# Initial deploy
npx vercel --yes

# Production deploy
npx vercel --prod

# Link to git
vercel git connect
```

### Run Supabase Migrations

Connect to your Supabase database and run:

```bash
psql $DATABASE_URL -f supabase/migrations/0001_init.sql
```

Or use the Supabase dashboard to run the migration SQL.

## Local-First Trial

The app is fully functional without signup for 3-5 minutes of engagement:

1. User enters a public GitHub repo URL
2. Releases are fetched from GitHub public API
3. Scorecard shows last 4 weeks based on release dates
4. User can add manual evidence links
5. All data stored in localStorage (`sgt_v1` key)

After meaningful engagement (repo selected + releases fetched or evidence added), a soft prompt appears encouraging account creation.

## Data Migration

When a user signs up or logs in:

1. Check localStorage for existing data
2. Create commitment and weeks in Supabase
3. Mark localStorage as migrated (keeps backup)
4. Future visits use Supabase data

## Services

### Active (from available env vars)

- **Supabase**: Database, Auth, Row Level Security
- **Stripe**: Subscriptions, Checkout, Billing Portal
- **GitHub Public API**: Release verification (no auth required)
- **Vercel**: Hosting, Edge Functions

### Inactive (needs setup)

- **Stripe Price IDs**: Set `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` and `NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID` to enable upgrade buttons
- **Admin Console**: Set `ADMIN_EMAILS` to enable admin features
- **Webhook Signature Verification**: Set `STRIPE_WEBHOOK_SECRET` for secure webhook handling

## License

MIT
