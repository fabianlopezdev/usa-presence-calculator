import { ALERTING_CONFIG } from '@api/constants/alerting';
import { AlertingWebhookService } from '@api/services/alerting-webhook';

export interface AlertPayload {
  type: string;
  severity: string;
  message: string;
  error?: Error;
  context?: {
    requestId?: string;
    userId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    [key: string]: unknown;
  };
  timestamp: string;
  environment: string;
}

export class AlertQueue {
  private queue: AlertPayload[] = [];
  private flushTimer?: NodeJS.Timeout;

  add(alert: AlertPayload): void {
    this.queue.push(alert);

    if (ALERTING_CONFIG.BATCH.ENABLED) {
      if (this.queue.length >= ALERTING_CONFIG.BATCH.MAX_SIZE) {
        this.flush();
      } else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), ALERTING_CONFIG.BATCH.FLUSH_INTERVAL_MS);
      }
    } else {
      this.flush();
    }
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    const alerts = [...this.queue];
    this.queue = [];

    if (alerts.length > 0) {
      void this.sendBatch(alerts);
    }
  }

  private async sendBatch(alerts: AlertPayload[]): Promise<void> {
    const service = AlertingWebhookService.getInstance();
    await Promise.allSettled(alerts.map((alert) => service.sendAlert(alert)));
  }
}
