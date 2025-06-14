import { z } from 'zod';

import { DATE_VALIDATION } from '@constants/validation-messages';

// Helper to check if year is leap year
const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

// Helper to get days in month
const getDaysInMonth = (month: number, year: number): number => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month - 1];
};

// Custom refinement to validate actual date validity
const isValidDate = (dateString: string): boolean => {
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(regex);

  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Check basic bounds
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Check day is within month bounds
  const maxDays = getDaysInMonth(month, year);
  if (day > maxDays) return false;

  // Additional check: ensure the date actually parses correctly
  // Use UTC to avoid timezone issues
  const date = new Date(`${dateString}T00:00:00Z`);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

// Custom refinement to ensure return date is after departure date
const dateRangeRefinement = (data: { departureDate: string; returnDate: string }): boolean => {
  const departure = new Date(data.departureDate);
  const returnDate = new Date(data.returnDate);
  return returnDate >= departure;
};

/**
 * Base trip schema with common fields
 */
const BaseTripSchema = z
  .object({
    departureDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
      .refine(isValidDate, { message: 'Invalid date' }),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
      .refine(isValidDate, { message: 'Invalid date' }),
    location: z.string().optional(),
  })
  .strict();

/**
 * Complete trip schema - Stored trip data
 */
export const TripSchema = BaseTripSchema.extend({
  id: z.string(),
  userId: z.string(),
  isSimulated: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncId: z.string().optional(),
  deviceId: z.string().optional(),
  syncVersion: z.number().int().min(0).optional(),
  syncStatus: z.enum(['local', 'pending', 'synced']).optional(),
  deletedAt: z.string().optional(),
})
  .strict()
  .refine(dateRangeRefinement, {
    message: DATE_VALIDATION.RETURN_BEFORE_DEPARTURE,
    path: ['returnDate'],
  });

/**
 * Trip creation schema - Data required to create a new trip
 */
export const TripCreateSchema = BaseTripSchema.refine(dateRangeRefinement, {
  message: DATE_VALIDATION.RETURN_BEFORE_DEPARTURE,
  path: ['returnDate'],
});

/**
 * Trip update schema - Partial data for updating a trip
 */
export const TripUpdateSchema = BaseTripSchema.partial().refine(
  (data) => {
    if (data.departureDate && data.returnDate) {
      return dateRangeRefinement({
        departureDate: data.departureDate,
        returnDate: data.returnDate,
      });
    }
    return true;
  },
  {
    message: DATE_VALIDATION.RETURN_BEFORE_DEPARTURE,
    path: ['returnDate'],
  },
);

/**
 * Simulated trip schema - For the travel simulator feature
 */
export const SimulatedTripSchema = z
  .object({
    departureDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
      .refine(isValidDate, { message: 'Invalid date' }),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
      .refine(isValidDate, { message: 'Invalid date' }),
  })
  .strict()
  .refine(dateRangeRefinement, {
    message: DATE_VALIDATION.RETURN_BEFORE_DEPARTURE,
    path: ['returnDate'],
  });

// Type exports
export type Trip = z.infer<typeof TripSchema>;
export type TripCreate = z.infer<typeof TripCreateSchema>;
export type TripUpdate = z.infer<typeof TripUpdateSchema>;
export type SimulatedTrip = z.infer<typeof SimulatedTripSchema>;
