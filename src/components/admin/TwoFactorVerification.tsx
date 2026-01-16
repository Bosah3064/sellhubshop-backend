// File: /components/auth/TwoFactorVerification.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityManager } from "@/lib/security";
import { SessionManager } from "../../lib/session-manager";
import {
  Smartphone,
  Mail,
  Key,
  Clock,
  AlertTriangle,
  RefreshCw,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TwoFactorVerificationProps {
  adminId: string;
  adminEmail: string;
  twoFactorMethod: string;
  sessionToken?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerification({
  adminId,
  adminEmail,
  twoFactorMethod,
  sessionToken,
  onSuccess,
  onCancel,
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeTab, setActiveTab] = useState<"code" | "backup">("code");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const securityManager = SecurityManager.getInstance();
  const sessionManager = SessionManager.getInstance();
  const timerRef = useRef<NodeJS.Timeout>();
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "code" && !isLoading) {
      // Start countdown timer
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleResendCode(); // Auto-resend when timer reaches 0
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTab, isLoading]);

  useEffect(() => {
    // Auto-focus code input when tab changes
    if (codeInputRef.current && activeTab === "code") {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  const handleVerificationCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get client IP
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // HMAC-SHA256 verification or TOTP check
      const { data: admin } = await supabase
        .from("admin_users")
        .select("two_factor_secret")
        .eq("id", adminId)
        .single();

      if (!admin?.two_factor_secret) {
        throw new Error("2FA not configured for this account");
      }

      const isValid = await securityManager.verifyTOTP(admin.two_factor_secret, verificationCode);

      if (!isValid) {
        // Track failed attempt
        await securityManager.trackLoginAttempt(adminEmail, clientIP, false);

        setError("The verification code is incorrect or expired");
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "The verification code is incorrect or expired",
        });
        setIsLoading(false);
        return;
      }

      // Track successful verification
      await securityManager.trackLoginAttempt(adminEmail, clientIP, true);

      // Update session with 2FA verification
      if (sessionToken) {
        await supabase
          .from("admin_sessions")
          .update({
            two_factor_verified: true,
            last_activity: new Date().toISOString(),
          })
          .eq("session_token", sessionToken);
      } else {
        // Create new session with 2FA verified
        const newSessionToken = await sessionManager.createSession(
          adminId,
          adminEmail,
          clientIP,
          true // twoFactorVerified
        );
        console.log("New session created with 2FA:", newSessionToken);
      }

      // Log 2FA success
      await securityManager.logSecurityEvent(
        adminId,
        adminEmail,
        "2fa_verification_success",
        "low",
        {
          method: twoFactorMethod,
          ip: clientIP,
        }
      );

      setSuccess(true);
      toast({
        title: "2FA Verified",
        description: "Successfully logged into admin panel.",
      });

      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error("2FA verification error:", error);
      setError(error.message || "Failed to verify 2FA code");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to verify 2FA code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode || backupCode.length !== 6) {
      setError("Please enter a valid 6-digit backup code");
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a valid 6-digit backup code",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get client IP
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // Get admin data to check backup codes
      const { data: admin } = await supabase
        .from("admin_users")
        .select("backup_codes")
        .eq("id", adminId)
        .single();

      if (!admin || !admin.backup_codes || !Array.isArray(admin.backup_codes)) {
        throw new Error("No backup codes available");
      }

      // Check if backup code is valid
      const isValidBackupCode = admin.backup_codes.includes(backupCode);

      if (!isValidBackupCode) {
        // Track failed attempt
        await securityManager.trackLoginAttempt(adminEmail, clientIP, false);

        setError("The backup code is incorrect or already used");
        toast({
          variant: "destructive",
          title: "Invalid Backup Code",
          description: "The backup code is incorrect or already used",
        });
        setIsLoading(false);
        return;
      }

      // Remove used backup code
      const updatedBackupCodes = admin.backup_codes.filter(
        (code: string) => code !== backupCode
      );

      await supabase
        .from("admin_users")
        .update({ backup_codes: updatedBackupCodes })
        .eq("id", adminId);

      // Track successful verification
      await securityManager.trackLoginAttempt(adminEmail, clientIP, true);

      // Update or create session with 2FA verified
      if (sessionToken) {
        await supabase
          .from("admin_sessions")
          .update({
            two_factor_verified: true,
            used_backup_code: true,
            last_activity: new Date().toISOString(),
          })
          .eq("session_token", sessionToken);
      } else {
        // Create new session with 2FA verified
        await sessionManager.createSession(
          adminId,
          adminEmail,
          clientIP,
          true // twoFactorVerified
        );
      }

      // Log backup code usage
      await securityManager.logSecurityEvent(
        adminId,
        adminEmail,
        "backup_code_used",
        "medium",
        {
          ip: clientIP,
          remaining_backup_codes: updatedBackupCodes.length,
        }
      );

      setSuccess(true);
      toast({
        title: "Backup Code Accepted",
        description: "Successfully logged in using backup code",
        variant: "default",
      });

      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error("Backup code verification error:", error);
      setError(error.message || "Failed to verify backup code");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to verify backup code",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const sendEmailCode = async () => {
    try {
      setIsLoading(true);

      // Send email with verification code
      const { error } = await supabase.auth.signInWithOtp({
        email: adminEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-2fa`,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Check your email for the verification code",
      });

      // Reset timer
      setTimeLeft(30);
    } catch (error: any) {
      console.error("Error sending email code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (twoFactorMethod === "email") {
      sendEmailCode();
    } else {
      // For authenticator app, just reset timer
      setTimeLeft(30);
      toast({
        title: "Timer Reset",
        description: "New code can be generated in your authenticator app",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "code" | "backup") => {
    if (e.key === "Enter") {
      if (type === "code") {
        handleVerificationCode();
      } else {
        handleBackupCode();
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800 border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <CheckCircle className="h-8 w-8 text-green-400" />
              Verification Successful!
            </CardTitle>
            <CardDescription className="text-gray-400">
              Redirecting to admin panel...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="animate-pulse">
              <div className="inline-flex items-center justify-center p-6 bg-green-900/20 rounded-full mb-4">
                <Shield className="h-16 w-16 text-green-400" />
              </div>
            </div>
            <p className="text-gray-300">
              Two-factor authentication verified successfully.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Shield className="h-8 w-8 text-blue-400" />
            Two-Factor Authentication Required
          </CardTitle>
          <CardDescription className="text-gray-400">
            {twoFactorMethod === "authenticator"
              ? "Enter the code from your authenticator app"
              : "Enter the code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-2 bg-gray-900">
              <TabsTrigger
                value="code"
                className="data-[state=active]:bg-gray-700"
              >
                <Key className="h-4 w-4 mr-2" />
                Verification Code
              </TabsTrigger>
              <TabsTrigger
                value="backup"
                className="data-[state=active]:bg-gray-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Backup Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-4 mt-4">
              <Alert className="bg-blue-900/20 border-blue-800">
                <AlertDescription className="text-blue-200">
                  Enter the 6-digit code from your{" "}
                  {twoFactorMethod === "authenticator"
                    ? "authenticator app"
                    : "email"}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-4 bg-gray-900 rounded-full mb-4">
                    {twoFactorMethod === "authenticator" ? (
                      <Smartphone className="h-12 w-12 text-blue-400" />
                    ) : (
                      <Mail className="h-12 w-12 text-blue-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code" className="text-gray-300">
                    6-digit Verification Code
                  </Label>
                  <div className="relative">
                    <Input
                      ref={codeInputRef}
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => handleKeyDown(e, "code")}
                      className="pl-4 pr-12 py-3 text-center text-2xl font-mono tracking-widest bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="000000"
                      autoFocus
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Time left: {timeLeft}s
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={timeLeft > 0 || isLoading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Resend
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={handleVerificationCode}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-700">
                <Button
                  variant="link"
                  className="text-blue-400 hover:text-blue-300"
                  onClick={() => setActiveTab("backup")}
                >
                  Lost access? Use backup code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4 mt-4">
              <Alert className="bg-amber-900/20 border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  Use a backup code if you can't access your 2FA device. Each
                  code can be used only once.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-4 bg-amber-900/20 rounded-full mb-4">
                    <Key className="h-12 w-12 text-amber-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-code" className="text-gray-300">
                    6-digit Backup Code
                  </Label>
                  <Input
                    id="backup-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={backupCode}
                    onChange={(e) =>
                      setBackupCode(e.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(e) => handleKeyDown(e, "backup")}
                    className="pl-4 pr-12 py-3 text-center text-2xl font-mono tracking-widest bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="000000"
                    autoFocus
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Enter one of your backup codes
                  </p>
                </div>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setActiveTab("code")}
                    disabled={isLoading}
                  >
                    Back to Code
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    onClick={handleBackupCode}
                    disabled={backupCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Use Backup Code"
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-700">
                <Button
                  variant="link"
                  className="text-blue-400 hover:text-blue-300"
                  onClick={() => setActiveTab("code")}
                >
                  Return to verification code
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
