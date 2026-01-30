const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking Referrals System Database Structure...');

    try {
        // Check if tables exist and counts
        const tables = ['profiles', 'referrals', 'referral_codes', 'withdrawals'];
        for (const table of tables) {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ Table "${table}": ${error.message}`);
            } else {
                console.log(`✅ Table "${table}" has ${count} records.`);
            }
        }

        // Check columns of referrals
        console.log('\n📊 Referrals Table (Last 5):');
        const { data: refSample, error: refError } = await supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(5);
        if (refError) {
            console.log(`❌ Error fetching referrals: ${refError.message}`);
        } else {
            console.log(JSON.stringify(refSample, null, 2));
        }

        // Check columns of referral_codes
        console.log('\n📊 Referral Codes Table (Last 5):');
        const { data: codeSample, error: codeError } = await supabase.from('referral_codes').select('*').order('created_at', { ascending: false }).limit(5);
        if (codeError) {
            console.log(`❌ Error fetching referral_codes: ${codeError.message}`);
        } else {
            console.log(JSON.stringify(codeSample, null, 2));
        }

    } catch (err) {
        console.error('💥 Error:', err.message);
    }
}

checkDatabase();
