import { z } from 'zod';

// Schema for tracking country visit data
export const countryDataSchema = z.object({
  totalDays: z.number().int().min(0),
  tripCount: z.number().int().min(0),
  lastVisited: z.date().nullable(),
}).strict();

// Schema for parsed trip date ranges
export const tripDateRangeSchema = z.object({
  departure: z.date(),
  returnDate: z.date(),
}).strict();

// Schema for year calculation boundaries
export const yearBoundariesSchema = z.object({
  yearStart: z.date(),
  yearEnd: z.date(),
}).strict();

// Schema for presence streak data
export const presenceStreakSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().int().positive(),
  description: z.string(),
}).strict();

// Schema for risk threshold configuration
export const riskThresholdsSchema = z.object({
  criticalDays: z.number().int().positive(),
  highDays: z.number().int().positive(),
  mediumDays: z.number().int().positive(),
}).strict();

// Schema for travel risk assessment result
export const travelRiskResultSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.enum(['continuous_residence', 'physical_presence', 'safe']),
}).strict();

// Schema for travel budget risk result
export const travelBudgetRiskResultSchema = z.object({
  riskLevel: z.enum(['safe', 'caution', 'warning']),
  recommendation: z.string(),
}).strict();

// Type exports
export type CountryData = z.infer<typeof countryDataSchema>;
export type TripDateRange = z.infer<typeof tripDateRangeSchema>;
export type YearBoundaries = z.infer<typeof yearBoundariesSchema>;
export type PresenceStreak = z.infer<typeof presenceStreakSchema>;
export type RiskThresholds = z.infer<typeof riskThresholdsSchema>;
export type TravelRiskResult = z.infer<typeof travelRiskResultSchema>;
export type TravelBudgetRiskResult = z.infer<typeof travelBudgetRiskResultSchema>;
