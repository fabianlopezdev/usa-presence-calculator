# API Design Patterns - USA Presence Calculator

This document outlines the design patterns, conventions, and best practices used throughout the USA Presence Calculator API.

## Table of Contents

1. [RESTful Design Principles](#restful-design-principles)
2. [Route Organization Patterns](#route-organization-patterns)
3. [Request/Response Patterns](#requestresponse-patterns)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Authentication Patterns](#authentication-patterns)
6. [Validation Patterns](#validation-patterns)
7. [Database Patterns](#database-patterns)
8. [Testing Patterns](#testing-patterns)
9. [Security Patterns](#security-patterns)
10. [Performance Patterns](#performance-patterns)

## RESTful Design Principles

### Resource-Based URLs

```typescript
// Good: Noun-based resources
GET    /api/v1/trips          // List trips
POST   /api/v1/trips          // Create trip
GET    /api/v1/trips/:id      // Get specific trip
PUT    /api/v1/trips/:id      // Update trip
DELETE /api/v1/trips/:id      // Delete trip

// Bad: Verb-based URLs
GET    /api/v1/getTrips       // Avoid
POST   /api/v1/createTrip     // Avoid
POST   /api/v1/updateTrip     // Avoid
```

### HTTP Status Codes

```typescript
// Success Responses
200 OK                   // Successful GET, PUT
201 Created             // Successful POST creating resource
204 No Content          // Successful DELETE

// Client Errors
400 Bad Request         // Invalid request data
401 Unauthorized        // Missing/invalid authentication
403 Forbidden           // Valid auth, insufficient permissions
404 Not Found          // Resource doesn't exist
409 Conflict           // State conflict (e.g., duplicate email)
422 Unprocessable      // Valid syntax, semantic errors
429 Too Many Requests  // Rate limit exceeded

// Server Errors
500 Internal Error     // Unexpected server error
503 Service Unavailable // Maintenance/overload
```

### API Versioning

```typescript
// URL Path Versioning (chosen approach)
/api/1v / trips / api / v2 / trips; // Future version

// Why: Clear, cache-friendly, easy to route
```

## Route Organization Patterns

### File Structure

```
src/routes/
├── __tests__/              # Route tests
│   ├── auth.test.ts
│   ├── trips.test.ts
│   └── users.test.ts
├── auth.ts                 # Auth endpoints
├── auth-handlers.ts        # Auth business logic
├── auth-schemas.ts         # Auth validation schemas
├── trips.ts               # Trip endpoints
├── trips-helpers.ts       # Trip utilities
├── trips-schemas.ts       # Trip schemas
└── index.ts              # Route registration
```

### Route Definition Pattern

```typescript
// trips.ts
const tripRoutes: FastifyPluginAsync = async (fastify) => {
  // List trips
  fastify.get('/', {
    schema: {
      tags: ['trips'],
      summary: 'List user trips',
      response: {
        200: TripListResponseSchema,
        401: UnauthorizedSchema,
      },
    },
    preHandler: fastify.requireAuth,
    handler: listTripsHandler,
  });

  // Create trip
  fastify.post('/', {
    schema: {
      tags: ['trips'],
      summary: 'Create new trip',
      body: CreateTripSchema,
      response: {
        201: TripResponseSchema,
        400: ValidationErrorSchema,
        401: UnauthorizedSchema,
      },
    },
    preHandler: fastify.requireAuth,
    handler: createTripHandler,
  });
};
```

### Handler Organization

```typescript
// Separate handlers for testability
async function listTripsHandler(
  request: FastifyRequest<{ Querystring: ListTripsQuery }>,
  reply: FastifyReply,
): Promise<void> {
  const { userId } = request.user;
  const { limit, offset, sort } = request.query;

  const trips = await tripService.listUserTrips(userId, {
    limit,
    offset,
    sort,
  });

  return reply.code(200).send(trips);
}
```

## Request/Response Patterns

### Request Validation

```typescript
// Use Zod schemas for all input validation
const CreateTripSchema = z
  .object({
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    destination: z.string().min(1).max(100),
    notes: z.string().max(500).optional(),
  })
  .strict();

// Helper function for validation
function validateTripCreateData(
  body: unknown,
  reply: FastifyReply,
): z.infer<typeof CreateTripSchema> | null {
  try {
    return CreateTripSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: {
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return null;
    }
    throw error;
  }
}
```

### Response Format

```typescript
// Consistent response structure
interface SuccessResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
    requestId?: string;
    timestamp?: string;
  };
}

// Example usage
reply.code(200).send({
  data: trips,
  meta: {
    total: totalCount,
    page: currentPage,
    limit: pageLimit,
  },
});
```

### Pagination Pattern

```typescript
// Query parameters for pagination
interface PaginationQuery {
  limit?: number; // Default: 20, Max: 100
  offset?: number; // Default: 0
  sort?: string; // Format: "field:asc" or "field:desc"
}

// Response includes metadata
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

## Error Handling Patterns

### Centralized Error Handler

```typescript
// Global error handler
export function createGlobalErrorHandler(): FastifyErrorHandler {
  return (error, request, reply) => {
    request.log.error(error);

    // Handle Zod validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: {
          message: 'Validation failed',
          details: error.validation,
          requestId: request.id,
        },
      });
    }

    // Handle known application errors
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code,
          requestId: request.id,
        },
      });
    }

    // Default error response
    return reply.code(500).send({
      error: {
        message: 'Internal server error',
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  };
}
```

### Custom Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

## Authentication Patterns

### JWT Token Management

```typescript
// Token structure
interface TokenPayload {
  sub: string; // User ID
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // Token ID
  type: 'access' | 'refresh';
}

// Token generation
function generateTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign({ sub: userId, type: 'access' }, config.JWT_SECRET, {
    expiresIn: '15m',
    jwtid: generateId(),
  });

  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, config.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    jwtid: generateId(),
  });

  return { accessToken, refreshToken };
}
```

### Authentication Middleware

```typescript
// Decorator for protected routes
declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: preHandlerHookHandler;
  }
}

