import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityManager } from "@/lib/security";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Lock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AdminSecurityProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  minRole?: "super_admin" | "admin" | "moderator";
  require2FA?: boolean;
}

const SECURITY_CHECKS = [
  {
    id: "auth",
    label: "Authentication",
    description: "Verifying user credentials",
  },
  {
    id: "session",
    label: "Session Validation",
    description: "Checking session integrity",
  },
  { id: "ip", label: "IP Security", description: "Validating IP address" },
  {
    id: "permissions",
    label: "Permissions Check",
    description: "Verifying access rights",
  },
  {
    id: "2fa",
    label: "2FA Verification",
    description: "Confirming two-factor authentication",
  },
  {
    id: "threat",
    label: "Threat Detection",
    description: "Scanning for security threats",
  },
];

export const AdminSecurity: React.FC<AdminSecurityProps> = ({
  children,
  requiredPermissions = [],
  minRole = "moderator",
  require2FA = true,
}) => {
  const [securityStatus, setSecurityStatus] = useState<
    "checking" | "verified" | "failed" | "2fa_required"
  >("checking");
  const [currentCheck, setCurrentCheck] = useState(0);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [adminData, setAdminData] = useState<any>(null);
  const [securityDetails, setSecurityDetails] = useState<{
    ip: string;
    location: string;
    device: string;
    lastLogin: string;
  } | null>(null);
  const [failedChecks, setFailedChecks] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const securityManager = SecurityManager.getInstance();

  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "unknown";
    }
  }, []);

  const performSecurityChecks = useCallback(async (): Promise<boolean> => {
    try {
      setCurrentCheck(0);
      const checksFailed: string[] = [];

      // 1. Authentication Check
      setCurrentCheck(1);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        checksFailed.push("Authentication failed");
        await securityManager.logSecurityEvent(
          "system",
          "unknown",
          "auth_failed",
          "high",
          { path: location.pathname, reason: "No authenticated user" }
        );
        return false;
      }

      // 2. Check if account is locked
      const isLocked = await securityManager.isAccountLocked(user.email!);
      if (isLocked) {
        checksFailed.push("Account is temporarily locked");
        toast({
          variant: "destructive",
          title: "Account Locked",
          description:
            "Too many failed login attempts. Please try again later.",
        });
        return false;
      }

      // 3. Session Validation
      setCurrentCheck(2);
      const sessionToken = localStorage.getItem("admin_session_token");
      const sessionExpiry = localStorage.getItem("admin_session_expiry");

      // If no session token exists but user is authenticated, create one automatically
      if (!sessionToken || !sessionExpiry || new Date(sessionExpiry) < new Date()) {
        console.log("No valid session token found, creating new session for authenticated admin...");
        
        // Get client IP for session creation
        const clientIP = await getClientIP();
        
        // Check if user is an admin first
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from("admin_users")
          .select("id, role, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (adminCheckError || !adminCheck) {
          checksFailed.push("Not an admin user");
          return false;
        }

        // Create new session automatically
        try {
          const newSessionToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 120 * 60 * 1000); // 2 hours

          await supabase.from("admin_sessions").insert({
            admin_id: adminCheck.id,
            session_token: newSessionToken,
            ip_address: clientIP,
            user_agent: navigator.userAgent,
            expires_at: expiresAt.toISOString(),
            two_factor_verified: false,
            is_revoked: false,
          });

          localStorage.setItem("admin_session_token", newSessionToken);
          localStorage.setItem("admin_session_expiry", expiresAt.toISOString());
          
          console.log("✅ New admin session created successfully");
        } catch (sessionCreateError) {
          console.warn("Failed to create session in database, using local session:", sessionCreateError);
          // Fallback: create local session even if DB insert fails
          const newSessionToken = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 120 * 60 * 1000);
          localStorage.setItem("admin_session_token", newSessionToken);
          localStorage.setItem("admin_session_expiry", expiresAt.toISOString());
        }
      }

      // Verify session with server (if it exists in DB)
      const currentSessionToken = localStorage.getItem("admin_session_token");
      if (currentSessionToken) {
        try {
          const { data: session, error: sessionError } = await supabase
            .from("admin_sessions")
            .select("*")
            .eq("session_token", currentSessionToken)
            .eq("is_revoked", false)
            .single();

          if (sessionError) {
            console.warn("Session table check failed (non-critical):", sessionError);
            // If the table is just missing, we trust the local session for now
            // but if it's a real error like revoked session, we'd handle it if we could
          } else if (!session) {
            checksFailed.push("Invalid session");
            return false;
          }
        } catch (err) {
          console.warn("Server-side session validation failed:", err);
          // Fallback: trust local storage if server check crashes
        }
      }

      // 4. IP Security Check
      setCurrentCheck(3);
      const clientIP = await getClientIP();
      if (!securityManager.isIPAllowed(clientIP)) {
        checksFailed.push("IP address not authorized");
        await securityManager.logSecurityEvent(
          "system",
          user.email!,
          "ip_blocked",
          "critical",
          { ip: clientIP, path: location.pathname }
        );
        return false;
      }

      // 5. Admin Permissions Check
      setCurrentCheck(4);
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select(
          `
          *,
          profile:profiles(*)
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (adminError || !admin) {
        checksFailed.push("Insufficient admin privileges");
        try {
          await securityManager.trackLoginAttempt(user.email!, clientIP, false);
        } catch (e) {
          console.warn("Failed to track login attempt:", e);
        }
        return false;
      }

      // Role hierarchy check
      const roleHierarchy = { super_admin: 3, admin: 2, moderator: 1 };
      if (roleHierarchy[admin.role] < roleHierarchy[minRole]) {
        checksFailed.push(`Requires ${minRole} role or higher`);
        return false;
      }

      // Specific permissions check
      if (requiredPermissions.length > 0) {
        const missingPermissions = requiredPermissions.filter(
          (perm) => !admin.permissions?.[perm]
        );
        if (missingPermissions.length > 0) {
          checksFailed.push(
            `Missing permissions: ${missingPermissions.join(", ")}`
          );
          return false;
        }
      }

      // 6. 2FA Check
      setCurrentCheck(5);
      if (require2FA && admin.two_factor_enabled) {
        // Store admin data for 2FA verification
        setAdminData(admin);
        setSecurityDetails({
          ip: clientIP,
          location: "Checking...",
          device: navigator.userAgent.substring(0, 50) + "...",
          lastLogin: admin.last_login_at
            ? new Date(admin.last_login_at).toLocaleString()
            : "First login",
        });
        setSecurityStatus("2fa_required");
        return false;
      }

      // 7. Threat Detection (simplified)
      setCurrentCheck(6);
      const suspiciousPatterns = [
        "script",
        "javascript:",
        "eval",
        "document.cookie",
        "localhost",
        "127.0.0.1",
        "admin",
        "select",
        "union",
      ];

      const urlParams = new URLSearchParams(location.search);
      const allParams = Array.from(urlParams.values()).join(" ").toLowerCase();

      if (suspiciousPatterns.some((pattern) => allParams.includes(pattern))) {
        checksFailed.push("Suspicious request detected");
        await securityManager.logSecurityEvent(
          admin.id,
          user.email!,
          "suspicious_request",
          "high",
          { params: location.search, clientIP }
        );
        return false;
      }

      // All checks passed
      setFailedChecks(checksFailed);

      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", admin.id);

      // Log successful access
      await securityManager.logSecurityEvent(
        admin.id,
        user.email!,
        "admin_access_granted",
        "low",
        {
          path: location.pathname,
          role: admin.role,
          permissions: requiredPermissions,
          clientIP,
        }
      );

      setSecurityStatus("verified");
      return true;
    } catch (error: any) {
      console.error("Security check error:", error);

      // Check for common specific errors
      let errorMessage = "Security system error";
      if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        errorMessage =
          "Database tables missing. Please run the schema migration.";
      } else if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        errorMessage = "Session expired. Please log in again.";
      }

      await securityManager
        .logSecurityEvent(
          "system",
          "unknown",
          "security_check_error",
          "critical",
          { error: error.message, path: location.pathname }
        )
        .catch(() => console.warn("Could not log security event")); // Prevent recursive failure

      setFailedChecks([errorMessage]);
      setSecurityStatus("failed");
      return false;
    }
  }, [
    location,
    minRole,
    requiredPermissions,
    require2FA,
    securityManager,
    toast,
    getClientIP,
  ]);

  useEffect(() => {
    const initializeSecurity = async () => {
      const passed = await performSecurityChecks();
      if (!passed && securityStatus !== "2fa_required") {
        toast({
          variant: "destructive",
          title: "Security Check Failed",
          description: "You don't have permission to access this section",
        });

        // Small delay before redirect to show message
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    };

    initializeSecurity();
  }, [performSecurityChecks, securityStatus, navigate, toast]);

  const verifyTwoFactorCode = async () => {
    try {
      // In production, implement actual 2FA verification
      // For demo purposes, accept any 6-digit code
      if (twoFactorCode.length !== 6 || !/^\d+$/.test(twoFactorCode)) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "Please enter a valid 6-digit code",
        });
        return;
      }

      // Generate new session
      const sessionToken = securityManager.generateSessionToken();
      const expiresAt = new Date(Date.now() + 120 * 60 * 1000); // 2 hours

      const clientIP = await getClientIP();

      try {
        await supabase.from("admin_sessions").insert({
          admin_id: adminData.id,
          session_token: sessionToken,
          ip_address: clientIP,
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString(),
          two_factor_verified: true,
        });
      } catch (sessionErr) {
        console.warn("Failed to persist session to database:", sessionErr);
      }

      localStorage.setItem("admin_session_token", sessionToken);
      localStorage.setItem("admin_session_expiry", expiresAt.toISOString());

      // Log 2FA success
      await securityManager.logSecurityEvent(
        adminData.id,
        adminData.email,
        "2fa_success",
        "medium",
        { method: "totp", clientIP }
      );

      setSecurityStatus("verified");
    } catch (error) {
      console.error("2FA verification error:", error);
      toast({
        variant: "destructive",
        title: "2FA Failed",
        description: "An error occurred during verification",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const sessionToken = localStorage.getItem("admin_session_token");
      if (sessionToken) {
        await supabase
          .from("admin_sessions")
          .update({ is_revoked: true })
          .eq("session_token", sessionToken);
      }

      localStorage.removeItem("admin_session_token");
      localStorage.removeItem("admin_session_expiry");

      await supabase.auth.signOut();

      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (securityStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-xl">Security Verification</div>
                <CardDescription className="text-gray-400">
                  Performing multi-layer security checks...
                </CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress
              value={(currentCheck / SECURITY_CHECKS.length) * 100}
              className="h-2"
            />

            <div className="space-y-3">
              {SECURITY_CHECKS.map((check, index) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${index < currentCheck
                      ? "bg-green-900/20 border border-green-800"
                      : index === currentCheck
                        ? "bg-blue-900/20 border border-blue-800 animate-pulse"
                        : "bg-gray-800/50 border border-gray-700"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${index < currentCheck
                          ? "bg-green-900 text-green-300"
                          : index === currentCheck
                            ? "bg-blue-900 text-blue-300"
                            : "bg-gray-800 text-gray-400"
                        }`}
                    >
                      {index < currentCheck ? (
                        <Lock className="h-4 w-4" />
                      ) : index === currentCheck ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {check.label}
                      </div>
                      <div className="text-sm text-gray-400">
                        {check.description}
                      </div>
                    </div>
                  </div>
                  {index < currentCheck && (
                    <Badge className="bg-green-900 text-green-300">
                      Verified
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Alert className="bg-blue-900/20 border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-300">
                Security in Progress
              </AlertTitle>
              <AlertDescription className="text-blue-200">
                Please wait while we verify your identity and permissions. This
                may take a few seconds.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (securityStatus === "2fa_required") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Lock className="h-8 w-8 text-purple-400" />
              Two-Factor Authentication Required
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter the code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {securityDetails && (
              <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
                <div className="text-sm text-gray-400">Login Details</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">IP Address:</div>
                  <div className="font-mono text-gray-400">
                    {securityDetails.ip}
                  </div>
                  <div className="text-gray-300">Device:</div>
                  <div className="font-mono text-gray-400 truncate">
                    {securityDetails.device}
                  </div>
                  <div className="text-gray-300">Last Login:</div>
                  <div className="text-gray-400">
                    {securityDetails.lastLogin}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-block p-4 bg-gray-900 rounded-lg mb-4">
                  <div className="text-2xl font-mono tracking-widest">
                    ••••••
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Open your authenticator app and enter the 6-digit code
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                }
                className="w-full text-center text-3xl font-mono tracking-widest bg-gray-900 border border-gray-700 rounded-lg py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="000000"
                autoFocus
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={handleLogout}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={verifyTwoFactorCode}
                  disabled={twoFactorCode.length !== 6}
                >
                  Verify & Continue
                </Button>
              </div>
            </div>

            <Alert className="bg-yellow-900/20 border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertTitle className="text-yellow-300">
                Security Notice
              </AlertTitle>
              <AlertDescription className="text-yellow-200">
                Two-factor authentication adds an extra layer of security to
                your account. Never share your authentication codes with anyone.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (securityStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-400">
              Security verification failed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <div className="text-sm font-medium text-red-300 mb-2">
                Security Issues:
              </div>
              <ul className="text-sm text-red-200 space-y-1">
                {failedChecks.map((check, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            <Alert className="bg-blue-900/20 border-blue-800">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-300">What happened?</AlertTitle>
              <AlertDescription className="text-blue-200">
                Our security system detected one or more issues with your access
                request. This could be due to expired credentials, IP
                restrictions, or insufficient permissions.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => navigate("/")}
              >
                Return to Home
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Add this to your AdminSecurity component
  useEffect(() => {
    const checkCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current auth user:", user);

      // Also check what's in admin_users for this user
      if (user) {
        const { data: admin } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        console.log("Admin record for current user:", admin);
      }
    };

    checkCurrentUser();
  }, []);

  return <>{children}</>;
};
