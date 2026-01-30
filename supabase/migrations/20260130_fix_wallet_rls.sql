-- Allow users to insert pending deposit transactions for their own wallet
CREATE POLICY "Users can create pending transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (
        status = 'pending' AND 
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = wallet_transactions.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

-- Allow users to update their own pending transactions (e.g. cancelling)
CREATE POLICY "Users can update own pending transactions" ON public.wallet_transactions
    FOR UPDATE USING (
        status = 'pending' AND 
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = wallet_transactions.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );
