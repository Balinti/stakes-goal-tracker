-- Stakes Goal Tracker - Initial Migration
-- Run this migration to set up the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

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

-- Admin overrides table
CREATE TABLE IF NOT EXISTS admin_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commitments_user_id ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_weeks_commitment_id ON weeks(commitment_id);
CREATE INDEX IF NOT EXISTS idx_weeks_status ON weeks(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Commitments policies
CREATE POLICY "Users can view own commitments" ON commitments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments" ON commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments" ON commitments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments" ON commitments
  FOR DELETE USING (auth.uid() = user_id);

-- Weeks policies
CREATE POLICY "Users can view own weeks" ON weeks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = weeks.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own weeks" ON weeks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = weeks.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own weeks" ON weeks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = weeks.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own weeks" ON weeks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM commitments
      WHERE commitments.id = weeks.commitment_id
      AND commitments.user_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin overrides policies
CREATE POLICY "Users can view overrides for their weeks" ON admin_overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weeks
      JOIN commitments ON commitments.id = weeks.commitment_id
      WHERE weeks.id = admin_overrides.week_id
      AND commitments.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
