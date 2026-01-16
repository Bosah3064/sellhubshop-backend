import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Safe insert function for tables that require manual UUIDs
  const safeInsert = async (table: string, data: Record<string, any>) => {
    const record = {
      id: crypto.randomUUID(), // Always include UUID
      ...data,
    };

    console.log(`Inserting into ${table}:`, record);
    const { data: result, error } = await supabase
      .from(table as any)
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return result;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter both email and password",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists and is banned
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email, status, full_name")
        .eq("email", email.trim().toLowerCase())
        .single();

      // If user doesn't exist in profiles but might be in auth, continue with sign in
      if (userError && userError.code !== "PGRST116") {
        console.error("Error checking user:", userError);
      }

      // Check if user is banned
      if (userData?.status === "banned") {
        toast({
          variant: "destructive",
          title: "Account Suspended",
          description:
            "Your account has been suspended. Please contact support.",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "Please verify your email address before signing in."
          );
        } else if (error.message.includes("Email rate limit exceeded")) {
          throw new Error(
            "Too many attempts. Please try again in a few minutes."
          );
        }
        throw error;
      }

      if (data.user) {
        // Update last_login timestamp in profiles
        await supabase
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", data.user.id);

        // Log successful login attempt with manual UUID
        try {
          // Check if table exists/is accessible by trying a lightweight operation or just catching error
          await safeInsert("admin_actions", {
            action_type: "user_login_success",
            resource_type: "auth",
            resource_id: data.user.id,
            admin_id: null, // Avoid FK violation since this is profiles.id
            details: {
              email: email.trim().toLowerCase(),
              user_id: data.user.id,
              type: "password",
            },
            created_at: new Date().toISOString(),
          });
        } catch (auditError) {
          console.warn("⚠️ Audit log failed (likely missing table or permissions):", auditError);
          // Do NOT throw. Login should succeed even if logging fails.
        }

        toast({
          title: "Welcome back! 👋",
          description: userData?.full_name
            ? `Good to see you again, ${userData.full_name}!`
            : "Signed in successfully!",
        });

        // Redirect to intended page or dashboard
        navigate(redirectTo, { replace: true });
      }
    } catch (err: unknown) {
      console.error("Sign in error:", err);

      // Log failed login attempt with manual UUID
      try {
        await safeInsert("admin_actions", {
          action_type: "user_login_failed",
          resource_type: "auth",
          details: {
            email: email.trim().toLowerCase(),
            error: err instanceof Error ? err.message : "Unknown error",
            user_agent: navigator.userAgent,
          },
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error("⚠️ Audit log failed (non-critical):", auditError);
      }

      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password";

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin
            }/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) throw error;

      // Log Google sign-in attempt with manual UUID
      try {
        await safeInsert("admin_actions", {
          action_type: "user_google_signin_initiated",
          resource_type: "auth",
          details: { redirect_to: redirectTo },
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error("⚠️ Audit log failed (non-critical):", auditError);
      }
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unable to sign in with Google";

      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to reset password",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      // Log password reset request with manual UUID
      try {
        await safeInsert("admin_actions", {
          action_type: "password_reset_requested",
          resource_type: "auth",
          details: { email: email.trim().toLowerCase() },
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error("⚠️ Audit log failed (non-critical):", auditError);
      }

      toast({
        title: "Check your email 📧",
        description:
          "Password reset instructions have been sent to your email.",
      });
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unable to send reset email";

      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: errorMessage,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to resend verification",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Log verification resend with manual UUID
      try {
        await safeInsert("admin_actions", {
          action_type: "verification_email_resent",
          resource_type: "auth",
          details: { email: email.trim().toLowerCase() },
          created_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error("⚠️ Audit log failed (non-critical):", auditError);
      }

      toast({
        title: "Verification email sent ✅",
        description: "Check your email for the verification link.",
      });
    } catch (err: unknown) {
      console.error("Resend verification error:", err);
      toast({
        variant: "destructive",
        title: "Failed to send verification",
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Sign in to access your marketplace dashboard
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 transition-all duration-200 h-12 text-base font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/90 px-3 text-gray-500 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
                autoComplete="email"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                >
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Verification Alert */}
            <Alert className="bg-blue-50/80 border-blue-200 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Need to verify your email?{" "}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="font-semibold hover:underline transition-all"
                  disabled={isLoading}
                >
                  Resend verification email
                </button>
              </AlertDescription>
            </Alert>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 pt-4 border-t border-gray-200">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Create account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
