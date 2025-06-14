# API Routes Reference - USA Presence Calculator

This document provides a complete reference for all API endpoints, including request/response schemas, authentication requirements, and usage examples.

## Table of Contents

1. [Route Overview](#route-overview)
2. [Health Endpoints](#health-endpoints)
3. [Authentication Endpoints](#authentication-endpoints)
4. [User Endpoints](#user-endpoints)
5. [Trip Endpoints](#trip-endpoints)
6. [Sync Endpoints](#sync-endpoints)
7. [Common Response Formats](#common-response-formats)
8. [Error Codes Reference](#error-codes-reference)

## Route Overview

### Base URL

```
Production: https://api.usapresencecalculator.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication

Most endpoints require authentication via JWT bearer token:

```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting

- **Authenticated requests**: 100 requests per minute
- **Authentication endpoints**: 5 requests per 15 minutes
- **Public endpoints**: 20 requests per minute

## Health Endpoints

### GET /health

Basic health check endpoint.

**Authentication**: Not required

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /health/ready

Readiness probe for container orchestration.

**Authentication**: Not required

**Response**:

```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": "healthy",
    "memory": "healthy"
  }
}
```

### GET /health/live

Liveness probe for container orchestration.

**Authentication**: Not required

**Response**:

```json
{
  "status": "live",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### GET /health/metrics

Prometheus metrics endpoint.

**Authentication**: Not required

**Response**: Prometheus text format

## Authentication Endpoints

### POST /auth/magic-link/send

Send a magic link to user's email for passwordless authentication.

**Authentication**: Not required

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Validation**:

- `email`: Valid email address, required

**Response (200)**:

```json
{
  "message": "Magic link sent to your email",
  "expiresIn": 900 // seconds
}
```

**Rate Limit**: 3 requests per 15 minutes per email

### POST /auth/magic-link/verify

Verify a magic link token and create a session.

**Authentication**: Not required

**Request Body**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation**:

- `token`: JWT token from email link, required

**Response (200)**:

```json
{
  "userId": "usr_123456",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900, // seconds
  "user": {
    "id": "usr_123456",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/passkey/register/options

Get WebAuthn registration options for passkey setup.

**Authentication**: Required

**Response (200)**:

```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "USA Presence Calculator",
    "id": "usapresencecalculator.com"
  },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user@example.com",
    "displayName": "User Name"
  },
  "pubKeyCredParams": [...],
  "authenticatorSelection": {...},
  "attestation": "none",
  "timeout": 60000
}
```

### POST /auth/passkey/register/verify

Verify WebAuthn registration response and save passkey.

**Authentication**: Required

**Request Body**:

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "attestationObject": "base64url-encoded",
      "clientDataJSON": "base64url-encoded"
    },
    "type": "public-key"
  },
  "name": "My iPhone" // Optional device name
}
```

**Response (201)**:

```json
{
  "id": "passkey_123456",
  "name": "My iPhone",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### POST /auth/passkey/authenticate/options

Get WebAuthn authentication options.

**Authentication**: Not required

**Request Body**:

```json
{
  "email": "user@example.com" // Optional
}
```

**Response (200)**:

```json
{
  "challenge": "base64url-encoded-challenge",
  "rpId": "usapresencecalculator.com",
  "allowCredentials": [...],
  "userVerification": "preferred",
  "timeout": 60000
}
```

### POST /auth/passkey/authenticate/verify

Verify WebAuthn authentication response and create session.

**Authentication**: Not required

**Request Body**:

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "authenticatorData": "base64url-encoded",
      "clientDataJSON": "base64url-encoded",
      "signature": "base64url-encoded",
      "userHandle": "base64url-encoded"
    },
    "type": "public-key"
  }
}
```

**Response (200)**: Same as magic link verify

### GET /auth/session

Get current session information.

**Authentication**: Required

**Response (200)**:

```json
{
  "userId": "usr_123456",
  "email": "user@example.com",
  "sessionId": "ses_123456",
  "expiresAt": "2024-01-15T11:00:00.000Z"
}
```

### POST /auth/refresh-token

Refresh an expired access token.

**Authentication**: Not required

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200)**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...", // New refresh token
  "expiresIn": 900
}
```

### POST /auth/logout

Logout and invalidate session.

**Authentication**: Required

**Response (204)**: No content

## User Endpoints

### GET /users/profile

Get current user's profile information.

**Authentication**: Required

**Response (200)**:

```json
{
  "id": "usr_123456",
  "email": "user@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /users/settings

Get current user's settings.

**Authentication**: Required

**Response (200)**:

```json
{
  "notifications": {
    "milestones": true,
    "warnings": true,
    "reminders": true
  },
  "biometricAuthEnabled": false,
  "theme": "system",
  "language": "en",
  "sync": {
    "enabled": true,
    "subscriptionTier": "basic",
    "lastSyncAt": "2024-01-15T10:00:00.000Z",
    "deviceId": "device_123456"
  }
}
```

### PATCH /users/settings

Update user settings.

**Authentication**: Required

**Request Body** (all fields optional):

```json
{
  "notifications": {
    "milestones": true,
    "warnings": false,
    "reminders": true
  },
  "biometricAuthEnabled": true,
  "theme": "dark",
  "language": "es",
  "sync": {
    "enabled": false
  }
}
```

**Validation**:

- `theme`: One of: "light", "dark", "system"
- `language`: One of: "en", "es"
- All fields are optional, only provided fields are updated

**Response (200)**: Updated settings object

## Trip Endpoints

### GET /trips

List user's trips with optional filtering and pagination.

**Authentication**: Required

**Query Parameters**:

- `limit`: Number of results (1-100, default: 20)
- `offset`: Skip results (default: 0)
- `sort`: Sort order (default: "departure:desc")
  - Options: "departure:asc", "departure:desc", "created:desc"
- `destination`: Filter by destination (partial match)
- `year`: Filter by year (YYYY format)

**Response (200)**:

```json
{
  "trips": [
    {
      "id": "trip_123456",
      "departureDate": "2024-01-15",
      "returnDate": "2024-01-20",
      "destination": "Canada",
      "purpose": "vacation",
      "notes": "Family visit",
      "daysAbroad": 5,
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /trips

Create a new trip.

**Authentication**: Required

**Request Body**:

```json
{
  "departureDate": "2024-01-15",
  "returnDate": "2024-01-20",
  "destination": "Canada",
  "purpose": "vacation", // Optional
  "notes": "Family visit" // Optional
}
```

**Validation**:

- `departureDate`: YYYY-MM-DD format, required
- `returnDate`: YYYY-MM-DD format, required, must be >= departureDate
- `destination`: 1-100 characters, required
- `purpose`: 1-50 characters, optional
- `notes`: Max 500 characters, optional

**Response (201)**:

```json
{
  "id": "trip_789012",
  "userId": "usr_123456",
  "departureDate": "2024-01-15",
  "returnDate": "2024-01-20",
  "destination": "Canada",
  "purpose": "vacation",
  "notes": "Family visit",
  "daysAbroad": 5,
  "version": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /trips/:id

Get a specific trip by ID.

**Authentication**: Required

**Response (200)**: Single trip object

**Response (404)**:

```json
{
  "error": {
    "message": "Trip not found",
    "code": "TRIP_NOT_FOUND"
  }
}
```

### PUT /trips/:id

Update an existing trip.

**Authentication**: Required

**Headers**:

- `If-Match`: Version number (for optimistic locking)

**Request Body**: Same as POST /trips

**Response (200)**: Updated trip object

**Response (409)** (version conflict):

```json
{
  "error": {
    "message": "Trip has been modified by another request",
    "code": "VERSION_CONFLICT",
    "currentVersion": 2
  }
}
```

### DELETE /trips/:id

Delete a trip.

**Authentication**: Required

**Response (204)**: No content

**Response (404)**: Trip not found

## Sync Endpoints

### POST /sync/pull

Pull changes from server since last sync.

**Authentication**: Required

**Request Body**:

```json
{
  "lastSyncAt": "2024-01-01T00:00:00.000Z",
  "deviceId": "device_123456",
  "includeDeleted": true // Optional, default: false
}
```

**Response (200)**:

```json
{
  "changes": {
    "trips": {
      "created": [...],
      "updated": [...],
      "deleted": ["trip_123", "trip_456"]
    },
    "settings": {
      "updated": {...}
    }
  },
  "syncToken": "sync_token_789",
  "serverTime": "2024-01-15T10:30:00.000Z"
}
```

### POST /sync/push

Push local changes to server.

**Authentication**: Required

**Request Body**:

```json
{
  "deviceId": "device_123456",
  "changes": {
    "trips": {
      "created": [...],
      "updated": [...],
      "deleted": ["trip_123"]
    },
    "settings": {
      "updated": {...}
    }
  },
  "lastSyncToken": "sync_token_456" // Optional
}
```

**Response (200)**:

```json
{
  "accepted": {
    "trips": {
      "created": 2,
      "updated": 1,
      "deleted": 1
    },
    "settings": {
      "updated": true
    }
  },
  "conflicts": [
    {
      "type": "trip",
      "id": "trip_789",
      "reason": "version_mismatch",
      "serverVersion": {...},
      "resolution": "server_wins"
    }
  ],
  "syncToken": "sync_token_101112",
  "serverTime": "2024-01-15T10:30:00.000Z"
}
```

## Common Response Formats

### Success Response

```json
{
  "data": {...},
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_CODE",
    "details": {...}, // Optional additional context
    "requestId": "req_123456",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Pagination Metadata

```json
{
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 40,
    "page": 3,
    "pages": 5,
    "hasMore": true,
    "hasPrevious": true
  }
}
```

## Error Codes Reference

### Authentication Errors (401)

- `INVALID_TOKEN`: JWT token is invalid or malformed
- `TOKEN_EXPIRED`: JWT token has expired
- `NO_TOKEN`: No authentication token provided
- `INVALID_CREDENTIALS`: Email/password incorrect
- `SESSION_EXPIRED`: Session has expired

### Authorization Errors (403)

- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RESOURCE_ACCESS_DENIED`: User cannot access this resource
- `SUBSCRIPTION_REQUIRED`: Feature requires subscription

### Validation Errors (400)

- `VALIDATION_ERROR`: Request body validation failed
- `INVALID_DATE_FORMAT`: Date must be YYYY-MM-DD
- `INVALID_DATE_RANGE`: Return date before departure
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `FIELD_TOO_LONG`: Field exceeds maximum length

### Resource Errors (404)

- `USER_NOT_FOUND`: User does not exist
- `TRIP_NOT_FOUND`: Trip does not exist
- `RESOURCE_NOT_FOUND`: Generic not found

### Conflict Errors (409)

- `EMAIL_ALREADY_EXISTS`: Email already registered
- `VERSION_CONFLICT`: Optimistic locking conflict
- `DUPLICATE_TRIP`: Trip already exists for dates

### Rate Limit Errors (429)

- `RATE_LIMIT_EXCEEDED`: Too many requests
- `DAILY_LIMIT_EXCEEDED`: Daily limit reached

### Server Errors (500)

- `INTERNAL_SERVER_ERROR`: Unexpected error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: Third-party service failed

---

Last updated: January 2025
