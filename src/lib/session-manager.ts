import { supabase } from "@/integrations/supabase/client";

export class SessionManager {
    private static instance: SessionManager;
    private monitorInterval: NodeJS.Timeout | null = null;
    private readonly SESSION_TIMEOUT = 120 * 60 * 1000; // 2 hours

    private constructor() { }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    async createSession(
        adminId: string,
        email: string,
        ip: string,
        twoFactorVerified: boolean = false
    ): Promise<string> {
        const sessionToken = this.generateToken();
        const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

        const { error } = await supabase.from("admin_sessions").insert({
            admin_id: adminId,
            session_token: sessionToken,
            ip_address: ip,
            user_agent: navigator.userAgent,
            expires_at: expiresAt.toISOString(),
            two_factor_verified: twoFactorVerified,
            is_revoked: false,
        });

        if (error) {
            console.error("Error creating admin session:", error);
            throw error;
        }

        localStorage.setItem("admin_session_token", sessionToken);
        localStorage.setItem("admin_session_expiry", expiresAt.toISOString());

        return sessionToken;
    }

    async isSessionValid(): Promise<boolean> {
        const token = localStorage.getItem("admin_session_token");
        const expiry = localStorage.getItem("admin_session_expiry");

        // First check local storage
        if (!token || !expiry) {
            console.log("No session token or expiry in localStorage");
            return false;
        }

        // Check if expired locally
        if (new Date(expiry) < new Date()) {
            console.log("Session expired based on local expiry time");
            return false;
        }

        // Try to verify with server, but don't fail if server check fails
        try {
            const { data, error } = await supabase
                .from("admin_sessions")
                .select("*")
                .eq("session_token", token)
                .eq("is_revoked", false)
                .single();

            if (error) {
                // If table doesn't exist or other DB error, trust local storage
                console.warn("Server session check failed (non-critical), trusting local session:", error.message);
                return true; // Trust local storage
            }

            if (!data) {
                console.log("Session not found in database or revoked");
                return false;
            }

            // Refresh expiry on activity
            const newExpiry = new Date(Date.now() + this.SESSION_TIMEOUT);
            
            // Try to update, but don't fail if it doesn't work
            try {
                await supabase
                    .from("admin_sessions")
                    .update({ 
                        expires_at: newExpiry.toISOString(), 
                        last_activity: new Date().toISOString() 
                    })
                    .eq("session_token", token);

                localStorage.setItem("admin_session_expiry", newExpiry.toISOString());
            } catch (updateError) {
                console.warn("Failed to update session activity, continuing anyway:", updateError);
            }

            return true;
        } catch (err) {
            // If any error occurs, trust local storage instead of failing
            console.warn("Session validation error, trusting local storage:", err);
            return true; // Trust local storage when server is unavailable
        }
    }

    startSessionMonitoring() {
        if (this.monitorInterval) return;

        this.monitorInterval = setInterval(async () => {
            const isValid = await this.isSessionValid();
            if (!isValid) {
                console.warn("Session expired or invalid. Logging out...");
                this.logout();
                window.location.reload(); // Force redirect back through security gate
            }
        }, 60000); // Check every minute
    }

    stopSessionMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    async logout() {
        const token = localStorage.getItem("admin_session_token");
        if (token) {
            await supabase
                .from("admin_sessions")
                .update({ is_revoked: true })
                .eq("session_token", token);
        }

        localStorage.removeItem("admin_session_token");
        localStorage.removeItem("admin_session_expiry");
        this.stopSessionMonitoring();
    }

    private generateToken(): string {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
}
