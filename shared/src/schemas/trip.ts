import { z } from 'zod';

// Custom refinement to ensure return date is after departure date
const dateRangeRefinement = (data: { departureDate: string; returnDate: string }): boolean => {
  const departure = new Date(data.departureDate);
  const returnDate = new Date(data.returnDate);
  return returnDate >= departure;
};

/**
 * Base trip schema with common fields
 */
const BaseTripSchema = z.object({
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  location: z.string().optional(),
}).strict();

/**
 * Complete trip schema - Stored trip data
 */
export const TripSchema = BaseTripSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isSimulated: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().refine(dateRangeRefinement, {
  message: 'Return date must be after or equal to departure date',
  path: ['returnDate'],
});

/**
 * Trip creation schema - Data required to create a new trip
 */
export const TripCreateSchema = BaseTripSchema.refine(dateRangeRefinement, {
  message: 'Return date must be after or equal to departure date',
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
    message: 'Return date must be after or equal to departure date',
    path: ['returnDate'],
  },
);

/**
 * Simulated trip schema - For the travel simulator feature
 */
export const SimulatedTripSchema = z
  .object({
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  })
  .strict()
  .refine(dateRangeRefinement, {
    message: 'Return date must be after or equal to departure date',
    path: ['returnDate'],
  });

// Type exports
export type Trip = z.infer<typeof TripSchema>;
export type TripCreate = z.infer<typeof TripCreateSchema>;
export type TripUpdate = z.infer<typeof TripUpdateSchema>;
export type SimulatedTrip = z.infer<typeof SimulatedTripSchema>;
