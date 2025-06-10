# Week 3: Backend Core APIs Plan (Revised)

## Overview

This document outlines the REST API endpoints needed for backend storage and synchronization. The app is offline-first, so we only need endpoints for:

1. Data that must be persisted and synced across devices
2. Data that requires server-side validation or security
3. Features that benefit from server-side computation for consistency

## Key Architecture Decision

- **Stored on Backend**: User profile, trips, settings, authentication data
- **Calculated on Device**: All presence calculations, compliance status, analytics, risk assessments
- **Rationale**: The app must work fully offline. Calculations are deterministic based on stored data.

## API Endpoints

### 1. User Profile Management

#### GET /users/profile

- **Description**: Retrieve the authenticated user's profile
- **Auth**: Required (Bearer token)
- **Response**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "greenCardDate": "2020-01-01",
    "eligibilityCategory": "five_year",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
  ```
- **Status Codes**: 200, 401, 404

#### PATCH /users/profile

- **Description**: Update user profile (only greenCardDate and eligibilityCategory can be changed)
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "greenCardDate": "2020-01-01",
    "eligibilityCategory": "three_year"
  }
  ```
- **Response**: Updated user profile
- **Status Codes**: 200, 400, 401, 404
- **Validation**:
  - greenCardDate must be in the past
  - greenCardDate cannot be more than 20 years ago

### 2. User Settings Management

#### GET /users/settings

- **Description**: Retrieve user's app settings
- **Auth**: Required (Bearer token)
- **Response**:
  ```json
  {
    "notifications": {
      "milestones": true,
      "warnings": true,
      "reminders": true
    },
    "biometricAuthEnabled": false,
    "theme": "system",
    "language": "en"
  }
  ```
- **Status Codes**: 200, 401, 404

#### PATCH /users/settings

- **Description**: Update user's app settings
- **Auth**: Required (Bearer token)
- **Request Body**: Partial settings object
- **Response**: Updated settings
- **Status Codes**: 200, 400, 401

### 3. Trip Management

#### GET /trips

- **Description**: List all trips for the authenticated user
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `cursor` (string, optional) - For pagination
  - `limit` (number, default: 50, max: 100)
  - `startDate` (string, YYYY-MM-DD) - Filter trips ending after this date
  - `endDate` (string, YYYY-MM-DD) - Filter trips starting before this date
- **Response**:
  ```json
  {
    "trips": [
      {
        "id": "uuid",
        "userId": "uuid",
        "departureDate": "2024-01-01",
        "returnDate": "2024-01-10",
        "location": "Mexico",
        "isSimulated": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "nextCursor": "string or null"
  }
  ```
- **Status Codes**: 200, 400, 401

#### POST /trips

- **Description**: Create a new trip
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "departureDate": "2024-01-01",
    "returnDate": "2024-01-10",
    "location": "Mexico"
  }
  ```
- **Response**: Created trip
- **Status Codes**: 201, 400, 401, 409
- **Validation**:
  - Trip dates cannot overlap with existing trips
  - Future trips are marked as simulated automatically
  - Departure date must be after green card date
  - Return date must be after or equal to departure date

#### GET /trips/:id

- **Description**: Get a specific trip
- **Auth**: Required (Bearer token)
- **Response**: Trip object
- **Status Codes**: 200, 401, 404

#### PATCH /trips/:id

- **Description**: Update a trip
- **Auth**: Required (Bearer token)
- **Request Body**: Partial trip object (departureDate, returnDate, location)
- **Response**: Updated trip
- **Status Codes**: 200, 400, 401, 404, 409
- **Validation**: Same as POST /trips

#### DELETE /trips/:id

- **Description**: Delete a trip
- **Auth**: Required (Bearer token)
- **Status Codes**: 204, 401, 404

#### POST /trips/bulk

- **Description**: Create multiple trips at once (for initial data import)
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "trips": [
      {
        "departureDate": "2024-01-01",
        "returnDate": "2024-01-10",
        "location": "Mexico"
      }
    ]
  }
  ```
- **Response**: Array of created trips
- **Status Codes**: 201, 400, 401, 409
- **Limits**: Maximum 100 trips per request
- **Validation**: All trips must be valid or none are created

