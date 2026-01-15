const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupWithdrawalsTable() {
    console.log('🚀 Setting up withdrawals table...');

    try {
        // We'll use a series of RPC calls or raw SQL if supported
        // Since we don't have a direct "run raw sql" RPC by default in all Supabase setups
        // We'll attempt to create it via the REST API if possible, or just log the SQL
        // Actually, usually we can use `supabase.rpc()` if we have a custom function.
        // For this environment, I'll attempt the creation by checking if it exists first.

        // A more reliable way in this specific environment is to use the terminal to run a psql-like command 
        // but we don't have psql. So we'll provide the SQL and attempt to use a migration-like approach.

        // Let's try to just use the `supabase.from('withdrawals').select('*').limit(1)` to see if it exists.
        const { error: checkError } = await supabase.from('withdrawals').select('*').limit(1);

        if (checkError && checkError.code === '42P01') { // undefined_table
            console.log('📝 Table "withdrawals" does not exist. Please run the SQL in your Supabase SQL Editor:');
            console.log(`
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method TEXT DEFAULT 'mpesa',
  account_details JSONB,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals" ON public.withdrawals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
      `);
        } else if (!checkError) {
            console.log('✅ Withdrawals table already exists.');
        } else {
            console.error('❌ Error checking table:', checkError.message);
        }

    } catch (err) {
        console.error('💥 Unexpected error:', err.message);
    }
}

setupWithdrawalsTable();
