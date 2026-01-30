-- Auto-create wallets for all users
-- This migration ensures every user has a wallet automatically

-- Function to create wallet for a user
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Create wallet for new profile with KSh currency
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'KSh')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_wallet_trigger ON public.profiles;

-- Create trigger to auto-create wallet on profile creation
CREATE TRIGGER auto_create_wallet_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

-- Backfill wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, balance, currency)
SELECT id, 0, 'KSh'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

-- Log the number of wallets created
DO $$
DECLARE
  wallet_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO wallet_count FROM public.wallets;
  RAISE NOTICE 'Total wallets in system: %', wallet_count;
END $$;
