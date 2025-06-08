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
});
