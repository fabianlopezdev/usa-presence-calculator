# Week 3: Backend Core APIs Plan

## Overview

This document outlines the REST API endpoints to be implemented in Week 3, based on the shared Zod schemas and business requirements.

## API Endpoints

### 1. User Profile Management

#### GET /users/profile

- **Description**: Retrieve the authenticated user's profile
- **Auth**: Required (Bearer token)
- **Response**: `UserProfileSchema`
- **Status Codes**: 200, 401, 404

#### PATCH /users/profile

- **Description**: Update user profile information
- **Auth**: Required (Bearer token)
- **Request Body**: Partial `UserProfileSchema` (only greenCardDate, eligibilityCategory)
- **Response**: Updated `UserProfileSchema`
- **Status Codes**: 200, 400, 401, 404
- **Business Rules**:
  - Cannot change email
  - greenCardDate must be in the past
  - Changing greenCardDate or eligibilityCategory will trigger recalculation of presence

### 2. User Settings Management

#### GET /users/settings

- **Description**: Retrieve user's app settings
- **Auth**: Required (Bearer token)
- **Response**: `UserSettingsSchema`
- **Status Codes**: 200, 401, 404

#### PATCH /users/settings

- **Description**: Update user's app settings
- **Auth**: Required (Bearer token)
- **Request Body**: Partial `UserSettingsSchema`
- **Response**: Updated `UserSettingsSchema`
- **Status Codes**: 200, 400, 401

### 3. Trip CRUD Operations

#### GET /trips

- **Description**: List all trips for the authenticated user
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 50, max: 100)
  - `startDate` (string, format: YYYY-MM-DD)
  - `endDate` (string, format: YYYY-MM-DD)
  - `includeSimulated` (boolean, default: false)
- **Response**:
  ```json
  {
    "data": Trip[],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  }
  ```
- **Status Codes**: 200, 400, 401

#### POST /trips

- **Description**: Create a new trip
- **Auth**: Required (Bearer token)
- **Request Body**: `TripCreateSchema`
- **Response**: Created `TripSchema`
- **Status Codes**: 201, 400, 401, 409
- **Business Rules**:
  - Trip dates cannot overlap with existing trips
  - Cannot create trips in the future (only simulated trips allowed for future)
  - Departure date must be after green card date

#### GET /trips/:id

- **Description**: Get a specific trip
- **Auth**: Required (Bearer token)
- **Response**: `TripSchema`
- **Status Codes**: 200, 401, 404

#### PATCH /trips/:id

- **Description**: Update a trip
- **Auth**: Required (Bearer token)
- **Request Body**: `TripUpdateSchema`
- **Response**: Updated `TripSchema`
- **Status Codes**: 200, 400, 401, 404, 409
- **Business Rules**:
  - Cannot update simulated trips
  - Updated dates cannot overlap with other trips
  - Cannot change trip to future dates

#### DELETE /trips/:id

- **Description**: Delete a trip
- **Auth**: Required (Bearer token)
- **Status Codes**: 204, 401, 404
- **Business Rules**:
  - Cannot delete simulated trips (they auto-expire)

#### POST /trips/bulk

- **Description**: Create multiple trips at once
- **Auth**: Required (Bearer token)
- **Request Body**: Array of `TripCreateSchema` (max 50)
- **Response**: Array of created `TripSchema`
- **Status Codes**: 201, 400, 401, 409
- **Business Rules**:
  - All trips must be valid or none are created (transaction)
  - No overlapping dates within the batch or with existing trips

### 4. Presence Calculations

#### GET /calculations/presence

- **Description**: Calculate presence status based on trips
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `asOfDate` (string, format: YYYY-MM-DD, default: today)
  - `includeSimulated` (boolean, default: false)
- **Response**: `PresenceCalculationResultSchema`
- **Status Codes**: 200, 400, 401

#### GET /calculations/compliance

- **Description**: Get comprehensive compliance status
- **Auth**: Required (Bearer token)
- **Response**: `ComprehensiveComplianceStatusSchema`
- **Status Codes**: 200, 401

#### GET /calculations/lpr-status

- **Description**: Get LPR status assessment
- **Auth**: Required (Bearer token)
- **Response**: `LPRStatusAssessmentAdvancedSchema`
- **Status Codes**: 200, 401

### 5. Travel Analytics

