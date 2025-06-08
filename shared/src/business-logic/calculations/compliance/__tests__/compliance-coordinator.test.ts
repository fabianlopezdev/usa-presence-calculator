/**
 * Tests for LPR Compliance Coordinator
 *
 * Tests the aggregation of all compliance statuses into a comprehensive
 * compliance report for LPRs
 */

// External dependencies
// None needed for tests

// Internal dependencies - Schemas & Types
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateComprehensiveCompliance,
  getActiveComplianceItems,
  getPriorityComplianceItems,
  getUpcomingDeadlines,
} from '@business-logic/calculations/compliance/compliance-coordinator';

describe('LPR Compliance Coordinator', () => {
  describe('calculateComprehensiveCompliance', () => {
    const baseParams = {
      isConditionalResident: false,
      greenCardDate: '2020-01-01',
      greenCardExpirationDate: '2030-01-01',
      birthDate: '2000-01-01',
      gender: 'female' as const,
      isSelectiveServiceRegistered: false,
      taxReminderDismissed: false,
      trips: [] as Trip[],
      currentDate: '2024-01-01',
    };

    it('should calculate all compliance statuses for non-conditional resident', () => {
      const result = calculateComprehensiveCompliance(baseParams);

      expect(result.removalOfConditions.applies).toBe(false);
      expect(result.greenCardRenewal.currentStatus).toBe('valid');
      expect(result.selectiveService.applies).toBe(false);
      expect(result.taxReminder.nextDeadline).toBe('2024-04-15');
    });

    it('should calculate for conditional resident', () => {
      const params = {
        ...baseParams,
        isConditionalResident: true,
        greenCardDate: '2023-01-01', // 1 year ago
      };

      const result = calculateComprehensiveCompliance(params);

      expect(result.removalOfConditions.applies).toBe(true);
      expect(result.removalOfConditions.currentStatus).toBe('not_yet');
      expect(result.removalOfConditions.filingWindowStart).toBe('2024-10-03');
    });

    it('should calculate for male requiring selective service', () => {
      const params = {
        ...baseParams,
        birthDate: '2004-01-01', // 20 years old
        gender: 'male' as const,
      };

      const result = calculateComprehensiveCompliance(params);

      expect(result.selectiveService.applies).toBe(true);
      expect(result.selectiveService.currentStatus).toBe('must_register');
      expect(result.selectiveService.registrationRequired).toBe(true);
    });

    it('should detect travel during tax season', () => {
      const params = {
        ...baseParams,
        trips: [
          {
            id: '1',
            userId: 'user1',
            departureDate: '2024-03-15',
            returnDate: '2024-04-20',
            location: 'Mexico',
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      const result = calculateComprehensiveCompliance(params);

      expect(result.taxReminder.isAbroadDuringTaxSeason).toBe(true);
    });

    it('should handle green card approaching renewal', () => {
      const params = {
        ...baseParams,
        greenCardExpirationDate: '2024-06-01', // 5 months away
      };

      const result = calculateComprehensiveCompliance(params);

      expect(result.greenCardRenewal.currentStatus).toBe('renewal_recommended');
      expect(result.greenCardRenewal.isInRenewalWindow).toBe(true);
    });

    it('should use current date when not provided', () => {
      const params = {
        ...baseParams,
        currentDate: undefined,
      };

      const result = calculateComprehensiveCompliance(params);

      expect(result).toBeDefined();
      expect(result.removalOfConditions).toBeDefined();
      expect(result.greenCardRenewal).toBeDefined();
      expect(result.selectiveService).toBeDefined();
      expect(result.taxReminder).toBeDefined();
    });
  });

  describe('getActiveComplianceItems', () => {
    const baseCompliance = {
      removalOfConditions: {
        applies: false,
        greenCardDate: '2020-01-01',
        filingWindowStart: '2021-10-03',
        filingWindowEnd: '2022-01-01',
        currentStatus: 'not_yet' as const,
        daysUntilWindow: null,
        daysUntilDeadline: null,
      },
      greenCardRenewal: {
        expirationDate: '2030-01-01',
        renewalWindowStart: '2029-07-01',
        currentStatus: 'valid' as const,
        monthsUntilExpiration: 72,
        isInRenewalWindow: false,
      },
      selectiveService: {
        applies: false,
        registrationRequired: false,
        registrationDeadline: null,
        isRegistered: false,
        currentStatus: 'not_applicable' as const,
      },
      taxReminder: {
        nextDeadline: '2024-04-15',
        daysUntilDeadline: 104,
        isAbroadDuringTaxSeason: false,
        reminderDismissed: false,
        applicableDeadline: 'standard' as const,
        actualDeadline: '2024-04-15',
      },
    };

    it('should return active items requiring action', () => {
      const compliance = {
        ...baseCompliance,
        removalOfConditions: {
          ...baseCompliance.removalOfConditions,
          applies: true,
          currentStatus: 'in_window' as const,
        },
        selectiveService: {
          ...baseCompliance.selectiveService,
          applies: true,
          registrationRequired: true,
          currentStatus: 'must_register' as const,
        },
      };

      const activeItems = getActiveComplianceItems(compliance);

      expect(activeItems).toHaveLength(2);
      expect(activeItems[0].type).toBe('removal_of_conditions');
      expect(activeItems[1].type).toBe('selective_service');
    });

    it('should include green card renewal when in window', () => {
      const compliance = {
        ...baseCompliance,
        greenCardRenewal: {
          ...baseCompliance.greenCardRenewal,
          currentStatus: 'renewal_recommended' as const,
          isInRenewalWindow: true,
        },
      };

      const activeItems = getActiveComplianceItems(compliance);

      expect(activeItems).toHaveLength(1);
      expect(activeItems[0].type).toBe('green_card_renewal');
    });

    it('should include tax reminder during tax season', () => {
      const compliance = {
        ...baseCompliance,
        taxReminder: {
          ...baseCompliance.taxReminder,
          daysUntilDeadline: 30,
          reminderDismissed: false,
        },
      };

      const activeItems = getActiveComplianceItems(compliance);

      expect(activeItems).toHaveLength(1);
      expect(activeItems[0].type).toBe('tax_filing');
    });

    it('should return empty array when no active items', () => {
      const activeItems = getActiveComplianceItems(baseCompliance);
      expect(activeItems).toHaveLength(0);
    });

    it('should not include dismissed tax reminders', () => {
      const compliance = {
        ...baseCompliance,
        taxReminder: {
          ...baseCompliance.taxReminder,
          daysUntilDeadline: 30,
          reminderDismissed: true,
        },
      };

      const activeItems = getActiveComplianceItems(compliance);
      expect(activeItems).toHaveLength(0);
    });
  });

  describe('getPriorityComplianceItems', () => {
    const baseCompliance = {
      removalOfConditions: {
        applies: true,
        greenCardDate: '2022-01-01',
        filingWindowStart: '2023-10-03',
        filingWindowEnd: '2024-01-01',
        currentStatus: 'overdue' as const,
        daysUntilWindow: null,
        daysUntilDeadline: -5,
      },
      greenCardRenewal: {
        expirationDate: '2024-02-01',
        renewalWindowStart: '2023-08-01',
        currentStatus: 'renewal_urgent' as const,
        monthsUntilExpiration: 1,
        isInRenewalWindow: true,
      },
      selectiveService: {
        applies: true,
        registrationRequired: true,
        registrationDeadline: '2024-01-15',
        isRegistered: false,
        currentStatus: 'must_register' as const,
      },
      taxReminder: {
        nextDeadline: '2024-04-15',
        daysUntilDeadline: 10,
        isAbroadDuringTaxSeason: true,
        reminderDismissed: false,
        applicableDeadline: 'abroad_extension' as const,
        actualDeadline: '2024-06-17',
      },
    };

    it('should prioritize overdue items first', () => {
      const priorityItems = getPriorityComplianceItems(baseCompliance);

      expect(priorityItems[0].type).toBe('removal_of_conditions');
      expect(priorityItems[0].priority).toBe('critical');
    });

    it('should prioritize urgent renewals', () => {
      const compliance = {
        ...baseCompliance,
        removalOfConditions: {
          ...baseCompliance.removalOfConditions,
          currentStatus: 'not_yet' as const,
          applies: false,
        },
        selectiveService: {
          ...baseCompliance.selectiveService,
          applies: false,
          registrationRequired: false,
        },
      };

      const priorityItems = getPriorityComplianceItems(compliance);

      expect(priorityItems[0].type).toBe('green_card_renewal');
      expect(priorityItems[0].priority).toBe('high');
    });

    it('should include tax filing when deadline is near and abroad', () => {
      const priorityItems = getPriorityComplianceItems(baseCompliance);

      const taxItem = priorityItems.find((item) => item.type === 'tax_filing');
      expect(taxItem).toBeDefined();
      expect(taxItem?.priority).toBe('high');
    });

    it('should return empty array when no priority items', () => {
      const compliance = {
        removalOfConditions: {
          applies: false,
          greenCardDate: '2020-01-01',
          filingWindowStart: '2021-10-03',
          filingWindowEnd: '2022-01-01',
          currentStatus: 'not_yet' as const,
          daysUntilWindow: null,
          daysUntilDeadline: null,
        },
        greenCardRenewal: {
          expirationDate: '2030-01-01',
          renewalWindowStart: '2029-07-01',
          currentStatus: 'valid' as const,
          monthsUntilExpiration: 72,
          isInRenewalWindow: false,
        },
        selectiveService: {
          applies: false,
          registrationRequired: false,
          registrationDeadline: null,
          isRegistered: false,
          currentStatus: 'not_applicable' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 300,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: false,
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const priorityItems = getPriorityComplianceItems(compliance);
      expect(priorityItems).toHaveLength(0);
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return all upcoming deadlines sorted by date', () => {
      const compliance = {
        removalOfConditions: {
          applies: true,
          greenCardDate: '2022-01-01',
          filingWindowStart: '2023-10-03',
          filingWindowEnd: '2024-06-01',
          currentStatus: 'in_window' as const,
          daysUntilWindow: null,
          daysUntilDeadline: 151,
        },
        greenCardRenewal: {
          expirationDate: '2024-12-01',
          renewalWindowStart: '2024-06-01',
          currentStatus: 'valid' as const,
          monthsUntilExpiration: 11,
          isInRenewalWindow: false,
        },
        selectiveService: {
          applies: true,
          registrationRequired: true,
          registrationDeadline: '2024-03-01',
          isRegistered: false,
          currentStatus: 'must_register' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 104,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: false,
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const deadlines = getUpcomingDeadlines(compliance, '2024-01-01');

      expect(deadlines).toHaveLength(4);
      expect(deadlines[0].type).toBe('selective_service');
      expect(deadlines[0].date).toBe('2024-03-01');
      expect(deadlines[1].type).toBe('tax_filing');
      expect(deadlines[1].date).toBe('2024-04-15');
      expect(deadlines[2].type).toBe('removal_of_conditions');
      expect(deadlines[3].type).toBe('green_card_renewal');
    });

    it('should exclude past deadlines', () => {
      const compliance = {
        removalOfConditions: {
          applies: true,
          greenCardDate: '2020-01-01',
          filingWindowStart: '2021-10-03',
          filingWindowEnd: '2022-01-01',
          currentStatus: 'overdue' as const,
          daysUntilWindow: null,
          daysUntilDeadline: -730,
        },
        greenCardRenewal: {
          expirationDate: '2030-01-01',
          renewalWindowStart: '2029-07-01',
          currentStatus: 'valid' as const,
          monthsUntilExpiration: 72,
          isInRenewalWindow: false,
        },
        selectiveService: {
          applies: false,
          registrationRequired: false,
          registrationDeadline: null,
          isRegistered: false,
          currentStatus: 'not_applicable' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 104,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: false,
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const deadlines = getUpcomingDeadlines(compliance, '2024-01-01');

      expect(deadlines).toHaveLength(2); // Only tax and green card renewal
      expect(deadlines[0].type).toBe('tax_filing');
      expect(deadlines[1].type).toBe('green_card_renewal');
    });

    it('should handle no upcoming deadlines', () => {
      const compliance = {
        removalOfConditions: {
          applies: false,
          greenCardDate: '2020-01-01',
          filingWindowStart: '2021-10-03',
          filingWindowEnd: '2022-01-01',
          currentStatus: 'not_yet' as const,
          daysUntilWindow: null,
          daysUntilDeadline: null,
        },
        greenCardRenewal: {
          expirationDate: '2020-01-01',
          renewalWindowStart: '2019-07-01',
          currentStatus: 'expired' as const,
          monthsUntilExpiration: -48,
          isInRenewalWindow: false,
        },
        selectiveService: {
          applies: false,
          registrationRequired: false,
          registrationDeadline: null,
          isRegistered: false,
          currentStatus: 'not_applicable' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 104,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: true, // Dismissed
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const deadlines = getUpcomingDeadlines(compliance, '2024-01-01');
      expect(deadlines).toHaveLength(0);
    });
  });

  describe('Multiple Simultaneous Deadlines Edge Cases', () => {
    it('should handle all deadlines on the same day', () => {
      const params = {
        isConditionalResident: true,
        greenCardDate: '2022-04-15',
        greenCardExpirationDate: '2024-04-15',
        birthDate: '2006-04-15', // Will be 18 on 2024-04-15
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-04-15', // Tax deadline, green card expiry, 18th birthday, removal deadline
      };

      const result = calculateComprehensiveCompliance(params);

      // All should be critical/urgent on the same day
      expect(result.removalOfConditions.currentStatus).toBe('in_window');
      expect(result.removalOfConditions.daysUntilDeadline).toBe(0);
      expect(result.greenCardRenewal.currentStatus).toBe('renewal_urgent');
      expect(result.selectiveService.currentStatus).toBe('must_register');
      expect(result.taxReminder.daysUntilDeadline).toBe(0);

      const deadlines = getUpcomingDeadlines(result, params.currentDate);
      // Tax deadline and green card expiry are on April 15
      // Selective service deadline is 30 days after 18th birthday (May 15)
      const uniqueDates = [...new Set(deadlines.map((d) => d.date))];
      expect(uniqueDates).toHaveLength(2);
      expect(uniqueDates).toContain('2024-04-15');
      expect(uniqueDates).toContain('2024-05-15');
    });

    it('should handle cascading deadlines where one affects another', () => {
      // Conditional resident who becomes permanent affects removal of conditions
      const params = {
        isConditionalResident: true,
        greenCardDate: '2022-01-01',
        greenCardExpirationDate: '2024-01-01', // 2-year conditional
        birthDate: '2000-01-01',
        gender: 'male' as const,
        isSelectiveServiceRegistered: true,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2023-12-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Both removal of conditions and green card renewal are urgent
      expect(result.removalOfConditions.currentStatus).toBe('in_window');
      expect(result.greenCardRenewal.currentStatus).toBe('renewal_urgent');

      const priorityItems = getPriorityComplianceItems(result);
      // Should prioritize based on closest deadline
      expect(priorityItems.length).toBeGreaterThan(0);
    });

    it('should handle overlapping compliance windows', () => {
      const params = {
        isConditionalResident: true,
        greenCardDate: '2022-07-01',
        greenCardExpirationDate: '2024-07-01',
        birthDate: '2000-01-01',
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [
          {
            id: '1',
            userId: 'user1',
            departureDate: '2024-03-01',
            returnDate: '2024-05-01',
            location: 'Extended Trip',
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        currentDate: '2024-04-01', // During tax season and removal window
      };

      const result = calculateComprehensiveCompliance(params);

      // Multiple active items
      const activeItems = getActiveComplianceItems(result);
      expect(activeItems.length).toBeGreaterThanOrEqual(2);

      // Tax reminder should note abroad status
      expect(result.taxReminder.isAbroadDuringTaxSeason).toBe(true);
    });
  });

  describe('Data Consistency Edge Cases', () => {
    it('should handle conflicting statuses - conditional resident with 10-year card', () => {
      const params = {
        isConditionalResident: true, // Conditional
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2030-01-01', // 10-year expiration (inconsistent)
        birthDate: '2000-01-01',
        gender: 'female' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-01-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Should still calculate removal of conditions based on conditional status
      expect(result.removalOfConditions.applies).toBe(true);
      // Green card renewal should use the actual expiration date
      expect(result.greenCardRenewal.monthsUntilExpiration).toBe(72);
    });

    it('should handle male with selective service marked as not required', () => {
      const params = {
        isConditionalResident: false,
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2030-01-01',
        birthDate: '2004-01-01', // 20 years old male
        gender: 'male' as const,
        isSelectiveServiceRegistered: false, // Not registered
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-01-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Should still require registration based on age and gender
      expect(result.selectiveService.applies).toBe(true);
      expect(result.selectiveService.registrationRequired).toBe(true);
      expect(result.selectiveService.currentStatus).toBe('must_register');
    });

    it('should handle incomplete data scenarios gracefully', () => {
      const params = {
        isConditionalResident: false,
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2030-01-01',
        birthDate: '2000-01-01',
        gender: 'other' as const, // Non-binary gender
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: undefined as unknown as string, // Missing current date
      };

      // Should not throw error
      expect(() => calculateComprehensiveCompliance(params)).not.toThrow();

      const result = calculateComprehensiveCompliance(params);
      expect(result).toBeDefined();
      expect(result.selectiveService.applies).toBe(false); // Other gender not required
    });

    it('should handle expired conditional green card scenario', () => {
      const params = {
        isConditionalResident: true,
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2022-01-01', // Expired 2 years ago
        birthDate: '2000-01-01',
        gender: 'male' as const,
        isSelectiveServiceRegistered: true,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-01-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Both removal of conditions and renewal are overdue
      expect(result.removalOfConditions.currentStatus).toBe('overdue');
      expect(result.greenCardRenewal.currentStatus).toBe('expired');

      const priorityItems = getPriorityComplianceItems(result);
      expect(priorityItems.length).toBeGreaterThanOrEqual(2);
      expect(priorityItems.every((item) => item.priority === 'critical')).toBe(true);
    });

    it('should handle future-dated green card with current compliance needs', () => {
      const params = {
        isConditionalResident: false,
        greenCardDate: '2025-01-01', // Future dated
        greenCardExpirationDate: '2035-01-01',
        birthDate: '2004-01-01', // Currently needs selective service
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-01-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Selective service should still apply based on current age
      expect(result.selectiveService.applies).toBe(true);
      expect(result.selectiveService.registrationRequired).toBe(true);
    });
  });

  describe('Priority Calculation Edge Cases', () => {
    it('should handle multiple critical priority items', () => {
      const compliance = {
        removalOfConditions: {
          applies: true,
          greenCardDate: '2020-01-01',
          filingWindowStart: '2021-10-03',
          filingWindowEnd: '2022-01-01',
          currentStatus: 'overdue' as const,
          daysUntilWindow: null,
          daysUntilDeadline: null,
        },
        greenCardRenewal: {
          expirationDate: '2023-01-01',
          renewalWindowStart: '2022-07-01',
          currentStatus: 'expired' as const,
          monthsUntilExpiration: -12,
          isInRenewalWindow: true,
        },
        selectiveService: {
          applies: true,
          registrationRequired: true,
          registrationDeadline: '2023-01-01',
          isRegistered: false,
          currentStatus: 'must_register' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 10, // Within 30 days and abroad
          isAbroadDuringTaxSeason: true,
          reminderDismissed: false,
          applicableDeadline: 'abroad_extension' as const,
          actualDeadline: '2024-06-17',
        },
      };

      const priorityItems = getPriorityComplianceItems(compliance);

      // Should have multiple priority items
      expect(priorityItems.length).toBeGreaterThanOrEqual(3);

      // Check critical items (removal of conditions and green card renewal)
      const criticalItems = priorityItems.filter((item) => item.priority === 'critical');
      expect(criticalItems.length).toBe(2);

      // Check high priority items (selective service and tax)
      const highPriorityItems = priorityItems.filter((item) => item.priority === 'high');
      expect(highPriorityItems.length).toBe(2);

      // Should be sorted by priority
      expect(priorityItems[0].priority).toBe('critical');
      expect(priorityItems[1].priority).toBe('critical');
    });

    it('should handle priority changes based on time progression', () => {
      const baseParams = {
        isConditionalResident: false,
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2024-06-01',
        birthDate: '2000-01-01',
        gender: 'male' as const,
        isSelectiveServiceRegistered: true,
        taxReminderDismissed: false,
        trips: [] as Trip[],
      };

      // Check priority 6 months before expiration
      const sixMonthsBefore = calculateComprehensiveCompliance({
        ...baseParams,
        currentDate: '2024-01-01',
      });
      const prioritySixMonths = getPriorityComplianceItems(sixMonthsBefore);

      // Check priority 1 month before expiration
      const oneMonthBefore = calculateComprehensiveCompliance({
        ...baseParams,
        currentDate: '2024-05-01',
      });
      const priorityOneMonth = getPriorityComplianceItems(oneMonthBefore);

      // Priority should increase as deadline approaches
      expect(priorityOneMonth.length).toBeGreaterThanOrEqual(prioritySixMonths.length);
    });

    it('should handle tie-breaking for equal priority items', () => {
      const compliance = {
        removalOfConditions: {
          applies: true,
          greenCardDate: '2022-01-01',
          filingWindowStart: '2023-10-03',
          filingWindowEnd: '2024-04-15', // Same deadline as tax
          currentStatus: 'in_window' as const,
          daysUntilWindow: null,
          daysUntilDeadline: 15,
        },
        greenCardRenewal: {
          expirationDate: '2024-04-15', // Same date
          renewalWindowStart: '2023-10-15',
          currentStatus: 'renewal_urgent' as const,
          monthsUntilExpiration: 0,
          isInRenewalWindow: true,
        },
        selectiveService: {
          applies: false,
          registrationRequired: false,
          registrationDeadline: null,
          isRegistered: false,
          currentStatus: 'not_applicable' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15', // Same date
          daysUntilDeadline: 15,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: false,
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const priorityItems = getPriorityComplianceItems(compliance);
      const deadlines = getUpcomingDeadlines(compliance, '2024-04-01');

      // Should have consistent ordering
      expect(priorityItems.length).toBeGreaterThan(0);
      expect(deadlines.filter((d) => d.date === '2024-04-15').length).toBe(3);

      // Verify deterministic ordering
      const types = deadlines.filter((d) => d.date === '2024-04-15').map((d) => d.type);
      expect(types).toEqual(
        expect.arrayContaining(['removal_of_conditions', 'green_card_renewal', 'tax_filing']),
      );
    });

    it('should exclude non-actionable items from priority list', () => {
      const compliance = {
        removalOfConditions: {
          applies: true,
          greenCardDate: '2022-01-01',
          filingWindowStart: '2023-10-03',
          filingWindowEnd: '2024-01-01',
          currentStatus: 'filed' as const, // Already filed
          daysUntilWindow: null,
          daysUntilDeadline: 30,
        },
        greenCardRenewal: {
          expirationDate: '2032-01-01',
          renewalWindowStart: '2031-07-01',
          currentStatus: 'valid' as const,
          monthsUntilExpiration: 96,
          isInRenewalWindow: false,
        },
        selectiveService: {
          applies: true,
          registrationRequired: false,
          registrationDeadline: '2020-01-01',
          isRegistered: true, // Already registered
          currentStatus: 'registered' as const,
        },
        taxReminder: {
          nextDeadline: '2024-04-15',
          daysUntilDeadline: 300,
          isAbroadDuringTaxSeason: false,
          reminderDismissed: true, // Dismissed
          applicableDeadline: 'standard' as const,
          actualDeadline: '2024-04-15',
        },
      };

      const priorityItems = getPriorityComplianceItems(compliance);
      const activeItems = getActiveComplianceItems(compliance);

      // Nothing should be priority since all are handled
      expect(priorityItems).toHaveLength(0);
      expect(activeItems).toHaveLength(0);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle LPR with all compliance requirements active', () => {
      const params = {
        isConditionalResident: true,
        greenCardDate: '2022-04-01', // 2 years from current date
        greenCardExpirationDate: '2024-04-01', // Expiring on current date
        birthDate: '2006-04-01', // 18 years old on current date
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [
          {
            id: '1',
            userId: 'user1',
            departureDate: '2024-02-15',
            returnDate: '2024-04-20',
            location: 'Long Trip',
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        currentDate: '2024-04-01', // All conditions align on this date
      };

      const result = calculateComprehensiveCompliance(params);

      // Should have all four compliance items active or applicable
      expect(result.removalOfConditions.applies).toBe(true);
      // The filing window starts 90 days before the 2-year anniversary
      // 2-year anniversary is 2024-04-01, so window starts ~2024-01-02
      expect(result.removalOfConditions.currentStatus).toBe('in_window');
      expect(result.greenCardRenewal.isInRenewalWindow).toBe(true);
      expect(result.greenCardRenewal.currentStatus).toBe('renewal_urgent');
      expect(result.selectiveService.registrationRequired).toBe(true);
      expect(result.selectiveService.currentStatus).toBe('must_register');
      expect(result.taxReminder.isAbroadDuringTaxSeason).toBe(true);
      expect(result.taxReminder.applicableDeadline).toBe('abroad_extension');
      expect(result.taxReminder.daysUntilDeadline).toBe(77); // April 1 to June 17 (adjusted weekend)

      const activeItems = getActiveComplianceItems(result);
      // Since the person is abroad and gets June extension, tax might not be active on April 1
      expect(activeItems.length).toBe(3);

      const priorityItems = getPriorityComplianceItems(result);
      expect(priorityItems.length).toBeGreaterThan(0);

      // Verify which types are represented
      const activeTypes = activeItems.map((item) => item.type);
      expect(activeTypes).toContain('removal_of_conditions');
      expect(activeTypes).toContain('green_card_renewal');
      expect(activeTypes).toContain('selective_service');
      // Tax filing is not active since deadline is 77 days away (> 30 day threshold)
    });

    it('should handle edge case date calculations across all modules', () => {
      // Feb 29 birthdate, green card date, during leap year
      const params = {
        isConditionalResident: true,
        greenCardDate: '2020-02-29', // Leap year
        greenCardExpirationDate: '2022-02-28', // Non-leap year adjustment
        birthDate: '2000-02-29', // Leap year birth
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2022-02-28', // Checking on adjusted date
      };

      const result = calculateComprehensiveCompliance(params);

      // All calculations should handle leap year adjustments
      expect(result.removalOfConditions.filingWindowEnd).toBe('2022-02-28');
      expect(result.greenCardRenewal.currentStatus).toBe('renewal_urgent');
      expect(result.selectiveService.applies).toBe(true);
    });

    it('should handle null and undefined edge cases across all modules', () => {
      const params = {
        isConditionalResident: false,
        greenCardDate: '2020-01-01',
        greenCardExpirationDate: '2030-01-01',
        birthDate: '2000-01-01',
        gender: 'male' as const,
        isSelectiveServiceRegistered: false,
        taxReminderDismissed: false,
        trips: [
          {
            id: '1',
            userId: 'user1',
            departureDate: '2024-03-01',
            returnDate: '2024-03-01', // Same day trip
            location: undefined as unknown as string, // Missing location
            isSimulated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        currentDate: '2024-01-01',
      };

      // Should handle gracefully
      expect(() => calculateComprehensiveCompliance(params)).not.toThrow();

      const result = calculateComprehensiveCompliance(params);
      expect(result).toBeDefined();
      expect(result.taxReminder).toBeDefined();
    });

    it('should provide consistent results with extreme dates', () => {
      const params = {
        isConditionalResident: false,
        greenCardDate: '1980-01-01', // Very old green card
        greenCardExpirationDate: '9999-12-31', // Never expires
        birthDate: '1950-01-01', // Very old person
        gender: 'male' as const,
        isSelectiveServiceRegistered: true,
        taxReminderDismissed: false,
        trips: [] as Trip[],
        currentDate: '2024-01-01',
      };

      const result = calculateComprehensiveCompliance(params);

      // Should handle extreme dates
      expect(result.removalOfConditions.applies).toBe(false);
      expect(result.greenCardRenewal.currentStatus).toBe('valid');
      expect(result.selectiveService.currentStatus).toBe('aged_out');
      expect(result.taxReminder.nextDeadline).toBe('2024-04-15');
    });
  });
});
