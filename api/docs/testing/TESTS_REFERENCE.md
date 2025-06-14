# Tests Reference - USA Presence Calculator API

This document provides comprehensive documentation for the API test suite, including test organization, patterns, utilities, and coverage reports.

## Table of Contents

1. [Test Overview](#test-overview)
2. [Test Organization](#test-organization)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Test Utilities](#test-utilities)
7. [Test Coverage](#test-coverage)
8. [Running Tests](#running-tests)
9. [Best Practices](#best-practices)

## Test Overview

### Test Statistics

- **Total Test Files**: 25+
- **Total Test Cases**: 500+
- **Unit Tests**: 200+
- **Integration Tests**: 250+
- **E2E Tests**: 50+
- **Coverage Target**: 80%+

### Testing Stack

- **Test Runner**: Jest
- **HTTP Testing**: Supertest
- **Database**: In-memory SQLite
- **Mocking**: Jest mocks
- **Assertions**: Jest matchers + custom matchers

## Test Organization

### Directory Structure

```
src/
├── __tests__/
│   ├── setup/
│   │   ├── global-setup.ts     # Global test setup
│   │   ├── global-teardown.ts  # Global cleanup
│   │   └── test-env.ts         # Test environment
│   ├── utils/
│   │   ├── test-db.ts          # Test database utilities
│   │   ├── test-app.ts         # Test app builder
│   │   ├── test-auth.ts        # Auth test helpers
│   │   └── fixtures.ts         # Test data fixtures
│   └── e2e/
│       ├── auth-flow.test.ts   # Full auth flow
│       └── sync-flow.test.ts   # Sync scenarios
├── routes/
│   └── __tests__/
│       ├── auth.test.ts         # Auth route tests
│       ├── trips.test.ts        # Trip route tests
│       ├── users.test.ts        # User route tests
│       ├── settings.test.ts     # Settings tests
│       └── sync.test.ts         # Sync route tests
└── utils/
    └── __tests__/
        ├── validation.test.ts   # Validation tests
        └── helpers.test.ts      # Helper tests
```

### Test File Naming

- **Unit tests**: `*.test.ts` (colocated with source)
- **Integration tests**: `routes/__tests__/*.test.ts`
- **E2E tests**: `__tests__/e2e/*.test.ts`
- **Test utilities**: `__tests__/utils/*.ts`

## Unit Tests

### Helper Function Tests

```typescript
// src/utils/__tests__/validation.test.ts
import { validateDateRange, isValidDate } from '../validation';

describe('validateDateRange', () => {
  it('should return true for valid date range', () => {
    expect(validateDateRange('2024-01-01', '2024-01-10')).toBe(true);
  });

  it('should return false when return date before departure', () => {
    expect(validateDateRange('2024-01-10', '2024-01-01')).toBe(false);
  });

  it('should handle same-day trips', () => {
    expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(true);
  });

  it('should handle invalid dates', () => {
    expect(validateDateRange('invalid', '2024-01-01')).toBe(false);
    expect(validateDateRange('2024-01-01', 'invalid')).toBe(false);
  });
});
```

### Database Query Tests

```typescript
// src/db/__tests__/queries.test.ts
import { createTestDb } from '@api/__tests__/utils/test-db';
import { getUserTrips } from '../queries/trips';

describe('Trip Queries', () => {
  let db: TestDatabase;
  let testUser: User;

  beforeEach(async () => {
    db = await createTestDb();
    testUser = await createTestUser(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('getUserTrips', () => {
    it('should return user trips ordered by departure date', async () => {
      // Create test trips
      await createTestTrip(db, {
        userId: testUser.id,
        departureDate: '2024-01-15',
      });
      await createTestTrip(db, {
        userId: testUser.id,
        departureDate: '2024-01-01',
      });

      const trips = await getUserTrips(db, testUser.id);

      expect(trips).toHaveLength(2);
      expect(trips[0].departureDate).toBe('2024-01-15');
      expect(trips[1].departureDate).toBe('2024-01-01');
    });

    it('should exclude soft-deleted trips', async () => {
      await createTestTrip(db, {
        userId: testUser.id,
        deletedAt: new Date().toISOString(),
      });

      const trips = await getUserTrips(db, testUser.id);

      expect(trips).toHaveLength(0);
    });
  });
});
```

## Integration Tests

### Route Testing Pattern

```typescript
// src/routes/__tests__/trips.test.ts
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '@api/__tests__/utils/test-app';
import { getAuthToken } from '@api/__tests__/utils/test-auth';
import { createTestUser } from '@api/__tests__/utils/fixtures';

describe('Trip Routes', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = await getAuthToken(app, testUser);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/trips', () => {
    it('should create a new trip', async () => {
      const tripData = {
        departureDate: '2024-01-15',
        returnDate: '2024-01-20',
        destination: 'Canada',
        purpose: 'vacation',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/trips',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: tripData,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toMatchObject({
        id: expect.stringMatching(/^trip_/),
        userId: testUser.id,
        ...tripData,
        version: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should validate date format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/trips',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          departureDate: '15-01-2024', // Wrong format
          returnDate: '2024-01-20',
          destination: 'Canada',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: {
          message: expect.stringContaining('Invalid date format'),
        },
      });
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/trips',
        payload: {
          departureDate: '2024-01-15',
          returnDate: '2024-01-20',
          destination: 'Canada',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/trips', () => {
    it('should list user trips with pagination', async () => {
      // Create test trips
      for (let i = 0; i < 25; i++) {
        await createTestTrip(testUser.id, {
          departureDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/trips?limit=10&offset=10',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.trips).toHaveLength(10);
      expect(body.meta).toMatchObject({
        total: 25,
        limit: 10,
        offset: 10,
        hasMore: true,
      });
    });
  });

  describe('PUT /api/v1/trips/:id', () => {
    it('should update trip with optimistic locking', async () => {
      const trip = await createTestTrip(testUser.id);

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/trips/${trip.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          'if-match': '1', // Version
        },
        payload: {
          destination: 'Mexico',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        destination: 'Mexico',
        version: 2,
      });
    });

    it('should handle version conflicts', async () => {
      const trip = await createTestTrip(testUser.id);

      // Update trip to increment version
      await updateTrip(trip.id, { destination: 'Mexico' });

      // Try to update with old version
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/trips/${trip.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          'if-match': '1', // Old version
        },
        payload: {
          destination: 'Canada',
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({
        error: {
          code: 'VERSION_CONFLICT',
          currentVersion: 2,
        },
      });
    });
  });
});
```

### Authentication Tests

```typescript
// src/routes/__tests__/auth.test.ts
describe('Authentication Flow', () => {
  describe('Magic Link', () => {
    it('should send magic link to valid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/magic-link/send',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: expect.stringContaining('Sign in'),
        html: expect.stringContaining('magic link'),
      });
    });

    it('should rate limit magic link requests', async () => {
      const email = 'test@example.com';

      // Send 3 requests (limit)
      for (let i = 0; i < 3; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/v1/auth/magic-link/send',
          payload: { email },
        });
      }

      // 4th request should be rate limited
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/magic-link/send',
        payload: { email },
      });

      expect(response.statusCode).toBe(429);
    });

    it('should verify valid magic link token', async () => {
      const token = await createMagicLinkToken('test@example.com');

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/magic-link/verify',
        payload: { token },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        userId: expect.any(String),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 900,
      });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh valid refresh token', async () => {
      const { refreshToken } = await createTestSession();

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String), // New refresh token
        expiresIn: 900,
      });
    });

    it('should invalidate used refresh token', async () => {
      const { refreshToken } = await createTestSession();

      // Use refresh token
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        payload: { refreshToken },
      });

      // Try to use again
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh-token',
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

## End-to-End Tests

### Complete User Journey

```typescript
// src/__tests__/e2e/user-journey.test.ts
describe('Complete User Journey', () => {
  it('should complete full user flow', async () => {
    // 1. Sign up with magic link
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/magic-link/send',
      payload: { email: 'newuser@example.com' },
    });

    const magicLink = extractMagicLinkFromEmail();
    const token = extractTokenFromLink(magicLink);

    // 2. Verify magic link
    const authResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/magic-link/verify',
      payload: { token },
    });

    const { accessToken, userId } = authResponse.json();

    // 3. Get user profile
    const profileResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/users/profile',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(profileResponse.json()).toMatchObject({
      id: userId,
      email: 'newuser@example.com',
    });

    // 4. Create first trip
    const tripResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/trips',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        departureDate: '2024-01-15',
        returnDate: '2024-01-20',
        destination: 'Canada',
      },
    });

    const trip = tripResponse.json();

    // 5. Update settings
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/settings',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        notifications: {
          milestones: true,
          warnings: true,
        },
      },
    });

    // 6. Sync data
    const syncResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/pull',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
        deviceId: 'test-device',
      },
    });

    expect(syncResponse.json()).toMatchObject({
      changes: {
        trips: {
          created: [expect.objectContaining({ id: trip.id })],
        },
      },
    });
  });
});
```

## Test Utilities

### Test Database Setup

```typescript
// src/__tests__/utils/test-db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export async function createTestDb() {
  // Use in-memory database for tests
  const sqlite = new Database(':memory:');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite);

  // Run migrations
  await migrate(db, {
    migrationsFolder: './migrations',
  });

  return {
    db,
    close: () => sqlite.close(),
  };
}

