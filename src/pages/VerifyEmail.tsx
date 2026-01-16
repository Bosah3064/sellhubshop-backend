import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export default function VerifyEmail() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get current user's email
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getCurrentUser();
  }, []);

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email address found. Please sign in again."
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Check your inbox for the verification link."
      });
    } catch (err: unknown) {
      console.error("Resend verification error:", err);
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: "Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified.",
        });
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Not verified yet",
          description: "Please check your email and click the verification link.",
        });
      }
    } catch (err) {
      console.error("Error checking verification:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <Mail className="h-12 w-12 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <p className="text-sm text-gray-600">
            We've sent a verification link to your email address
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                Please check your inbox at <strong>{email}</strong> and click the verification link to activate your account.
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Check your email inbox</span>
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Click the verification link</span>
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Return to complete setup</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              onClick={handleCheckVerification}
              variant="outline"
              className="w-full h-11 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Verified My Email
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Having trouble?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-purple-600 font-semibold"
                onClick={() => navigate("/signin")}
              >
                Return to Sign In
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}