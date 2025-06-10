import { eq, and, gte, lt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import { AUTH_CONFIG, AUTH_ERRORS } from '@api/constants/auth';
import { getDatabase } from '@api/db/connection';
import { users, authUsers, magicLinks, authAttempts } from '@api/db/schema';
import { generateMagicLinkEmailContent } from '@api/utils/email-templates';

interface SendMagicLinkResult {
  success: boolean;
  message: string;
}

interface VerifyMagicLinkResult {
  verified: boolean;
  userId: string;
}

interface RateLimitStatus {
  attemptsRemaining: number;
  isLimited: boolean;
  resetAt: Date;
}

export class MagicLinkService {
  private sesClient: SESClient;

  constructor() {
    // Initialize AWS SES client
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined, // Use default credentials chain if not provided
    });
  }

  private validateAndGetUser(email: string): { id: string; email: string } {
    const db = getDatabase();
    const user = db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }

  private async createAndSaveMagicLink(userId: string, email: string): Promise<{ token: string }> {
    const db = getDatabase();
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.MAGIC_LINK_EXPIRY);

    await db.insert(magicLinks).values({
      userId,
      email,
      token,
      expiresAt,
      used: false,
    });

    return { token };
  }

  async sendMagicLink(email: string): Promise<SendMagicLinkResult> {
    const db = getDatabase();

    // Find and validate user
    const user = this.validateAndGetUser(email);

    // Check rate limit
    const rateLimitStatus = this.getRateLimitStatus(user.id);
    if (rateLimitStatus.isLimited) {
      throw new Error(AUTH_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    // Clean up expired links first
    await this.cleanupExpiredLinks();

    // Then invalidate existing magic links
    await this.invalidateExistingLinks(user.id);

    // Create and save magic link
    const { token } = await this.createAndSaveMagicLink(user.id, user.email);

    // Record attempt
    await db.insert(authAttempts).values({
      userId: user.id,
      identifier: user.email,
      attemptType: 'magic_link',
      success: true,
      attemptedAt: new Date(),
    });

    // Send email
    try {
      await this.sendMagicLinkEmail(email, token);
    } catch {
      // If email fails, clean up the magic link
      await db.delete(magicLinks).where(eq(magicLinks.token, token));
      throw new Error('Failed to send magic link email');
    }

    return {
      success: true,
      message: 'Magic link sent to your email address',
    };
  }

  private async validateMagicLink(
    token: string,
  ): Promise<{ id: string; userId: string; email: string }> {
    const db = getDatabase();
    const magicLink = db.select().from(magicLinks).where(eq(magicLinks.token, token)).get();

    if (!magicLink) {
      await this.recordFailedAttempt(token);
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }

    // Check if already used
    if (magicLink.used) {
      await this.recordFailedAttempt(token, magicLink.userId);
      throw new Error(AUTH_ERRORS.MAGIC_LINK_ALREADY_USED);
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      await this.recordFailedAttempt(token, magicLink.userId);
      throw new Error(AUTH_ERRORS.MAGIC_LINK_EXPIRED);
    }

    return magicLink;
  }

  async verifyMagicLink(token: string): Promise<VerifyMagicLinkResult> {
    const db = getDatabase();

    // Validate magic link
    const magicLink = await this.validateMagicLink(token);

    // Mark as used
    await db
      .update(magicLinks)
      .set({
        used: true,
        usedAt: new Date(),
      })
      .where(eq(magicLinks.id, magicLink.id));

    // Update auth user
    await db
      .update(authUsers)
      .set({
        emailVerified: true,
        lastLoginAt: new Date(),
      })
      .where(eq(authUsers.userId, magicLink.userId));

    // Record successful attempt
    await db.insert(authAttempts).values({
      userId: magicLink.userId,
      identifier: magicLink.email,
      attemptType: 'magic_link_verify',
      success: true,
      attemptedAt: new Date(),
    });

    return {
      verified: true,
      userId: magicLink.userId,
    };
  }

  getRateLimitStatus(userId: string): RateLimitStatus {
    const db = getDatabase();
    const windowStart = new Date(Date.now() - AUTH_CONFIG.RATE_LIMIT_WINDOW);

    // Get user email
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    // Count recent attempts by identifier (email)
    const recentAttempts = db
      .select()
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.identifier, user.email),
          eq(authAttempts.attemptType, 'magic_link'),
          gte(authAttempts.attemptedAt, windowStart),
        ),
      )
      .all();

    const attemptCount = recentAttempts.length;
    const attemptsRemaining = Math.max(0, AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS - attemptCount);
    const isLimited = attemptCount >= AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS;

    // Calculate reset time (when the oldest attempt expires)
    let resetAt = new Date(Date.now() + AUTH_CONFIG.RATE_LIMIT_WINDOW);
    if (recentAttempts.length > 0) {
      const oldestAttempt = recentAttempts.reduce((oldest, attempt) =>
        attempt.attemptedAt < oldest.attemptedAt ? attempt : oldest,
      );
      resetAt = new Date(oldestAttempt.attemptedAt.getTime() + AUTH_CONFIG.RATE_LIMIT_WINDOW);
    }

    return {
      attemptsRemaining,
      isLimited,
      resetAt,
    };
  }

  async cleanupExpiredLinks(): Promise<void> {
    const db = getDatabase();
    const now = new Date();

    // Delete expired and unused magic links
    await db
      .delete(magicLinks)
      .where(and(lt(magicLinks.expiresAt, now), eq(magicLinks.used, false)));
  }

  private generateSecureToken(): string {
    return randomBytes(AUTH_CONFIG.MAGIC_LINK_LENGTH / 2).toString('hex');
  }

  private async invalidateExistingLinks(userId: string): Promise<void> {
    const db = getDatabase();

    // Mark all unused links for this user as used
    await db
      .update(magicLinks)
      .set({
        used: true,
        usedAt: new Date(),
      })
      .where(and(eq(magicLinks.userId, userId), eq(magicLinks.used, false)));
  }

  private async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const magicLinkUrl = `${process.env.APP_URL}/auth/magic-link/verify?token=${token}`;
    const { html, text } = generateMagicLinkEmailContent(magicLinkUrl);

    const command = new SendEmailCommand({
      Source: AUTH_CONFIG.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: AUTH_CONFIG.EMAIL_SUBJECT_MAGIC_LINK,
        },
        Body: {
          Html: {
            Data: html,
          },
          Text: {
            Data: text,
          },
        },
      },
    });

    await this.sesClient.send(command);
  }

  private async recordFailedAttempt(token: string, userId?: string): Promise<void> {
    const db = getDatabase();

    // If we have userId, get the email
    let identifier = 'unknown';
    if (userId) {
      const user = db.select().from(users).where(eq(users.id, userId)).get();
      if (user) {
        identifier = user.email;
      }
    }

    await db.insert(authAttempts).values({
      userId: userId || null,
      identifier,
      attemptType: 'magic_link_verify',
      success: false,
      attemptedAt: new Date(),
      metadata: JSON.stringify({ token: `${token.substring(0, 8)}...` }), // Log partial token for debugging
    });
  }
}
