-- Add credits to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;

-- Credit transaction log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,  -- negative = deduction, positive = purchase/refund
  reason TEXT NOT NULL,      -- 'scan', 'refund', 'purchase', 'bonus'
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(user_id, created_at DESC);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
