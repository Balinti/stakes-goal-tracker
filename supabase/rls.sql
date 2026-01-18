-- Row Level Security Policies for Stakes Goal Tracker

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

-- Note: Insert/Update for subscriptions is done via service role in webhooks
-- Users cannot directly modify their subscription

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

-- Note: Insert/Update for admin_overrides is done via service role