// Implementation
async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = extractToken(request);
    const payload = jwt.verify(token, config.JWT_SECRET);

    // Attach user to request
    request.user = await userService.findById(payload.sub);

    if (!request.user) {
      throw new AuthenticationError();
    }
  } catch (error) {
    reply.code(401).send({
      error: { message: 'Invalid or expired token' },
    });
  }
}
```

## Validation Patterns

### Input Validation Strategy

```typescript
// Shared validation schemas from @usa-presence/shared
import { TripCreateSchema } from '@usa-presence/shared';

// API-specific validation
const CreateTripBodySchema = TripCreateSchema.extend({
  // Additional API-only fields
  source: z.enum(['mobile', 'web']).optional(),
});

// Validation middleware
async function validateBody<T>(
  schema: z.ZodSchema<T>,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<T | null> {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    reply.code(400).send({
      error: {
        message: 'Invalid request body',
        details: result.error.errors,
      },
    });
    return null;
  }

  return result.data;
}
```

### Query Parameter Validation

```typescript
// Type-safe query parameters
const ListTripsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort: z.enum(['departure:asc', 'departure:desc', 'created:desc']).optional(),
  destination: z.string().optional(),
});

type ListTripsQuery = z.infer<typeof ListTripsQuerySchema>;

// In route handler
fastify.get<{ Querystring: ListTripsQuery }>('/', {
  schema: {
    querystring: ListTripsQuerySchema,
  },
  handler: async (request, reply) => {
    const { limit, offset, sort } = request.query;
    // Query is fully typed and validated
  },
});
```

## Database Patterns

### Repository Pattern

```typescript
// Abstract database operations
export class TripRepository {
  constructor(private db: Database) {}

  async findByUser(userId: string, options: { limit: number; offset: number }): Promise<Trip[]> {
    return this.db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .limit(options.limit)
      .offset(options.offset)
      .orderBy(desc(trips.departureDate));
  }