export async function cleanupTestData(db: TestDatabase) {
  // Clean all tables except migrations
  await db.run('DELETE FROM trips');
  await db.run('DELETE FROM user_settings');
  await db.run('DELETE FROM sessions');
  await db.run('DELETE FROM users');
}
```

### Test App Builder

```typescript
// src/__tests__/utils/test-app.ts
import { buildApp } from '@api/app';
import { createTestDb } from './test-db';

export async function buildTestApp(options?: TestAppOptions) {
  const testDb = await createTestDb();

  // Override database connection
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  const app = await buildApp({
    logger: false, // Disable logging in tests
    ...options,
  });

  // Inject test database
  app.decorate('db', testDb.db);

  // Add test cleanup
  app.addHook('onClose', async () => {
    await testDb.close();
  });

  return app;
}
```

### Authentication Helpers

```typescript
// src/__tests__/utils/test-auth.ts
export async function getAuthToken(app: FastifyInstance, user: User): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/magic-link/send',
    payload: { email: user.email },
  });

  // Extract token from mocked email
  const token = extractMagicLinkToken();

  const verifyResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/magic-link/verify',
    payload: { token },
  });

  return verifyResponse.json().accessToken;
}

export async function createAuthenticatedRequest(app: FastifyInstance, user: User) {
  const token = await getAuthToken(app, user);

  return {
    inject: (options: InjectOptions) =>
      app.inject({
        ...options,
        headers: {
          ...options.headers,
          authorization: `Bearer ${token}`,
        },
      }),
  };
}
```

### Test Fixtures

```typescript
// src/__tests__/utils/fixtures.ts
import { createId } from '@paralleldrive/cuid2';

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: createId(),
    email: `test-${Date.now()}@example.com`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestTrip(userId: string, overrides?: Partial<Trip>): Trip {
  const departureDate = overrides?.departureDate || '2024-01-15';
  const returnDate = overrides?.returnDate || '2024-01-20';

  return {
    id: createId(),
    userId,
    departureDate,
    returnDate,
    destination: 'Test Country',
    purpose: 'vacation',
    notes: 'Test trip',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestSettings(
  userId: string,
  overrides?: Partial<UserSettings>,
): UserSettings {
  return {
    id: createId(),
    userId,
    notifications: {
      milestones: true,
      warnings: true,
      reminders: true,
    },
    biometricAuthEnabled: false,
    theme: 'system',
    language: 'en',
    sync: {
      enabled: false,
      subscriptionTier: 'none',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```

### Custom Matchers

```typescript
// src/__tests__/utils/matchers.ts
expect.extend({
  toBeValidDate(received: string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const pass = dateRegex.test(received) && !isNaN(Date.parse(received));

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid YYYY-MM-DD date`,
    };
  },

  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min}-${max}`
          : `expected ${received} to be within range ${min}-${max}`,
    };
  },
});

// TypeScript declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeWithinRange(min: number, max: number): R;
    }
  }
}
```

## Test Coverage

### Coverage Configuration

```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/dist/',
    '.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};
```

### Coverage Report Example

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.34 |    82.15 |   88.92 |   85.34 |
 routes/            |   92.45 |    89.23 |   95.65 |   92.45 |
  auth.ts           |   94.12 |    91.30 |   96.15 |   94.12 | 125,187
  trips.ts          |   91.67 |    88.46 |   94.74 |   91.67 | 67,89,143
  users.ts          |   93.33 |    90.00 |   96.00 |   93.33 | 45
  settings.ts       |   90.48 |    87.50 |   95.00 |   90.48 | 78,92
  sync.ts           |   89.74 |    86.21 |   93.75 |   89.74 | 156,203,245
 utils/             |   78.95 |    75.00 |   82.35 |   78.95 |
  validation.ts     |   85.71 |    83.33 |   88.89 |   85.71 | 23,45
  helpers.ts        |   72.73 |    66.67 |   77.78 |   72.73 | 34,56,78
 db/                |   83.33 |    80.00 |   86.67 |   83.33 |
  queries.ts        |   86.96 |    83.33 |   90.00 |   86.96 | 123,145
  connection.ts     |   80.00 |    75.00 |   83.33 |   80.00 | 34,45
--------------------|---------|----------|---------|---------|-------------------
```

## Running Tests

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test auth.test.ts

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Environment Variables

```bash
# .env.test
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing
JWT_REFRESH_SECRET=test-refresh-secret-key
DB_PATH=:memory:
LOG_LEVEL=silent
```

### CI/CD Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Best Practices

### Test Writing Guidelines

1. **Descriptive test names**: Use full sentences

   ```typescript
   it('should return 404 when trip does not exist');
   ```

2. **Arrange-Act-Assert pattern**:

   ```typescript
   it('should create trip', async () => {
     // Arrange
     const user = await createTestUser();
     const tripData = { ... };

     // Act
     const response = await createTrip(user.id, tripData);

     // Assert
     expect(response.status).toBe(201);
   });
   ```

3. **Test one thing at a time**: Each test should verify a single behavior

4. **Use test utilities**: Don't repeat setup code

5. **Clean up after tests**: Ensure test isolation

### Performance Testing

```typescript
describe('Performance', () => {
  it('should handle 1000 concurrent requests', async () => {
    const promises = Array.from({ length: 1000 }, () =>
      app.inject({
        method: 'GET',
        url: '/health',
      }),
    );

    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(responses.every((r) => r.statusCode === 200)).toBe(true);
    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

### Security Testing

```typescript
describe('Security', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/trips?destination=${maliciousInput}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    // Verify database is intact
    const users = await db.select().from(users).all();
    expect(users.length).toBeGreaterThan(0);
  });

  it('should rate limit requests', async () => {
    const requests = Array.from({ length: 10 }, () =>
      app.inject({
        method: 'POST',
        url: '/api/v1/auth/magic-link/send',
        payload: { email: 'test@example.com' },
      }),
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.statusCode === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

Last updated: January 2025
