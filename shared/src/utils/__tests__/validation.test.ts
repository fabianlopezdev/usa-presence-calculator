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
});
