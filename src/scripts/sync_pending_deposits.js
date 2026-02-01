const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPendingDeposits() {
    console.log('--- Wallet Deposit Sync Tool ---');
    console.log('Finding all pending deposit transactions...\n');

    try {
        // Get all pending deposit transactions
        const { data: pendingDeposits, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('status', 'pending')
            .eq('reference_type', 'deposit')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!pendingDeposits || pendingDeposits.length === 0) {
            console.log('✅ No pending deposits found. All transactions are processed!');
            return;
        }

        console.log(`Found ${pendingDeposits.length} pending deposit(s):\n`);

        for (const tx of pendingDeposits) {
            console.log(`Transaction ID: ${tx.id}`);
            console.log(`  Amount: ${tx.amount} KES`);
            console.log(`  Created: ${new Date(tx.created_at).toLocaleString()}`);
            console.log(`  M-Pesa Receipt: ${tx.mpesa_receipt || 'Not set'}`);
            console.log(`  Reference ID: ${tx.reference_id || 'Not set'}`);
            
            // Check if this transaction has a valid M-Pesa receipt
            if (tx.mpesa_receipt && tx.mpesa_receipt.startsWith('ws_CO_')) {
                console.log(`  ⚠️  Has CheckoutRequestID but still pending - likely payment was successful`);
                console.log(`  💡 Attempting to process...`);
                
                // Try to process it
                const { data: result, error: processError } = await supabase.rpc('process_wallet_deposit', {
                    p_transaction_id: tx.id,
                    p_mpesa_receipt: tx.mpesa_receipt
                });

                if (processError) {
                    console.log(`  ❌ Error: ${processError.message}`);
                } else {
                    console.log(`  ✅ Successfully processed!`);
                }
            } else {
                console.log(`  ℹ️  No M-Pesa receipt - user likely cancelled or didn't complete payment`);
            }
            console.log('');
        }

        console.log('\n--- Sync Complete ---');
        console.log('Check your wallet balance to verify the updates.');

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

syncPendingDeposits();
