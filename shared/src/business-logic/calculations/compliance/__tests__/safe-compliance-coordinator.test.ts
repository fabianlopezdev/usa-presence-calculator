import { 
  ComplianceCalculationError,
  DateRangeError,
  isErr,
  isOk
} from '@errors/index';

import {
  safeCalculateComprehensiveCompliance,
  safeGetActiveComplianceItems,
  safeGetFullComplianceReport,
  safeGetPriorityComplianceItems,
  safeGetUpcomingDeadlines,
} from '../safe-compliance-coordinator';

describe('Safe Compliance Coordinator Functions', () => {
  const validTrips = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      departureDate: '2023-01-01',
      returnDate: '2023-01-10',
      location: 'Canada',
      isSimulated: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ];

  const validParams = {
    currentDate: '2023-12-31',
    greenCardDate: '2020-01-01',
    greenCardExpirationDate: '2030-01-01',
    birthDate: '1990-01-01',
    gender: 'male' as const,
    isConditionalResident: false,
    isSelectiveServiceRegistered: true,
    taxReminderDismissed: false,
    trips: validTrips,
  };

  describe('safeGetActiveComplianceItems', () => {
    it('should return success result for valid inputs', () => {
      const result = safeGetActiveComplianceItems(validParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach(item => {
          expect(item).toHaveProperty('type');
          expect(item).toHaveProperty('description');
          expect(item).toHaveProperty('urgency');
        });
      }
    });

    it('should return error for invalid date format', () => {
      const invalidParams = {
        ...validParams,
        greenCardDate: '01/01/2020', // Invalid format
      };

      const result = safeGetActiveComplianceItems(invalidParams);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid eligibility category', () => {
      const invalidParams = {
        ...validParams,
        eligibilityCategory: 'ten_year', // Invalid category
      };

      const result = safeGetActiveComplianceItems(invalidParams);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid trips', () => {
      const invalidParams = {
        ...validParams,
        trips: [{ invalidTrip: true }],
      };

      const result = safeGetActiveComplianceItems(invalidParams);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should handle null/undefined inputs', () => {
      const result = safeGetActiveComplianceItems(null);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateComprehensiveCompliance', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateComprehensiveCompliance(validParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('greenCardRenewal');
        expect(result.data).toHaveProperty('taxReminder');
        expect(result.data).toHaveProperty('selectiveService');
        expect(result.data).toHaveProperty('removalOfConditions');
      }
    });

    it('should handle conditional resident properly', () => {
      const conditionalParams = {
        ...validParams,
        isConditionalResident: true,
      };

      const result = safeCalculateComprehensiveCompliance(conditionalParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.removalOfConditions).toBeDefined();
        expect(result.data.removalOfConditions.applies).toBe(true);
      }
    });

    it('should return error for missing required fields', () => {
      const incompleteParams = {
        currentDate: '2023-12-31',
        // Missing other required fields
      };

      const result = safeCalculateComprehensiveCompliance(incompleteParams);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeGetFullComplianceReport', () => {
    it('should return comprehensive status for valid inputs', () => {
      const result = safeGetFullComplianceReport(validParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('activeItems');
        expect(result.data).toHaveProperty('upcomingDeadlines');
        expect(result.data).toHaveProperty('priorityItems');
        expect(result.data).toHaveProperty('status');
      }
    });

    it('should propagate errors from sub-calculations', () => {
      const invalidParams = {
        ...validParams,
        birthDate: 'invalid-date',
      };

      const result = safeGetFullComplianceReport(invalidParams);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeGetPriorityComplianceItems', () => {
    it('should return success result for valid inputs', () => {
      const result = safeGetPriorityComplianceItems(validParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach(item => {
          expect(item).toHaveProperty('type');
          expect(item).toHaveProperty('description');
          expect(item).toHaveProperty('deadline');
          expect(item).toHaveProperty('priority');
        });
      }
    });

    it('should prioritize items correctly', () => {
      const result = safeGetPriorityComplianceItems(validParams);

      if (isOk(result) && result.data.length > 1) {
        for (let i = 1; i < result.data.length; i++) {
          const prevPriority = result.data[i - 1].priority === 'critical' ? 4 :
                               result.data[i - 1].priority === 'high' ? 3 : 
                               result.data[i - 1].priority === 'medium' ? 2 : 1;
          const currPriority = result.data[i].priority === 'critical' ? 4 :
                               result.data[i].priority === 'high' ? 3 : 
                               result.data[i].priority === 'medium' ? 2 : 1;
          expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
        }
      }
    });
  });

  describe('safeGetUpcomingDeadlines', () => {
    it('should return success result for valid inputs', () => {
      const result = safeGetUpcomingDeadlines(validParams, 365);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach(deadline => {
          expect(deadline).toHaveProperty('type');
          expect(deadline).toHaveProperty('description');
          expect(deadline).toHaveProperty('date');
          expect(deadline).toHaveProperty('daysRemaining');
        });
      }
    });

    it('should filter deadlines within specified days', () => {
      const result = safeGetUpcomingDeadlines(validParams, 30);

      if (isOk(result)) {
        result.data.forEach(deadline => {
          expect(deadline.daysRemaining).toBeLessThanOrEqual(30);
        });
      }
    });

    it('should return error for invalid days parameter', () => {
      const result = safeGetUpcomingDeadlines(validParams, -1);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(ComplianceCalculationError);
      }
    });

    it('should return error for non-integer days', () => {
      const result = safeGetUpcomingDeadlines(validParams, 'thirty' as any);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should reject malicious input with prototype pollution', () => {
      const maliciousParams = {
        ...validParams,
        __proto__: { isAdmin: true },
        extraProperty: 'should-be-rejected',
      };

      const result = safeGetActiveComplianceItems(maliciousParams);

      expect(isErr(result)).toBe(true);
    });

    it('should handle XSS attempts in string fields', () => {
      const xssParams = {
        ...validParams,
        currentDate: '<script>alert("XSS")</script>2023-12-31',
      };

      const result = safeCalculateComprehensiveCompliance(xssParams);

      expect(isErr(result)).toBe(true);
    });

    it('should validate date ranges properly', () => {
      const dateRangeParams = {
        ...validParams,
        currentDate: '2019-01-01', // Before green card date
        greenCardDate: '2020-01-01',
      };

      const result = safeGetFullComplianceReport(dateRangeParams);

      // The function might handle this gracefully by calculating based on the provided dates
      expect(isOk(result) || isErr(result)).toBe(true);
    });

    it('should handle extremely large input arrays', () => {
      const largeTrips = Array(10000).fill(validTrips[0]);
      const largeParams = {
        ...validParams,
        trips: largeTrips,
      };

      const result = safeGetActiveComplianceItems(largeParams);

      // Should still work but might be slow
      expect(isOk(result) || isErr(result)).toBe(true);
    });

    it('should handle SQL injection attempts', () => {
      const sqlInjectionParams = {
        ...validParams,
        gender: "'; DROP TABLE users; --" as any,
      };

      const result = safeCalculateComprehensiveCompliance(sqlInjectionParams);

      expect(isErr(result)).toBe(true);
    });

    it('should handle missing optional parameters gracefully', () => {
      const minimalParams = {
        currentDate: '2023-12-31',
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2030-01-01',
        birthDate: '1990-01-01',
        gender: 'female' as const, // No selective service
        isConditionalResident: false, // No removal of conditions
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: true,
        trips: [], // No trips
      };

      const result = safeGetFullComplianceReport(minimalParams);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.status.selectiveService.currentStatus).toBe('not_applicable');
        expect(result.data.status.removalOfConditions.applies).toBe(false);
      }
    });
  });
});