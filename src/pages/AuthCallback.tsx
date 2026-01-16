import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Completing sign in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("Processing authentication...");

        // Get the current session - this should include the OAuth data
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
        }

        if (session?.user) {
          setStatus("Authentication successful! Updating profile...");

          // Update last login timestamp in profiles
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              last_login: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.user.id);

          if (profileError) {
            console.warn("Profile update warning:", profileError);
            // Don't throw error - this is non-critical
          }

          // Log successful OAuth login
          // Log successful OAuth login
          const logSuccess = {
            id: crypto.randomUUID(),
            action_type: "user_oauth_login_success",
            resource_type: "auth",
            resource_id: session.user.id,
            admin_id: null,
            details: {
              email: session.user.email,
              user_id: session.user.id,
              type: "oauth",
              provider: session.user.app_metadata?.provider || "unknown",
            },
          };
          console.log("OAuth Success Log Payload:", logSuccess);
          const { error: logError } = await supabase.from("admin_actions").insert(logSuccess);
          if (logError) console.error("Error logging OAuth success:", logError);

          setStatus("Redirecting to dashboard...");

          // Small delay to show success message
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1000);
        } else {
          throw new Error(
            "No user session found. Please try signing in again."
          );
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setError(error.message);
        setStatus("Authentication failed");

        // Log failed OAuth attempt
        // Log failed OAuth attempt
        const logFailed = {
          id: crypto.randomUUID(),
          action_type: "user_oauth_login_failed",
          resource_type: "auth",
          details: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        };
        console.log("OAuth Failure Log Payload:", logFailed);
        const { error: logError } = await supabase.from("admin_actions").insert(logFailed);
        if (logError) console.error("Error logging OAuth failure:", logError);

        // Auto-redirect after delay
        setTimeout(() => {
          navigate("/signin", { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleRetry = () => {
    navigate("/signin", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          {error ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>
            </>
          ) : status.includes("successful") ||
            status.includes("Redirecting") ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Success!</h2>
              <p className="text-gray-600">{status}</p>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing</h2>
              <p className="text-gray-600">{status}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
