import { eq, and, lt, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import { AUTH_CONFIG, AUTH_ERRORS } from '@api/constants/auth';
import { config } from '@api/config/env';
import { getDatabase } from '@api/db/connection';
import { sessions, users, authUsers } from '@api/db/schema';

interface SessionPayload {
  userId: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

interface CreateSessionResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

interface SessionInfo {
  userId: string;
  email: string;
  emailVerified: boolean;
  greenCardDate: string;
  eligibilityCategory: string;
}

export class SessionService {
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CreateSessionResult> {
    const db = getDatabase();

    // Clean up expired sessions first
    await this.cleanupExpiredSessions();

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    const sessionId = randomBytes(16).toString('hex');

    // Create session in database
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRY);

    await db.insert(sessions).values({
      userId,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Generate JWT tokens
    const accessToken = this.generateAccessToken(userId, sessionId);

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  async refreshSession(refreshToken: string): Promise<CreateSessionResult> {
    const db = getDatabase();

    // Find valid session
    const session = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshToken, refreshToken), gt(sessions.expiresAt, new Date())))
      .get();

    if (!session) {
      throw new Error(AUTH_ERRORS.SESSION_EXPIRED);
    }

    // Update last activity
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, session.id));

    // Generate new access token
    const sessionId = randomBytes(16).toString('hex');
    const accessToken = this.generateAccessToken(session.userId, sessionId);

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  getSessionInfo(userId: string): SessionInfo {
    const db = getDatabase();

    // Get user info with auth details
    const userWithAuth = db
      .select({
        userId: users.id,
        email: users.email,
        greenCardDate: users.greenCardDate,
        eligibilityCategory: users.eligibilityCategory,
        emailVerified: authUsers.emailVerified,
      })
      .from(users)
      .leftJoin(authUsers, eq(authUsers.userId, users.id))
      .where(eq(users.id, userId))
      .get();

    if (!userWithAuth) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return {
      ...userWithAuth,
      emailVerified: userWithAuth.emailVerified ?? false,
    };
  }

  async invalidateSession(refreshToken: string): Promise<void> {
    const db = getDatabase();

    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const db = getDatabase();

    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  verifyAccessToken(token: string): SessionPayload {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
        issuer: AUTH_CONFIG.JWT_ISSUER,
        audience: AUTH_CONFIG.JWT_AUDIENCE,
      }) as SessionPayload;

      if (payload.type !== 'access') {
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
      }

      return payload;
    } catch {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
  }

  private generateAccessToken(userId: string, sessionId: string): string {
    const payload: SessionPayload = {
      userId,
      sessionId,
      type: 'access',
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
      expiresIn: Math.floor(AUTH_CONFIG.ACCESS_TOKEN_EXPIRY / 1000),
      issuer: AUTH_CONFIG.JWT_ISSUER,
      audience: AUTH_CONFIG.JWT_AUDIENCE,
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const db = getDatabase();

    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}
