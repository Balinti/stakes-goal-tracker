-- Stakes Goal Tracker Database Schema
-- This file is for reference. Run migrations for actual deployment.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  cutoff_dow INTEGER NOT NULL DEFAULT 0 CHECK (cutoff_dow >= 0 AND cutoff_dow <= 6),
  cutoff_time TEXT NOT NULL DEFAULT '23:59',
  tag_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weeks table
CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'grace', 'pending')),
  proof JSONB,
  evidence_url TEXT,
  note TEXT,
  evaluated_at TIMESTAMPTZ,
  UNIQUE(commitment_id, week_start, week_end)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin overrides table (optional)
CREATE TABLE IF NOT EXISTS admin_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commitments_user_id ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_weeks_commitment_id ON weeks(commitment_id);
CREATE INDEX IF NOT EXISTS idx_weeks_status ON weeks(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