### 4. Sync Endpoints

#### POST /sync/status

- **Description**: Get sync status to determine what needs syncing
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "lastSyncTimestamp": "2024-01-01T00:00:00Z",
    "localChecksums": {
      "profile": "hash",
      "settings": "hash",
      "trips": "hash"
    }
  }
  ```
- **Response**:
  ```json
  {
    "serverTimestamp": "2024-01-01T00:00:00Z",
    "needsSync": {
      "profile": boolean,
      "settings": boolean,
      "trips": boolean
    }
  }
  ```
- **Status Codes**: 200, 401

#### GET /sync/pull

- **Description**: Download data that has changed since last sync
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `since` (string, ISO datetime) - Get changes after this timestamp
  - `types` (string, comma-separated) - Data types to sync (profile,settings,trips)
- **Response**:
  ```json
  {
    "profile": { ... } or null,
    "settings": { ... } or null,
    "trips": {
      "created": [...],
      "updated": [...],
      "deleted": ["id1", "id2"]
    },
    "serverTimestamp": "2024-01-01T00:00:00Z"
  }
  ```
- **Status Codes**: 200, 401

#### POST /sync/push

- **Description**: Upload local changes
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "changes": {
      "profile": { ... } or null,
      "settings": { ... } or null,
      "trips": {
        "created": [...],
        "updated": [...],
        "deleted": ["id1", "id2"]
      }
    },
    "clientTimestamp": "2024-01-01T00:00:00Z"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "conflicts": [],
    "serverTimestamp": "2024-01-01T00:00:00Z"
  }
  ```
- **Status Codes**: 200, 400, 401, 409

### 5. Data Export

#### GET /export/pdf

- **Description**: Generate PDF report (computed server-side for consistency)
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `startDate` (string, YYYY-MM-DD)
  - `endDate` (string, YYYY-MM-DD)
  - `includeAnalytics` (boolean, default: true)
- **Response**: PDF file stream
- **Status Codes**: 200, 400, 401
- **Note**: This is the only calculation done server-side for PDF consistency

## What We're NOT Implementing

The following are calculated on-device and don't need backend endpoints:

1. **Presence Calculations** - Calculated from trips data
2. **Compliance Status** - Calculated from user profile and current date
3. **LPR Status Assessment** - Calculated from trips and profile
4. **Travel Analytics** - Calculated from trips data
5. **Risk Assessments** - Calculated from trips and rules
6. **Milestones** - Calculated from presence data
7. **Notifications** - Generated locally based on calculations

## Database Schema Updates

The existing schema already supports everything we need:

- `users` - Profile data
- `user_settings` - App preferences
- `trips` - Travel history
- `audit_logs` - Track changes for sync
- Auth tables from Week 2

No new tables needed!

## Implementation Order

1. **Day 1**: User profile and settings endpoints
2. **Day 2**: Basic trip CRUD (GET, POST, PATCH, DELETE)
3. **Day 3**: Trip pagination and bulk operations
4. **Day 4**: Sync endpoints
5. **Day 5**: PDF export endpoint
6. **Day 6**: Integration testing and optimization

## Key Design Decisions

### Why No Calculation Endpoints?

1. **Offline-First**: App must work without internet
2. **Performance**: Calculations are fast on-device
3. **Privacy**: Less data sent to server
4. **Cost**: Reduced server load and bandwidth
5. **Consistency**: Same calculation logic used everywhere

### Sync Strategy

1. **Conflict Resolution**: Last-write-wins for simplicity
2. **Incremental Sync**: Only sync changed data
3. **Checksums**: Detect changes efficiently
4. **Audit Trail**: Track all changes for debugging

### Security

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Users can only access their own data
3. **Validation**: Strict input validation with Zod
4. **Rate Limiting**: Prevent abuse
5. **Encryption**: Sensitive data encrypted at rest

## Testing Strategy

1. **Unit Tests**: Service methods
2. **Integration Tests**: API endpoints
3. **Sync Tests**: Conflict scenarios
4. **Load Tests**: Bulk operations
5. **Security Tests**: Auth and validation
