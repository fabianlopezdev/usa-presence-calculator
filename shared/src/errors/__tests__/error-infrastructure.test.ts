import {
  chainResult,
  combineResults,
  ComplianceCalculationError,
  DateRangeError,
  err,
  isErr,
  isOk,
  LPRStatusError,
  mapError,
  mapResult,
  ok,
  TripValidationError,
  unwrapOr,
  unwrapResult,
  USCISCalculationError,
  USCISError,
  USCISValidationError,
} from '../index';

describe('Error Infrastructure', () => {
  describe('Custom Error Classes', () => {
    it('should create USCISCalculationError with correct properties', () => {
      const error = new USCISCalculationError('Calculation failed', { detail: 'test' });

      expect(error).toBeInstanceOf(USCISError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Calculation failed');
      expect(error.code).toBe('CALCULATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('USCISCalculationError');
    });

    it('should create USCISValidationError with correct properties', () => {
      const error = new USCISValidationError('Validation failed');

      expect(error).toBeInstanceOf(USCISError);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('USCISValidationError');
    });

    it('should create DateRangeError with correct properties', () => {
      const error = new DateRangeError('Invalid date range');

      expect(error).toBeInstanceOf(USCISValidationError);
      expect(error.message).toBe('Invalid date range');
      expect(error.code).toBe('DATE_RANGE_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should create TripValidationError with correct properties', () => {
      const error = new TripValidationError('Invalid trip data');

      expect(error).toBeInstanceOf(USCISValidationError);
      expect(error.message).toBe('Invalid trip data');
      expect(error.code).toBe('TRIP_VALIDATION_ERROR');
    });

    it('should create LPRStatusError with correct properties', () => {
      const error = new LPRStatusError('LPR calculation failed');

      expect(error).toBeInstanceOf(USCISCalculationError);
      expect(error.message).toBe('LPR calculation failed');
      expect(error.code).toBe('LPR_STATUS_ERROR');
    });

    it('should create ComplianceCalculationError with correct properties', () => {
      const error = new ComplianceCalculationError('Compliance check failed');

      expect(error).toBeInstanceOf(USCISCalculationError);
      expect(error.message).toBe('Compliance check failed');
      expect(error.code).toBe('COMPLIANCE_ERROR');
    });
  });

  describe('Result Type', () => {
    describe('ok function', () => {
      it('should create successful Result', () => {
        const result = ok(42);

        expect(result).toEqual({ success: true, data: 42 });
        expect(isOk(result)).toBe(true);
        expect(isErr(result)).toBe(false);
      });

      it('should work with complex data types', () => {
        const data = { id: 1, name: 'Test', values: [1, 2, 3] };
        const result = ok(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
      });
    });

    describe('err function', () => {
      it('should create error Result', () => {
        const error = new Error('Test error');
        const result = err(error);

        expect(result).toEqual({ success: false, error });
        expect(isOk(result)).toBe(false);
        expect(isErr(result)).toBe(true);
      });

      it('should work with custom error types', () => {
        const error = new USCISCalculationError('Calc error');
        const result = err(error);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
      });
    });

    describe('mapResult function', () => {
      it('should map successful Result value', () => {
        const result = ok(10);
        const mapped = mapResult(result, (x) => x * 2);

        expect(isOk(mapped)).toBe(true);
        if (isOk(mapped)) {
          expect(mapped.data).toBe(20);
        }
      });

      it('should not map error Result', () => {
        const error = new Error('Test');
        const result = err(error);
        const mapped = mapResult(result, (x: number) => x * 2);

        expect(isErr(mapped)).toBe(true);
        if (isErr(mapped)) {
          expect(mapped.error).toBe(error);
        }
      });
    });

    describe('mapError function', () => {
      it('should map error Result', () => {
        const result = err(new Error('Original'));
        const mapped = mapError(result, (e) => new Error(`Wrapped: ${e.message}`));

        expect(isErr(mapped)).toBe(true);
        if (isErr(mapped)) {
          expect(mapped.error.message).toBe('Wrapped: Original');
        }
      });

      it('should not map successful Result', () => {
        const result = ok(42);
        const mapped = mapError(result, () => new Error('Should not be called'));

        expect(isOk(mapped)).toBe(true);
        if (isOk(mapped)) {
          expect(mapped.data).toBe(42);
        }
      });
    });

    describe('unwrapResult function', () => {
      it('should unwrap successful Result', () => {
        const result = ok(42);
        const value = unwrapResult(result);

        expect(value).toBe(42);
      });

      it('should throw on error Result', () => {
        const error = new Error('Test error');
        const result = err(error);

        expect(() => unwrapResult(result)).toThrow(error);
      });
    });

    describe('unwrapOr function', () => {
      it('should unwrap successful Result', () => {
        const result = ok(42);
        const value = unwrapOr(result, 0);

        expect(value).toBe(42);
      });

      it('should return default on error Result', () => {
        const result = err(new Error('Test'));
        const value = unwrapOr(result, 99);

        expect(value).toBe(99);
      });
    });

    describe('chainResult function', () => {
      it('should chain successful Results', () => {
        const result = ok(10);
        const chained = chainResult(result, (x) => ok(x * 2));

        expect(isOk(chained)).toBe(true);
        if (isOk(chained)) {
          expect(chained.data).toBe(20);
        }
      });

      it('should propagate first error', () => {
        const error = new Error('First error');
        const result = err(error);
        const chained = chainResult(result, (x: number) => ok(x * 2));

        expect(isErr(chained)).toBe(true);
        if (isErr(chained)) {
          expect(chained.error).toBe(error);
        }
      });

      it('should propagate second error', () => {
        const result = ok(10);
        const error = new Error('Second error');
        const chained = chainResult(result, () => err(error));

        expect(isErr(chained)).toBe(true);
        if (isErr(chained)) {
          expect(chained.error).toBe(error);
        }
      });
    });

    describe('combineResults function', () => {
      it('should combine all successful Results', () => {
        const results = [ok(1), ok(2), ok(3)];
        const combined = combineResults(results);

        expect(isOk(combined)).toBe(true);
        if (isOk(combined)) {
          expect(combined.data).toEqual([1, 2, 3]);
        }
      });

      it('should return first error if any Result fails', () => {
        const error = new Error('Failed');
        const results = [ok(1), err(error), ok(3)];
        const combined = combineResults(results);

        expect(isErr(combined)).toBe(true);
        if (isErr(combined)) {
          expect(combined.error).toBe(error);
        }
      });

      it('should handle empty array', () => {
        const results: ReturnType<typeof ok>[] = [];
        const combined = combineResults(results);

        expect(isOk(combined)).toBe(true);
        if (isOk(combined)) {
          expect(combined.data).toEqual([]);
        }
      });
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify successful Results', () => {
      const success = ok('test');
      const failure = err(new Error('test'));

      expect(isOk(success)).toBe(true);
      expect(isOk(failure)).toBe(false);
    });

    it('should correctly identify error Results', () => {
      const success = ok('test');
      const failure = err(new Error('test'));

      expect(isErr(success)).toBe(false);
      expect(isErr(failure)).toBe(true);
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain instanceof relationships', () => {
      const calcError = new USCISCalculationError('test');
      const validationError = new USCISValidationError('test');
      const dateError = new DateRangeError('test');

      expect(calcError instanceof USCISError).toBe(true);
      expect(calcError instanceof Error).toBe(true);

      expect(validationError instanceof USCISError).toBe(true);
      expect(validationError instanceof Error).toBe(true);

      expect(dateError instanceof USCISValidationError).toBe(true);
      expect(dateError instanceof USCISError).toBe(true);
      expect(dateError instanceof Error).toBe(true);
    });
  });
});
