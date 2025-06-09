/**
 * Initialization Utilities
 *
 * This module provides generic initialization functions and patterns
 * to reduce redundancy across different modules.
 */

/**
 * Create a generic initializer function that returns a copy of default values
 *
 * @param defaultValues - The default values to use
 * @returns Function that returns a copy of the default values
 */
export function createInitializer<T>(defaultValues: T): () => T {
  return () => ({ ...defaultValues });
}

/**
 * Create a factory function for complex initialization
 *
 * @param factory - Factory function that creates the initial object
 * @returns Function that calls the factory
 */
export function createFactory<T>(factory: () => T): () => T {
  return factory;
}

/**
 * Initialize an object with default values, merging with partial values
 *
 * @param defaults - Default values
 * @param partial - Partial values to merge
 * @returns Merged object
 */
export function initializeWithDefaults<T>(defaults: T, partial?: Partial<T>): T {
  if (!partial) return { ...defaults };
  return { ...defaults, ...partial };
}

/**
 * Create a typed default object initializer
 *
 * @param shape - Object shape with default values
 * @returns Function that returns initialized object
 */
export function createDefaultObject<T extends Record<string, unknown>>(shape: T): () => T {
  return () => {
    const result = {} as T;
    for (const key in shape) {
      if (Object.prototype.hasOwnProperty.call(shape, key)) {
        const value = shape[key];
        // Handle nested objects
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          result[key] = { ...value } as T[typeof key];
        } else if (Array.isArray(value)) {
          result[key] = [...value] as T[typeof key];
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  };
}

/**
 * Initialize an array with a specific length and default values
 *
 * @param length - Length of array
 * @param defaultValue - Default value for each element
 * @returns Initialized array
 */
export function initializeArray<T>(length: number, defaultValue: T | (() => T)): T[] {
  const result: T[] = [];
  for (let i = 0; i < length; i++) {
    result.push(typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue);
  }
  return result;
}

/**
 * Initialize a Map with default entries
 *
 * @param entries - Default entries for the map
 * @returns Initialized Map
 */
export function initializeMap<K, V>(entries: Array<[K, V]>): Map<K, V> {
  return new Map(entries);
}

/**
 * Initialize a Set with default values
 *
 * @param values - Default values for the set
 * @returns Initialized Set
 */
export function initializeSet<T>(values: T[]): Set<T> {
  return new Set(values);
}

/**
 * Reset an object to its initial state
 *
 * @param target - Object to reset
 * @param initialState - Initial state to reset to
 */
export function resetToInitialState<T extends object>(target: T, initialState: T): void {
  // Clear existing properties
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      delete target[key];
    }
  }

  // Copy initial state properties
  Object.assign(target, initialState);
}

/**
 * Create a memoized initializer that only creates the object once
 *
 * @param factory - Factory function to create the object
 * @returns Memoized initializer
 */
export function createMemoizedInitializer<T>(factory: () => T): () => T {
  let instance: T | undefined;
  let initialized = false;

  return () => {
    if (!initialized) {
      instance = factory();
      initialized = true;
    }
    return instance as T;
  };
}

/**
 * Initialize with validation
 *
 * @param factory - Factory function to create the object
 * @param validator - Validation function
 * @returns Validated object or throws error
 */
export function initializeWithValidation<T>(
  factory: () => T,
  validator: (value: T) => boolean | string,
): T {
  const instance = factory();
  const validation = validator(instance);

  if (validation === true) {
    return instance;
  }

  throw new Error(typeof validation === 'string' ? validation : 'Initialization validation failed');
}
