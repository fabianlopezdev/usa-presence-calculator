/**
 * Tests for Initialization Utilities
 */

import {
  createInitializer,
  createFactory,
  initializeWithDefaults,
  createDefaultObject,
  initializeArray,
  initializeMap,
  initializeSet,
  resetToInitialState,
  createMemoizedInitializer,
  initializeWithValidation,
} from '../initialization';

describe('initialization', () => {
  describe('createInitializer', () => {
    it('should create function that returns copy of defaults', () => {
      const defaults = { name: 'test', count: 0 };
      const initializer = createInitializer(defaults);

      const instance1 = initializer();
      const instance2 = initializer();

      expect(instance1).toEqual(defaults);
      expect(instance2).toEqual(defaults);
      expect(instance1).not.toBe(instance2); // Different instances
    });

    it('should create shallow copies by default', () => {
      const defaults = { user: { name: 'test' }, count: 0 };
      const initializer = createInitializer(defaults);

      const instance1 = initializer();
      const instance2 = initializer();

      // Objects are different
      expect(instance1).not.toBe(instance2);
      // But nested objects are shared (shallow copy)
      expect(instance1.user).toBe(instance2.user);
    });
  });

  describe('createFactory', () => {
    it('should create function that calls factory', () => {
      let counter = 0;
      const factory = createFactory((): { id: number } => ({ id: ++counter }));

      expect(factory()).toEqual({ id: 1 });
      expect(factory()).toEqual({ id: 2 });
      expect(factory()).toEqual({ id: 3 });
    });
  });

  describe('initializeWithDefaults', () => {
    const defaults = { name: 'default', count: 0, active: true };

    it('should return copy of defaults when no partial provided', () => {
      const result = initializeWithDefaults(defaults);
      expect(result).toEqual(defaults);
      expect(result).not.toBe(defaults);
    });

    it('should merge partial values with defaults', () => {
      const result = initializeWithDefaults(defaults, { name: 'custom', count: 5 });
      expect(result).toEqual({ name: 'custom', count: 5, active: true });
    });

    it('should handle undefined partial values', () => {
      const result = initializeWithDefaults(defaults, { name: undefined });
      expect(result).toEqual({ name: undefined, count: 0, active: true });
    });
  });

  describe('createDefaultObject', () => {
    it('should create initializer for object shape', () => {
      const shape = {
        name: 'default',
        count: 0,
        tags: ['tag1', 'tag2'],
        metadata: { version: 1 },
      };

      const initializer = createDefaultObject(shape);
      const instance1 = initializer();
      const instance2 = initializer();

      expect(instance1).toEqual(shape);
      expect(instance1.tags).not.toBe(instance2.tags); // Arrays are copied
      expect(instance1.metadata).not.toBe(instance2.metadata); // Objects are copied
    });

    it('should handle Date objects properly', () => {
      const date = new Date('2024-01-15');
      const shape = { createdAt: date };
      const initializer = createDefaultObject(shape);

      const instance = initializer();
      expect(instance.createdAt).toBe(date); // Dates are not cloned
    });
  });

  describe('initializeArray', () => {
    it('should create array with static values', () => {
      const result = initializeArray(3, 'test');
      expect(result).toEqual(['test', 'test', 'test']);
    });

    it('should create array with factory function', () => {
      let counter = 0;
      const result = initializeArray(3, (): { id: number } => ({ id: ++counter }));
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should handle zero length', () => {
      const result = initializeArray(0, 'test');
      expect(result).toEqual([]);
    });
  });

  describe('initializeMap', () => {
    it('should create Map with entries', () => {
      const entries: Array<[string, number]> = [
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ];

      const map = initializeMap(entries);
      expect(map.size).toBe(3);
      expect(map.get('a')).toBe(1);
      expect(map.get('b')).toBe(2);
      expect(map.get('c')).toBe(3);
    });

    it('should handle empty entries', () => {
      const map = initializeMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('initializeSet', () => {
    it('should create Set with values', () => {
      const set = initializeSet([1, 2, 3, 2, 1]);
      expect(set.size).toBe(3);
      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(true);
      expect(set.has(3)).toBe(true);
    });

    it('should handle empty values', () => {
      const set = initializeSet([]);
      expect(set.size).toBe(0);
    });
  });

  describe('resetToInitialState', () => {
    it('should reset object to initial state', () => {
      const initial = { name: 'initial', count: 0 };
      const target = { name: 'changed', count: 5, extra: 'field' };

      resetToInitialState(target, initial);

      expect(target).toEqual(initial);
      expect('extra' in target).toBe(false);
    });
  });

  describe('createMemoizedInitializer', () => {
    it('should create object only once', () => {
      let callCount = 0;
      const factory = (): { id: number } => {
        callCount++;
        return { id: callCount };
      };

      const initializer = createMemoizedInitializer(factory);

      const instance1 = initializer();
      const instance2 = initializer();
      const instance3 = initializer();

      expect(callCount).toBe(1);
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1.id).toBe(1);
    });
  });

  describe('initializeWithValidation', () => {
    it('should return instance when validation passes', () => {
      const factory = (): { name: string; age: number } => ({ name: 'test', age: 25 });
      const validator = (obj: { age: number }): boolean => obj.age >= 18;

      const result = initializeWithValidation(factory, validator);
      expect(result).toEqual({ name: 'test', age: 25 });
    });

    it('should throw when validation fails with boolean', () => {
      const factory = (): { name: string; age: number } => ({ name: 'test', age: 15 });
      const validator = (obj: { age: number }): boolean => obj.age >= 18;

      expect(() => initializeWithValidation(factory, validator)).toThrow(
        'Initialization validation failed',
      );
    });

    it('should throw with custom message when validation returns string', () => {
      const factory = (): { name: string; age: number } => ({ name: 'test', age: 15 });
      const validator = (obj: { age: number }): boolean | string =>
        obj.age >= 18 ? true : 'Age must be at least 18';

      expect(() => initializeWithValidation(factory, validator)).toThrow('Age must be at least 18');
    });
  });
});
