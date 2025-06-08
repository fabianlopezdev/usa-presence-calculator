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

// Main Compliance Status Schema
export const ComplianceStatusSchema = z.object({
  removalOfConditions: RemovalOfConditionsStatusSchema.optional(),
  greenCardRenewal: GreenCardRenewalStatusSchema,
  selectiveService: SelectiveServiceStatusSchema.optional(),
  taxReminders: TaxReminderStatusSchema,
  lastUpdated: z.string(),
});

export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
