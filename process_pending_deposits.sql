-- ============================================================
-- RETROACTIVE WALLET DEPOSIT PROCESSING
-- This script processes all pending transactions that have 
-- M-Pesa receipts (meaning payment went through successfully)
-- ============================================================

-- Step 1: View all pending transactions with receipts
SELECT 
    id,
    created_at,
    amount,
    status,
    mpesa_receipt
FROM public.wallet_transactions
WHERE status = 'pending' 
  AND mpesa_receipt IS NOT NULL
  AND mpesa_receipt NOT LIKE 'ws_CO_%'  -- Exclude CheckoutRequestIDs
ORDER BY created_at ASC;

-- Step 2: Process each pending transaction
-- This will update the balance and mark as completed
DO $$
DECLARE
    tx RECORD;
    result JSON;
BEGIN
    FOR tx IN 
        SELECT id, mpesa_receipt
        FROM public.wallet_transactions
        WHERE status = 'pending' 
          AND mpesa_receipt IS NOT NULL
          AND mpesa_receipt NOT LIKE 'ws_CO_%'  -- Only real receipts
    LOOP
        -- Call the RPC function for each transaction
        SELECT process_wallet_deposit(tx.id, tx.mpesa_receipt) INTO result;
        
        -- Log the result
        RAISE NOTICE 'Transaction %: %', tx.id, result;
    END LOOP;
END $$;

-- Step 3: Verify the results
-- Check updated balance
SELECT 
    w.id AS wallet_id,
    w.balance,
    w.updated_at,
    COUNT(wt.id) AS completed_transactions,
    SUM(wt.amount) AS total_deposited
FROM public.wallets w
LEFT JOIN public.wallet_transactions wt ON wt.wallet_id = w.id AND wt.status = 'completed'
GROUP BY w.id, w.balance, w.updated_at;

-- Check any remaining pending transactions
SELECT 
    COUNT(*) as pending_count,
    SUM(amount) as pending_amount
FROM public.wallet_transactions
WHERE status = 'pending';
