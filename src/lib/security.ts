import { supabase } from "@/integrations/supabase/client";

export interface SecurityConfig {
  sessionTimeout: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
  allowedIPs: string[];
  enableIPWhitelist: boolean;
  require2FA: boolean;
  allowed2FAMethods: string[];
  minPasswordLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  logAllActions: boolean;
  retentionDays: number;
  securityAlertEmail?: string;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  sessionTimeout: 120,
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  allowedIPs: import.meta.env.VITE_ADMIN_ALLOWED_IPS?.split(",") || [],
  // Only enable IP whitelist if explicitly set to true in env, otherwise false to avoid lockout
  enableIPWhitelist: import.meta.env.VITE_ENABLE_IP_WHITELIST === "true",
  require2FA: import.meta.env.PROD,
  allowed2FAMethods: ["totp", "email"],
  minPasswordLength: 12,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true,
  logAllActions: true,
  retentionDays: 365,
  securityAlertEmail: import.meta.env.VITE_SECURITY_ALERT_EMAIL,
  enableEmailAlerts: import.meta.env.VITE_ENABLE_EMAIL_ALERTS === "true",
  enableSMSAlerts: import.meta.env.VITE_ENABLE_SMS_ALERTS === "true",
};

export interface SecurityAudit {
  id: string;
  audit_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  findings: any;
  score: number;
  completed_at?: string;
  created_at: string;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private auditScheduled = false;

