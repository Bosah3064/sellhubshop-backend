const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables missing in backend!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 1. Try to verify as an Admin Session first
        const { data: adminSession, error: adminError } = await supabase
            .from("admin_sessions")
            .select("*, admin_users(*)")
            .eq("session_token", token)
            .eq("is_revoked", false)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (adminSession && !adminError) {
            // Refresh last activity for admin
            await supabase
                .from("admin_sessions")
                .update({ last_activity: new Date().toISOString() })
                .eq("id", adminSession.id);

            req.admin = adminSession.admin_users;
            req.session = adminSession;
            req.userType = 'admin';
            return next();
        }

        // 2. If not an admin session, check if it's a regular Supabase user JWT
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (user && !userError) {
            req.user = user;
            req.userType = 'regular';
            return next();
        }

        // 3. Neither admin nor regular user
        return res.status(401).json({
            error: "Invalid or expired session",
            details: adminError?.message || userError?.message || "Session not found"
        });

    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error during authentication" });
    }
};

module.exports = authMiddleware;
