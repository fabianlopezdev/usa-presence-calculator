/**
 * Selective Service Registration Checker
 *
 * Determines selective service registration requirements for male LPRs aged 18-25
 * Registration is required by law and affects naturalization eligibility
 */

// External dependencies
import { addYears, differenceInDays, differenceInYears, parseISO, isAfter } from 'date-fns';

// Internal dependencies - Schemas & Types
import { SelectiveServiceStatus } from '@schemas/compliance';

// Internal dependencies - Constants
import { SELECTIVE_SERVICE } from '@constants/uscis-rules';

/**
 * Calculate the selective service registration status
 */
export function calculateSelectiveServiceStatus(
  birthDate: string,
  gender: string,
  isRegistered: boolean,
  currentDate: string = new Date().toISOString(),
): SelectiveServiceStatus {
  const age = getAgeInYears(birthDate, currentDate);
  const isRequired = isSelectiveServiceRequired(birthDate, gender, currentDate);

  // Determine if this applies to the user
  const applies =
    gender === SELECTIVE_SERVICE.GENDER_REQUIRED &&
    age >= SELECTIVE_SERVICE.MIN_AGE &&
    age < SELECTIVE_SERVICE.MAX_AGE;

  // Determine current status
  let currentStatus: SelectiveServiceStatus['currentStatus'];

  if (gender !== SELECTIVE_SERVICE.GENDER_REQUIRED) {
    currentStatus = 'not_applicable';
  } else if (age < SELECTIVE_SERVICE.MIN_AGE) {
    currentStatus = 'not_applicable';
  } else if (age >= SELECTIVE_SERVICE.MAX_AGE) {
    currentStatus = 'aged_out';
  } else if (isRegistered) {
    currentStatus = 'registered';
  } else {
    currentStatus = 'must_register';
  }

  // Calculate registration deadline only if not aged out
  const registrationDeadline =
    currentStatus === 'aged_out' ? null : getRegistrationDeadline(birthDate, gender);

  return {
    applies,
    registrationRequired: isRequired && !isRegistered,
    registrationDeadline,
    isRegistered,
    currentStatus,
  };
}

/**
 * Check if selective service registration is required
 */
export function isSelectiveServiceRequired(
  birthDate: string,
  gender: string,
  currentDate: string = new Date().toISOString(),
): boolean {
  if (gender !== SELECTIVE_SERVICE.GENDER_REQUIRED) {
    return false;
  }

  const age = getAgeInYears(birthDate, currentDate);
  return age >= SELECTIVE_SERVICE.MIN_AGE && age < SELECTIVE_SERVICE.MAX_AGE;
}

/**
 * Calculate age in years
 */
export function getAgeInYears(
  birthDate: string,
  currentDate: string = new Date().toISOString(),
): number {
  const birth = parseISO(birthDate);
  const current = parseISO(currentDate);

  return differenceInYears(current, birth);
}

/**
 * Get the registration deadline (18th birthday for males)
 */
export function getRegistrationDeadline(birthDate: string, gender: string): string | null {
  if (gender !== SELECTIVE_SERVICE.GENDER_REQUIRED) {
    return null;
  }

  const birth = parseISO(birthDate);
  const eighteenthBirthday = addYears(birth, SELECTIVE_SERVICE.MIN_AGE);

  return eighteenthBirthday.toISOString().split('T')[0];
}

/**
 * Get days until registration is required (18th birthday)
 */
export function getDaysUntilRegistrationRequired(
  birthDate: string,
  gender: string,
  currentDate: string = new Date().toISOString(),
): number {
  if (gender !== SELECTIVE_SERVICE.GENDER_REQUIRED) {
    return 0;
  }

  const current = parseISO(currentDate);
  const registrationDate = getRegistrationDeadline(birthDate, gender);

  if (!registrationDate) {
    return 0;
  }

  const deadline = parseISO(registrationDate);

  if (isAfter(current, deadline) || current.getTime() === deadline.getTime()) {
    return 0;
  }

  return differenceInDays(deadline, current);
}

/**
 * Get days until aged out (26th birthday)
 */
export function getDaysUntilAgedOut(
  birthDate: string,
  currentDate: string = new Date().toISOString(),
): number {
  const current = parseISO(currentDate);
  const birth = parseISO(birthDate);
  const twentySixthBirthday = addYears(birth, SELECTIVE_SERVICE.MAX_AGE);

  if (
    isAfter(current, twentySixthBirthday) ||
    current.getTime() === twentySixthBirthday.getTime()
  ) {
    return 0;
  }

  return differenceInDays(twentySixthBirthday, current);
}