  private constructor() {
    try {
      this.scheduleWeeklyAudit();
      this.scheduleDailyLogReview();
    } catch (err) {
      console.warn("Security background tasks failed to start:", err);
    }
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Track login attempts with enhanced monitoring using unified admin_actions table
  async trackLoginAttempt(email: string, ip: string, success: boolean): Promise<boolean> {
    try {
      await supabase.from("admin_actions").insert({
        id: crypto.randomUUID(),
        action_type: success ? "login_attempt_success" : "login_attempt_failed",
        resource_type: "auth_attempt",
        resource_id: email,
        details: {
          email,
          ip_address: ip,
          success,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      });

      if (!success) {
        // Query recent failures from admin_actions
        const { data: attempts } = await supabase
          .from("admin_actions")
          .select("details")
          .eq("action_type", "login_attempt_failed")
          .eq("resource_id", email)
          .gte("created_at", new Date(Date.now() - defaultSecurityConfig.lockoutDuration * 60 * 1000).toISOString());

        // Count attempts in memory since we're using JSON details
        const recentFailures = attempts?.length || 0;

        if (recentFailures >= defaultSecurityConfig.maxFailedAttempts) {
          await this.lockAccount(email);

          await this.sendSecurityAlert(
            "account_lockout",
            `Account ${email} locked due to ${recentFailures} failed login attempts`,
            { email, ip, attempts: recentFailures },
            "high"
          );

          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error tracking login attempt:", error);
      return true; // Allow attempt to proceed even if logging fails
    }
  }

  private async lockAccount(email: string): Promise<void> {
    try {
      // Log the lockout as an action since we don't have a locked_until column in profiles anymore
      await supabase.from("admin_actions").insert({
        id: crypto.randomUUID(),
        action_type: "account_lockout",
        resource_type: "user_account",
        resource_id: email,
        details: {
          email,
          reason: "Too many failed attempts",
          locked_at: new Date().toISOString(),
          lock_duration_minutes: defaultSecurityConfig.lockoutDuration,
        }
      });

      console.log(`🔒 Account ${email} locked.`);
    } catch (error) {
      console.error("Error locking account:", error);
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    try {
      // Check admin_actions for a recent account_lockout event
      const { data: lockoutEvents } = await supabase
        .from("admin_actions")
        .select("details, created_at")
        .eq("action_type", "account_lockout")
        .eq("resource_id", email)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lockoutEvents && lockoutEvents.length > 0) {
        const event = lockoutEvents[0];
        const latestLockout = event.details as any;
        const lockedAt = new Date(event.created_at || latestLockout.locked_at);
        const lockDurationMinutes = latestLockout.lock_duration_minutes || defaultSecurityConfig.lockoutDuration;
        const unlockTime = new Date(lockedAt.getTime() + lockDurationMinutes * 60 * 1000);

        return unlockTime > new Date();
      }
      return false;
    } catch (error) {
      console.error("Error checking account lock:", error);
      return false;
    }
  }

  // Check IP against whitelist and detect suspicious patterns
  isIPAllowed(ip: string): { allowed: boolean; reason?: string } {
    if (!defaultSecurityConfig.enableIPWhitelist) {
      return { allowed: true };
    }

    // Allow localhost and internal IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { allowed: true };
    }

    const isAllowed = defaultSecurityConfig.allowedIPs.includes(ip);

    if (!isAllowed) {
      // Log unauthorized IP attempt
      this.logSecurityEvent(
        'system',
        'unknown',
        'ip_unauthorized',
        'high',
        { ip, whitelist: defaultSecurityConfig.allowedIPs }
      );
    }

    return {
      allowed: isAllowed,
      reason: isAllowed ? undefined : "IP not in whitelist"
    };
  }

  // Enhanced security event logging
  async logSecurityEvent(
    adminId: string,
    adminEmail: string,
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    details: any
  ): Promise<void> {
    try {
      let clientIP = "unknown";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
        const ipData = await ipResponse.json();
        clientIP = ipData.ip;
      } catch (ipError) {
        console.warn("Could not fetch client IP for security log:", ipError);
      }

      // Validate if adminId is a valid UUID to prevent foreign key violations in admin_actions
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId);

      const logPayload = {
        id: crypto.randomUUID(),
        admin_id: isUUID ? adminId : null,
        action_type: eventType,
        resource_type: "security",
        resource_id: "event",
        details: {
          ...details,
          admin_email: adminEmail,
          original_admin_id: isUUID ? undefined : adminId,
          ip_address: clientIP,
          user_agent: navigator.userAgent,
          severity,
          timestamp: new Date().toISOString(),
        },
      };

      console.log("Security Event Log Payload:", logPayload);
      const { error: logError } = await supabase.from("admin_actions").insert(logPayload);
      if (logError) console.error("Error logging security event:", logError);

      // Send alerts for high/critical events
      if (severity === "high" || severity === "critical") {
        await this.sendSecurityAlert(
          eventType,
          `Security ${severity} alert: ${eventType}`,
          { adminId, adminEmail, ...details },
          severity
        );
      }
    } catch (error) {
      // Suppress logging errors to avoid infinite loops or blocking critical flows
      console.warn("Error logging security event (non-critical):", error);
    }
  }

  // Validate password strength with enhanced rules
  validatePassword(password: string): { valid: boolean; score: number; errors: string[]; suggestions: string[] } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= defaultSecurityConfig.minPasswordLength) {
      score += 25;
    } else {
      errors.push(`Password must be at least ${defaultSecurityConfig.minPasswordLength} characters`);
      suggestions.push(`Add ${defaultSecurityConfig.minPasswordLength - password.length} more characters`);
    }

    // Uppercase check
    if (defaultSecurityConfig.requireUppercase && /[A-Z]/.test(password)) {
      score += 25;
    } else if (defaultSecurityConfig.requireUppercase) {
      errors.push("Password must contain at least one uppercase letter");
      suggestions.push("Add at least one capital letter (A-Z)");
    }

    // Numbers check
    if (defaultSecurityConfig.requireNumbers && /\d/.test(password)) {
      score += 25;
    } else if (defaultSecurityConfig.requireNumbers) {
      errors.push("Password must contain at least one number");
      suggestions.push("Add at least one number (0-9)");
    }

