const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Load from backend/

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
    "test": "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
    "Silver": "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
    "Gold": "f34c0928-7494-46a6-9ff9-c4d498818297"
};

const reverseMapping = {
    "ceb71ae1-caaa-44df-8b1a-62daa6a2938e": "free",
    "0b922be5-91b7-46c7-8ac9-2c0a95e32593": "silver",
    "f34c0928-7494-46a6-9ff9-c4d498818297": "gold"
};

async function fixSubscriptions() {
    console.log("--- 🛠️ Repairing Historical Subscriptions ---");

    const targetUserId = "c12a1d8d-b380-4e44-b39b-51ad55c71fa1";
    const { data: userSubs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

    if (subError) {
        console.error("Error fetching subscriptions:", subError.message);
        return;
    }

    console.log(`Found ${userSubs.length} subscriptions for user ${targetUserId}.`);

    let highestPlan = 'free';
    const planPriority = { 'gold': 3, 'silver': 2, 'free': 1, 'test': 0 };

    for (const sub of userSubs) {
        process.stdout.write(`\nProcessing Sub ${sub.id} (Plan: ${sub.plan_id}, Status: ${sub.status})... `);

        try {
            const mappedPlanName = reverseMapping[sub.plan_id] || sub.plan_id;

            // Track highest plan for final sync if subscription was successful/active
            if (sub.status === 'active' || sub.status === 'completed') {
                if (planPriority[mappedPlanName] > planPriority[highestPlan]) {
                    highestPlan = mappedPlanName;
                }
            }

            // 1. Repair Subscription Status if it was supposed to be active
            if (sub.status === 'pending' || sub.status === 'active') {
                const { error: subUpdateError } = await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        confirmed_at: sub.confirmed_at || new Date().toISOString(),
                        activated_at: sub.activated_at || new Date().toISOString()
                    })
                    .eq('id', sub.id);

                if (subUpdateError) process.stdout.write(`SubX `);
                else process.stdout.write(`SubOk `);
            }

            // 2. Map status for billing history
            let historyStatus = 'completed';
            if (sub.status === 'canceled' || sub.status === 'cancelled') historyStatus = 'canceled';
            else if (sub.status === 'failed' || sub.status === 'failure') historyStatus = 'failed';
            else if (sub.status === 'pending') historyStatus = 'pending';

            // 3. Migrate to billing_history (Upsert all)
            const { error: billingError } = await supabase
                .from('billing_history')
                .upsert({
                    id: sub.id,
                    user_id: sub.user_id,
                    amount: sub.amount,
                    currency: sub.currency || 'KES',
                    status: historyStatus,
                    description: `Subscription to ${mappedPlanName} plan`,
                    payment_method: 'mpesa',
                    created_at: sub.created_at
                }, { onConflict: 'id' });

            if (billingError) process.stdout.write(`BillX `);
            else process.stdout.write(`BillOk `);

        } catch (e) {
            process.stdout.write(`Error: ${e.message}`);
        }
    }

    // Final Sync: Update Profile and User_Plan to the HIGHEST plan found
    console.log(`\n\nFinal Sync: Setting User ${targetUserId} to ${highestPlan} plan...`);

    if (highestPlan !== 'free') {
        const targetPlanUuid = planMapping[highestPlan];

        // Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ plan_type: highestPlan })
            .eq('id', targetUserId);

        if (profileError) console.error("Profile update failed:", profileError.message);
        else console.log("Profile updated to '" + highestPlan + "' successfully.");

        // Update User Plan
        await supabase.from('user_plans').delete().eq('user_id', targetUserId);
        const { error: userPlanError } = await supabase
            .from('user_plans')
            .insert({
                id: require('crypto').randomUUID(),
                user_id: targetUserId,
                plan_id: targetPlanUuid,
                status: 'active',
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

        if (userPlanError) console.error("User plan update failed:", userPlanError.message);
        else console.log("User plan updated successfully.");
    }

    console.log("\n✅ Repair Complete!");
}

fixSubscriptions();
