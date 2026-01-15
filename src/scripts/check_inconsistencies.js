const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Load from current directory (backend/)

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const planMapping = {
    "free": "ceb71ae1-caaa-44df-8b1a-62daa6a2938e",
    "silver": "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
    "gold": "f34c0928-7494-46a6-9ff9-c4d498818297",
    "Starter": "ceb71ae1-caaa-44df-8b1a-62daa6a2938e",
    "Professional": "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
    "Enterprise": "f34c0928-7494-46a6-9ff9-c4d498818297",
    "test": "0b922be5-91b7-46c7-8ac9-2c0a95e32593" // Map test to silver for now
};

async function diagnose() {
    console.log("--- 🕵️ Database Subscription Diagnosis ---");

    // Fetch all active subscriptions
    const { data: activeSubs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

    if (subError) {
        console.error("Error fetching subscriptions:", subError.message);
        return;
    }

    console.log(`Found ${activeSubs.length} active subscriptions.`);

    for (const sub of activeSubs) {
        console.log(`\nChecking Sub ID: ${sub.id} | User: ${sub.user_id} | Plan: ${sub.plan_id}`);

        const targetPlanUuid = planMapping[sub.plan_id] || sub.plan_id;

        // 1. Check Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', sub.user_id)
            .single();

        console.log(`- Profile Plan Type: ${profile?.plan_type}`);
        if (profile?.plan_type !== sub.plan_id) {
            console.log(`  ⚠️ MISMATCH: Profile has '${profile?.plan_type}', expected '${sub.plan_id}'`);
        }

        // 2. Check User Plans (without ambiguous join)
        const { data: userPlans } = await supabase
            .from('user_plans')
            .select('*')
            .eq('user_id', sub.user_id)
            .eq('status', 'active');

        if (!userPlans || userPlans.length === 0) {
            console.log(`  ⚠️ MISSING: No active record in 'user_plans' for this user.`);
        } else {
            userPlans.forEach(up => {
                console.log(`- Active 'user_plans' entry: Plan UUID ${up.plan_id}`);
                if (up.plan_id !== targetPlanUuid) {
                    console.log(`  ⚠️ MISMATCH: user_plans plan_id (${up.plan_id}) does not match mapped UUID (${targetPlanUuid})`);
                }
            });
        }
    }

    // Fetch Master Plans
    console.log("\n--- 📋 Master Plans List ---");
    const { data: plans } = await supabase.from('plans').select('*');
    plans?.forEach(p => console.log(`- ${p.id}: ${p.name} (Limit: ${p.features?.product_limit})`));
}

diagnose();