#### GET /analytics/summary

- **Description**: Get travel analytics summary
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `year` (number, optional)
- **Response**:
  ```json
  {
    "countryStatistics": CountryStatistics[],
    "yearlyDaysAbroad": YearlyDaysAbroad[],
    "travelStreaks": TravelStreak[],
    "milestones": MilestoneInfo[]
  }
  ```
- **Status Codes**: 200, 400, 401

#### POST /analytics/simulate

- **Description**: Simulate a future trip impact
- **Auth**: Required (Bearer token)
- **Request Body**: `SimulatedTripSchema`
- **Response**:
  ```json
  {
    "tripRiskAssessment": TripRiskAssessment,
    "projectedPresence": PresenceCalculationResult,
    "safeTravelBudget": SafeTravelBudget
  }
  ```
- **Status Codes**: 200, 400, 401

### 6. Sync Endpoints

#### GET /sync/pull

- **Description**: Download all user data for offline sync
- **Auth**: Required (Bearer token)
- **Query Parameters**:
  - `lastSyncTimestamp` (string, ISO datetime)
- **Response**:
  ```json
  {
    "profile": UserProfile,
    "settings": UserSettings,
    "trips": Trip[],
    "deletedTripIds": string[],
    "syncTimestamp": string
  }
  ```
- **Status Codes**: 200, 401

#### POST /sync/push

- **Description**: Upload local changes
- **Auth**: Required (Bearer token)
- **Request Body**:
  ```json
  {
    "profile": Partial<UserProfile>,
    "settings": Partial<UserSettings>,
    "trips": {
      "created": TripCreate[],
      "updated": { id: string, data: TripUpdate }[],
      "deleted": string[]
    },
    "clientTimestamp": string
  }
  ```
- **Response**:
  ```json
  {
    "conflicts": {
      "profile": boolean,
      "settings": boolean,
      "trips": { id: string, type: "created" | "updated" | "deleted" }[]
    },
    "syncTimestamp": string
  }
  ```
- **Status Codes**: 200, 400, 401, 409

## Implementation Order

1. **User Management** (Day 1)

   - GET/PATCH /users/profile
   - GET/PATCH /users/settings

2. **Trip CRUD** (Day 2-3)

   - GET /trips (with pagination)
   - POST /trips
   - GET/PATCH/DELETE /trips/:id
   - POST /trips/bulk

3. **Calculations** (Day 4)

   - GET /calculations/presence
   - GET /calculations/compliance
   - GET /calculations/lpr-status

4. **Analytics** (Day 5)

   - GET /analytics/summary
   - POST /analytics/simulate

5. **Sync** (Day 6)
   - GET /sync/pull
   - POST /sync/push

## Database Considerations

### New Tables Needed:

- `user_settings` - Store user preferences
- `sync_log` - Track sync operations for conflict resolution

### Indexes:

- `trips.user_id` + `trips.departure_date` (composite)
- `trips.user_id` + `trips.is_simulated`
- `sync_log.user_id` + `sync_log.timestamp`

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access their own data
3. **Rate Limiting**:
   - General API: 100 requests per 15 minutes per user
   - Sync endpoints: 10 requests per hour per user
4. **Input Validation**: All inputs validated with Zod schemas
5. **SQL Injection**: Use parameterized queries (Drizzle ORM)

## Testing Strategy

1. **Unit Tests**: Service layer business logic
2. **Integration Tests**: API endpoints with real database
3. **E2E Tests**: Complete user flows
4. **Performance Tests**: Pagination and bulk operations
5. **Security Tests**: Auth, authorization, input validation

## Performance Optimizations

1. **Database Queries**:

   - Use indexes for trip queries
   - Batch operations in transactions
   - Optimize presence calculations with SQL aggregations

2. **Caching**:

   - Cache presence calculations (5 minute TTL)
   - Cache compliance status (15 minute TTL)
   - Invalidate on trip changes

3. **Pagination**:
   - Cursor-based pagination for large datasets
   - Limit max page size to 100

## Error Handling

All errors follow consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "field": "field_name" // For validation errors
  }
}
```

Common error codes:

- `UNAUTHORIZED` - Invalid or missing token
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `CONFLICT` - Resource conflict (e.g., overlapping trips)
- `RATE_LIMIT_EXCEEDED` - Too many requests
