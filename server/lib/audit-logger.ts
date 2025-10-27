import type { Request } from "express";

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  username?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: any;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k log entries

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.logs.push(logEntry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for monitoring
    const logMessage = `[AUDIT] ${logEntry.action} by ${logEntry.username || 'anonymous'} (${logEntry.ip}) - ${logEntry.success ? 'SUCCESS' : 'FAILED'}`;
    console.log(logMessage, logEntry.details || '');
  }

  logFromRequest(
    req: Request,
    action: string,
    success: boolean,
    details?: any
  ): void {
    const session = (req as any).session;
    this.log({
      action,
      userId: session?.adminId,
      username: session?.adminUsername,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success,
      details,
    });
  }

  getRecentLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  getLogsByUser(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit)
      .reverse();
  }

  getFailedLogins(limit: number = 50): AuditLogEntry[] {
    return this.logs
      .filter(log => log.action.includes('LOGIN') && !log.success)
      .slice(-limit)
      .reverse();
  }

  clearOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
  }
}

export const auditLogger = new AuditLogger();
