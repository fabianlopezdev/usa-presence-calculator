/**
 * Custom error classes for USCIS calculations
 * Provides structured error handling with specific error types
 */

/**
 * Base error class for all USCIS-related errors
 */
export abstract class USCISError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when USCIS calculations fail
 */
export class USCISCalculationError extends USCISError {
  constructor(message: string, details?: unknown) {
    super(message, 'CALCULATION_ERROR', 500, details);
  }
}

/**
 * Error thrown when validation of USCIS data fails
 */
export class USCISValidationError extends USCISError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when date range validation fails
 */
export class DateRangeError extends USCISValidationError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    Object.defineProperty(this, 'code', {
      value: 'DATE_RANGE_ERROR',
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

/**
 * Error thrown when trip data is invalid
 */
export class TripValidationError extends USCISValidationError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    Object.defineProperty(this, 'code', {
      value: 'TRIP_VALIDATION_ERROR',
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

/**
 * Error thrown when LPR status calculation fails
 */
export class LPRStatusError extends USCISCalculationError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    Object.defineProperty(this, 'code', {
      value: 'LPR_STATUS_ERROR',
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

/**
 * Error thrown when compliance calculation fails
 */
export class ComplianceCalculationError extends USCISCalculationError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    Object.defineProperty(this, 'code', {
      value: 'COMPLIANCE_ERROR',
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

/**
 * Result type for functional error handling
 * Inspired by Rust's Result type
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Creates a successful Result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failed Result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if Result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if Result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Maps a successful Result value
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Maps an error Result value
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Unwraps a Result or throws the error
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps a Result or returns a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Chains Result operations
 */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Combines multiple Results into a single Result
 */
export function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }

  return ok(values);
}
