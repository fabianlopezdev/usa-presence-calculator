import { beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SESClient } from '@aws-sdk/client-ses';

// Global test setup

// Reset all AWS SDK mocks before each test
beforeEach(() => {
  // Reset AWS SES mock
  const sesMock = mockClient(SESClient);
  sesMock.reset();
});

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:';
process.env.DATABASE_ENCRYPTION_KEY = 'test-encryption-key-32-characters-long!!';
process.env.MASTER_ENCRYPTION_KEY = 'test-master-key-32-characters-long!!!!!!';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long!!!!!!';
process.env.COOKIE_SECRET = 'test-cookie-secret-32-characters-long!!';
process.env.APP_URL = 'http://localhost:3000';
process.env.AWS_REGION = 'us-east-1';
