DO $$
DECLARE
    v_transaction_id UUID;
    v_wallet_id UUID;
    v_amount NUMERIC;
    v_mpesa_code TEXT := 'UAUBU5B89J'; -- The code you provided
BEGIN
    -- 1. Find the most recent pending deposit
    SELECT id, wallet_id, amount INTO v_transaction_id, v_wallet_id, v_amount
    FROM wallet_transactions
    WHERE status = 'pending' 
    AND reference_type = 'deposit'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_transaction_id IS NULL THEN
        RAISE NOTICE 'No pending deposit found to match. You may need to insert a new credit manually.';
        RETURN;
    END IF;

    -- 2. Update transaction to COMPLETED
    UPDATE wallet_transactions
    SET 
        status = 'completed',
        reference_id = v_mpesa_code,
        updated_at = now()
    WHERE id = v_transaction_id;

    -- 3. Credit Wallet Balance
    UPDATE wallets
    SET 
        balance = balance + v_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    RAISE NOTICE 'SUCCESS: Credited % KES to wallet % (Transaction ID: %)', v_amount, v_wallet_id, v_transaction_id;
END $$;
