// Load SERVICE ROLE key for update
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser(id) {
    console.log(`\n� Fixing user ID: "${id}"`);
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('❌ Error finding user:', error.message);
        return;
    }

    const currentParams = data.username;
    const trimmed = currentParams.trim();

    if (currentParams === trimmed) {
        console.log('✅ Username is already trimmed:', currentParams);
        return;
    }

    console.log(`⚠️  Username has whitespace: "${currentParams}"`);
    console.log(`🛠️  Updating to: "${trimmed}"`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', id);

    if (updateError) {
        console.error('❌ Update failed:', updateError.message);
    } else {
        console.log('✅ Update successful! Try the link now.');
    }
}

if (process.argv[2]) {
    fixUser(process.argv[2]);
}
