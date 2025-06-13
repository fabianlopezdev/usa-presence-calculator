import { ALERTING_CONFIG, AlertSeverity } from '@api/constants/alerting';
import { AlertPayload } from '@api/services/alerting-queue';

interface WebhookPayload {
  text?: string;
  content?: string;
  embeds?: Array<{
    title: string;
    description: string;
    color: number;
    fields: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  }>;
}

export class AlertingWebhookService {
  private static instance: AlertingWebhookService;

  static getInstance(): AlertingWebhookService {
    if (!AlertingWebhookService.instance) {
      AlertingWebhookService.instance = new AlertingWebhookService();
    }
    return AlertingWebhookService.instance;
  }

  async sendAlert(alert: AlertPayload): Promise<void> {
    const webhooks = this.getActiveWebhooks();

    if (webhooks.length === 0) {
      return;
    }

    const promises = webhooks.map((webhook) =>
      this.sendWithRetry(() =>
        this.sendWebhook(webhook.url, this.formatPayload(alert, webhook.type)),
      ),
    );

    await Promise.allSettled(promises);
  }

  private getActiveWebhooks(): Array<{ url: string; type: 'slack' | 'discord' | 'custom' }> {
    const webhooks: Array<{ url: string; type: 'slack' | 'discord' | 'custom' }> = [];

    if (ALERTING_CONFIG.WEBHOOKS.SLACK) {
      webhooks.push({ url: ALERTING_CONFIG.WEBHOOKS.SLACK, type: 'slack' });
    }
    if (ALERTING_CONFIG.WEBHOOKS.DISCORD) {
      webhooks.push({ url: ALERTING_CONFIG.WEBHOOKS.DISCORD, type: 'discord' });
    }
    if (ALERTING_CONFIG.WEBHOOKS.CUSTOM) {
      webhooks.push({ url: ALERTING_CONFIG.WEBHOOKS.CUSTOM, type: 'custom' });
    }

    return webhooks;
  }

  private formatPayload(alert: AlertPayload, type: 'slack' | 'discord' | 'custom'): WebhookPayload {
    const color = this.getSeverityColor(alert.severity as AlertSeverity);
    const emoji = this.getSeverityEmoji(alert.severity as AlertSeverity);

    if (type === 'slack') {
      return {
        text: `${emoji} *${alert.type.toUpperCase()}* - ${alert.message}`,
        attachments: [
          {
            color,
            fields: this.buildFields(alert),
            footer: `Environment: ${alert.environment}`,
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          },
        ],
      } as unknown as WebhookPayload;
    }

    if (type === 'discord') {
      return {
        content: `${emoji} **${alert.type.toUpperCase()}**`,
        embeds: [
          {
            title: alert.message,
            description: alert.error?.message || '',
            color: parseInt(color.replace('#', ''), 16),
            fields: this.buildFields(alert),
            timestamp: alert.timestamp,
          },
        ],
      } as unknown as WebhookPayload;
    }

    // Custom webhook format
    return alert as unknown as WebhookPayload;
  }

  private buildFields(
    alert: AlertPayload,
  ): Array<{ name: string; value: string; inline?: boolean }> {
    const fields = this.buildBasicFields(alert);
    const contextFields = this.buildContextFields(alert);
    const errorFields = this.buildErrorFields(alert);

    return [...fields, ...contextFields, ...errorFields];
  }

  private buildBasicFields(
    alert: AlertPayload,
  ): Array<{ name: string; value: string; inline?: boolean }> {
    return [
      { name: 'Severity', value: alert.severity, inline: true },
      { name: 'Type', value: alert.type, inline: true },
    ];
  }

  private buildContextFields(
    alert: AlertPayload,
  ): Array<{ name: string; value: string; inline?: boolean }> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (alert.context?.requestId) {
      fields.push({ name: 'Request ID', value: String(alert.context.requestId), inline: true });
    }

    if (alert.context?.userId) {
      fields.push({ name: 'User ID', value: String(alert.context.userId), inline: true });
    }

    if (alert.context?.method && alert.context?.url) {
      fields.push({
        name: 'Request',
        value: `${String(alert.context.method)} ${String(alert.context.url)}`,
        inline: false,
      });
    }

    return fields;
  }

  private buildErrorFields(
    alert: AlertPayload,
  ): Array<{ name: string; value: string; inline?: boolean }> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (alert.error?.stack) {
      fields.push({
        name: 'Stack Trace',
        value: alert.error.stack.substring(0, 1000),
        inline: false,
      });
    }

    return fields;
  }

  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      low: '#36a64f',
      medium: '#ff9f00',
      high: '#ff6b6b',
      critical: '#dc3545',
    };
    return colors[severity];
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥',
    };
    return emojis[severity];
  }

  private async sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ALERTING_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      // Success - webhook sent
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendWithRetry(fn: () => Promise<void>): Promise<void> {
    let lastError: Error | undefined;
    let delay = ALERTING_CONFIG.RETRY.INITIAL_DELAY_MS;

    for (let attempt = 1; attempt <= ALERTING_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
      try {
        await fn();
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < ALERTING_CONFIG.RETRY.MAX_ATTEMPTS) {
          // Retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(
            delay * ALERTING_CONFIG.RETRY.FACTOR,
            ALERTING_CONFIG.RETRY.MAX_DELAY_MS,
          ) as typeof ALERTING_CONFIG.RETRY.INITIAL_DELAY_MS;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
  }
}