-- Allow authenticated users to insert orders
CREATE POLICY "Users can create orders" ON public.marketplace_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Allow authenticated users to insert order items
CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.marketplace_orders 
            WHERE marketplace_orders.id = order_items.order_id 
            AND marketplace_orders.buyer_id = auth.uid()
        )
    );
