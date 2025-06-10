/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/await-thenable */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

import { getDatabase, closeDatabase } from '@api/db/connection';
import { PasskeyService } from '@api/services/passkey';
import { resetTestDatabase, createTestUser } from '@api/test-utils/db';
import { passkeys, authUsers } from '@api/db/schema';
import { eq } from 'drizzle-orm';

vi.mock('@simplewebauthn/server');

describe('PasskeyService', () => {
  let passkeyService: PasskeyService;
  let testUserId: string;

  beforeEach(async () => {
    resetTestDatabase();
    passkeyService = new PasskeyService();

    // Create test user
    const testUser = await createTestUser({
      email: 'test@example.com',
      greenCardDate: '2020-01-01',
      eligibilityCategory: 'five_year',
    });
    testUserId = testUser.id;

    // Create auth user record
    const db = getDatabase();
    await db.insert(authUsers).values({
      userId: testUserId,
      emailVerified: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('generateRegistrationOptions', () => {
    it('should generate registration options for new passkey', async () => {
      const mockOptions = {
        challenge: 'test-challenge',
        rp: { name: 'USA Presence Calculator', id: 'localhost' },
        user: { id: testUserId, name: 'test@example.com', displayName: 'test@example.com' },
        excludeCredentials: [],
      };

      vi.mocked(generateRegistrationOptions).mockResolvedValue(mockOptions as any);

      const result = await passkeyService.generateRegistrationOptions(testUserId);

      expect(result).toEqual(mockOptions);
      expect(generateRegistrationOptions).toHaveBeenCalledWith({
        rpName: 'USA Presence Calculator',
        rpID: 'localhost',
        userID: Buffer.from(testUserId),
        userName: 'test@example.com',
        userDisplayName: 'test@example.com',
        attestationType: 'none',
        excludeCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });
    });

    it('should exclude existing credentials for user', async () => {
      // Add existing passkey
      const db = getDatabase();
      await db.insert(passkeys).values({
        userId: testUserId,
        credentialId: 'existing-credential-id',
        publicKey: 'public-key',
        counter: 0,
      });

      const mockOptions = {
        challenge: 'test-challenge',
        excludeCredentials: [{ id: 'existing-credential-id', type: 'public-key' }],
      };

      vi.mocked(generateRegistrationOptions).mockResolvedValue(mockOptions as any);

      const result = await passkeyService.generateRegistrationOptions(testUserId);

      expect(result.excludeCredentials).toHaveLength(1);
      expect(result.excludeCredentials?.[0]?.id).toBe('existing-credential-id');
    });

    it('should throw error if user not found', async () => {
      await expect(
        passkeyService.generateRegistrationOptions('non-existent-user-id'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('verifyRegistrationResponse', () => {
    it('should verify and save new passkey', async () => {
      const mockVerification = {
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-credential-id',
            publicKey: Buffer.from('public-key'),
            counter: 0,
          },
          credentialType: 'public-key',
          credentialBackedUp: false,
          attestationObject: Buffer.from('attestation'),
          userVerified: true,
        },
      };

      vi.mocked(verifyRegistrationResponse).mockResolvedValue(mockVerification as any);

      const response = {
        id: 'new-credential-id',
        rawId: 'new-credential-id',
        response: {
          attestationObject: 'attestation-base64',
          clientDataJSON: 'client-data-base64',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await passkeyService.verifyRegistrationResponse(
        testUserId,
        response,
        'test-challenge',
        'localhost',
      );

      expect(result.verified).toBe(true);

      // Check that passkey was saved
      const db = getDatabase();
      const savedPasskey = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.credentialId, 'new-credential-id'))
        .get();

      expect(savedPasskey).toBeDefined();
      expect(savedPasskey?.userId).toBe(testUserId);
      expect(savedPasskey?.publicKey).toBe(Buffer.from('public-key').toString('base64'));
    });

    it('should not save passkey if verification fails', async () => {
      const mockVerification = {
        verified: false,
      };

      vi.mocked(verifyRegistrationResponse).mockResolvedValue(mockVerification as any);

      const response = {
        id: 'new-credential-id',
        rawId: 'new-credential-id',
        response: {
          attestationObject: 'attestation-base64',
          clientDataJSON: 'client-data-base64',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await passkeyService.verifyRegistrationResponse(
        testUserId,
        response,
        'test-challenge',
        'localhost',
      );

      expect(result.verified).toBe(false);

      // Check that passkey was not saved
      const db = getDatabase();
      const savedPasskey = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.credentialId, 'new-credential-id'))
        .get();

      expect(savedPasskey).toBeUndefined();
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('should generate authentication options with user passkeys', async () => {
      // Add passkey for user
      const db = getDatabase();
      await db.insert(passkeys).values({
        userId: testUserId,
        credentialId: 'test-credential-id',
        publicKey: 'public-key',
        counter: 0,
        transports: JSON.stringify(['internal']),
      });

      const mockOptions = {
        challenge: 'auth-challenge',
        allowCredentials: [
          {
            id: 'test-credential-id',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      };

      vi.mocked(generateAuthenticationOptions).mockResolvedValue(mockOptions as any);

      const result = await passkeyService.generateAuthenticationOptions(testUserId);

      expect(result).toEqual(mockOptions);
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        allowCredentials: [
          {
            id: 'test-credential-id',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'preferred',
      });
    });

    it('should generate options without allowCredentials if userId not provided', async () => {
      const mockOptions = {
        challenge: 'auth-challenge',
        allowCredentials: [],
      };

      vi.mocked(generateAuthenticationOptions).mockResolvedValue(mockOptions as any);

      const result = await passkeyService.generateAuthenticationOptions();

      expect(result).toEqual(mockOptions);
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        userVerification: 'preferred',
      });
    });
  });

  describe('verifyAuthenticationResponse', () => {
    let testPasskeyId: string;

    beforeEach(async () => {
      // Add passkey for user
      const db = getDatabase();
      const [passkey] = await db
        .insert(passkeys)
        .values({
          userId: testUserId,
          credentialId: 'test-credential-id',
          publicKey: Buffer.from('public-key').toString('base64'),
          counter: 0,
        })
        .returning();
      testPasskeyId = passkey.id;
    });

    it('should verify authentication and update counter', async () => {
      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 1,
          userVerified: true,
        },
      };

      vi.mocked(verifyAuthenticationResponse).mockResolvedValue(mockVerification as any);

      const response = {
        id: 'test-credential-id',
        rawId: 'test-credential-id',
        response: {
          authenticatorData: 'auth-data-base64',
          clientDataJSON: 'client-data-base64',
          signature: 'signature-base64',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await passkeyService.verifyAuthenticationResponse(
        response,
        'auth-challenge',
        'localhost',
      );

      expect(result.verified).toBe(true);
      expect(result.userId).toBe(testUserId);

      // Check that counter was updated
      const db = getDatabase();
      const updatedPasskey = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.id, testPasskeyId))
        .get();

      expect(updatedPasskey?.counter).toBe(1);
      expect(updatedPasskey?.lastUsedAt).toBeDefined();
    });

    it('should throw error if passkey not found', async () => {
      const response = {
        id: 'non-existent-credential',
        rawId: 'non-existent-credential',
        response: {
          authenticatorData: 'auth-data-base64',
          clientDataJSON: 'client-data-base64',
          signature: 'signature-base64',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      await expect(
        passkeyService.verifyAuthenticationResponse(response, 'auth-challenge', 'localhost'),
      ).rejects.toThrow('Passkey not found');
    });

    it('should not update counter if verification fails', async () => {
      const mockVerification = {
        verified: false,
      };

      vi.mocked(verifyAuthenticationResponse).mockResolvedValue(mockVerification as any);

      const response = {
        id: 'test-credential-id',
        rawId: 'test-credential-id',
        response: {
          authenticatorData: 'auth-data-base64',
          clientDataJSON: 'client-data-base64',
          signature: 'signature-base64',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await passkeyService.verifyAuthenticationResponse(
        response,
        'auth-challenge',
        'localhost',
      );

      expect(result.verified).toBe(false);
      expect(result.userId).toBeUndefined();

      // Check that counter was not updated
      const db = getDatabase();
      const passkey = await db.select().from(passkeys).where(eq(passkeys.id, testPasskeyId)).get();

      expect(passkey?.counter).toBe(0);
      expect(passkey?.lastUsedAt).toBeNull();
    });
  });

  describe('listUserPasskeys', () => {
    it('should return all passkeys for a user', async () => {
      const db = getDatabase();
      await db.insert(passkeys).values([
        {
          userId: testUserId,
          credentialId: 'credential-1',
          publicKey: 'key-1',
          counter: 0,
          name: 'iPhone',
          createdAt: new Date('2024-01-01'),
        },
        {
          userId: testUserId,
          credentialId: 'credential-2',
          publicKey: 'key-2',
          counter: 5,
          name: 'MacBook',
          createdAt: new Date('2024-01-02'),
          lastUsedAt: new Date('2024-01-10'),
        },
      ]);

      const userPasskeys = await passkeyService.listUserPasskeys(testUserId);

      expect(userPasskeys).toHaveLength(2);
      expect(userPasskeys[0].name).toBe('MacBook'); // Should be ordered by lastUsedAt desc
      expect(userPasskeys[1].name).toBe('iPhone');
    });

    it('should return empty array if user has no passkeys', async () => {
      const userPasskeys = await passkeyService.listUserPasskeys(testUserId);

      expect(userPasskeys).toEqual([]);
    });
  });

  describe('deletePasskey', () => {
    it('should delete a passkey if owned by user', async () => {
      const db = getDatabase();
      const [passkey] = await db
        .insert(passkeys)
        .values({
          userId: testUserId,
          credentialId: 'to-delete',
          publicKey: 'key',
          counter: 0,
        })
        .returning();

      await passkeyService.deletePasskey(passkey.id, testUserId);

      const deletedPasskey = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.id, passkey.id))
        .get();

      expect(deletedPasskey).toBeUndefined();
    });

    it('should throw error if passkey not owned by user', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: 'other@example.com',
      });

      const db = getDatabase();
      const [passkey] = await db
        .insert(passkeys)
        .values({
          userId: otherUser.id,
          credentialId: 'not-owned',
          publicKey: 'key',
          counter: 0,
        })
        .returning();

      await expect(passkeyService.deletePasskey(passkey.id, testUserId)).rejects.toThrow(
        'Passkey not found or not owned by user',
      );
    });
  });

  describe('updatePasskeyName', () => {
    it('should update passkey name if owned by user', async () => {
      const db = getDatabase();
      const [passkey] = await db
        .insert(passkeys)
        .values({
          userId: testUserId,
          credentialId: 'to-rename',
          publicKey: 'key',
          counter: 0,
          name: 'Old Name',
        })
        .returning();

      await passkeyService.updatePasskeyName(passkey.id, testUserId, 'New Name');

      const updatedPasskey = await db
        .select()
        .from(passkeys)
        .where(eq(passkeys.id, passkey.id))
        .get();

      expect(updatedPasskey?.name).toBe('New Name');
    });

    it('should throw error if passkey not owned by user', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: 'another@example.com',
      });

      const db = getDatabase();
      const [passkey] = await db
        .insert(passkeys)
        .values({
          userId: otherUser.id,
          credentialId: 'not-owned',
          publicKey: 'key',
          counter: 0,
        })
        .returning();

      await expect(
        passkeyService.updatePasskeyName(passkey.id, testUserId, 'New Name'),
      ).rejects.toThrow('Passkey not found or not owned by user');
    });
  });
});
