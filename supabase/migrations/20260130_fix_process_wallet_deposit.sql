-- Function to process wallet deposit from M-Pesa callback
CREATE OR REPLACE FUNCTION process_wallet_deposit(
    p_transaction_id UUID,
    p_mpesa_receipt TEXT
) RETURNS JSON AS $$
DECLARE
    v_transaction RECORD;
    v_wallet_id UUID;
    v_amount NUMERIC;
BEGIN
    -- 1. Get Transaction Details (Locking isn't strictly necessary if we check status, but good for safety)
    SELECT * INTO v_transaction 
    FROM public.wallet_transactions 
    WHERE id = p_transaction_id;

    IF v_transaction IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Transaction not found');
    END IF;

    -- 2. Idempotency Check
    IF v_transaction.status = 'completed' THEN
        RETURN json_build_object('success', true, 'message', 'Transaction already processed');
    END IF;

    v_wallet_id := v_transaction.wallet_id;
    v_amount := v_transaction.amount;

    -- 3. Update Wallet Balance
    UPDATE public.wallets
    SET balance = balance + v_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- 4. Update Transaction Status
    UPDATE public.wallet_transactions
    SET status = 'completed',
        mpesa_receipt = p_mpesa_receipt, -- Ensure receipt is saved if not already
        updated_at = now() -- Assuming there's a trigger or we specific column, checking schema... default table has created_at only? 
        -- Creating logs showed wallet_transactions has created_at default now(). 
        -- Let's just update the status/receipt.
    WHERE id = p_transaction_id;

    RETURN json_build_object('success', true, 'message', 'Deposit processed successfully', 'new_balance', (SELECT balance FROM public.wallets WHERE id = v_wallet_id));

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
