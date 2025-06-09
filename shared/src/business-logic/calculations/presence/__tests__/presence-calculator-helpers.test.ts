// Internal dependencies - Schemas & Types
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateTripDaysAbroad,
  createResidenceWarning,
  validateAndParseDates,
} from '@business-logic/calculations/presence/helpers';

// Internal dependencies - Utilities
import { parseUTCDate } from '@utils/utc-date-helpers';
import { isValidTrip, isValidTripForResidenceCheck } from '@utils/validation';

describe('Presence Calculator Helpers', () => {
  describe('validateAndParseDates', () => {
    it('should validate correct dates', () => {
      const result = validateAndParseDates('2020-01-01', '2023-01-01');

      expect(result.isValid).toBe(true);
      expect(result.startDate).toEqual(parseUTCDate('2020-01-01'));
      expect(result.endDate).toEqual(parseUTCDate('2023-01-01'));
    });

    it('should reject empty dates', () => {
      expect(validateAndParseDates('', '2023-01-01').isValid).toBe(false);
      expect(validateAndParseDates('2020-01-01', '').isValid).toBe(false);
      expect(validateAndParseDates('', '').isValid).toBe(false);
    });

    it('should reject null/undefined dates', () => {
      // @ts-expect-error Testing invalid input
      expect(validateAndParseDates(null, '2023-01-01').isValid).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(validateAndParseDates('2020-01-01', undefined).isValid).toBe(false);
    });

    it('should reject invalid date formats', () => {
      expect(validateAndParseDates('invalid-date', '2023-01-01').isValid).toBe(false);
      expect(validateAndParseDates('2020-01-01', 'not-a-date').isValid).toBe(false);
      expect(validateAndParseDates('2020-13-01', '2023-01-01').isValid).toBe(false); // Invalid month
    });

    it('should reject end date before start date', () => {
      const result = validateAndParseDates('2023-01-01', '2020-01-01');
      expect(result.isValid).toBe(false);
    });

    it('should accept same start and end date', () => {
      const result = validateAndParseDates('2023-01-01', '2023-01-01');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isValidTrip', () => {
    const validTrip: Trip = {
      id: '1',
      userId: 'user1',
      departureDate: '2022-01-01',
      returnDate: '2022-01-10',
      location: 'Canada',
      isSimulated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should validate a correct trip', () => {
      expect(isValidTrip(validTrip)).toBe(true);
    });

    it('should reject simulated trips', () => {
      expect(isValidTrip({ ...validTrip, isSimulated: true })).toBe(false);
    });

    it('should reject trips with missing dates', () => {
      expect(isValidTrip({ ...validTrip, departureDate: '' })).toBe(false);
      expect(isValidTrip({ ...validTrip, returnDate: '' })).toBe(false);
      expect(isValidTrip({ ...validTrip, departureDate: null })).toBe(false);
      expect(isValidTrip({ ...validTrip, returnDate: undefined })).toBe(false);
    });

    it('should reject trips with invalid dates', () => {
      expect(isValidTrip({ ...validTrip, departureDate: 'invalid' })).toBe(false);
      expect(isValidTrip({ ...validTrip, returnDate: '2022-13-01' })).toBe(false);
    });

    it('should reject trips with return before departure', () => {
      expect(
        isValidTrip({
          ...validTrip,
          departureDate: '2022-01-10',
          returnDate: '2022-01-01',
        }),
      ).toBe(false);
    });

    it('should accept same-day trips', () => {
      expect(
        isValidTrip({
          ...validTrip,
          departureDate: '2022-01-01',
          returnDate: '2022-01-01',
        }),
      ).toBe(true);
    });

    it('should reject null/undefined trip', () => {
      expect(isValidTrip(null)).toBe(false);
      expect(isValidTrip(undefined)).toBe(false);
    });
  });

  describe('calculateTripDaysAbroad', () => {
    const trip: Trip = {
      id: '1',
      userId: 'user1',
      departureDate: '2022-06-10',
      returnDate: '2022-06-20',
      location: 'Mexico',
      isSimulated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should calculate days abroad for a normal trip', () => {
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-01-01');
      const endDate = parseUTCDate('2022-12-31');

      calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);

      // Should include June 11-19 (9 days), not departure/return days
      expect(daysAbroadSet.size).toBe(9);
      expect(daysAbroadSet.has('2022-06-10')).toBe(false); // Departure day
      expect(daysAbroadSet.has('2022-06-11')).toBe(true);
      expect(daysAbroadSet.has('2022-06-19')).toBe(true);
      expect(daysAbroadSet.has('2022-06-20')).toBe(false); // Return day
    });

    it('should handle trip starting before calculation period', () => {
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-06-15'); // Green card date during trip
      const endDate = parseUTCDate('2022-12-31');

      calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);

      // Should include June 15-19 (5 days)
      expect(daysAbroadSet.size).toBe(5);
      expect(daysAbroadSet.has('2022-06-15')).toBe(true); // Green card date counts as abroad
      expect(daysAbroadSet.has('2022-06-19')).toBe(true);
      expect(daysAbroadSet.has('2022-06-20')).toBe(false); // Return day
    });

    it('should handle trip extending beyond calculation period', () => {
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-01-01');
      const endDate = parseUTCDate('2022-06-15'); // End date during trip

      calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);

      // Should include June 11-15 (5 days)
      expect(daysAbroadSet.size).toBe(5);
      expect(daysAbroadSet.has('2022-06-10')).toBe(false); // Departure day
      expect(daysAbroadSet.has('2022-06-11')).toBe(true);
      expect(daysAbroadSet.has('2022-06-15')).toBe(true); // asOfDate included when trip extends beyond
    });

    it('should skip trips entirely before calculation period', () => {
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-07-01'); // After trip
      const endDate = parseUTCDate('2022-12-31');

      calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);

      expect(daysAbroadSet.size).toBe(0);
    });

    it('should skip trips entirely after calculation period', () => {
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-01-01');
      const endDate = parseUTCDate('2022-05-31'); // Before trip

      calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);

      expect(daysAbroadSet.size).toBe(0);
    });

    it('should handle same-day trips', () => {
      const sameDayTrip = { ...trip, returnDate: '2022-06-10' };
      const daysAbroadSet = new Set<string>();
      const startDate = parseUTCDate('2022-01-01');
      const endDate = parseUTCDate('2022-12-31');

      calculateTripDaysAbroad(sameDayTrip, startDate, endDate, daysAbroadSet);

      expect(daysAbroadSet.size).toBe(0); // No days abroad for same-day trips
    });
  });

  describe('createResidenceWarning', () => {
    it('should return null for trips under 150 days', () => {
      expect(createResidenceWarning('trip1', 149)).toBeNull();
      expect(createResidenceWarning('trip1', 100)).toBeNull();
      expect(createResidenceWarning('trip1', 0)).toBeNull();
    });

    it('should return medium warning for trips 150-179 days', () => {
      const warning150 = createResidenceWarning('trip1', 150);
      expect(warning150).not.toBeNull();
      expect(warning150?.severity).toBe('medium');
      expect(warning150?.message).toContain('approaching the 180-day limit');

      const warning179 = createResidenceWarning('trip1', 179);
      expect(warning179?.severity).toBe('medium');
    });

    it('should return high warning for trips 180+ days', () => {
      const warning180 = createResidenceWarning('trip1', 180);
      expect(warning180).not.toBeNull();
      expect(warning180?.severity).toBe('high');
      expect(warning180?.message).toContain('exceeds 180 days');

      const warning365 = createResidenceWarning('trip1', 365);
      expect(warning365?.severity).toBe('high');
    });

    it('should include trip ID and days in warning', () => {
      const warning = createResidenceWarning('trip123', 180);
      expect(warning?.tripId).toBe('trip123');
      expect(warning?.daysAbroad).toBe(180);
    });
  });

  describe('isValidTripForResidenceCheck', () => {
    const validTrip: Trip = {
      id: '1',
      userId: 'user1',
      departureDate: '2022-01-01',
      returnDate: '2022-01-10',
      location: 'Canada',
      isSimulated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should validate a correct trip with ID', () => {
      expect(isValidTripForResidenceCheck(validTrip)).toBe(true);
    });

    it('should reject trips without ID', () => {
      expect(isValidTripForResidenceCheck({ ...validTrip, id: '' })).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidTripForResidenceCheck({ ...validTrip, id: null })).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidTripForResidenceCheck({ ...validTrip, id: undefined })).toBe(false);
    });

    it('should reject simulated trips', () => {
      expect(isValidTripForResidenceCheck({ ...validTrip, isSimulated: true })).toBe(false);
    });

    // All other validation should work the same as isValidTrip
    it('should reject trips with invalid dates', () => {
      expect(isValidTripForResidenceCheck({ ...validTrip, departureDate: 'invalid' })).toBe(false);
      expect(isValidTripForResidenceCheck({ ...validTrip, returnDate: '' })).toBe(false);
    });
  });
});