  async create(data: CreateTripData): Promise<Trip> {
    const [trip] = await this.db
      .insert(trips)
      .values({
        id: generateId(),
        ...data,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return trip;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTripData,
    version: number,
  ): Promise<Trip | null> {
    const [updated] = await this.db
      .update(trips)
      .set({
        ...data,
        version: version + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(trips.id, id),
          eq(trips.userId, userId),
          eq(trips.version, version), // Optimistic locking
        ),
      )
      .returning();

    return updated || null;
  }
}
```

### Transaction Pattern

```typescript
// Use transactions for multi-step operations
async function createTripWithSync(userId: string, tripData: CreateTripData): Promise<Trip> {
  return await db.transaction(async (tx) => {
    // Create trip
    const trip = await tx.insert(trips).values(tripData).returning();

    // Update sync status
    await tx
      .update(syncStatus)
      .set({
        lastModifiedAt: new Date().toISOString(),
        pendingChanges: sql`${syncStatus.pendingChanges} + 1`,
      })
      .where(eq(syncStatus.userId, userId));

    return trip;
  });
}
```

## Testing Patterns

### Integration Test Pattern

```typescript
// Test setup
describe('POST /api/v1/trips', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    app = await buildTestApp();
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  it('should create a new trip', async () => {
    const tripData = {
      departureDate: '2024-01-15',
      returnDate: '2024-01-20',
      destination: 'Canada',
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
    expect(response.json()).toMatchObject({
      id: expect.any(String),
      ...tripData,
      userId: testUser.id,
    });
  });
});
```

### Unit Test Pattern

```typescript
// Test individual functions
describe('validateDateRange', () => {
  it('should return true for valid date range', () => {
    const result = validateDateRange('2024-01-01', '2024-01-10');
    expect(result).toBe(true);
  });

  it('should return false when return date is before departure', () => {
    const result = validateDateRange('2024-01-10', '2024-01-01');
    expect(result).toBe(false);
  });

  it('should handle same-day trips', () => {
    const result = validateDateRange('2024-01-01', '2024-01-01');
    expect(result).toBe(true);
  });
});
```

## Security Patterns

### Input Sanitization

```typescript
// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 1000); // Limit length
}

// SQL injection prevention (handled by ORM)
// Never use string concatenation for queries
const query = sql`SELECT * FROM users WHERE email = ${userEmail}`;
```

### Rate Limiting Pattern

```typescript
// Configure rate limits per endpoint
const rateLimitConfig = {
  global: {
    max: 1000,
    timeWindow: '15 minutes',
  },
  auth: {
    max: 5,
    timeWindow: '15 minutes',
  },
  api: {
    max: 100,
    timeWindow: '1 minute',
  },
};

// Apply different limits
fastify.register(rateLimit, {
  max: async (request) => {
    if (request.url.startsWith('/api/v1/auth')) {
      return rateLimitConfig.auth.max;
    }
    return request.user ? rateLimitConfig.api.max : rateLimitConfig.global.max;
  },
});
```

## Performance Patterns

### Caching Strategy

```typescript
// Cache frequently accessed data
const cache = new Map<string, CachedData>();

async function getUserSettings(userId: string): Promise<UserSettings> {
  const cacheKey = `settings:${userId}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  cache.set(cacheKey, {
    data: settings,
    expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return settings;
}
```

### Query Optimization

```typescript
// Efficient pagination
async function listTrips(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ trips: Trip[]; total: number }> {
  // Parallel queries for data and count
  const [trips, totalResult] = await Promise.all([
    db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(trips.departureDate)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(trips)
      .where(eq(trips.userId, userId)),
  ]);

  return {
    trips,
    total: totalResult[0].count,
  };
}
```

### Response Compression

```typescript
// Enable compression for large responses
await fastify.register(compress, {
  global: true,
  threshold: 1024, // Only compress if larger than 1KB
  encodings: ['gzip', 'deflate'],
});
```

---

Last updated: January 2025
