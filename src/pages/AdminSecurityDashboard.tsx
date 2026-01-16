import { RefreshCw } from "lucide-react"; // Add this line
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SecurityManager } from "@/lib/security";
import {
  Shield,
  AlertTriangle,
  Users,
  Activity,
  Lock,
  Globe,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface SecurityMetrics {
  totalLogins: number;
  failedAttempts: number;
  blockedIPs: number;
  activeSessions: number;
  securityScore: number;
  threatsDetected: number;
}

interface SecurityEvent {
  id: string;
  admin_email: string;
  action_type: string;
  severity: string;
  ip_address: string;
  created_at: string;
  details: any;
}

export default function AdminSecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLogins: 0,
    failedAttempts: 0,
    blockedIPs: 0,
    activeSessions: 0,
    securityScore: 0,
    threatsDetected: 0,
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
    // Refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load security metrics
      const [
        loginAttempts,
        blockedIPs,
        activeSessions,
        securityEvents,
        recentActivity,
      ] = await Promise.all([
        supabase
          .from("admin_login_attempts")
          .select("*")
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          ),
        supabase
          .from("admin_actions")
          .select("*")
          .eq("action_type", "ip_blocked")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          ),
        supabase
          .from("admin_sessions")
          .select("*")
          .eq("is_revoked", false)
          .gt("expires_at", new Date().toISOString()),
        supabase
          .from("admin_actions")
          .select("*")
          .eq("resource_type", "security")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("admin_actions")
          .select("*")
          .eq("resource_type", "security")
          .order("created_at", { ascending: false })
          .limit(100), // Fetch more to filter locally for threats
      ]);

      const totalLogins =
        loginAttempts.data?.filter((l) => l.success).length || 0;
      const failedAttempts =
        loginAttempts.data?.filter((l) => !l.success).length || 0;

      // Filter threats locally from admin_actions
      const threats = recentActivity.data?.filter(event => {
        const severity = (event.details as any)?.severity;
        return severity === "high" || severity === "critical";
      }) || [];

      // Calculate security score (0-100)
      const securityScore = Math.max(
        0,
        100 - failedAttempts * 2 - (threats.length || 0) * 5
      );

      setMetrics({
        totalLogins,
        failedAttempts,
        blockedIPs: blockedIPs.data?.length || 0,
        activeSessions: activeSessions.data?.length || 0,
        securityScore,
        threatsDetected: threats.length || 0,
      });

      // Map admin_actions to SecurityEvent format
      const mappedEvents = (securityEvents.data || []).map(event => ({
        id: event.id,
        admin_email: (event.details as any)?.admin_email || 'System',
        action_type: event.action_type,
        severity: (event.details as any)?.severity || 'low',
        ip_address: (event.details as any)?.ip_address || 'N/A',
        created_at: event.created_at,
        details: event.details
      }));

      // Map threats similarly
      const mappedThreats = threats.map(event => ({
        id: event.id,
        admin_email: (event.details as any)?.admin_email,
        action_type: event.action_type,
        severity: (event.details as any)?.severity,
        ip_address: (event.details as any)?.ip_address,
        created_at: event.created_at,
        details: event.details
      }));

      setRecentEvents(mappedEvents);
      setSuspiciousActivity(mappedThreats.slice(0, 20));
    } catch (error) {
      console.error("Error loading security data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      admin_login: "Admin Login",
      admin_logout: "Admin Logout",
      ip_blocked: "IP Blocked",
      auth_failed: "Auth Failed",
      suspicious_request: "Suspicious Request",
      admin_access_granted: "Access Granted",
      "2fa_success": "2FA Success",
      unauthorized_admin_access: "Unauthorized Access",
    };
    return labels[actionType] || actionType.replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Security Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring and threat detection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadSecurityData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Badge
              variant={
                metrics.securityScore > 80
                  ? "default"
                  : metrics.securityScore > 60
                    ? "secondary"
                    : "destructive"
              }
            >
              Security Score: {metrics.securityScore}/100
            </Badge>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Active Sessions
                  </p>
                  <p className="text-2xl font-bold">{metrics.activeSessions}</p>
                  <p className="text-blue-200 text-xs">Currently logged in</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Successful Logins
                  </p>
                  <p className="text-2xl font-bold">{metrics.totalLogins}</p>
                  <p className="text-green-200 text-xs">Last 24 hours</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Failed Attempts
                  </p>
                  <p className="text-2xl font-bold">{metrics.failedAttempts}</p>
                  <p className="text-red-200 text-xs">Last 24 hours</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Threats Detected
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics.threatsDetected}
                  </p>
                  <p className="text-orange-200 text-xs">Recent activity</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Security Score */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Security Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Overall Security
                    </span>
                    <span className="text-sm font-bold">
                      {metrics.securityScore}%
                    </span>
                  </div>
                  <Progress value={metrics.securityScore} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Login Success Rate</span>
                      <span className="text-sm font-bold">
                        {metrics.totalLogins + metrics.failedAttempts > 0
                          ? Math.round(
                            (metrics.totalLogins /
                              (metrics.totalLogins +
                                metrics.failedAttempts)) *
                            100
                          )
                          : 100}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        metrics.totalLogins + metrics.failedAttempts > 0
                          ? (metrics.totalLogins /
                            (metrics.totalLogins + metrics.failedAttempts)) *
                          100
                          : 100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Session Health</span>
                      <span className="text-sm font-bold">
                        {metrics.activeSessions > 0 ? "Good" : "No Active"}
                      </span>
                    </div>
                    <Progress
                      value={metrics.activeSessions > 0 ? 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Force Logout All Sessions
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  Update IP Whitelist
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  View Audit Logs
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(event.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {event.admin_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getActionTypeLabel(event.action_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {event.ip_address}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Suspicious Activity Alerts */}
        {suspiciousActivity.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Suspicious Activity Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suspiciousActivity.map((activity) => (
                  <Alert key={activity.id} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {getActionTypeLabel(activity.action_type)}
                        </span>
                        <span className="text-sm">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        IP: {activity.ip_address} • Admin:{" "}
                        {activity.admin_email}
                      </div>
                      {activity.details && (
                        <div className="text-xs mt-2 bg-red-50 p-2 rounded">
                          {JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
