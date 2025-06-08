import { z } from 'zod';

// Country statistics for travel destinations
export const countryStatisticsSchema = z.object({
  country: z.string(),
  totalDays: z.number().int().min(0),
  tripCount: z.number().int().min(1),
  averageDuration: z.number().int().min(0),
  lastVisited: z.string().nullable(), // ISO date string or null
});

export type CountryStatistics = z.infer<typeof countryStatisticsSchema>;

// Yearly breakdown of days abroad
export const yearlyDaysAbroadSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  daysAbroad: z.number().int().min(0),
  tripCount: z.number().int().min(0),
});

export type YearlyDaysAbroad = z.infer<typeof yearlyDaysAbroadSchema>;

// Travel streaks (continuous presence or absence)
export const travelStreakSchema = z.object({
  type: z.enum(['in_usa', 'traveling', 'travel_free_months']),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  duration: z.number().int().min(0), // days
  description: z.string(),
});

export type TravelStreak = z.infer<typeof travelStreakSchema>;

// Milestone tracking for naturalization requirements
export const milestoneInfoSchema = z.object({
  type: z.enum(['physical_presence', 'early_filing', 'eligibility']),
  daysRemaining: z.number().int().min(0),
  targetDate: z.string(), // ISO date string
  currentProgress: z.number().min(0).max(100), // percentage
  description: z.string(),
});

export type MilestoneInfo = z.infer<typeof milestoneInfoSchema>;

// Safe travel budget calculation
export const safeTravelBudgetSchema = z.object({
  daysAvailable: z.number().int().min(0),
  untilDate: z.string(), // ISO date string
  recommendation: z.string(),
  riskLevel: z.enum(['safe', 'caution', 'warning']),
});

export type SafeTravelBudget = z.infer<typeof safeTravelBudgetSchema>;

// Travel pattern projection
export const travelProjectionSchema = z.object({
  projectedEligibilityDate: z.string(), // ISO date string
  averageDaysAbroadPerYear: z.number().int().min(0),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
  assumptions: z.array(z.string()),
});

export type TravelProjection = z.infer<typeof travelProjectionSchema>;

// Risk assessment for upcoming trips
export const tripRiskAssessmentSchema = z.object({
  tripId: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  impactDescription: z.string(),
  daysUntilRisk: z.number().int().nullable(), // null if no specific threshold
  recommendation: z.string(),
});

export type TripRiskAssessment = z.infer<typeof tripRiskAssessmentSchema>;

// Annual travel summary for notifications
export const annualTravelSummarySchema = z.object({
  year: z.number().int(),
  totalDaysAbroad: z.number().int().min(0),
  totalTrips: z.number().int().min(0),
  longestTrip: z
    .object({
      destination: z.string(),
      duration: z.number().int().min(0),
      dates: z.string(), // formatted date range
    })
    .nullable(),
  topDestinations: z
    .array(
      z.object({
        country: z.string(),
        days: z.number().int().min(0),
      }),
    )
    .max(5), // top 5 destinations
  comparedToLastYear: z
    .object({
      daysChange: z.number().int(), // positive or negative
      tripsChange: z.number().int(), // positive or negative
      trend: z.enum(['more_travel', 'less_travel', 'similar']),
    })
    .nullable(),
});

export type AnnualTravelSummary = z.infer<typeof annualTravelSummarySchema>;
