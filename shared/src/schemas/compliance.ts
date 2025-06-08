/**
 * Compliance Tracking Schemas
 *
 * Schemas for tracking LPR compliance requirements including:
 * - Removal of conditions (Form I-751)
 * - Green card renewal
 * - Selective service registration
 * - Tax filing reminders
 */

import { z } from 'zod';
import { TripSchema } from '@schemas/trip';

// Removal of Conditions (I-751) Schemas
export const RemovalOfConditionsStatusSchema = z.object({
  applies: z.boolean(),
  greenCardDate: z.string(),
  filingWindowStart: z.string(),
  filingWindowEnd: z.string(),
  currentStatus: z.enum(['not_yet', 'in_window', 'filed', 'approved', 'overdue']),
  daysUntilWindow: z.number().nullable(),
  daysUntilDeadline: z.number().nullable(),
});

export type RemovalOfConditionsStatus = z.infer<typeof RemovalOfConditionsStatusSchema>;

// Green Card Renewal Schemas
export const GreenCardRenewalStatusSchema = z.object({
  expirationDate: z.string(),
  renewalWindowStart: z.string(),
  currentStatus: z.enum(['valid', 'renewal_recommended', 'renewal_urgent', 'expired']),
  monthsUntilExpiration: z.number(),
  isInRenewalWindow: z.boolean(),
});

export type GreenCardRenewalStatus = z.infer<typeof GreenCardRenewalStatusSchema>;

// Selective Service Schemas
export const SelectiveServiceStatusSchema = z.object({
  applies: z.boolean(),
  registrationRequired: z.boolean(),
  registrationDeadline: z.string().nullable(),
  isRegistered: z.boolean(),
  currentStatus: z.enum(['not_applicable', 'must_register', 'registered', 'aged_out']),
});

export type SelectiveServiceStatus = z.infer<typeof SelectiveServiceStatusSchema>;

// Tax Reminder Schemas
export const TaxReminderStatusSchema = z.object({
  nextDeadline: z.string(),
  daysUntilDeadline: z.number(),
  isAbroadDuringTaxSeason: z.boolean(),
  reminderDismissed: z.boolean(),
});

export type TaxReminderStatus = z.infer<typeof TaxReminderStatusSchema>;

// Comprehensive compliance status for all LPR requirements
export const ComprehensiveComplianceStatusSchema = z.object({
  removalOfConditions: RemovalOfConditionsStatusSchema,
  greenCardRenewal: GreenCardRenewalStatusSchema,
  selectiveService: SelectiveServiceStatusSchema,
  taxReminder: TaxReminderStatusSchema,
});

export type ComprehensiveComplianceStatus = z.infer<typeof ComprehensiveComplianceStatusSchema>;

// Parameters for calculating comprehensive compliance
export const ComplianceCalculationParamsSchema = z.object({
  // Removal of conditions
  isConditionalResident: z.boolean(),
  greenCardDate: z.string(),

  // Green card renewal
  greenCardExpirationDate: z.string(),

  // Selective service
  birthDate: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  isSelectiveServiceRegistered: z.boolean(),

  // Tax reminders
  taxReminderDismissed: z.boolean(),
  trips: z.array(TripSchema),

  // Optional current date for testing
  currentDate: z.string().optional(),
});

export type ComplianceCalculationParams = z.infer<typeof ComplianceCalculationParamsSchema>;

// Main Compliance Status Schema
export const ComplianceStatusSchema = z.object({
  removalOfConditions: RemovalOfConditionsStatusSchema.optional(),
  greenCardRenewal: GreenCardRenewalStatusSchema,
  selectiveService: SelectiveServiceStatusSchema.optional(),
  taxReminders: TaxReminderStatusSchema,
  lastUpdated: z.string(),
});

export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
