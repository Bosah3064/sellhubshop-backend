import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecurityManager } from "@/lib/security";
import {
  Shield,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Key,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "magic_link">(
    "password"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [clientIP, setClientIP] = useState<string>("");
  const [securityCheck, setSecurityCheck] = useState<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const securityManager = SecurityManager.getInstance();

  // Get client IP on component mount
  React.useEffect(() => {
    const getClientIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setClientIP(data.ip);

        // Check IP security
        const ipCheck = securityManager.isIPAllowed(data.ip);
        setSecurityCheck({
          ip: data.ip,
          allowed: ipCheck.allowed,
          reason: ipCheck.reason,
          timestamp: new Date().toISOString(),
        });

        if (!ipCheck.allowed) {
          console.warn(`Admin Access Restricted: Your Public IP is ${data.ip}. To allow this IP, add it to VITE_ADMIN_ALLOWED_IPS in your .env file.`);
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: `Your IP address (${data.ip}) is not authorized for admin access.`,
          });
        }
      } catch (error) {
        console.error("Error getting IP:", error);
      }
    };

    getClientIP();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if account is locked
      const isLocked = await securityManager.isAccountLocked(email);
      if (isLocked) {
        toast({
          variant: "destructive",
          title: "Account Locked",
          description:
            "This account has been temporarily locked due to multiple failed login attempts.",
        });
        setIsLoading(false);
        return;
      }

      // Check IP restrictions
      if (securityCheck && !securityCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description:
            securityCheck.reason || "Your IP address is not authorized.",
        });
        setIsLoading(false);
        return;
      }



      if (loginMethod === "password") {
        // Sign in with password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Track failed attempt
          await securityManager.trackLoginAttempt(email, clientIP, false);

          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description:
                error.message || "Failed to authenticate. Please try again.",
            });
          }
          setIsLoading(false);
          return;
        }

        // Track successful login attempt
        await securityManager.trackLoginAttempt(email, clientIP, true);

        // Check if user is an admin
        const { data: admin, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("user_id", data.user.id)
          .eq("is_active", true)
          .single();

        // Cast admin to any to bypass missing type definition for two_factor_enabled
        const adminData = admin as any;

        if (adminError || !admin) {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description:
              "You don't have administrator privileges for this panel.",
          });
          setIsLoading(false);
          return;
        }

        // Generate secure session
        const sessionToken = securityManager.generateSessionToken();
        const expiresAt = new Date(Date.now() + 120 * 60 * 1000); // 2 hours

        try {
          // If admin has 2FA enabled, the database might block session creation until 2FA is verified
          // The AdminSecurityGate will handle this if we skip it here
          await supabase.from("admin_sessions" as any).insert({
            admin_id: admin.id,
            session_token: sessionToken,
            ip_address: clientIP,
            user_agent: navigator.userAgent,
            expires_at: expiresAt.toISOString(),
            two_factor_verified: false,
          });

          localStorage.setItem("admin_session_token", sessionToken);
          localStorage.setItem("admin_session_expiry", expiresAt.toISOString());
        } catch (sessionErr: any) {
          if (sessionErr.message?.includes("Two-factor authentication required") || sessionErr.code === 'P0001') {
            console.log("Admin session creation deferred: 2FA required. Security Gate will handle verification.");
            // We still proceed to /admin, but without a session token in localStorage 
            // OR we can still save the token/expiry to help the Security Gate identify the attempt
            localStorage.setItem("admin_session_token", sessionToken); // The gate will try to validate this and fail, then trigger 2FA
            localStorage.setItem("admin_session_expiry", expiresAt.toISOString());
          } else {
            throw sessionErr;
          }
        }

        // Log successful admin login
        await securityManager.logSecurityEvent(
          admin.id,
          email,
          "admin_login_success",
          "low",
          {
            method: "password",
            ip: clientIP,
            role: admin.role,
          }
        );

        toast({
          title: "Welcome, Admin",
          description: "Successfully logged into admin panel.",
        });

        navigate("/admin");
      } else if (loginMethod === "magic_link") {
        // Send magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?type=admin`,
          },
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to send magic link.",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Magic Link Sent",
          description: "Check your email for the login link.",
        });
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyAccess = () => {
    toast({
      title: "Emergency Access",
      description: "Please contact the system administrator for emergency access codes.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">
            Admin Security Portal
          </CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Restricted access to authorized administrators only
          </CardDescription>

          {securityCheck && (
            <div className="mt-4">
              <Badge
                variant={securityCheck.allowed ? "default" : "destructive"}
                className="flex items-center gap-2"
              >
                {securityCheck.allowed ? (
                  <>
                    <Shield className="h-3 w-3" />
                    IP Authorized
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    IP Restricted
                  </>
                )}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">{securityCheck.ip}</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Alert className="mb-6 bg-blue-900/20 border-blue-800">
            <AlertDescription className="text-blue-200 text-sm">
              <strong className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warning:
              </strong>
              Unauthorized access to this system is strictly prohibited and
              monitored. All activities are logged and recorded.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900">
              <TabsTrigger
                value="password"
                onClick={() => setLoginMethod("password")}
                className="data-[state=active]:bg-gray-700"
              >
                <Key className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="magic"
                onClick={() => setLoginMethod("magic_link")}
                className="data-[state=active]:bg-gray-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Magic Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="admin-email"
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <Mail className="h-4 w-4" />
                    Admin Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="admin-password"
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-gray-900 border-gray-700 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <Link
                      to="/reset-password"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Forgot password?
                    </Link>
                    <span className="text-xs text-gray-500">
                      Min. 12 characters
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={
                    isLoading || (securityCheck && !securityCheck.allowed)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Access Admin Panel
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="magic" className="space-y-4 mt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    We'll send you a secure login link
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={
                    isLoading || (securityCheck && !securityCheck.allowed)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-6 bg-gray-700" />

          <div className="space-y-4">
            <Alert className="bg-gray-900/50 border-gray-700">
              <AlertDescription className="text-gray-400 text-xs">
                <strong>Security Features:</strong>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-green-400" />
                    IP Address Restriction
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-green-400" />
                    Two-Factor Authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-green-400" />
                    Session Timeout (2 hours)
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-green-400" />
                    Real-time Monitoring
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={handleEmergencyAccess}
              >
                <AlertTriangle className="h-3 w-3 mr-2" />
                Emergency Access
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-700 pt-6">
          <p className="text-xs text-gray-500 text-center w-full">
            By accessing this system, you agree to comply with all security
            policies and procedures.
            <br />
            All login attempts are monitored and recorded for security purposes.
            <br />© {new Date().getFullYear()} Admin Security Portal
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
