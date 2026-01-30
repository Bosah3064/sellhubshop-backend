-- Allow 'deposit' as a reference_type in wallet_transactions
ALTER TABLE public.wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_reference_type_check;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_reference_type_check 
CHECK (reference_type IN ('order', 'withdrawal', 'refund', 'referral', 'subscription', 'deposit'));

-- Function to process a successful wallet deposit from M-Pesa
CREATE OR REPLACE FUNCTION process_wallet_deposit(
    p_transaction_id UUID,
    p_mpesa_receipt TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
    v_wallet_id UUID;
    v_amount NUMERIC;
BEGIN
    -- 1. Get the pending transaction
    SELECT * INTO v_transaction
    FROM public.wallet_transactions
    WHERE id = p_transaction_id
    AND status = 'pending'
    AND type = 'credit'
    AND reference_type = 'deposit'
    FOR UPDATE; -- Lock the row

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Pending deposit transaction not found or already processed.'
        );
    END IF;

    v_wallet_id := v_transaction.wallet_id;
    v_amount := v_transaction.amount;

    -- 2. Update the transaction status
    UPDATE public.wallet_transactions
    SET 
        status = 'completed',
        reference_id = p_mpesa_receipt, -- Store M-Pesa Receipt Number
        updated_at = now()
    WHERE id = p_transaction_id;

    -- 3. Credit the wallet balance
    UPDATE public.wallets
    SET 
        balance = balance + v_amount,
        updated_at = now()
    WHERE id = v_wallet_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Deposit processed successfully.',
        'new_balance', (SELECT balance FROM public.wallets WHERE id = v_wallet_id)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', SQLERRM
    );
END;
$$;
