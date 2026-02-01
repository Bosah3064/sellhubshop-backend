-- ============================================================
-- PART 1: SYNCHRONIZATION (Apply the Fix)
-- Run this part to ensure the logic exists in your database.
-- ============================================================

DROP FUNCTION IF EXISTS process_wallet_deposit;

CREATE OR REPLACE FUNCTION process_wallet_deposit(p_transaction_id uuid, p_mpesa_receipt text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
  v_amount numeric;
  v_status text;
BEGIN
  -- 1. Get transaction details
  SELECT wallet_id, amount, status INTO v_wallet_id, v_amount, v_status
  FROM public.wallet_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Transaction not found');
  END IF;

  -- 2. Idempotency check
  IF v_status = 'completed' THEN
    RETURN json_build_object('success', true, 'message', 'Already completed');
  END IF;

  -- 3. Update Wallet Balance
  UPDATE public.wallets
  SET balance = balance + v_amount,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- 4. Mark Transaction as Completed
  UPDATE public.wallet_transactions
  SET status = 'completed',
      mpesa_receipt = p_mpesa_receipt
  WHERE id = p_transaction_id;

  RETURN json_build_object('success', true, 'new_balance', (SELECT balance FROM public.wallets WHERE id = v_wallet_id));
END;
$$;

-- ============================================================
-- PART 2: VERIFICATION (View the Data Output)
-- Run these queries to see your latest transactions and balance.
-- ============================================================

-- 1. View the last 10 Transactions (Check status and IDs)
SELECT 
    id AS transaction_id, 
    created_at, 
    amount, 
    status, 
    type, 
    mpesa_receipt
FROM public.wallet_transactions
ORDER BY created_at DESC
LIMIT 10;

-- 2. View Wallet Balances (for wallets associated with recent transactions)
SELECT 
    w.id AS wallet_id, 
    w.user_id, 
    w.balance, 
    w.updated_at
FROM public.wallets w
WHERE w.id IN (
    SELECT wallet_id 
    FROM public.wallet_transactions 
    ORDER BY created_at DESC 
    LIMIT 10
);
