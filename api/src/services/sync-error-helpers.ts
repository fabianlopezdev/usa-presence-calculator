export function createForbiddenError(message: string): Error {
  return new Error(`FORBIDDEN: ${message}`);
}

export function createInvalidTripDataError(message: string): Error {
  return new Error(`INVALID_TRIP_DATA: ${message}`);
}

export function createMissingFieldsError(message: string): Error {
  return new Error(`MISSING_REQUIRED_FIELDS: ${message}`);
}
