// External dependencies
import { addDays, differenceInDays, formatISO, isBefore, subDays } from 'date-fns';

// Internal dependencies - Schemas & Types
import { MilestoneInfo } from '@schemas/travel-analytics';

// Internal dependencies - Business Logic
import {
  calculateAnniversaryDate,
  getRequiredDays,
  getRequiredYears,
} from '@business-logic/calculations/travel-analytics-helpers';
import { formatUTCDate, getCurrentUTCDate, parseUTCDate } from '@utils/utc-date-helpers';

// Internal dependencies - Constants
import { EARLY_FILING_WINDOW_DAYS } from '@constants/index';

// Export functions
export function calculateMilestones(
  totalDaysInUSA: number,
  eligibilityCategory: 'three_year' | 'five_year',
  greenCardDate: string,
  currentDate: string = formatUTCDate(getCurrentUTCDate()),
): MilestoneInfo[] {
  const requiredDays = getRequiredDays(eligibilityCategory);
  const yearsRequired = getRequiredYears(eligibilityCategory);

  return [
    createPhysicalPresenceMilestone(totalDaysInUSA, requiredDays, currentDate),
    createEarlyFilingMilestone(greenCardDate, yearsRequired, currentDate),
  ];
}

// Helper functions
function createEarlyFilingMilestone(
  greenCardDate: string,
  yearsRequired: number,
  currentDate: string,
): MilestoneInfo {
  const greenCardParsed = parseUTCDate(greenCardDate);
  const anniversaryDate = calculateAnniversaryDate(greenCardParsed, yearsRequired);
  const earlyFilingDate = subDays(anniversaryDate, EARLY_FILING_WINDOW_DAYS);
  const currentParsed = parseUTCDate(currentDate);

  if (isBefore(currentParsed, earlyFilingDate)) {
    const daysUntilEarlyFiling = differenceInDays(earlyFilingDate, currentParsed);
    const totalDaysToWait = differenceInDays(earlyFilingDate, greenCardParsed);
    const daysSinceGreenCard = differenceInDays(currentParsed, greenCardParsed);

    return {
      type: 'early_filing',
      daysRemaining: daysUntilEarlyFiling,
      targetDate: formatISO(earlyFilingDate, { representation: 'date' }),
      currentProgress: Math.round((daysSinceGreenCard / totalDaysToWait) * 1000) / 10,
      description: `${daysUntilEarlyFiling} days until early filing window opens`,
    };
  }

  return {
    type: 'early_filing',
    daysRemaining: 0,
    targetDate: formatISO(earlyFilingDate, { representation: 'date' }),
    currentProgress: 100,
    description: 'Early filing window is now open!',
  };
}

function createPhysicalPresenceMilestone(
  totalDaysInUSA: number,
  requiredDays: number,
  currentDate: string,
): MilestoneInfo {
  const daysRemaining = Math.max(0, requiredDays - totalDaysInUSA);
  const percentComplete = Math.min(100, (totalDaysInUSA / requiredDays) * 100);

  return {
    type: 'physical_presence',
    daysRemaining,
    targetDate:
      daysRemaining > 0
        ? formatUTCDate(addDays(parseUTCDate(currentDate), daysRemaining))
        : currentDate,
    currentProgress: Math.round(percentComplete * 10) / 10,
    description:
      daysRemaining > 0
        ? `${daysRemaining} days until physical presence requirement met`
        : 'Physical presence requirement met!',
  };
}
