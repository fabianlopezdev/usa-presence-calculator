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
        },
      };

      const deadlines = getUpcomingDeadlines(compliance, '2024-01-01');
      expect(deadlines).toHaveLength(0);
    });
  });
});
