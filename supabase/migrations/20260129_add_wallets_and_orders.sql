-- Create Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC(20, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'KSh' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Wallet Transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('order', 'withdrawal', 'refund', 'referral', 'subscription')),
    reference_id TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create User Addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    region TEXT NOT NULL, -- e.g., Nairobi, Mombasa
    city TEXT NOT NULL, -- e.g., Westlands, Nyali
    address_details TEXT NOT NULL, -- Street, Apartment, etc.
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Marketplace Orders table
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(20, 2) NOT NULL,
    delivery_address_id UUID REFERENCES public.user_addresses(id) ON DELETE SET NULL,
    delivery_fee NUMERIC(20, 2) DEFAULT 0.00 NOT NULL,
    delivery_status TEXT DEFAULT 'pending' NOT NULL CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'returned')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'wallet')),
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    transaction_id TEXT, -- M-Pesa CheckoutRequestID
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price_at_purchase NUMERIC(20, 2) NOT NULL,
    total_price NUMERIC(20, 2) NOT NULL,
    disbursement_status TEXT DEFAULT 'pending' NOT NULL CHECK (disbursement_status IN ('pending', 'completed', 'held')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Wallets: Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Wallet Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets 
            WHERE wallets.id = wallet_transactions.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

-- User Addresses: Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON public.user_addresses
    FOR ALL USING (auth.uid() = user_id);

-- Marketplace Orders: Buyers can view their own orders
CREATE POLICY "Buyers can view own orders" ON public.marketplace_orders
    FOR SELECT USING (auth.uid() = buyer_id);

-- Order Items: Buyers and Sellers can view items
CREATE POLICY "Users can view relevant order items" ON public.order_items
    FOR SELECT USING (
        auth.uid() = seller_id OR 
        EXISTS (
            SELECT 1 FROM public.marketplace_orders 
            WHERE marketplace_orders.id = order_items.order_id 
            AND marketplace_orders.buyer_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
