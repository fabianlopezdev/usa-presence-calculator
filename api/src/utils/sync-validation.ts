import { z } from 'zod';

import { SYNC_CONFIG } from '@api/constants/sync';

/**
 * Checks if an object is deeply nested beyond the allowed depth
 */
export function checkObjectDepth(
  obj: unknown,
  maxDepth: number = SYNC_CONFIG.MAX_OBJECT_DEPTH,
): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return true;
  }

  const queue: Array<{ obj: unknown; depth: number }> = [{ obj, depth: 0 }];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;

    if (item.depth > maxDepth) {
      return false;
    }

    const childrenToProcess = getChildObjects(item.obj, item.depth);
    queue.push(...childrenToProcess);
  }

  return true;
}

function getChildObjects(
  current: unknown,
  currentDepth: number,
): Array<{ obj: unknown; depth: number }> {
  const children: Array<{ obj: unknown; depth: number }> = [];

  if (Array.isArray(current)) {
    for (const item of current) {
      if (isObject(item)) {
        children.push({ obj: item, depth: currentDepth + 1 });
      }
    }
  } else if (isObject(current)) {
    for (const value of Object.values(current)) {
      if (isObject(value)) {
        children.push({ obj: value, depth: currentDepth + 1 });
      }
    }
  }

  return children;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

/**
 * Validates string length across all fields in an object
 */
export function validateStringLengths(obj: unknown): boolean {
  if (!isObject(obj)) {
    return true;
  }

  const queue: unknown[] = [obj];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!isObject(current)) {
      continue;
    }

    const validationResult = checkObjectStringLengths(current as Record<string, unknown>);
    if (!validationResult.isValid) {
      return false;
    }

    queue.push(...validationResult.childObjects);
  }

  return true;
}

function checkObjectStringLengths(obj: Record<string, unknown>): {
  isValid: boolean;
  childObjects: unknown[];
} {
  const childObjects: unknown[] = [];

  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && value.length > SYNC_CONFIG.MAX_STRING_LENGTH) {
      return { isValid: false, childObjects: [] };
    }

    if (isObject(value)) {
      childObjects.push(value);
    }
  }

  return { isValid: true, childObjects };
}

/**
 * Estimates the size of a JSON object
 */
export function estimateJsonSize(obj: unknown): number {
  try {
    return JSON.stringify(obj).length;
  } catch {
    return SYNC_CONFIG.MAX_REQUEST_SIZE + 1; // If it fails, assume it's too big
  }
}

/**
 * Validates sync request payload for security issues
 */
export function validateSyncPayload(payload: unknown): {
  isValid: boolean;
  error?: string;
} {
  // Check if payload is an object
  if (typeof payload !== 'object' || payload === null) {
    return { isValid: false, error: 'Invalid payload format' };
  }

  // Check object depth
  if (!checkObjectDepth(payload)) {
    return { isValid: false, error: 'Payload nested too deeply' };
  }

  // Check string lengths
  if (!validateStringLengths(payload)) {
    return { isValid: false, error: 'String fields exceed maximum length' };
  }

  // Check overall size
  if (estimateJsonSize(payload) > SYNC_CONFIG.MAX_REQUEST_SIZE) {
    return { isValid: false, error: 'Payload size exceeds maximum allowed' };
  }

  // Check for prototype pollution attempts
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const checkForDangerousKeys = (obj: unknown): boolean => {
    if (typeof obj !== 'object' || obj === null) return false;

    const objRecord = obj as Record<string, unknown>;
    for (const key in objRecord) {
      if (dangerousKeys.includes(key)) return true;
      if (typeof objRecord[key] === 'object' && checkForDangerousKeys(objRecord[key])) return true;
    }
    return false;
  };

  if (checkForDangerousKeys(payload)) {
    return { isValid: false, error: 'Potentially malicious payload detected' };
  }

  return { isValid: true };
}

/**
 * Sanitizes trip dates to ensure they are valid
 */
export function sanitizeTripDates(trip: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...trip };

  // Ensure dates are in valid format
  if (sanitized.departureDate) {
    const date = new Date(sanitized.departureDate as string | number | Date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid departure date');
    }
    // Ensure it's in YYYY-MM-DD format
    sanitized.departureDate = date.toISOString().split('T')[0];
  }

  if (sanitized.returnDate) {
    const date = new Date(sanitized.returnDate as string | number | Date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid return date');
    }
    sanitized.returnDate = date.toISOString().split('T')[0];
  }

  // Validate date logic
  if (sanitized.departureDate && sanitized.returnDate) {
    const departure = new Date(sanitized.departureDate as string);
    const returnDate = new Date(sanitized.returnDate as string);
    if (returnDate < departure) {
      throw new Error('Return date cannot be before departure date');
    }
  }

  return sanitized;
}

/**
 * Validates batch size limits
 */
export function validateBatchSize(items: unknown[]): boolean {
  return items.length <= SYNC_CONFIG.MAX_BATCH_SIZE;
}

/**
 * Strips unknown fields from an object based on allowed keys
 */
export function stripUnknownFields<T extends Record<string, unknown>>(
  obj: T,
  allowedKeys: string[],
): Partial<T> {
  const result: Partial<T> = {};

  for (const key of allowedKeys) {
    if (key in obj) {
      result[key as keyof T] = obj[key as keyof T];
    }
  }

  return result;
}

/**
 * Validates sync version is a positive integer
 */
export function validateSyncVersion(version: unknown): number {
  const parsed = z.number().int().min(0).max(2147483647).safeParse(version);

  if (!parsed.success) {
    throw new Error('Invalid sync version');
  }

  return parsed.data;
}
