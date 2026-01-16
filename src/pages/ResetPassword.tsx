import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Lock } from "lucide-react";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetData = z.infer<typeof resetSchema>;
type NewPasswordData = z.infer<typeof newPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm<ResetData>({
    resolver: zodResolver(resetSchema)
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, watch } = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema)
  });

  React.useEffect(() => {
    // Check if we already have a session (e.g., from an email link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isRecoveryInURL = window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery');

      if (session || isRecoveryInURL) {
        console.log("Recovery state detected (Session or URL), switching to reset step.");
        setStep("reset");
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      }
    };

    checkSession();

    // Listen for auth state changes specifically for recovery events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event in ResetPassword:", event);
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (window.location.hash.includes('type=recovery') || event === "PASSWORD_RECOVERY") {
          console.log("Password recovery event matched.");
          setStep("reset");
          setEmail(session?.user?.email || "");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onEmailSubmit = async (data: ResetData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmail(data.email);
      setStep("reset");

      toast({
        title: "Check your email",
        description: "We've sent a password reset link to your email address.",
      });
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to send reset email";

      toast({
        variant: "destructive",
        title: "Reset failed",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: NewPasswordData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      // Log password reset
      try {
        const logData = {
          id: crypto.randomUUID(),
          action_type: 'password_reset',
          resource_type: 'auth',
          details: { email: email || 'unknown' }
        };
        console.log("Password Reset Log Payload:", logData);
        const { error: logError } = await supabase.from('admin_actions').insert(logData);
        if (logError) console.error("Error logging password reset:", logError);
      } catch (logErr) {
        console.warn("Audit log failed during password reset:", logErr);
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset.",
      });

      navigate("/signin");
    } catch (err: unknown) {
      console.error("Password update error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to reset password";

      toast({
        variant: "destructive",
        title: "Reset failed",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <Lock className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {step === "email" ? "Reset Password" : "Create New Password"}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {step === "email"
              ? "Enter your email to receive a reset link"
              : "Enter your new password below"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...registerEmail("email")}
                    className="h-11 pl-10"
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-red-600">{emailErrors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("password")}
                  className={`h-11 ${passwordErrors.password ? "border-red-500" : ""}`}
                />
                {passwordErrors.password && (
                  <p className="text-sm text-red-600">{passwordErrors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("confirmPassword")}
                  className={`h-11 ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/signin"
              className="inline-flex items-center text-sm text-blue-600 hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}