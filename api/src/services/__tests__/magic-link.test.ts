/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/await-thenable */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { eq, and, desc } from 'drizzle-orm';
import { mockClient } from 'aws-sdk-client-mock';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import { getDatabase, closeDatabase } from '@api/db/connection';
import { MagicLinkService } from '@api/services/magic-link';
import { resetTestDatabase, createTestUser } from '@api/test-utils/db';
import { magicLinks, authUsers, authAttempts, users } from '@api/db/schema';
import { AUTH_CONFIG, AUTH_ERRORS } from '@api/constants/auth';

// Mock AWS SES using aws-sdk-client-mock
const sesMock = mockClient(SESClient);

describe('MagicLinkService', () => {
  let magicLinkService: MagicLinkService;
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    resetTestDatabase();
    sesMock.reset();

    // Default mock behavior for SES
    sesMock.on(SendEmailCommand).resolves({
      MessageId: 'test-message-id',
    });

    magicLinkService = new MagicLinkService();

    // Create test user
    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });
    testUserId = testUser.id;
    testUserEmail = testUser.email;

    // Create auth user record
    const db = getDatabase();
    await db.insert(authUsers).values({
      userId: testUserId,
      emailVerified: false,
    });
  });

  afterEach(() => {
    sesMock.reset();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('sendMagicLink', () => {
    it('should generate and send magic link for existing user', async () => {
      // Configure mock to return success
      sesMock.on(SendEmailCommand).resolves({
        MessageId: 'test-message-id',
      });

      const result = await magicLinkService.sendMagicLink(testUserEmail);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Magic link sent');

      // Check that SES was called
      const calls = sesMock.commandCalls(SendEmailCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toMatchObject({
        Destination: {
          ToAddresses: [testUserEmail],
        },
      });

      // Check that magic link was saved
      const db = getDatabase();
      const savedLink = db.select().from(magicLinks).where(eq(magicLinks.userId, testUserId)).get();

      expect(savedLink).toBeDefined();
      expect(savedLink?.token).toHaveLength(AUTH_CONFIG.MAGIC_LINK_LENGTH);
      expect(savedLink?.used).toBe(false);
      expect(savedLink?.expiresAt).toBeInstanceOf(Date);
    });

    it('should invalidate existing magic links before creating new one', async () => {
      const db = getDatabase();

      // Create existing magic link
      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: 'old-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
        used: false,
      });

      await magicLinkService.sendMagicLink(testUserEmail);

      // Check that old link was invalidated
      const oldLink = db.select().from(magicLinks).where(eq(magicLinks.token, 'old-token')).get();

      expect(oldLink?.used).toBe(true);
    });

    it('should respect rate limiting', async () => {
      const db = getDatabase();

      // Add rate limit attempts
      for (let i = 0; i < AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS; i++) {
        await db.insert(authAttempts).values({
          userId: testUserId,
          identifier: testUserEmail,
          attemptType: 'magic_link',
          success: true,
          attemptedAt: new Date(),
        });
      }

      await expect(magicLinkService.sendMagicLink(testUserEmail)).rejects.toThrow(
        AUTH_ERRORS.RATE_LIMIT_EXCEEDED,
      );
    });

    it('should throw error for non-existent user', async () => {
      await expect(magicLinkService.sendMagicLink('nonexistent@example.com')).rejects.toThrow(
        AUTH_ERRORS.USER_NOT_FOUND,
      );
    });

    it('should handle email sending failure gracefully', async () => {
      // Mock email sending failure
      sesMock.on(SendEmailCommand).rejects(new Error('Email service error'));

      await expect(magicLinkService.sendMagicLink(testUserEmail)).rejects.toThrow(
        'Failed to send magic link email',
      );

      // Check that magic link was not saved
      const db = getDatabase();
      const savedLinks = db
        .select()
        .from(magicLinks)
        .where(and(eq(magicLinks.userId, testUserId), eq(magicLinks.used, false)))
        .all();

      expect(savedLinks).toHaveLength(0);
    });

    it('should clean up expired magic links', async () => {
      const db = getDatabase();

      // Create expired magic link
      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        used: false,
      });

      await magicLinkService.sendMagicLink(testUserEmail);

      // The cleanupExpiredLinks method is called, which should delete unused expired links
      const expiredLink = db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, 'expired-token'))
        .get();

      expect(expiredLink).toBeUndefined();
    });
  });

  describe('verifyMagicLink', () => {
    let validToken: string;

    beforeEach(async () => {
      // Create a valid magic link
      const db = getDatabase();
      validToken = 'valid-test-token-12345678901234567890123456789012';
      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: validToken,
        expiresAt: new Date(Date.now() + AUTH_CONFIG.MAGIC_LINK_EXPIRY),
        used: false,
      });
    });

    it('should verify valid magic link', async () => {
      const result = await magicLinkService.verifyMagicLink(validToken);

      expect(result.verified).toBe(true);
      expect(result.userId).toBe(testUserId);

      // Check that link was marked as used
      const db = getDatabase();
      const usedLink = db.select().from(magicLinks).where(eq(magicLinks.token, validToken)).get();

      expect(usedLink?.used).toBe(true);
      expect(usedLink?.usedAt).toBeInstanceOf(Date);
    });

    it('should update auth user verification status', async () => {
      await magicLinkService.verifyMagicLink(validToken);

      const db = getDatabase();
      const authUser = db.select().from(authUsers).where(eq(authUsers.userId, testUserId)).get();

      expect(authUser?.emailVerified).toBe(true);
      expect(authUser?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should reject expired magic link', async () => {
      const db = getDatabase();
      const expiredToken = 'expired-token-12345678901234567890123456789012';

      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
        used: false,
      });

      await expect(magicLinkService.verifyMagicLink(expiredToken)).rejects.toThrow(
        AUTH_ERRORS.MAGIC_LINK_EXPIRED,
      );
    });

    it('should reject already used magic link', async () => {
      const db = getDatabase();
      const usedToken = 'used-token-12345678901234567890123456789012';

      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: usedToken,
        expiresAt: new Date(Date.now() + AUTH_CONFIG.MAGIC_LINK_EXPIRY),
        used: true,
        usedAt: new Date(),
      });

      await expect(magicLinkService.verifyMagicLink(usedToken)).rejects.toThrow(
        AUTH_ERRORS.MAGIC_LINK_ALREADY_USED,
      );
    });

    it('should reject non-existent magic link', async () => {
      await expect(
        magicLinkService.verifyMagicLink('non-existent-token-12345678901234567890123456'),
      ).rejects.toThrow(AUTH_ERRORS.INVALID_TOKEN);
    });

    it('should record failed verification attempt', async () => {
      const invalidToken = 'invalid-token-12345678901234567890123456789012';

      try {
        await magicLinkService.verifyMagicLink(invalidToken);
      } catch {
        // Expected to throw
      }

      const db = getDatabase();
      const attempts = db
        .select()
        .from(authAttempts)
        .where(
          and(eq(authAttempts.attemptType, 'magic_link_verify'), eq(authAttempts.success, false)),
        )
        .all();

      expect(attempts).toHaveLength(1);
    });
  });

  describe('cleanupExpiredLinks', () => {
    it('should delete expired magic links', async () => {
      const db = getDatabase();

      // Create multiple magic links with different expiry times
      await db.insert(magicLinks).values([
        {
          userId: testUserId,
          email: testUserEmail,
          token: 'expired-1',
          expiresAt: new Date(Date.now() - 1000),
          used: false,
        },
        {
          userId: testUserId,
          email: testUserEmail,
          token: 'expired-2',
          expiresAt: new Date(Date.now() - 2000),
          used: false,
        },
        {
          userId: testUserId,
          email: testUserEmail,
          token: 'valid-1',
          expiresAt: new Date(Date.now() + 1000),
          used: false,
        },
      ]);

      await magicLinkService.cleanupExpiredLinks();

      const remainingLinks = db.select().from(magicLinks).all();

      expect(remainingLinks).toHaveLength(1);
      expect(remainingLinks[0].token).toBe('valid-1');
    });

    it('should not delete used magic links regardless of expiry', async () => {
      const db = getDatabase();

      await db.insert(magicLinks).values({
        userId: testUserId,
        email: testUserEmail,
        token: 'used-expired',
        expiresAt: new Date(Date.now() - 1000),
        used: true,
        usedAt: new Date(Date.now() - 2000),
      });

      await magicLinkService.cleanupExpiredLinks();

      const remainingLink = db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, 'used-expired'))
        .get();

      expect(remainingLink).toBeDefined();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return correct rate limit status', async () => {
      const db = getDatabase();

      // Add some attempts
      for (let i = 0; i < 2; i++) {
        await db.insert(authAttempts).values({
          userId: testUserId,
          identifier: testUserEmail,
          attemptType: 'magic_link',
          success: true,
          attemptedAt: new Date(),
        });
      }

      const status = await magicLinkService.getRateLimitStatus(testUserId);

      expect(status.attemptsRemaining).toBe(AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS - 2);
      expect(status.isLimited).toBe(false);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('should indicate when rate limited', async () => {
      const db = getDatabase();

      // Max out attempts
      for (let i = 0; i < AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS; i++) {
        await db.insert(authAttempts).values({
          userId: testUserId,
          identifier: testUserEmail,
          attemptType: 'magic_link',
          success: true,
          attemptedAt: new Date(),
        });
      }

      const status = await magicLinkService.getRateLimitStatus(testUserId);

      expect(status.attemptsRemaining).toBe(0);
      expect(status.isLimited).toBe(true);
    });

    it('should ignore old attempts outside rate limit window', async () => {
      const db = getDatabase();

      // Add old attempt
      await db.insert(authAttempts).values({
        userId: testUserId,
        identifier: testUserEmail,
        attemptType: 'magic_link',
        success: true,
        attemptedAt: new Date(Date.now() - AUTH_CONFIG.RATE_LIMIT_WINDOW - 1000),
      });

      const status = await magicLinkService.getRateLimitStatus(testUserId);

      expect(status.attemptsRemaining).toBe(AUTH_CONFIG.MAX_MAGIC_LINK_REQUESTS);
      expect(status.isLimited).toBe(false);
    });
  });

  describe('edge cases and security scenarios', () => {
    it('should handle sequential magic link requests', async () => {
      // SQLite handles these sequentially, not concurrently
      const result1 = await magicLinkService.sendMagicLink(testUserEmail);
      const result2 = await magicLinkService.sendMagicLink(testUserEmail);
      const result3 = await magicLinkService.sendMagicLink(testUserEmail);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Check that multiple links were created but only last one is active
      const db = getDatabase();
      const allLinks = db.select().from(magicLinks).where(eq(magicLinks.userId, testUserId)).all();

      // Should have created 3 links
      expect(allLinks.length).toBe(3);

      // Only last one should be unused
      const unusedLinks = allLinks.filter((link) => !link.used);
      expect(unusedLinks).toHaveLength(1);

      // First two should be marked as used
      const usedLinks = allLinks.filter((link) => link.used);
      expect(usedLinks).toHaveLength(2);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = `${'a'.repeat(200)}@example.com`;
      const longEmailUser = await createTestUser({
        email: longEmail,
      });

      const db = getDatabase();
      await db.insert(authUsers).values({
        userId: longEmailUser.id,
        emailVerified: false,
      });

      const result = await magicLinkService.sendMagicLink(longEmail);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+special.chars-123@sub.example.com';
      const specialUser = await createTestUser({
        email: specialEmail,
      });

      const db = getDatabase();
      await db.insert(authUsers).values({
        userId: specialUser.id,
        emailVerified: false,
      });

      const result = await magicLinkService.sendMagicLink(specialEmail);

      expect(result.success).toBe(true);
    });

    it('should handle unique token generation', async () => {
      const db = getDatabase();

      // Create many links to test uniqueness
      const promises = Array(10)
        .fill(null)
        .map(() => magicLinkService.sendMagicLink(testUserEmail));

      const results = await Promise.allSettled(promises);

      // All should succeed
      const successes = results.filter((r) => r.status === 'fulfilled').length;
      expect(successes).toBeGreaterThan(0);

      // Check all tokens are unique
      const links = db.select().from(magicLinks).where(eq(magicLinks.userId, testUserId)).all();

      const tokens = links.map((l) => l.token);
      const uniqueTokens = new Set(tokens);

      // All tokens should be unique
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should handle AWS SES rate limiting', async () => {
      // Mock SES to throw rate limit error
      const throttlingError = new Error('Rate exceeded');
      throttlingError.name = 'MessageRejected';
      const errorWithMetadata = throttlingError as Error & {
        $metadata: { httpStatusCode: number };
      };
      errorWithMetadata.$metadata = { httpStatusCode: 400 };

      sesMock.on(SendEmailCommand).rejects(errorWithMetadata);

      // Should handle rate limit and fail
      await expect(magicLinkService.sendMagicLink(testUserEmail)).rejects.toThrow(
        'Failed to send magic link email',
      );

      // Verify SES was called
      const calls = sesMock.commandCalls(SendEmailCommand);
      expect(calls).toHaveLength(1);
    });

    it('should handle database transaction during cleanup', async () => {
      const db = getDatabase();

      // Create many expired links
      const expiredLinks = Array(100)
        .fill(null)
        .map((_, i) => ({
          userId: testUserId,
          email: testUserEmail,
          token: `expired-${i}`,
          expiresAt: new Date(Date.now() - 1000 * (i + 1)),
          used: false,
        }));

      await db.insert(magicLinks).values(expiredLinks);

      // Cleanup should handle large batch deletion
      await magicLinkService.cleanupExpiredLinks();

      const remaining = db.select().from(magicLinks).where(eq(magicLinks.userId, testUserId)).all();

      expect(remaining).toHaveLength(0);
    });

    it('should validate token format', async () => {
      // Test various invalid token formats
      const invalidTokens = ['', 'short', '!@#$%^&*()', 'token with spaces', 'a'.repeat(100)];

      for (const token of invalidTokens) {
        await expect(magicLinkService.verifyMagicLink(token)).rejects.toThrow(
          AUTH_ERRORS.INVALID_TOKEN,
        );
      }
    });

    it('should handle orphaned magic links', async () => {
      const db = getDatabase();

      // Create a separate user for this test
      const tempUser = await createTestUser({
        email: 'temp@example.com',
      });

      await db.insert(authUsers).values({
        userId: tempUser.id,
        emailVerified: false,
      });

      const orphanToken = 'orphan-test-token-12345678901234567890123456789012';

      await db.insert(magicLinks).values({
        userId: tempUser.id,
        email: tempUser.email,
        token: orphanToken,
        expiresAt: new Date(Date.now() + AUTH_CONFIG.MAGIC_LINK_EXPIRY),
        used: false,
      });

      // Magic link exists
      const linkBefore = db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.token, orphanToken))
        .get();

      expect(linkBefore).toBeDefined();

      // Delete user (cascade will delete magic link)
      await db.delete(users).where(eq(users.id, tempUser.id));

      // Magic link should be gone due to cascade
      await expect(magicLinkService.verifyMagicLink(orphanToken)).rejects.toThrow(
        AUTH_ERRORS.INVALID_TOKEN,
      );
    });

    it('should handle clock skew for expiration', async () => {
      const db = getDatabase();

      // Create two links - one that expires soon, one already expired
      const soonToken = 'soon-token-12345678901234567890123456789012';
      const expiredToken = 'expired-token-12345678901234567890123456789012';

      await db.insert(magicLinks).values([
        {
          userId: testUserId,
          email: testUserEmail,
          token: soonToken,
          expiresAt: new Date(Date.now() + 1000),
          used: false,
        },
        {
          userId: testUserId,
          email: testUserEmail,
          token: expiredToken,
          expiresAt: new Date(Date.now() - 1000),
          used: false,
        },
      ]);

      // Soon token should still be valid
      const result = await magicLinkService.verifyMagicLink(soonToken);
      expect(result.verified).toBe(true);

      // Expired token should fail
      await expect(magicLinkService.verifyMagicLink(expiredToken)).rejects.toThrow(
        AUTH_ERRORS.MAGIC_LINK_EXPIRED,
      );
    });

    it('should handle metadata in auth attempts', async () => {
      const db = getDatabase();
      const invalidToken = 'metadata-test-token-12345678901234567890123456789';

      try {
        await magicLinkService.verifyMagicLink(invalidToken);
      } catch {
        // Expected to fail
      }

      const attempt = db
        .select()
        .from(authAttempts)
        .where(eq(authAttempts.attemptType, 'magic_link_verify'))
        .orderBy(desc(authAttempts.attemptedAt))
        .get();

      expect(attempt?.metadata).toBeDefined();
      const metadata = JSON.parse(attempt?.metadata || '{}') as { token?: string };
      expect(metadata.token).toMatch(/^metadata/);
      expect(metadata.token).toContain('...');
    });

    it('should store email exactly as provided', async () => {
      const db = getDatabase();

      // Configure mock for success
      sesMock.on(SendEmailCommand).resolves({
        MessageId: 'test-message-id',
      });

      const result = await magicLinkService.sendMagicLink(testUserEmail);
      expect(result.success).toBe(true);

      // Check that magic link stores the exact email
      const links = db
        .select()
        .from(magicLinks)
        .where(eq(magicLinks.userId, testUserId))
        .orderBy(desc(magicLinks.createdAt))
        .all();

      expect(links.length).toBeGreaterThan(0);
      expect(links[0].email).toBe(testUserEmail);
    });
  });
});
