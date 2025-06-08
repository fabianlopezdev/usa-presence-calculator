/**
 * Tests for Selective Service Registration Checker
 *
 * Tests the determination of selective service registration requirements
 * for male LPRs aged 18-25
 */

// External dependencies
// None needed for tests

// Internal dependencies - Schemas & Types
// None needed for tests

// Internal dependencies - Business Logic
import {
  calculateSelectiveServiceStatus,
  isSelectiveServiceRequired,
  getAgeInYears,
  getRegistrationDeadline,
  getDaysUntilRegistrationRequired,
  getDaysUntilAgedOut,
} from '@business-logic/calculations/compliance/selective-service';

describe('Selective Service Registration Checker', () => {
  describe('calculateSelectiveServiceStatus', () => {
    it('should return not applicable for females', () => {
      const result = calculateSelectiveServiceStatus('2000-01-01', 'female', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.registrationRequired).toBe(false);
      expect(result.currentStatus).toBe('not_applicable');
      expect(result.registrationDeadline).toBeNull();
    });

    it('should return not applicable for males under 18', () => {
      const birthDate = '2010-01-01'; // 14 years old in 2024
      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.registrationRequired).toBe(false);
      expect(result.currentStatus).toBe('not_applicable');
      expect(result.registrationDeadline).toBe('2028-01-01'); // 18th birthday
    });

    it('should return must register for unregistered males 18-25', () => {
      const birthDate = '2004-01-01'; // 20 years old in 2024
      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, '2024-01-01');

      expect(result.applies).toBe(true);
      expect(result.registrationRequired).toBe(true);
      expect(result.isRegistered).toBe(false);
      expect(result.currentStatus).toBe('must_register');
      expect(result.registrationDeadline).toBe('2022-01-01'); // Should have registered at 18
    });

    it('should return registered for registered males', () => {
      const birthDate = '2004-01-01';
      const result = calculateSelectiveServiceStatus(
        birthDate,
        'male',
        true, // Already registered
        '2024-01-01',
      );

      expect(result.applies).toBe(true);
      expect(result.registrationRequired).toBe(false);
      expect(result.isRegistered).toBe(true);
      expect(result.currentStatus).toBe('registered');
    });

    it('should return aged out for males over 26', () => {
      const birthDate = '1997-01-01'; // 27 years old in 2024
      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.registrationRequired).toBe(false);
      expect(result.currentStatus).toBe('aged_out');
      expect(result.registrationDeadline).toBeNull();
    });

    it('should handle exactly 18 years old', () => {
      const birthDate = '2006-01-01';
      const currentDate = '2024-01-01'; // Exactly 18th birthday

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

      expect(result.applies).toBe(true);
      expect(result.registrationRequired).toBe(true);
      expect(result.currentStatus).toBe('must_register');
    });

    it('should handle exactly 26 years old', () => {
      const birthDate = '1998-01-01';
      const currentDate = '2024-01-01'; // Exactly 26th birthday

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

      expect(result.applies).toBe(false);
      expect(result.registrationRequired).toBe(false);
      expect(result.currentStatus).toBe('aged_out');
    });

    it('should use current date when not provided', () => {
      const result = calculateSelectiveServiceStatus('2000-01-01', 'male', false);

      expect(result).toBeDefined();
      expect(result.applies).toBeDefined();
    });
  });

  describe('isSelectiveServiceRequired', () => {
    it('should return false for females', () => {
      expect(isSelectiveServiceRequired('2000-01-01', 'female', '2024-01-01')).toBe(false);
    });

    it('should return false for males under 18', () => {
      expect(isSelectiveServiceRequired('2010-01-01', 'male', '2024-01-01')).toBe(false);
    });

    it('should return true for males 18-25', () => {
      expect(isSelectiveServiceRequired('2000-01-01', 'male', '2024-01-01')).toBe(true);
    });

    it('should return false for males over 26', () => {
      expect(isSelectiveServiceRequired('1990-01-01', 'male', '2024-01-01')).toBe(false);
    });

    it('should handle non-binary gender as not required', () => {
      expect(isSelectiveServiceRequired('2000-01-01', 'other', '2024-01-01')).toBe(false);
    });
  });

  describe('getAgeInYears', () => {
    it('should calculate age correctly', () => {
      expect(getAgeInYears('2000-01-01', '2024-01-01')).toBe(24);
    });

    it('should handle birthdays that have not occurred this year', () => {
      expect(getAgeInYears('2000-12-31', '2024-01-01')).toBe(23);
    });

    it('should handle same day', () => {
      expect(getAgeInYears('2000-01-01', '2000-01-01')).toBe(0);
    });

    it('should handle leap year birthdays', () => {
      expect(getAgeInYears('2000-02-29', '2024-02-28')).toBe(23);
      expect(getAgeInYears('2000-02-29', '2024-02-29')).toBe(24);
    });
  });

  describe('getRegistrationDeadline', () => {
    it('should return 18th birthday for males', () => {
      const deadline = getRegistrationDeadline('2006-01-15', 'male');
      expect(deadline).toBe('2024-01-15');
    });

    it('should return null for females', () => {
      const deadline = getRegistrationDeadline('2006-01-15', 'female');
      expect(deadline).toBeNull();
    });

    it('should handle leap year birthdays', () => {
      const deadline = getRegistrationDeadline('2004-02-29', 'male');
      expect(deadline).toBe('2022-02-28'); // Non-leap year
    });
  });

  describe('getDaysUntilRegistrationRequired', () => {
    it('should calculate days until 18th birthday', () => {
      const days = getDaysUntilRegistrationRequired('2010-01-01', 'male', '2024-01-01');
      expect(days).toBe(1461); // 4 years including leap year
    });

    it('should return 0 if already 18 or older', () => {
      const days = getDaysUntilRegistrationRequired('2000-01-01', 'male', '2024-01-01');
      expect(days).toBe(0);
    });

    it('should return 0 for females', () => {
      const days = getDaysUntilRegistrationRequired('2010-01-01', 'female', '2024-01-01');
      expect(days).toBe(0);
    });

    it('should handle exact 18th birthday', () => {
      const days = getDaysUntilRegistrationRequired('2006-01-01', 'male', '2024-01-01');
      expect(days).toBe(0);
    });
  });

  describe('getDaysUntilAgedOut', () => {
    it('should calculate days until 26th birthday', () => {
      const days = getDaysUntilAgedOut('2000-01-01', '2024-01-01');
      expect(days).toBe(731); // 2 years including leap year
    });

    it('should return 0 if already 26 or older', () => {
      const days = getDaysUntilAgedOut('1990-01-01', '2024-01-01');
      expect(days).toBe(0);
    });

    it('should handle exact 26th birthday', () => {
      const days = getDaysUntilAgedOut('1998-01-01', '2024-01-01');
      expect(days).toBe(0);
    });

    it('should work for any gender', () => {
      const days = getDaysUntilAgedOut('2000-01-01', '2024-01-01');
      expect(days).toBe(731);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid birth dates gracefully', () => {
      expect(() => {
        calculateSelectiveServiceStatus('invalid-date', 'male', false, '2024-01-01');
      }).toThrow();
    });

    it('should handle future birth dates', () => {
      const result = calculateSelectiveServiceStatus('2025-01-01', 'male', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.currentStatus).toBe('not_applicable');
    });

    it('should handle very old birth dates', () => {
      const result = calculateSelectiveServiceStatus('1920-01-01', 'male', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.currentStatus).toBe('aged_out');
    });

    it('should handle registration status change', () => {
      const birthDate = '2004-01-01';

      // Before registration
      const before = calculateSelectiveServiceStatus(birthDate, 'male', false, '2024-01-01');
      expect(before.currentStatus).toBe('must_register');

      // After registration
      const after = calculateSelectiveServiceStatus(birthDate, 'male', true, '2024-01-01');
      expect(after.currentStatus).toBe('registered');
    });
  });

  describe('Age Boundary Edge Cases', () => {
    describe('Leap Day Birthday Scenarios', () => {
      it('should handle Feb 29 birthdate turning 18 on non-leap year', () => {
        const birthDate = '2004-02-29'; // Leap year birth
        const currentDate = '2022-02-28'; // 18th birthday on non-leap year

        const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

        // On Feb 28 of non-leap year, they're not quite 18 yet per date-fns logic
        expect(result.applies).toBe(false);
        expect(result.registrationRequired).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
        expect(result.registrationDeadline).toBe('2022-02-28');
      });

      it('should handle Feb 29 birthdate turning 26 on non-leap year', () => {
        const birthDate = '1996-02-29';
        const currentDate = '2022-03-01'; // Day after 26th birthday

        const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

        expect(result.applies).toBe(false);
        expect(result.currentStatus).toBe('aged_out');
      });

      it('should calculate age correctly for Feb 29 births on March 1', () => {
        const birthDate = '2004-02-29';
        const currentDate = '2022-03-01'; // Day after "birthday" in non-leap year

        const age = getAgeInYears(birthDate, currentDate);
        expect(age).toBe(18);
      });
    });

    describe('Time-Sensitive Age Calculations', () => {
      it('should handle checking one day before 18th birthday', () => {
        const birthDate = '2006-01-15';
        const currentDate = '2024-01-14'; // One day before 18

        const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

        expect(result.applies).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
        expect(result.registrationDeadline).toBe('2024-01-15');
      });

      it('should handle checking one day before 26th birthday', () => {
        const birthDate = '1998-01-15';
        const currentDate = '2024-01-14'; // One day before aging out

        const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

        expect(result.applies).toBe(true);
        expect(result.registrationRequired).toBe(true);
        expect(result.currentStatus).toBe('must_register');
      });

      it('should handle year-end birthday transitions', () => {
        const birthDate = '2005-12-31';
        const currentDate = '2024-01-01'; // Day after 18th birthday

        const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

        expect(result.applies).toBe(true);
        expect(result.registrationRequired).toBe(true);
        expect(getAgeInYears(birthDate, currentDate)).toBe(18);
      });
    });
  });

  describe('Gender Edge Cases', () => {
    describe('Non-Binary and Other Gender Identities', () => {
      it('should handle other gender identity', () => {
        const result = calculateSelectiveServiceStatus('2004-01-01', 'other', false, '2024-01-01');

        expect(result.applies).toBe(false);
        expect(result.registrationRequired).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
      });

      it('should handle uppercase gender values', () => {
        const result = calculateSelectiveServiceStatus(
          '2004-01-01',
          'MALE' as 'male' | 'female' | 'other',
          false,
          '2024-01-01',
        );

        // Implementation expects lowercase, so uppercase won't match
        expect(result.applies).toBe(false);
        expect(result.registrationRequired).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
      });

      it('should handle mixed case gender values', () => {
        const result = calculateSelectiveServiceStatus(
          '2004-01-01',
          'Male' as 'male' | 'female' | 'other',
          false,
          '2024-01-01',
        );

        // Implementation expects lowercase, so mixed case won't match
        expect(result.applies).toBe(false);
        expect(result.registrationRequired).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
      });
    });

    describe('Gender-Related Edge Cases', () => {
      it('should apply consistent rules regardless of registration status for non-males', () => {
        const femaleUnregistered = calculateSelectiveServiceStatus(
          '2004-01-01',
          'female',
          false,
          '2024-01-01',
        );
        const femaleRegistered = calculateSelectiveServiceStatus(
          '2004-01-01',
          'female',
          true,
          '2024-01-01',
        );

        expect(femaleUnregistered.applies).toBe(false);
        expect(femaleRegistered.applies).toBe(false);
        expect(femaleUnregistered.currentStatus).toBe('not_applicable');
        expect(femaleRegistered.currentStatus).toBe('not_applicable');
      });
    });
  });

  describe('Registration Status Anomalies', () => {
    describe('Pre-Registration Scenarios', () => {
      it('should handle registered status for someone under 18', () => {
        const birthDate = '2010-01-01'; // 14 years old
        const result = calculateSelectiveServiceStatus(birthDate, 'male', true, '2024-01-01');

        // Even if registered, they're not of age
        expect(result.applies).toBe(false);
        expect(result.currentStatus).toBe('not_applicable');
        expect(result.isRegistered).toBe(true);
      });

      it('should handle registered status for someone over 26', () => {
        const birthDate = '1990-01-01'; // Over 26
        const result = calculateSelectiveServiceStatus(birthDate, 'male', true, '2024-01-01');

        expect(result.applies).toBe(false);
        expect(result.currentStatus).toBe('aged_out');
        expect(result.isRegistered).toBe(true);
      });
    });

    describe('Edge Registration Timing', () => {
      it('should handle registration on exact 18th birthday', () => {
        const birthDate = '2006-01-01';
        const currentDate = '2024-01-01'; // 18th birthday

        const unregistered = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);
        const registered = calculateSelectiveServiceStatus(birthDate, 'male', true, currentDate);

        expect(unregistered.currentStatus).toBe('must_register');
        expect(registered.currentStatus).toBe('registered');
        expect(registered.registrationDeadline).toBe('2024-01-01');
      });

      it('should handle registration check on 26th birthday', () => {
        const birthDate = '1998-01-01';
        const currentDate = '2024-01-01'; // 26th birthday

        const unregistered = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);
        const registered = calculateSelectiveServiceStatus(birthDate, 'male', true, currentDate);

        // On exact 26th birthday, already aged out
        expect(unregistered.currentStatus).toBe('aged_out');
        expect(registered.currentStatus).toBe('aged_out');
      });
    });
  });

  describe('Date Calculation Extreme Cases', () => {
    it('should handle someone born on January 1, 2000 (Y2K)', () => {
      const result = calculateSelectiveServiceStatus('2000-01-01', 'male', false, '2024-01-01');

      expect(getAgeInYears('2000-01-01', '2024-01-01')).toBe(24);
      expect(result.applies).toBe(true);
      expect(result.registrationRequired).toBe(true);
    });

    it('should handle century leap year calculations', () => {
      // 2000 was a leap year (divisible by 400)
      const birthDate = '2000-02-29';
      const currentDate = '2018-02-28'; // 18th birthday

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);

      expect(getAgeInYears(birthDate, currentDate)).toBe(17); // Not 18 yet
      expect(result.applies).toBe(false);
    });

    it('should handle registration deadline exactly 30 days after 18th birthday', () => {
      const birthDate = '2006-01-01';
      const thirtyDaysAfter18 = '2024-01-31';

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, thirtyDaysAfter18);

      expect(result.registrationRequired).toBe(true);
      expect(result.currentStatus).toBe('must_register');
    });

    it('should handle extreme past dates', () => {
      const result = calculateSelectiveServiceStatus('1900-01-01', 'male', false, '2024-01-01');

      expect(result.applies).toBe(false);
      expect(result.currentStatus).toBe('aged_out');
      expect(getAgeInYears('1900-01-01', '2024-01-01')).toBe(124);
    });

    it('should handle days until registration for someone turning 18 in a leap year', () => {
      const birthDate = '2008-02-29'; // Will turn 18 in 2026 (non-leap)
      const currentDate = '2024-01-01';

      const days = getDaysUntilRegistrationRequired(birthDate, 'male', currentDate);
      const deadline = getRegistrationDeadline(birthDate, 'male');

      expect(deadline).toBe('2026-02-28'); // Adjusted to Feb 28
      expect(days).toBeGreaterThan(0);
    });

    it('should handle days until aged out for Feb 29 birthdate', () => {
      const birthDate = '2000-02-29';
      const currentDate = '2024-01-01';

      const days = getDaysUntilAgedOut(birthDate, currentDate);

      // 26th birthday on non-leap year would be Feb 28, 2026
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThan(800); // Less than ~2.2 years
    });
  });

  describe('Function Boundary Testing', () => {
    it('should handle exactly 17 years 364 days old', () => {
      const birthDate = '2006-01-02';
      const currentDate = '2024-01-01'; // One day before 18

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);
      const days = getDaysUntilRegistrationRequired(birthDate, 'male', currentDate);

      expect(result.applies).toBe(false);
      expect(days).toBe(1);
    });

    it('should handle exactly 25 years 364 days old', () => {
      const birthDate = '1998-01-02';
      const currentDate = '2024-01-01'; // One day before 26

      const result = calculateSelectiveServiceStatus(birthDate, 'male', false, currentDate);
      const days = getDaysUntilAgedOut(birthDate, currentDate);

      expect(result.applies).toBe(true);
      expect(days).toBe(1);
    });

    it('should handle registration status transition at midnight', () => {
      const birthDate = '2006-01-01';
      const beforeMidnight = '2023-12-31'; // 17 years old
      const afterMidnight = '2024-01-01'; // 18 years old

      const before = calculateSelectiveServiceStatus(birthDate, 'male', false, beforeMidnight);
      const after = calculateSelectiveServiceStatus(birthDate, 'male', false, afterMidnight);

      expect(before.currentStatus).toBe('not_applicable');
      expect(after.currentStatus).toBe('must_register');
    });
  });
});
