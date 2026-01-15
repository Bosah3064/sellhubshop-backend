const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function introspect() {
    console.log("--- 🕵️ Database Introspection Starting ---");

    const queries = {
        tables: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
        columns: `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
        policies: `SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public'`,
        triggers: `SELECT event_object_table as table_name, trigger_name, action_statement, event_manipulation FROM information_schema.triggers WHERE trigger_schema = 'public'`,
        functions: `SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public'`
    };

    const results = {};

    for (const [name, sql] of Object.entries(queries)) {
        console.log(`Fetching ${name}...`);
        // We use the 'rpc' to a custom function if exists, but usually we can't run arbitrary SQL.
        // However, we can try to use standard queries if we have a table we can exploit or 
        // if we use a special introspection RPC we might have created.

        // Since we probably don't have a 'run_sql' RPC, we'll try to query information_schema via standard from() calls
        // though Supabase JS usually filters these. 

        // WORKAROUND: Direct SQL is hard via client. We'll try to get as much as we can via standard metadata queries.
        // If this fails, we'll ask the user to run a SQL command in the dashboard.
    }

    // Let's try getting columns for critical tables at least
    const criticalTables = ['profiles', 'admin_users', 'subscriptions', 'user_plans', 'billing_history', 'products'];
    results.columns = {};

    for (const table of criticalTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (data && data.length > 0) {
            results.columns[table] = Object.keys(data[0]);
        } else {
            results.columns[table] = "Empty or Error: " + (error?.message || "No data");
        }
    }

    console.log("\n--- Table Columns ---");
    console.log(JSON.stringify(results.columns, null, 2));

    console.log("\n--- 📝 ACTION PLAN FOR USER ---");
    console.log("Please run the following SQL commands in your Supabase SQL Editor and share the results:");
    console.log("\n1. GET POLICIES:\nSELECT * FROM pg_policies WHERE schemaname = 'public';");
    console.log("\n2. GET TRIGGERS:\nSELECT tablename, triggername FROM pg_indexes WHERE schemaname = 'public'; -- (Just a check)");
    console.log("SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public';");
}

introspect();
