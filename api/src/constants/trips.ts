export const TRIPS_API_MESSAGES = {
  TRIP_NOT_FOUND: 'Trip not found',
  TRIP_CREATED: 'Trip created successfully',
  TRIP_UPDATED: 'Trip updated successfully',
  TRIP_DELETED: 'Trip deleted successfully',
  NO_CHANGES_PROVIDED: 'No changes provided for update',
  INVALID_REQUEST_BODY: 'Invalid request body',
  INVALID_TRIP_ID: 'Invalid trip ID format',
} as const;

export const TRIPS_VALIDATION = {
  MAX_LOCATION_LENGTH: 200,
  MIN_LOCATION_LENGTH: 1,
} as const;
