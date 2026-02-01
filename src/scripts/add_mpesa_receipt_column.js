const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMpesaReceiptColumn() {
    console.log('--- Adding mpesa_receipt Column ---\n');

    try {
        // Add the column
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.wallet_transactions 
                ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;
                
                CREATE INDEX IF NOT EXISTS idx_wallet_transactions_mpesa_receipt 
                ON public.wallet_transactions(mpesa_receipt) 
                WHERE mpesa_receipt IS NOT NULL;
            `
        });

        if (error) {
            // If RPC doesn't exist, try direct query
            console.log('RPC not available, trying direct approach...');
            
            const { error: alterError } = await supabase
                .from('wallet_transactions')
                .select('mpesa_receipt')
                .limit(1);
            
            if (alterError && alterError.message.includes('column "mpesa_receipt" does not exist')) {
                console.error('❌ Column does not exist and cannot be added via client.');
                console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
                console.log('   1. Go to https://supabase.com/dashboard');
                console.log('   2. Open SQL Editor');
                console.log('   3. Run this SQL:\n');
                console.log('ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;');
                console.log('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_mpesa_receipt ON public.wallet_transactions(mpesa_receipt) WHERE mpesa_receipt IS NOT NULL;');
                process.exit(1);
            } else {
                console.log('✅ Column already exists!');
            }
        } else {
            console.log('✅ Column added successfully!');
        }

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addMpesaReceiptColumn();
