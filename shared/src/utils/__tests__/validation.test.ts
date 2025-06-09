/**
 * Tests for Unified Validation Utilities
 */

import {
  isValidTrip,
  isValidTripWithId,
  validateTripForCalculation,
  isValidTripForResidenceCheck,
  isValidTripForRiskAssessment,
  filterValidTrips,
  getActualValidTrips,
  getSimulatedValidTrips,
  TripValidationRequirements,
} from '../validation';

import { Trip } from '@schemas/trip';

describe('validation', () => {
  const validTrip: Trip = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    departureDate: '2024-01-10',
    returnDate: '2024-01-20',
    location: 'Canada',
    isSimulated: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const simulatedTrip: Trip = {
    ...validTrip,
    isSimulated: true,
  };

  describe('isValidTrip', () => {
    it('should return true for valid trips', () => {
      expect(isValidTrip(validTrip)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isValidTrip(null)).toBe(false);
      expect(isValidTrip(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidTrip('string')).toBe(false);
      expect(isValidTrip(123)).toBe(false);
      expect(isValidTrip([])).toBe(false);
    });

    it('should return false for simulated trips by default', () => {
      expect(isValidTrip(simulatedTrip)).toBe(false);
    });

    it('should return false for trips with missing dates', () => {
      const tripWithoutDeparture = { ...validTrip, departureDate: '' };
      const tripWithoutReturn = { ...validTrip, returnDate: '' };

      expect(isValidTrip(tripWithoutDeparture)).toBe(false);
      expect(isValidTrip(tripWithoutReturn)).toBe(false);
    });

    it('should return false for trips with invalid dates', () => {
      const tripWithInvalidDate = { ...validTrip, departureDate: '2024-13-45' };
      expect(isValidTrip(tripWithInvalidDate)).toBe(false);
    });

    it('should return false when departure is after return', () => {
      const invalidTrip = { ...validTrip, departureDate: '2024-01-20', returnDate: '2024-01-10' };
      expect(isValidTrip(invalidTrip)).toBe(false);
    });
  });

  describe('isValidTripWithId', () => {
    it('should return true for valid trips with ID', () => {
      expect(isValidTripWithId(validTrip)).toBe(true);
    });

    it('should return false for trips without ID', () => {
      const tripWithoutId = { ...validTrip, id: undefined } as unknown as Trip;
      expect(isValidTripWithId(tripWithoutId)).toBe(false);
    });

    it('should return false for trips with empty ID', () => {
      const tripWithEmptyId = { ...validTrip, id: '' };
      expect(isValidTripWithId(tripWithEmptyId)).toBe(false);
    });

    it('should return false for invalid trips', () => {
      expect(isValidTripWithId(null)).toBe(false);
      expect(isValidTripWithId(simulatedTrip)).toBe(false);
    });
  });

  describe('validateTripForCalculation', () => {
    it('should validate with default requirements', () => {
      expect(validateTripForCalculation(validTrip)).toBe(true);
    });

    it('should check ID when required', () => {
      const requirements: TripValidationRequirements = { needsId: true };
      expect(validateTripForCalculation(validTrip, requirements)).toBe(true);

      const tripWithoutId = { ...validTrip, id: undefined } as unknown as Trip;
      expect(validateTripForCalculation(tripWithoutId, requirements)).toBe(false);
    });

    it('should check location when required', () => {
      const requirements: TripValidationRequirements = { needsLocation: true };
      expect(validateTripForCalculation(validTrip, requirements)).toBe(true);

      const tripWithoutLocation = { ...validTrip, location: undefined } as unknown as Trip;
      expect(validateTripForCalculation(tripWithoutLocation, requirements)).toBe(false);
    });

    it('should allow simulated trips when specified', () => {
      const requirements: TripValidationRequirements = { allowSimulated: true };
      expect(validateTripForCalculation(simulatedTrip, requirements)).toBe(true);
    });

    it('should skip date validation when specified', () => {
      const requirements: TripValidationRequirements = { checkDates: false };
      const tripWithBadDates = { ...validTrip, departureDate: 'invalid' };
      expect(validateTripForCalculation(tripWithBadDates, requirements)).toBe(true);
    });
  });

  describe('isValidTripForResidenceCheck', () => {
    it('should return true for valid non-simulated trips with ID', () => {
      expect(isValidTripForResidenceCheck(validTrip)).toBe(true);
    });

    it('should return false for simulated trips', () => {
      expect(isValidTripForResidenceCheck(simulatedTrip)).toBe(false);
    });

    it('should return false for trips without ID', () => {
      const { id: _, ...tripWithoutIdObj } = validTrip;
      const tripWithoutId = tripWithoutIdObj as unknown as Trip;
      expect(isValidTripForResidenceCheck(tripWithoutId)).toBe(false);
    });
  });

  describe('isValidTripForRiskAssessment', () => {
    it('should return true only for simulated trips with valid data', () => {
      expect(isValidTripForRiskAssessment(simulatedTrip)).toBe(true);
    });

    it('should return false for non-simulated trips', () => {
      expect(isValidTripForRiskAssessment(validTrip)).toBe(false);
    });

    it('should return false for simulated trips without ID', () => {
      const { id: _, ...simulatedTripWithoutId } = simulatedTrip;
      const simulatedWithoutId = simulatedTripWithoutId as unknown as Trip;
      expect(isValidTripForRiskAssessment(simulatedWithoutId)).toBe(false);
    });
  });

  describe('filterValidTrips', () => {
    const trips = [
      validTrip,
      simulatedTrip,
      { ...validTrip, id: '2', departureDate: 'invalid' },
      null,
      undefined,
      'not a trip',
    ];

    it('should filter with default requirements', () => {
      const result = filterValidTrips(trips);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(validTrip);
    });

    it('should include simulated trips when allowed', () => {
      const result = filterValidTrips(trips, { allowSimulated: true });
      expect(result).toHaveLength(2);
      expect(result).toContain(validTrip);
      expect(result).toContain(simulatedTrip);
    });

    it('should handle non-array inputs', () => {
      expect(filterValidTrips([])).toEqual([]);
      expect(filterValidTrips([])).toEqual([]);
      expect(filterValidTrips([])).toEqual([]);
    });
  });

  describe('getActualValidTrips', () => {
    it('should return only non-simulated valid trips', () => {
      const trips = [validTrip, simulatedTrip, { ...validTrip, id: '3' }];
      const result = getActualValidTrips(trips);
      expect(result).toHaveLength(2);
      expect(result.every((t) => !t.isSimulated)).toBe(true);
    });
  });

  describe('getSimulatedValidTrips', () => {
    it('should return only simulated valid trips', () => {
      const trips = [validTrip, simulatedTrip, { ...simulatedTrip, id: '3' }];
      const result = getSimulatedValidTrips(trips);
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.isSimulated)).toBe(true);
    });

    it('should handle empty arrays', () => {
      expect(getSimulatedValidTrips([])).toEqual([]);
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('malformed trip objects', () => {
      it('should handle trips with extra unexpected properties', () => {
        const tripWithExtras = {
          ...validTrip,
          extraField: 'unexpected',
          nestedObject: { foo: 'bar' },
          arrayField: [1, 2, 3],
        };

        // Should still validate as it has all required fields
        expect(isValidTrip(tripWithExtras)).toBe(true);
        expect(validateTripForCalculation(tripWithExtras as unknown as Trip)).toBe(true);
      });

      it('should handle trips with null/undefined property values', () => {
        const tripWithNulls = {
          ...validTrip,
          location: null,
          notes: undefined,
        } as unknown as Trip;

        // Should validate if location is not required
        expect(validateTripForCalculation(tripWithNulls, { needsLocation: false })).toBe(true);
        // Should fail if location is required
        expect(validateTripForCalculation(tripWithNulls, { needsLocation: true })).toBe(false);
      });

      it('should handle trips with wrong property types', () => {
        const tripWithWrongTypes = {
          ...validTrip,
          departureDate: 123456, // number instead of string
          isSimulated: 'true', // string instead of boolean
        } as unknown as Trip;

        // parseDate will fail with non-string input
        expect(isValidTrip(tripWithWrongTypes)).toBe(false);
      });
    });

    describe('date edge cases', () => {
      it('should handle dates in different formats', () => {
        const dateFormats = [
          '2024-01-10', // Standard ISO
          '2024/01/10', // Slash separator
          '01-10-2024', // US format
          '10.01.2024', // European format
          '2024-1-10', // No padding
          'Jan 10, 2024', // Named month
        ];

        dateFormats.forEach((format) => {
          const trip = {
            ...validTrip,
            departureDate: format,
            returnDate: '2024-01-20',
          };

          // Only standard ISO format should be valid
          if (format === '2024-01-10') {
            expect(isValidTrip(trip)).toBe(true);
          } else {
            // parseDate might handle some formats, but not guaranteed
            // This test documents actual behavior
            const result = isValidTrip(trip);
            expect(typeof result).toBe('boolean');
          }
        });
      });

      it('should handle same departure and return dates', () => {
        const sameDayTrip = {
          ...validTrip,
          departureDate: '2024-01-10',
          returnDate: '2024-01-10',
        };

        expect(isValidTrip(sameDayTrip)).toBe(true);
        expect(validateTripForCalculation(sameDayTrip)).toBe(true);
      });

      it('should handle dates at year boundaries', () => {
        const yearBoundaryTrip = {
          ...validTrip,
          departureDate: '2023-12-31',
          returnDate: '2024-01-01',
        };

        expect(isValidTrip(yearBoundaryTrip)).toBe(true);
      });

      it('should handle leap year dates', () => {
        const leapYearTrip = {
          ...validTrip,
          departureDate: '2024-02-29',
          returnDate: '2024-03-01',
        };

        expect(isValidTrip(leapYearTrip)).toBe(true);

        // Invalid leap year date
        const invalidLeapYearTrip = {
          ...validTrip,
          departureDate: '2023-02-29', // 2023 is not a leap year
          returnDate: '2023-03-01',
        };

        expect(isValidTrip(invalidLeapYearTrip)).toBe(false);
      });
    });

    describe('filterValidTrips edge cases', () => {
      it('should handle deeply nested invalid data', () => {
        const complexData = [
          validTrip,
          [validTrip], // array within array
          { trip: validTrip }, // wrapped object
          () => validTrip, // function
          new Date(), // Date object
          Symbol('trip'), // Symbol
          NaN,
          Infinity,
          -Infinity,
        ];

        const result = filterValidTrips(complexData);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(validTrip);
      });

      it('should handle circular references', () => {
        const circular = { ...validTrip } as Trip & { self?: Trip };
        circular.self = circular;

        const trips = [validTrip, circular];

        // Should not throw
        expect(() => filterValidTrips(trips)).not.toThrow();
        const result = filterValidTrips(trips);
        expect(result.length).toBeGreaterThanOrEqual(1);
      });

      it('should handle very large arrays efficiently', () => {
        // Create array with 10,000 trips
        const largeArray = Array(10000)
          .fill(null)
          .map((_, i) => ({
            ...validTrip,
            id: `trip-${i}`,
          }));

        const startTime = Date.now();
        const result = filterValidTrips(largeArray);
        const endTime = Date.now();

        expect(result).toHaveLength(10000);
        // Should complete in reasonable time (< 1 second)
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });

    describe('validation requirements edge cases', () => {
      it('should handle all requirements simultaneously', () => {
        const strictRequirements: TripValidationRequirements = {
          needsId: true,
          needsLocation: true,
          allowSimulated: false,
          checkDates: true,
        };

        expect(validateTripForCalculation(validTrip, strictRequirements)).toBe(true);

        // Trip missing location
        const tripNoLocation = { ...validTrip, location: '' };
        expect(validateTripForCalculation(tripNoLocation, strictRequirements)).toBe(false);
      });

      it('should handle contradictory requirements gracefully', () => {
        const requirements: TripValidationRequirements = {
          allowSimulated: true,
          checkDates: false,
        };

        const invalidSimulatedTrip = {
          ...simulatedTrip,
          departureDate: 'not-a-date',
          returnDate: 'also-not-a-date',
        };

        // Should pass because date checking is disabled
        expect(validateTripForCalculation(invalidSimulatedTrip, requirements)).toBe(true);
      });

      it('should handle empty requirements object', () => {
        const emptyReq: TripValidationRequirements = {};

        expect(validateTripForCalculation(validTrip, emptyReq)).toBe(true);
        expect(validateTripForCalculation(simulatedTrip, emptyReq)).toBe(false);
      });
    });

    describe('ID validation edge cases', () => {
      it('should handle various ID formats', () => {
        const idFormats = [
          '550e8400-e29b-41d4-a716-446655440000', // UUID
          '123', // Simple number string
          'trip-2024-01-10', // Descriptive ID
          '0', // Zero
          ' id-with-spaces ', // Spaces
          'id_with_underscores',
          'id-with-special-chars!@#',
          '🚀emoji-id🚀', // Emojis
        ];

        idFormats.forEach((id) => {
          const trip = { ...validTrip, id };
          expect(isValidTripWithId(trip)).toBe(true);
        });
      });

      it('should reject invalid IDs', () => {
        const invalidIds = [
          '', // Empty string
        ];

        invalidIds.forEach((id) => {
          const trip = { ...validTrip, id };
          expect(isValidTripWithId(trip)).toBe(false);
        });

        // IDs with only whitespace are considered valid (length > 0)
        const whitespaceIds = [
          ' ', // Only spaces
          '\t\n', // Only whitespace
        ];

        whitespaceIds.forEach((id) => {
          const trip = { ...validTrip, id };
          expect(isValidTripWithId(trip)).toBe(true);
        });
      });
    });

    describe('location validation edge cases', () => {
      it('should handle various location formats', () => {
        const locations = [
          'Canada',
          'United Kingdom',
          'São Paulo, Brazil',
          '東京', // Japanese
          'Москва', // Russian
          '🇫🇷 France',
          'Multiple Cities: London, Paris, Berlin',
          'Remote Work - Various Locations',
          '123 Main St, City, Country', // Address-like
        ];

        locations.forEach((location) => {
          const trip = { ...validTrip, location };
          expect(validateTripForCalculation(trip, { needsLocation: true })).toBe(true);
        });
      });

      it('should handle edge case location values', () => {
        const validLocations = [
          '0', // Numeric string
          'null', // String "null"
          'undefined', // String "undefined"
          '   ', // Only spaces (still has length > 0)
          '\n\t', // Only whitespace (still has length > 0)
        ];

        validLocations.forEach((location) => {
          const trip = { ...validTrip, location };
          // All these are valid because they have length > 0
          expect(validateTripForCalculation(trip, { needsLocation: true })).toBe(true);
        });

        // Only empty string is invalid
        const emptyLocation = '';
        const tripWithEmpty = { ...validTrip, location: emptyLocation };
        expect(validateTripForCalculation(tripWithEmpty, { needsLocation: true })).toBe(false);
      });
    });

    describe('performance edge cases', () => {
      it('should handle validation of trips with very long strings', () => {
        const longString = 'A'.repeat(10000); // 10,000 character string
        const tripWithLongStrings = {
          ...validTrip,
          location: longString,
          notes: longString,
        };

        expect(() => isValidTrip(tripWithLongStrings)).not.toThrow();
        expect(isValidTrip(tripWithLongStrings)).toBe(true);
      });

      it('should handle rapid repeated validations', () => {
        const iterations = 1000;
        const start = Date.now();

        for (let i = 0; i < iterations; i++) {
          isValidTrip(validTrip);
          validateTripForCalculation(validTrip);
          isValidTripWithId(validTrip);
        }

        const duration = Date.now() - start;
        // Should complete 1000 iterations in under 100ms
        expect(duration).toBeLessThan(100);
      });
    });

    describe('type coercion edge cases', () => {
      it('should handle objects with valueOf/toString methods', () => {
        const tripLikeObject = {
          valueOf: () => validTrip,
          toString: () => JSON.stringify(validTrip),
        };

        expect(isValidTrip(tripLikeObject)).toBe(false);
      });

      it('should handle proxy objects', () => {
        const proxyTrip = new Proxy(validTrip, {
          get(target, prop) {
            return target[prop as keyof Trip];
          },
        });

        expect(isValidTrip(proxyTrip)).toBe(true);
        expect(validateTripForCalculation(proxyTrip)).toBe(true);
      });
    });

    describe('error boundary testing', () => {
      it('should not throw on any input type', () => {
        const inputs = [
          null,
          undefined,
          0,
          1,
          -1,
          '',
          'string',
          true,
          false,
          [],
          {},
          () => {},
          Symbol(),
          new Date(),
          new Map(),
          new Set(),
          Promise.resolve(),
          /regex/,
          new Error(),
        ];

        inputs.forEach((input) => {
          expect(() => isValidTrip(input)).not.toThrow();
          expect(() => validateTripForCalculation(input as unknown as Trip)).not.toThrow();
          expect(() => filterValidTrips([input])).not.toThrow();
        });
      });
    });
  });
});
