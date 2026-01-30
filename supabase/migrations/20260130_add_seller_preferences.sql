-- Add payment preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_preference TEXT DEFAULT 'wallet' CHECK (payment_preference IN ('wallet', 'mpesa')),
ADD COLUMN IF NOT EXISTS mpesa_phone TEXT;