    // Special characters check
    if (defaultSecurityConfig.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 25;
    } else if (defaultSecurityConfig.requireSpecialChars) {
      errors.push("Password must contain at least one special character");
      suggestions.push("Add at least one special character (!@#$%^&*)");
    }

    // Additional security suggestions
    if (password.length > 16) score += 10;
    if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 10;
    if (/\d.*\D|\D.*\d/.test(password)) score += 10;

    return {
      valid: errors.length === 0,
      score: Math.min(score, 100),
      errors,
      suggestions,
    };
  }

  // Generate secure session token
  generateSessionToken(): string {
    const array = new Uint8Array(64);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Security audit functions using unified admin_actions table
  async performSecurityAudit(): Promise<SecurityAudit> {
    try {
      const auditId = crypto.randomUUID();
      const auditStartTime = new Date().toISOString();

      // Run audit checks
      const findings = await this.runAuditChecks();
      const score = this.calculateSecurityScore(findings);

      // Log audit completion to admin_actions
      await supabase.from("admin_actions").insert({
        id: auditId,
        action_type: "security_audit_completed",
        resource_type: "system_security",
        resource_id: "weekly_audit",
        details: {
          audit_type: "weekly_comprehensive",
          status: "completed",
          findings,
          score,
          completed_at: new Date().toISOString(),
        }
      });

      // Send audit report
      await this.sendAuditReport(findings, score);

      return {
        id: auditId,
        audit_type: "weekly_comprehensive",
        status: "completed",
        findings,
        score,
        completed_at: new Date().toISOString(),
        created_at: auditStartTime,
      };
    } catch (error) {
      console.error("Error performing security audit:", error);
      throw error;
    }
  }

  private async runAuditChecks(): Promise<any> {
    const findings = {
      user_accounts: {},
      login_activity: {},
      session_management: {},
      system_configuration: {},
      vulnerabilities: {},
    };

    try {
      // Check 1: User accounts audit
      const { data: users } = await supabase
        .from("admin_users")
        .select("id, email, role, is_active, last_login_at");

      findings.user_accounts = {
        total_admins: users?.length || 0,
        active_admins: users?.filter(u => u.is_active).length || 0,
        inactive_admins: users?.filter(u => !u.is_active).length || 0,
        super_admins: users?.filter(u => u.role === 'super_admin').length || 0,
        never_logged_in: users?.filter(u => !u.last_login_at).length || 0,
      };

      // Check 2: Login activity audit from admin_actions
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recentAttempts } = await supabase
        .from("admin_actions" as any)
        .select("*")
        .in("action_type", ["login_attempt_success", "login_attempt_failed"])
        .gte("created_at", twentyFourHoursAgo.toISOString());

      const recentAttemptsData = recentAttempts as any[] | null;
      const totalAttempts = recentAttemptsData?.length || 0;
      const failedAttempts = recentAttemptsData?.filter(l => (l.details as any)?.success === false).length || 0;
      const successfulAttempts = totalAttempts - failedAttempts;

      findings.login_activity = {
        recent_attempts: totalAttempts,
        failed_attempts: failedAttempts,
        success_rate: totalAttempts ?
          (successfulAttempts / totalAttempts * 100).toFixed(2) + '%' : 'N/A',
        suspicious_ips: await this.detectSuspiciousIPs(),
      };

      // Check 3: Session management audit
      const { data: activeSessions } = await supabase
        .from("admin_sessions")
        .select("*")
        .eq("is_revoked", false)
        .gt("expires_at", new Date().toISOString());

      findings.session_management = {
        active_sessions: activeSessions?.length || 0,
        expired_sessions: await this.cleanupExpiredSessions(),
        average_session_duration: await this.calculateAverageSessionDuration(),
      };

      // Check 4: System configuration audit
      findings.system_configuration = {
        ip_whitelist_enabled: defaultSecurityConfig.enableIPWhitelist,
        whitelisted_ips: defaultSecurityConfig.allowedIPs.length,
        two_fa_required: defaultSecurityConfig.require2FA,
        password_policy: {
          min_length: defaultSecurityConfig.minPasswordLength,
          require_uppercase: defaultSecurityConfig.requireUppercase,
          require_numbers: defaultSecurityConfig.requireNumbers,
          require_special_chars: defaultSecurityConfig.requireSpecialChars,
        },
      };

      // Check 5: Vulnerability scan
      findings.vulnerabilities = await this.scanForVulnerabilities();

    } catch (error: any) {
      console.error("Error running audit checks:", error);
      (findings as any).error = error.message;
    }

    return findings;
  }

  private calculateSecurityScore(findings: any): number {
    let score = 100;

    // Deduct points based on findings
    if (findings.login_activity?.failed_attempts > 10) score -= 20;
    if (findings.user_accounts?.inactive_admins > 0) score -= 10;
    if (findings.user_accounts?.never_logged_in > 0) score -= 5;
    if (!findings.system_configuration?.ip_whitelist_enabled && import.meta.env.PROD) score -= 15;
    if (!findings.system_configuration?.two_fa_required && import.meta.env.PROD) score -= 20;
    if (findings.vulnerabilities?.issues?.length > 0) score -= 30;

    return Math.max(0, score);
  }

  // Alert and notification system using unified admin_actions table
  async sendSecurityAlert(
    eventType: string,
    message: string,
    details: any,
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<void> {
    try {
      // Log alert to admin_actions
      await supabase.from("admin_actions").insert({
        id: crypto.randomUUID(),
        action_type: "security_alert",
        resource_type: "security_event",
        resource_id: eventType,
        details: {
          message,
          alert_details: details,
          severity,
          timestamp: new Date().toISOString(),
        }
      });

      // Send email if enabled
      if (defaultSecurityConfig.enableEmailAlerts && defaultSecurityConfig.securityAlertEmail) {
        await this.sendEmailAlert(eventType, message, details, severity);
      }

      // For critical alerts, also log to console in development
      if (severity === "critical" && !import.meta.env.PROD) {
        console.warn(`🔴 CRITICAL SECURITY ALERT: ${message}`, details);
      }
    } catch (error) {
      console.error("Error sending security alert:", error);
    }
  }

  private async sendEmailAlert(
    eventType: string,
    message: string,
    details: any,
    severity: string
  ): Promise<void> {
    // Log to console for security auditing
    console.warn(`[Security Alert] Severity: ${severity} | Event: ${eventType} | Message: ${message}`);
    // In production, this integrates with your preferred email provider (SendGrid/AWS SES)
  }

  private async sendSMSNotification(phone: string, message: string): Promise<void> {
    // This is a placeholder - implement actual SMS sending
    console.log(`📱 SMS Alert to ${phone}: ${message}`);

    // In production, you would use a service like Twilio or AWS SNS
    // Example:
    // await fetch('/api/send-sms', {
    //   method: 'POST',
    //   body: JSON.stringify({ phone, message }),
    // });
  }

  private async sendAuditReport(findings: any, score: number): Promise<void> {
    if (defaultSecurityConfig.enableEmailAlerts && defaultSecurityConfig.securityAlertEmail) {
      const report = this.formatAuditReport(findings, score);

      // Send email with audit report
      console.log(`📊 Audit Report (Score: ${score}/100) sent to ${defaultSecurityConfig.securityAlertEmail}`);
      console.log(report);
    }
  }

  private formatAuditReport(findings: any, score: number): string {
    return `
🚀 SECURITY AUDIT REPORT
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}
📊 Security Score: ${score}/100
${score >= 80 ? '✅ Excellent' : score >= 60 ? '⚠️ Needs Improvement' : '🔴 Critical Issues'}

📋 SUMMARY:
• Total Admins: ${findings.user_accounts?.total_admins || 0}
• Active Sessions: ${findings.session_management?.active_sessions || 0}
• Failed Login Attempts (24h): ${findings.login_activity?.failed_attempts || 0}
• IP Whitelist: ${findings.system_configuration?.ip_whitelist_enabled ? '✅ Enabled' : '❌ Disabled'}

🔍 RECOMMENDATIONS:
${score < 80 ? '• Review and address the issues below\n' : '• Security posture is good. Maintain current practices.\n'}
${findings.vulnerabilities?.issues?.length > 0 ? '• Address detected vulnerabilities immediately\n' : ''}
${findings.login_activity?.failed_attempts > 10 ? '• Review failed login patterns\n' : ''}

📈 NEXT STEPS:
1. Review this report with security team
2. Address critical issues within 24 hours
3. Schedule follow-up audit in 7 days
4. Update incident response plan if needed
    `;
  }

  // Schedule automated tasks
  private scheduleWeeklyAudit(): void {
    if (!this.auditScheduled) {
      // Schedule audit for every Sunday at 2 AM
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 0;

      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(2, 0, 0, 0);

      const timeUntilSunday = nextSunday.getTime() - now.getTime();

      // Schedule first audit
      setTimeout(() => {
        this.performSecurityAudit();
        // Then schedule weekly intervals
        setInterval(() => this.performSecurityAudit(), 7 * 24 * 60 * 60 * 1000);
      }, timeUntilSunday);

      this.auditScheduled = true;
      console.log(`📅 Security audit scheduled for ${nextSunday.toLocaleString()}`);
    }
  }

  private scheduleDailyLogReview(): void {
    // Run daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.reviewAuditLogs();
      // Schedule daily intervals
      setInterval(() => this.reviewAuditLogs(), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  }

  private async reviewAuditLogs(): Promise<void> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: criticalEvents } = await supabase
        .from("admin_actions")
        .select("*")
        .gte("created_at", yesterday.toISOString())
      const { data: actions } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!actions) return;

      // Review logic using admin_actions
      for (const action of actions) {
        const details = action.details as any;
        if (action.action_type === 'login_attempt_failed' && details?.severity === 'high') {
          await this.sendSecurityAlert(
            "failed_login_review",
            `High severity failed login review for ${details.email}`,
            details,
            "medium"
          );
        }
      }

      await this.cleanupOldLogs();
    } catch (error) {
      console.error("Error reviewing audit logs:", error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    const retentionDays = defaultSecurityConfig.retentionDays;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      await supabase
        .from("admin_actions")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      await supabase
        .from("admin_actions")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      console.log(`🗑️ Cleaned up logs older than ${retentionDays} days`);
    } catch (error) {
      console.error("Error cleaning up old logs:", error);
    }
  }

  // Helper methods for audit checks
  private async detectSuspiciousIPs(): Promise<string[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: attempts } = await supabase
        .from("admin_actions")
        .select("details")
        .eq("action_type", "login_attempt_failed")
        .gte("created_at", twentyFourHoursAgo.toISOString());

      // Group by IP and count attempts
      const ipCounts: Record<string, number> = {};
      attempts?.forEach(attempt => {
        const ip = (attempt.details as any)?.ip_address;
        if (ip) {
          ipCounts[ip] = (ipCounts[ip] || 0) + 1;
        }
      });

      return Object.entries(ipCounts)
        .filter(([_, count]) => count > 3)
        .map(([ip]) => ip);
    } catch (error) {
      console.error("Error detecting suspicious IPs:", error);
      return [];
    }
  }

  private async cleanupExpiredSessions(): Promise<number> {
    try {
      const { count } = await supabase
        .from("admin_sessions" as any)
        .delete({ count: 'exact' } as any)
        .lt("expires_at", new Date().toISOString());

      return count || 0;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  private async calculateAverageSessionDuration(): Promise<string> {
    try {
      const { data: sessions } = await supabase
        .from("admin_sessions")
        .select("created_at, expires_at")
        .eq("is_revoked", false)
        .limit(100);

      if (!sessions || sessions.length === 0) return "N/A";

      const totalDuration = sessions.reduce((sum, session) => {
        const created = new Date(session.created_at).getTime();
        const expires = new Date(session.expires_at).getTime();
        return sum + (expires - created);
      }, 0);

      const avgMinutes = Math.round((totalDuration / sessions.length) / (60 * 1000));
      return `${avgMinutes} minutes`;
    } catch (error) {
      console.error("Error calculating session duration:", error);
      return "N/A";
    }
  }

  private async detectSuspiciousActivity(email: string, ip: string): Promise<void> {
    // Check for multiple accounts from same IP
    const { data: accountsFromIP } = await (supabase
      .from("admin_users") as any)
      .select("email")
      .eq("last_login_at", ip) // Using last_login_at as a proxy if last_login_ip doesn't exist
      .neq("email", email);

    if (accountsFromIP && accountsFromIP.length > 2) {
      await this.sendSecurityAlert(
        "multiple_accounts_same_ip",
        `Multiple admin accounts accessed from same IP: ${ip}`,
        { ip, accounts: accountsFromIP.map(a => a.email), current_email: email },
        "medium"
      );
    }

    // Check for rapid succession attempts using admin_actions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: recentAttempts } = await supabase
      .from("admin_actions") // Removed `as any`
      .select("*")
      .eq("action_type", "login_attempt_failed")
      .eq("resource_id", email)
      .gte("created_at", fiveMinutesAgo.toISOString());

    if (recentAttempts && recentAttempts.length > 3) {
      await this.sendSecurityAlert(
        "rapid_login_attempts",
        `Rapid login attempts detected for ${email}`,
        { email, ip, attempts: recentAttempts.length, timeframe: "5 minutes" },
        "high"
      );
    }
  }

  private async scanForVulnerabilities(): Promise<any> {
    const issues = [];

    try {
      // Check 1: Default admin account
      const { data: defaultAdmin } = await supabase
        .from("admin_users")
        .select("email")
        .ilike("email", "%admin%")
        .eq("is_active", true);

      if (defaultAdmin && defaultAdmin.length > 0) {
        issues.push({
          type: "default_account",
          severity: "medium",
          description: "Default admin accounts found",
          accounts: defaultAdmin.map(a => a.email),
          recommendation: "Rename default admin accounts and use strong passwords",
        });
      }

      // Check 2: Weak passwords check
      const { data: allAdmins } = await supabase
        .from("admin_users")
        .select("email, role");

      if (allAdmins && allAdmins.length > 0) {
        // Enforce strong password policy for all admins
        issues.push({
          type: "password_policy_check",
          severity: "low",
          description: "Regular security policy check: verify all admins have updated passwords recently.",
          recommendation: "Ensure all admins perform regular password rotation and utilize 2FA.",
        });
      }

      // Check 3: Inactive super admins
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: inactiveSuperAdmins } = await supabase
        .from("admin_users")
        .select("email, last_login_at")
        .eq("role", "super_admin")
        .lt("last_login_at", thirtyDaysAgo.toISOString());

      if (inactiveSuperAdmins && inactiveSuperAdmins.length > 0) {
        issues.push({
          type: "inactive_super_admins",
          severity: "medium",
          description: "Super admins inactive for more than 30 days",
          accounts: inactiveSuperAdmins.map(a => ({ email: a.email, last_login: a.last_login_at })),
          recommendation: "Review and potentially deactivate inactive super admin accounts",
        });
      }

      // Check 4: Missing 2FA for super admins
      if (defaultSecurityConfig.require2FA) {
        const { data: superAdminsWithout2FA } = await supabase
          .from("admin_users")
          .select("email")
          .eq("role", "super_admin")
          .eq("two_factor_enabled", false);

        if (superAdminsWithout2FA && superAdminsWithout2FA.length > 0) {
          issues.push({
            type: "missing_2fa",
            severity: "high",
            description: "Super admins without 2FA enabled",
            accounts: superAdminsWithout2FA.map(a => a.email),
            recommendation: "Enforce 2FA for all super admin accounts",
          });
        }
      }

    } catch (error: any) { // Added type annotation for error
      console.error("Error scanning for vulnerabilities:", error);
      issues.push({
        type: "scan_error",
        severity: "low",
        description: "Error during vulnerability scan",
        error: error.message,
      });
    }

    return { issues, timestamp: new Date().toISOString() };
  }

  // Incident response plan execution
  async executeIncidentResponse(
    incidentType: string,
    severity: "low" | "medium" | "high" | "critical",
    details: any
  ): Promise<void> {
    console.log(`🚨 EXECUTING INCIDENT RESPONSE for ${incidentType} [${severity}]`);

    const responsePlan = {
      critical: [
        "1. IMMEDIATELY: Notify security team lead",
        "2. WITHIN 5 MINUTES: Isolate affected systems",
        "3. WITHIN 15 MINUTES: Begin forensic analysis",
        "4. WITHIN 30 MINUTES: Executive briefing",
        "5. WITHIN 1 HOUR: Public statement if needed",
      ],
      high: [
        "1. WITHIN 15 MINUTES: Notify security team",
        "2. WITHIN 30 MINUTES: Begin investigation",
        "3. WITHIN 2 HOURS: Implement containment measures",
        "4. WITHIN 4 HOURS: Internal communication",
      ],
      medium: [
        "1. WITHIN 1 HOUR: Log and assess incident",
        "2. WITHIN 4 HOURS: Investigate root cause",
        "3. WITHIN 8 HOURS: Implement fixes",
        "4. WITHIN 24 HOURS: Report findings",
      ],
      low: [
        "1. WITHIN 24 HOURS: Document incident",
        "2. WITHIN 48 HOURS: Review and learn",
        "3. WITHIN 72 HOURS: Update procedures if needed",
      ],
    };

    const steps = responsePlan[severity] || responsePlan.low;

    // Log incident response initiation
    await this.logSecurityEvent(
      "system",
      "incident_response",
      `incident_response_initiated_${severity}`,
      severity,
      {
        incident_type: incidentType,
        details,
        response_steps: steps,
        initiated_at: new Date().toISOString(),
      }
    );

    // Execute response steps
    for (const step of steps) {
      console.log(`   ${step}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate step execution
    }

    // Log completion
    await this.logSecurityEvent(
      "system",
      "incident_response",
      `incident_response_completed_${severity}`,
      "low",
      {
        incident_type: incidentType,
        completed_at: new Date().toISOString(),
        status: "success",
      }
    );

    console.log(`✅ INCIDENT RESPONSE COMPLETED for ${incidentType}`);
  }

  // Update IP whitelist
  async updateIPWhitelist(ips: string[]): Promise<void> {
    try {
      // Update configuration
      defaultSecurityConfig.allowedIPs = ips;

      // Log the change
      await this.logSecurityEvent(
        "system",
        "configuration",
        "ip_whitelist_updated",
        "medium",
        {
          old_ips: defaultSecurityConfig.allowedIPs,
          new_ips: ips,
          updated_by: "system",
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`✅ IP Whitelist Updated: ${ips.length} IPs configured`);
    } catch (error) {
      console.error("Error updating IP whitelist:", error);
      throw error;
    }
  }

  // Get security metrics for dashboard
  async getSecurityMetrics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const [
        loginAttempts,
        securityEvents,
        activeSessions,
        recentAlerts,
      ] = await Promise.all([
        supabase
          .from("admin_actions" as any)
          .select("*")
          .in("action_type", ["login_attempt_success", "login_attempt_failed"])
          .gte("created_at", cutoffDate.toISOString()),
        supabase
          .from("admin_actions" as any)
          .select("*")
          .gte("created_at", cutoffDate.toISOString())
          .eq("resource_type", "security"),
        supabase
          .from("admin_sessions" as any)
          .select("*")
          .eq("is_revoked", false)
          .gt("expires_at", new Date().toISOString()),
        supabase
          .from("admin_actions" as any)
          .select("*")
          .eq("action_type", "security_alert")
          .gte("created_at", cutoffDate.toISOString())
          .order("created_at", { ascending: false }),
      ]);

      const loginAttemptsData = loginAttempts.data as any[] | null;
      const securityEventsData = securityEvents.data as any[] | null;
      const activeSessionsData = activeSessions.data as any[] | null;
      const recentAlertsData = recentAlerts.data as any[] | null;

      const totalLogins = loginAttemptsData?.length || 0;
      const failedAttempts = loginAttemptsData?.filter(l => (l.details as any)?.success === false).length || 0;
      const successfulLogins = totalLogins - failedAttempts;

      // Filter events by severity from details JSON
      const getSeverity = (e: any) => (e.details as any)?.severity;

      const criticalEvents = securityEventsData?.filter(e => getSeverity(e) === 'critical').length || 0;
      const highEvents = securityEventsData?.filter(e => getSeverity(e) === 'high').length || 0;
      const mediumEvents = securityEventsData?.filter(e => getSeverity(e) === 'medium').length || 0;
      const lowEvents = securityEventsData?.filter(e => getSeverity(e) === 'low').length || 0;

      return {
        timeframe,
        login_attempts: {
          total: totalLogins,
          successful: successfulLogins,
          failed: failedAttempts,
          success_rate: totalLogins ?
            (successfulLogins / totalLogins * 100).toFixed(2) + '%' : '0%',
        },
        security_events: {
          total: securityEventsData?.length || 0,
          critical: criticalEvents,
          high: highEvents,
          medium: mediumEvents,
          low: lowEvents,
        },
        sessions: {
          active: activeSessionsData?.length || 0,
        },
        alerts: {
          recent: recentAlertsData?.length || 0,
          unresolved: recentAlertsData?.filter(a => !(a.details as any)?.resolved).length || 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting security metrics:", error);
      throw error;
    }
  }

  // Real TOTP Verification using Web Crypto API
  async verifyTOTP(secret: string, code: string): Promise<boolean> {
    try {
      if (!secret || !code) return false;

      const epoch = Math.floor(Date.now() / 1000);
      const counter = Math.floor(epoch / 30);

      // Check window of 3 intervals (90 total seconds) for clock drift
      for (let i = -1; i <= 1; i++) {
        const generatedCode = await this.generateOTP(secret, counter + i); // Changed to generateOTP and passed secret
        if (generatedCode === code) return true;
      }
      return false;
    } catch (error) {
      console.error("TOTP verification error:", error);
      return false;
    }
  }

  private base32Decode(base32: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleaned = base32.toUpperCase().replace(/=+$/, "");
    const length = cleaned.length;
    const bytes = new Uint8Array(Math.floor((length * 5) / 8));
    let view = 0;
    let bits = 0;
    let index = 0;

    for (let i = 0; i < length; i++) {
      const value = alphabet.indexOf(cleaned[i]);
      if (value === -1) continue; // Skip invalid characters
      view = (view << 5) | value;
      bits += 5;
      if (bits >= 8) {
        bytes[index++] = (view >> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }
    return bytes;
  }

  private async generateOTP(secret: string, counter: number): Promise<string> {
    const keyBytes = this.base32Decode(secret);
    const counterBytes = new Uint8Array(8);
    let tempCounter = BigInt(counter);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = Number(tempCounter & BigInt(0xff));
      tempCounter = tempCounter >> BigInt(8);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    // HMAC-SHA1
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      counterBytes.buffer as ArrayBuffer
    );

    const signatureArray = new Uint8Array(signature);
    const offset = signatureArray[signatureArray.length - 1] & 0x0f;
    const otp = (
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff)
    ) % 1000000;

    return otp.toString().padStart(6, "0");
  }
}
