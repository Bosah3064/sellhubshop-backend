// File: /components/security/AdminSecurityGate.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityManager } from "@/lib/security";
import { SessionManager } from "../../lib/session-manager";
import TwoFactorVerification from "@/components/admin/TwoFactorVerification";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Lock,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
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
import { cn } from "@/lib/utils";

interface AdminSecurityProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  minRole?: "super_admin" | "admin" | "moderator";
  require2FA?: boolean;
  showDebug?: boolean;
}

const SECURITY_CHECKS = [
  {
    id: "auth",
    label: "Authentication",
    description: "Verifying user credentials",
    icon: Shield,
  },
  {
    id: "session",
    label: "Session Management",
    description: "Checking and renewing session",
    icon: Lock,
  },
  {
    id: "ip",
    label: "IP Security",
    description: "Validating IP address",
    icon: AlertCircle,
  },
  {
    id: "permissions",
    label: "Permissions Check",
    description: "Verifying access rights",
    icon: CheckCircle,
  },
  {
    id: "2fa",
    label: "2FA Verification",
    description: "Confirming two-factor authentication",
    icon: Shield,
  },
  {
    id: "threat",
    label: "Threat Detection",
    description: "Scanning for security threats",
    icon: AlertTriangle,
  },
];

export const AdminSecurityGate: React.FC<AdminSecurityProps> = ({
  children,
  requiredPermissions = [],
  minRole = "moderator",
  require2FA = true,
  showDebug = import.meta.env.DEV,
}) => {
  const [securityStatus, setSecurityStatus] = useState<
    "checking" | "verified" | "failed" | "2fa_required" | "locked"
  >("checking");

  useEffect(() => {
    console.log("AdminSecurityGate status changed:", securityStatus);
  }, [securityStatus]);
  const [currentCheck, setCurrentCheck] = useState(-1);
  const [adminData, setAdminData] = useState<any>(null);
  const [failedChecks, setFailedChecks] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [checkDetails, setCheckDetails] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(() => {
    const verifiedAt = localStorage.getItem("admin_verified_at");
    return (verifiedAt ? 100 : 0);
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const securityManager = SecurityManager.getInstance();
  const sessionManager = SessionManager.getInstance();
  const isInitialized = useRef(false);

  const addDebugInfo = useCallback(
    (info: string) => {
      if (showDebug) {
        setDebugInfo((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ${info}`,
        ]);
        console.log(`[AdminSecurity] ${info}`);
      }
    },
    [showDebug]
  );

  const updateCheckDetail = useCallback((checkId: string, detail: any) => {
    setCheckDetails((prev) => ({
      ...prev,
      [checkId]: detail,
    }));
  }, []);

  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn("Failed to fetch client IP in Security Gate:", error);
      return "unknown";
    }
  }, []);

  const performSecurityChecks = useCallback(async (): Promise<boolean> => {
    if (isInitialized.current) return false;
    isInitialized.current = true;

    try {
      setSecurityStatus("checking");
      setCurrentCheck(0);
      setProgress(0);
      setFailedChecks([]);
      setDebugInfo([]);
      setCheckDetails({});

      addDebugInfo("Starting security checks...");
      addDebugInfo(`Path: ${location.pathname}`);
      addDebugInfo(`Required role: ${minRole}`);
      addDebugInfo(`Required permissions: ${requiredPermissions.join(", ")}`);

      // 1. AUTHENTICATION CHECK
      setCurrentCheck(1);
      setProgress(15);
      addDebugInfo("Step 1: Authentication check");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        const errorMsg = authError?.message || "No authenticated user found";
        addDebugInfo(`❌ Authentication failed: ${errorMsg}`);
        updateCheckDetail("auth", { status: "failed", error: errorMsg });
        setFailedChecks(["Authentication failed - Please log in again"]);

        await securityManager.logSecurityEvent(
          "system",
          "unknown",
          "auth_failed",
          "high",
          { path: location.pathname, error: errorMsg }
        );

        setSecurityStatus("failed");
        return false;
      }

      addDebugInfo(`✅ User authenticated: ${user.email}`);
      updateCheckDetail("auth", {
        status: "success",
        email: user.email,
        userId: user.id,
      });

      // 2. ACCOUNT LOCK CHECK
      setCurrentCheck(2);
      setProgress(30);
      addDebugInfo("Step 2: Account lock check");

      const isLocked = await securityManager.isAccountLocked(user.email!);
      if (isLocked) {
        addDebugInfo(`❌ Account is locked: ${user.email}`);
        updateCheckDetail("account_lock", { status: "failed", locked: true });
        setFailedChecks([
          "Account is temporarily locked due to security violations",
        ]);
        setSecurityStatus("locked");

        toast({
          variant: "destructive",
          title: "Account Locked",
          description:
            "Too many failed login attempts. Please contact administrator or try again later.",
        });
        return false;
      }

      addDebugInfo(`✅ Account is not locked`);
      updateCheckDetail("account_lock", { status: "success", locked: false });

      // 3. IP SECURITY CHECK
      setCurrentCheck(3);
      setProgress(45);
      addDebugInfo("Step 3: IP security check");

      const clientIP = await getClientIP();
      addDebugInfo(`Detected IP: ${clientIP}`);

      const ipCheck = securityManager.isIPAllowed(clientIP);
      if (!ipCheck.allowed) {
        addDebugInfo(`❌ IP not allowed: ${clientIP} - ${ipCheck.reason}`);
        updateCheckDetail("ip", {
          status: "failed",
          ip: clientIP,
          reason: ipCheck.reason,
        });
        setFailedChecks([`IP address not authorized: ${ipCheck.reason}`]);

        await securityManager.logSecurityEvent(
          "system",
          user.email!,
          "ip_blocked",
          "critical",
          { ip: clientIP, path: location.pathname, reason: ipCheck.reason }
        );

        setSecurityStatus("failed");
        return false;
      }

      addDebugInfo(`✅ IP authorized: ${clientIP}`);
      updateCheckDetail("ip", {
        status: "success",
        ip: clientIP,
        allowed: true,
      });

      // 4. ADMIN PERMISSIONS CHECK
      setCurrentCheck(4);
      setProgress(60);
      addDebugInfo("Step 4: Admin permissions check");

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (adminError || !admin) {
        addDebugInfo(
          `❌ Not an admin: ${adminError?.message || "No admin record found"}`
        );
        updateCheckDetail("permissions", {
          status: "failed",
          error: adminError?.message || "No admin record",
        });
        setFailedChecks(["You don't have admin privileges"]);

        // Track failed attempt
        await securityManager.trackLoginAttempt(user.email!, clientIP, false);

        setSecurityStatus("failed");
        return false;
      }

      addDebugInfo(`✅ Admin found: ${admin.email} (Role: ${admin.role})`);
      updateCheckDetail("permissions", {
        status: "success",
        role: admin.role,
        isActive: admin.is_active,
      });

      // 5. ROLE HIERARCHY CHECK
      setProgress(70);
      addDebugInfo("Step 5: Role hierarchy check");

      const roleHierarchy = { super_admin: 3, admin: 2, moderator: 1 };
      if (roleHierarchy[admin.role] < roleHierarchy[minRole]) {
        addDebugInfo(`❌ Insufficient role: ${admin.role} < ${minRole}`);
        updateCheckDetail("role", {
          status: "failed",
          current: admin.role,
          required: minRole,
        });
        setFailedChecks([
          `Requires ${minRole} role or higher. Your role: ${admin.role}`,
        ]);
        setSecurityStatus("failed");
        return false;
      }

      addDebugInfo(`✅ Role sufficient: ${admin.role} >= ${minRole}`);
      updateCheckDetail("role", {
        status: "success",
        current: admin.role,
        required: minRole,
      });

      // 6. SPECIFIC PERMISSIONS CHECK
      setProgress(75);
      if (requiredPermissions.length > 0) {
        addDebugInfo("Step 6: Specific permissions check");

        const missingPermissions: string[] = [];
        requiredPermissions.forEach((perm) => {
          if (!admin[perm]) {
            missingPermissions.push(perm);
          }
        });

        if (missingPermissions.length > 0) {
          addDebugInfo(
            `❌ Missing permissions: ${missingPermissions.join(", ")}`
          );
          updateCheckDetail("specific_permissions", {
            status: "failed",
            missing: missingPermissions,
          });
          setFailedChecks([
            `Missing permissions: ${missingPermissions.join(", ")}`,
          ]);
          setSecurityStatus("failed");
          return false;
        }

        addDebugInfo(`✅ All required permissions granted`);
        updateCheckDetail("specific_permissions", {
          status: "success",
          granted: requiredPermissions,
        });
      }

      // 7. SESSION MANAGEMENT
      setCurrentCheck(5);
      setProgress(85);
      addDebugInfo("Step 7: Session management");

      let sessionToken = localStorage.getItem("admin_session_token");
      let sessionExpiry = localStorage.getItem("admin_session_expiry");

      // Check if we need to create/renew session
      const shouldCreateNewSession =
        !sessionToken ||
        !sessionExpiry ||
        new Date(sessionExpiry!) < new Date();

      if (shouldCreateNewSession) {
        addDebugInfo("Creating new session...");
        try {
          sessionToken = await sessionManager.createSession(
            admin.id,
            user.email!,
            clientIP
          );
          sessionExpiry = new Date(Date.now() + 120 * 60 * 1000).toISOString();
          localStorage.setItem("admin_session_token", sessionToken);
          localStorage.setItem("admin_session_expiry", sessionExpiry);
          addDebugInfo(`✅ New session created`);
        } catch (error: any) {
          // Check for 2FA required error (P0001 is a common custom error code for this)
          if (error.message?.includes("Two-factor authentication required") || error.code === 'P0001') {
            addDebugInfo("⚠️ Session creation deferred: 2FA required by database");
            // We set these to null/undefined to signal that we need 2FA before a session can be fully established
            sessionToken = null;
            sessionExpiry = null;
          } else {
            throw error;
          }
        }
      } else {
        // Validate existing session
        try {
          const isValid = await sessionManager.isSessionValid();
          if (!isValid) {
            addDebugInfo("❌ Existing session invalid, creating new one...");
            sessionToken = await sessionManager.createSession(
              admin.id,
              user.email!,
              clientIP
            );
            sessionExpiry = new Date(Date.now() + 120 * 60 * 1000).toISOString();
            localStorage.setItem("admin_session_token", sessionToken);
            localStorage.setItem("admin_session_expiry", sessionExpiry);
            addDebugInfo(`✅ New session created after validation failed`);
          } else {
            addDebugInfo(`✅ Existing session valid`);
          }
        } catch (error: any) {
          if (error.message?.includes("Two-factor authentication required") || error.code === 'P0001') {
            addDebugInfo("⚠️ Session validation failed but 2FA is required");
            sessionToken = null;
            sessionExpiry = null;
          } else {
            throw error;
          }
        }
      }

      updateCheckDetail("session", {
        status: "success",
        hasSession: true,
        expires: sessionExpiry,
      });

      // 8. 2FA CHECK
      setCurrentCheck(6);
      setProgress(95);
      addDebugInfo("Step 8: 2FA check");

      if (require2FA && admin.two_factor_enabled) {
        addDebugInfo("2FA is enabled, checking verification status...");

        // Check if 2FA is already verified in this session
        const { data: session } = await supabase
          .from("admin_sessions")
          .select("two_factor_verified")
          .eq("session_token", sessionToken!)
          .single();

        if (!session?.two_factor_verified || !sessionToken) {
          addDebugInfo(sessionToken ? "2FA verification required (session exists)" : "2FA verification required (pre-session check)");
          updateCheckDetail("2fa", {
            status: "required",
            method: admin.two_factor_method,
          });

          setAdminData({
            ...admin,
            userEmail: user.email,
            sessionToken: sessionToken || undefined,
          });

          setSecurityStatus("2fa_required");
          isInitialized.current = false; // Reset so user can try 2FA
          return false;
        }

        addDebugInfo(`✅ 2FA already verified`);
        updateCheckDetail("2fa", {
          status: "verified",
          method: admin.two_factor_method,
        });
      } else {
        addDebugInfo(
          require2FA ? "2FA not required" : "2FA disabled for this route"
        );
        updateCheckDetail("2fa", { status: "not_required" });
      }

      // 9. THREAT DETECTION (Log only, don't block)
      setCurrentCheck(7);
      setProgress(100);
      addDebugInfo("Step 9: Threat detection scan");

      const urlParams = new URLSearchParams(location.search);
      const allParams = Array.from(urlParams.values()).join(" ").toLowerCase();
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
        "drop",
        "delete",
        "insert",
        "update",
      ];

      const suspiciousPatternsFound = suspiciousPatterns.filter((pattern) =>
        allParams.includes(pattern)
      );

      if (suspiciousPatternsFound.length > 0) {
        addDebugInfo(
          `⚠️ Suspicious patterns detected: ${suspiciousPatternsFound.join(
            ", "
          )}`
        );

        await securityManager.logSecurityEvent(
          admin.id,
          user.email!,
          "suspicious_request",
          "medium",
          {
            patterns: suspiciousPatternsFound,
            params: location.search,
            clientIP,
            path: location.pathname,
          }
        );
      } else {
        addDebugInfo(`✅ No suspicious patterns detected`);
      }

      updateCheckDetail("threat", {
        status: "scanned",
        suspiciousPatterns: suspiciousPatternsFound.length,
      });

      // ALL CHECKS PASSED!
      addDebugInfo("🎉 All security checks passed!");

      // Update last login
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (!admin.last_login_at || new Date(admin.last_login_at) < oneHourAgo) {
        await supabase
          .from("admin_users")
          .update({
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", admin.id);

        addDebugInfo("Last login timestamp updated");
      }

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
          checks_passed: Object.keys(checkDetails).length,
        }
      );

      // Start session monitoring
      sessionManager.startSessionMonitoring();

      setSecurityStatus("verified");
      localStorage.setItem("admin_verified_at", Date.now().toString());
      isInitialized.current = false; // Reset for next check
      return true;
    } catch (error: any) {
      console.error("❌ Security check error:", error);

      let errorMessage = "Security system error";
      if (
        error.message?.includes("relation") &&
        error.message?.includes("does not exist")
      ) {
        errorMessage =
          "Database tables missing. Please run the schema migration.";
      } else if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        errorMessage = "Session expired. Please log in again.";
      } else {
        errorMessage = error.message || "Unknown security error";
      }

      addDebugInfo(`❌ Fatal error: ${errorMessage}`);
      setFailedChecks([errorMessage]);
      setSecurityStatus("failed");
      isInitialized.current = false;

      return false;
    }
  }, [
    location,
    minRole,
    requiredPermissions,
    require2FA,
    securityManager,
    sessionManager,
    toast,
    getClientIP,
    addDebugInfo,
    updateCheckDetail,
    showDebug,
  ]);

  // Effect to run security checks
  useEffect(() => {
    const initializeSecurity = async () => {
      await performSecurityChecks();
    };

    initializeSecurity();

    // Cleanup function
    return () => {
      isInitialized.current = false;
    };
  }, [performSecurityChecks]);

  // Effect to handle security status changes
  useEffect(() => {
    if (securityStatus === "failed") {
      toast({
        variant: "destructive",
        title: "Security Check Failed",
        description: "You don't have permission to access this section",
        duration: 3000,
      });

      // Redirect after delay
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }

    if (securityStatus === "locked") {
      toast({
        variant: "destructive",
        title: "Account Locked",
        description: "Your account has been locked due to security violations",
        duration: 5000,
      });

      const timer = setTimeout(() => {
        navigate("/auth/login");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [securityStatus, navigate, toast]);

  const handle2FASuccess = () => {
    addDebugInfo("2FA verification successful");
    setSecurityStatus("verified");

    // Start session monitoring after 2FA success
    sessionManager.startSessionMonitoring();
  };

  const handle2FACancel = async () => {
    addDebugInfo("2FA verification cancelled");
    await sessionManager.logout();
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      addDebugInfo("Logging out...");
      await sessionManager.logout();
      await supabase.auth.signOut();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      addDebugInfo(`Logout error: ${error}`);
    }
  };

  const handleRetry = async () => {
    addDebugInfo("Retrying security checks...");
    isInitialized.current = false;
    await performSecurityChecks();
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
            <Progress value={progress} className="h-2" />

            <div className="text-center mb-4">
              <div className="text-sm text-gray-400">
                Progress: {Math.round(progress)}%
              </div>
            </div>

            <div className="space-y-3">
              {SECURITY_CHECKS.map((check, index) => {
                const isCurrent = index === currentCheck;
                const isCompleted = index < currentCheck;
                const detail = checkDetails[check.id];
                const Icon = check.icon;

                return (
                  <div
                    key={check.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-all border",
                      isCompleted
                        ? "bg-green-900/20 border-green-800"
                        : isCurrent
                          ? "bg-blue-900/20 border-blue-800 animate-pulse"
                          : "bg-gray-800/50 border-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          isCompleted
                            ? "bg-green-900 text-green-300"
                            : isCurrent
                              ? "bg-blue-900 text-blue-300"
                              : "bg-gray-800 text-gray-400"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {check.label}
                          {detail?.status === "failed" && (
                            <XCircle className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {check.description}
                        </div>
                        {detail && (
                          <div className="text-xs text-gray-500 mt-1">
                            {detail.status === "success" && detail.email && (
                              <span>✓ {detail.email}</span>
                            )}
                            {detail.status === "failed" && detail.error && (
                              <span className="text-red-400">
                                ✗ {detail.error}
                              </span>
                            )}
                            {detail.ip && <span>IP: {detail.ip}</span>}
                            {detail.role && <span>Role: {detail.role}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-900 text-green-300">
                        Verified
                      </Badge>
                    )}
                    {detail?.status === "failed" && (
                      <Badge className="bg-red-900 text-red-300">Failed</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {showDebug && debugInfo.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-300 mb-2">
                  Debug Information:
                </div>
                <div className="p-3 bg-gray-900 rounded-lg max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div
                      key={index}
                      className={cn(
                        "text-xs font-mono mb-1",
                        info.includes("❌") || info.includes("✗")
                          ? "text-red-400"
                          : info.includes("✅") || info.includes("✓")
                            ? "text-green-400"
                            : info.includes("⚠️")
                              ? "text-yellow-400"
                              : "text-gray-400"
                      )}
                    >
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="bg-blue-900/20 border-blue-800">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
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

  if (securityStatus === "2fa_required" && adminData) {
    return (
      <TwoFactorVerification
        adminId={adminData.id}
        adminEmail={adminData.userEmail}
        twoFactorMethod={adminData.two_factor_method || "authenticator"}
        sessionToken={adminData.sessionToken}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  if (securityStatus === "failed" || securityStatus === "locked") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              {securityStatus === "locked" ? "Account Locked" : "Access Denied"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {securityStatus === "locked"
                ? "Account security violation detected"
                : "Security verification failed"}
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
                    <XCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            {showDebug && debugInfo.length > 0 && (
              <div className="p-3 bg-gray-900 rounded-lg">
                <div className="text-sm font-medium text-gray-300 mb-2">
                  Debug Log:
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono mb-1 text-gray-400"
                    >
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert
              className={cn(
                "border",
                securityStatus === "locked"
                  ? "bg-yellow-900/20 border-yellow-800"
                  : "bg-blue-900/20 border-blue-800"
              )}
            >
              {securityStatus === "locked" ? (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              ) : (
                <Shield className="h-4 w-4 text-blue-400" />
              )}
              <AlertTitle
                className={
                  securityStatus === "locked"
                    ? "text-yellow-300"
                    : "text-blue-300"
                }
              >
                {securityStatus === "locked"
                  ? "What happened?"
                  : "Security Explanation"}
              </AlertTitle>
              <AlertDescription
                className={
                  securityStatus === "locked"
                    ? "text-yellow-200"
                    : "text-blue-200"
                }
              >
                {securityStatus === "locked"
                  ? "Your account has been temporarily locked due to multiple failed login attempts or security violations. This is an automated security measure."
                  : "Our security system detected one or more issues with your access request. This could be due to expired credentials, IP restrictions, or insufficient permissions."}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() =>
                  navigate(securityStatus === "locked" ? "/auth/login" : "/")
                }
              >
                {securityStatus === "locked" ? "Go to Login" : "Return Home"}
              </Button>
              {securityStatus === "failed" && (
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Verification
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (securityStatus === "verified") {
    return (
      <>
        {/* Session Monitor (hidden) */}
        <SessionMonitor onSessionExpired={handleLogout} />

        {/* Security Status Bar (optional - shows in dev mode) */}
        {showDebug && (
          <div className="fixed top-4 right-4 z-50">
            <Badge className="bg-green-900 text-green-300 text-xs">
              🔐 Session Active
            </Badge>
          </div>
        )}

        {children}
      </>
    );
  }

  return null;
};

// Session Monitor Component
const SessionMonitor: React.FC<{ onSessionExpired: () => void }> = ({
  onSessionExpired,
}) => {
  useEffect(() => {
    const checkSession = () => {
      const sessionExpiry = localStorage.getItem("admin_session_expiry");
      if (!sessionExpiry || new Date(sessionExpiry) < new Date()) {
        console.log("Session expired in monitor");
        onSessionExpired();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30 * 1000);

    // Initial check
    checkSession();

    return () => clearInterval(interval);
  }, [onSessionExpired]);

  return null;
};

export default AdminSecurityGate;
