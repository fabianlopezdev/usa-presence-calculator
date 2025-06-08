// External dependencies
import { differenceInDays, subDays } from 'date-fns';

// Internal dependencies - Schemas & Types
import { SafeTravelBudget } from '@schemas/travel-analytics';

// Internal dependencies - Business Logic
import {
  calculateAnniversaryDate,
  getRequiredDays,
  getRequiredYears,
} from '@business-logic/calculations/travel-analytics/helpers';
import { determineTravelBudgetRisk } from '@business-logic/calculations/travel-risk/helpers';

// Internal dependencies - Utilities
import { parseUTCDate, formatUTCDate, getCurrentUTCDate } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
export function calculateSafeTravelBudget(
  _totalDaysInUSA: number,
  totalDaysAbroad: number,
  eligibilityCategory: 'three_year' | 'five_year',
  greenCardDate: string,
  _currentDate: string = formatUTCDate(getCurrentUTCDate()),
): SafeTravelBudget {
  const requiredDays = getRequiredDays(eligibilityCategory);
  const yearsRequired = getRequiredYears(eligibilityCategory);

  const greenCardParsed = parseUTCDate(greenCardDate);
  const anniversaryDate = calculateAnniversaryDate(greenCardParsed, yearsRequired);
  // Eligibility date is anniversary - 1 day per USCIS rules
  const eligibilityDate = subDays(anniversaryDate, 1);

  const projectedTotalDays = differenceInDays(eligibilityDate, greenCardParsed) + 1;
  const maxDaysAbroad = projectedTotalDays - requiredDays;
  const daysAvailable = Math.max(0, maxDaysAbroad - totalDaysAbroad);

  const { riskLevel, recommendation } = determineTravelBudgetRisk(daysAvailable);

  return {
    daysAvailable,
    untilDate: formatUTCDate(eligibilityDate),
    recommendation,
    riskLevel,
  };
}
