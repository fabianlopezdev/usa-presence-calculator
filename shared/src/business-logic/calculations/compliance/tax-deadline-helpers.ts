/**
 * Tax Deadline Helper Functions
 *
 * Provides utility functions for adjusting tax deadlines based on weekends
 * and DC Emancipation Day (April 16) which affects IRS deadlines nationwide
 */

// External dependencies
import { addDays, getDay } from 'date-fns';

// Internal dependencies - Constants
import { DAY_OF_WEEK, MONTH_INDEX, DC_EMANCIPATION_DAY } from '@constants/date-time';

/**
 * Adjust date to next business day if it falls on weekend or DC Emancipation Day
 * DC Emancipation Day (April 16) affects IRS deadlines nationwide
 */
export function adjustForWeekend(date: Date): Date {
  let adjustedDate = date;
  const dayOfWeek = getDay(adjustedDate);

  // First, adjust for weekend
  if (dayOfWeek === DAY_OF_WEEK.SATURDAY) {
    // Saturday - move to Monday
    adjustedDate = addDays(adjustedDate, 2);
  } else if (dayOfWeek === DAY_OF_WEEK.SUNDAY) {
    // Sunday - move to Monday
    adjustedDate = addDays(adjustedDate, 1);
  }

  // Check if we need to account for DC Emancipation Day (April 16)
  // Only relevant for April tax deadlines
  if (adjustedDate.getMonth() === MONTH_INDEX.APRIL) {
    // April (0-indexed)
    const day = adjustedDate.getDate();
    const year = adjustedDate.getFullYear();

    // Check if adjusted date falls on April 16
    if (day === DC_EMANCIPATION_DAY.HOLIDAY_DAY) {
      // Move to April 17
      adjustedDate = addDays(adjustedDate, 1);
    } else if (day === DC_EMANCIPATION_DAY.TAX_DEADLINE_DAY) {
      // Special case: If April 15 is Friday, check if we need to skip to April 18
      // because April 16 (Saturday) is Emancipation Day
      const dayOfWeek15 = getDay(adjustedDate);
      if (dayOfWeek15 === DAY_OF_WEEK.FRIDAY) {
        // Friday - skip weekend AND Emancipation Day
        adjustedDate = addDays(adjustedDate, DC_EMANCIPATION_DAY.FRIDAY_SKIP_DAYS); // Move to Monday April 18
      }
    } else if (day === DC_EMANCIPATION_DAY.DAY_AFTER_HOLIDAY) {
      // Special case: If we moved to April 17 (Monday),
      // check if Emancipation Day is being observed on this day
      const april16 = new Date(year, MONTH_INDEX.APRIL, DC_EMANCIPATION_DAY.HOLIDAY_DAY);
      const april16DayOfWeek = getDay(april16);

      // If April 16 was Sunday, it's observed on Monday (April 17)
      if (april16DayOfWeek === DAY_OF_WEEK.SUNDAY) {
        // Move to Tuesday
        adjustedDate = addDays(adjustedDate, 1);
      }
    }
  }

  return adjustedDate;
}
