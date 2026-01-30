-- Add mpesa_receipt column to wallet_transactions table
-- This column stores the M-Pesa CheckoutRequestID for matching callbacks

ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

-- Create index for faster callback lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_mpesa_receipt 
ON public.wallet_transactions(mpesa_receipt) 
WHERE mpesa_receipt IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.wallet_transactions.mpesa_receipt IS 'M-Pesa CheckoutRequestID for matching payment callbacks';
