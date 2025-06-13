import { FastifyInstance } from 'fastify';

import { SessionService } from '@api/services/session';
import { createTestUser } from '@api/test-utils/db';

export async function createAuthenticatedUser(
  _app: FastifyInstance,
  userData?: {
    email?: string;
    greenCardDate?: string;
    eligibilityCategory?: 'three_year' | 'five_year';
  },
): Promise<{
  userId: string;
  email: string;
  accessToken: string;
  headers: {
    authorization: string;
  };
}> {
  // Create test user with default or provided data
  const testUser = await createTestUser({
    email: userData?.email ?? 'test@example.com',
    greenCardDate: userData?.greenCardDate ?? '2020-01-01',
    eligibilityCategory: userData?.eligibilityCategory ?? 'five_year',
  });

  // Generate authentication token
  const sessionService = new SessionService();
  const sessionData = await sessionService.createSession(testUser.id, '127.0.0.1', 'test-agent');

  return {
    userId: testUser.id,
    email: testUser.email,
    accessToken: sessionData.accessToken,
    headers: {
      authorization: `Bearer ${sessionData.accessToken}`,
    },
  };
}
