import { FastifyRequest } from 'fastify';

import { ALERTING_CONFIG, AlertSeverity, AlertType } from '@api/constants/alerting';
import { AlertPayload, AlertQueue } from '@api/services/alerting-queue';
import { BaseError } from '@api/utils/errors';

export class AlertingService {
  private static instance: AlertingService;
  private alertCounts = new Map<string, { count: number; resetAt: number }>();
  private alertQueue = new AlertQueue();

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  alert(params: {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    error?: Error | BaseError;
    request?: FastifyRequest;
    context?: Record<string, unknown>;
  }): void {
    if (!ALERTING_CONFIG.ENABLED) {
      return;
    }

    const alert: AlertPayload = {
      type: params.type,
      severity: params.severity,
      message: params.message,
      error: params.error,
      context: {
        ...params.context,
        requestId: params.request?.id,
        userId: (params.request as FastifyRequest & { user?: { id: string } })?.user?.id,
        method: params.request?.method,
        url: params.request?.url,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    if (this.isRateLimited(params.type)) {
      // Rate limited alerts are silently dropped
      return;
    }

    this.alertQueue.add(alert);
  }

  private isRateLimited(type: AlertType): boolean {
    const now = Date.now();
    const key = type;
    const limit = this.alertCounts.get(key);

    if (!limit || now > limit.resetAt) {
      this.alertCounts.set(key, {
        count: 1,
        resetAt: now + ALERTING_CONFIG.RATE_LIMIT.WINDOW_MS,
      });
      return false;
    }

    if (limit.count >= ALERTING_CONFIG.RATE_LIMIT.MAX_ALERTS_PER_HOUR) {
      return true;
    }

    limit.count++;
    return false;
  }

  flushQueue(): void {
    this.alertQueue.flush();
  }
}

// Export singleton instance
export const alertingService = AlertingService.getInstance();
