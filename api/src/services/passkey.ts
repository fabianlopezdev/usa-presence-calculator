import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { eq, and, desc } from 'drizzle-orm';

import { AUTH_CONFIG, AUTH_ERRORS } from '@api/constants/auth';
import { getDatabase } from '@api/db/connection';
import { users, authUsers, passkeys, type Passkey } from '@api/db/schema';

interface SecurityNotificationPayload {
  type: 'new_passkey_enrolled' | 'passkey_removed';
  deviceInfo?: string;
  timestamp?: Date;
}

export class PasskeyService {
  private parseTransports(
    transportsJson: string | null,
  ): AuthenticatorTransportFuture[] | undefined {
    if (!transportsJson) return undefined;

    try {
      return JSON.parse(transportsJson) as AuthenticatorTransportFuture[];
    } catch {
      // Invalid JSON, ignore transports
      return undefined;
    }
  }

  private mapPasskeyToCredentialDescriptor(passkey: typeof passkeys.$inferSelect): {
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransportFuture[];
  } {
    return {
      id: passkey.credentialId,
      type: 'public-key' as const,
      transports: this.parseTransports(passkey.transports),
    };
  }
  async generateRegistrationOptions(
    userId: string,
  ): Promise<ReturnType<typeof generateRegistrationOptions>> {
    const db = getDatabase();

    // Get user details
    const user = db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    // Get existing passkeys to exclude
    const existingPasskeys = db.select().from(passkeys).where(eq(passkeys.userId, userId)).all();

    const excludeCredentials = existingPasskeys.map((passkey) =>
      this.mapPasskeyToCredentialDescriptor(passkey),
    );

    const options: GenerateRegistrationOptionsOpts = {
      rpName: AUTH_CONFIG.RP_NAME,
      rpID: AUTH_CONFIG.RP_ID,
      userID: Buffer.from(userId),
      userName: user.email,
      userDisplayName: user.email,
      attestationType: AUTH_CONFIG.ATTESTATION_PREFERENCE,
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: AUTH_CONFIG.USER_VERIFICATION,
      },
    };

    return await generateRegistrationOptions(options);
  }

  async verifyRegistrationResponse(
    userId: string,
    response: RegistrationResponseJSON,
    expectedChallenge: string,
    expectedOrigin: string,
  ): Promise<ReturnType<typeof verifyRegistrationResponse>> {
    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: AUTH_CONFIG.RP_ID,
      requireUserVerification: false,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialType, credentialBackedUp } = verification.registrationInfo;

      // Save the new passkey
      const db = getDatabase();
      await db.insert(passkeys).values({
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        deviceType: credentialType,
        backed_up: credentialBackedUp,
      });

      // Send security notification about new passkey enrollment
      this.sendSecurityNotification(userId, {
        type: 'new_passkey_enrolled',
        deviceInfo: `${credentialType} authenticator`,
        timestamp: new Date(),
      });
    }

    return verification;
  }

  async generateAuthenticationOptions(
    userId?: string,
  ): Promise<ReturnType<typeof generateAuthenticationOptions>> {
    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: AUTH_CONFIG.RP_ID,
      userVerification: AUTH_CONFIG.USER_VERIFICATION,
    };

    if (userId) {
      // Get user's passkeys
      const db = getDatabase();
      const userPasskeys = db.select().from(passkeys).where(eq(passkeys.userId, userId)).all();

      opts.allowCredentials = userPasskeys.map((passkey) =>
        this.mapPasskeyToCredentialDescriptor(passkey),
      );
    }

    return await generateAuthenticationOptions(opts);
  }

  async verifyAuthenticationResponse(
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
    expectedOrigin: string,
  ): Promise<{ verified: boolean; userId?: string }> {
    const db = getDatabase();

    // Find the passkey
    const passkey = db.select().from(passkeys).where(eq(passkeys.credentialId, response.id)).get();

    if (!passkey) {
      throw new Error(AUTH_ERRORS.PASSKEY_NOT_FOUND || 'Passkey not found');
    }

    const transports = this.parseTransports(passkey.transports);

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: AUTH_CONFIG.RP_ID,
      requireUserVerification: false,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: passkey.counter,
        transports,
      },
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified && verification.authenticationInfo) {
      await this.updateAuthenticationData(
        passkey.id,
        passkey.userId,
        verification.authenticationInfo.newCounter,
      );

      return {
        verified: true,
        userId: passkey.userId,
      };
    }

    return {
      verified: false,
    };
  }

  private async updateAuthenticationData(
    passkeyId: string,
    userId: string,
    newCounter: number,
  ): Promise<void> {
    const db = getDatabase();

    // Update counter and last used
    await db
      .update(passkeys)
      .set({
        counter: newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(passkeys.id, passkeyId));

    // Update auth user last login
    await db
      .update(authUsers)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(authUsers.userId, userId));
  }

  async listUserPasskeys(userId: string): Promise<Passkey[]> {
    const db = getDatabase();
    return await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, userId))
      .orderBy(desc(passkeys.lastUsedAt), desc(passkeys.createdAt));
  }

  async deletePasskey(passkeyId: string, userId: string): Promise<void> {
    const db = getDatabase();
    const result = await db
      .delete(passkeys)
      .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)));

    if (!result.changes) {
      throw new Error('Passkey not found or not owned by user');
    }
  }

  async updatePasskeyName(passkeyId: string, userId: string, name: string): Promise<void> {
    const db = getDatabase();
    const result = await db
      .update(passkeys)
      .set({ name })
      .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)));

    if (!result.changes) {
      throw new Error('Passkey not found or not owned by user');
    }
  }

  private sendSecurityNotification(userId: string, payload: SecurityNotificationPayload): void {
    // NOTE: Security notifications are currently logged only.
    // In production, these would be sent via email or push notification.
    // This is intentional for the MVP to avoid email infrastructure complexity.
    console.warn(`Security notification for user ${userId}:`, payload);
  }
}
