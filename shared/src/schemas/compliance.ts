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
import {
  REMOVAL_CONDITIONS_STATUS,
  GREEN_CARD_RENEWAL_STATUS,
  SELECTIVE_SERVICE_STATUS,
  TAX_DEADLINE_TYPE,
  GENDER,
} from '@constants/compliance';

// Removal of Conditions (I-751) Schemas
export const RemovalOfConditionsStatusSchema = z.object({
  applies: z.boolean(),
  greenCardDate: z.string(),
  filingWindowStart: z.string(),
  filingWindowEnd: z.string(),
  currentStatus: z.enum([
    REMOVAL_CONDITIONS_STATUS.NOT_YET,
    REMOVAL_CONDITIONS_STATUS.IN_WINDOW,
    REMOVAL_CONDITIONS_STATUS.FILED,
    REMOVAL_CONDITIONS_STATUS.APPROVED,
    REMOVAL_CONDITIONS_STATUS.OVERDUE,
  ]),
  daysUntilWindow: z.number().nullable(),
  daysUntilDeadline: z.number().nullable(),
}).strict();

export type RemovalOfConditionsStatus = z.infer<typeof RemovalOfConditionsStatusSchema>;

// Green Card Renewal Schemas
export const GreenCardRenewalStatusSchema = z.object({
  expirationDate: z.string(),
  renewalWindowStart: z.string(),
  currentStatus: z.enum([
    GREEN_CARD_RENEWAL_STATUS.VALID,
    GREEN_CARD_RENEWAL_STATUS.RENEWAL_RECOMMENDED,
    GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT,
    GREEN_CARD_RENEWAL_STATUS.EXPIRED,
  ]),
  monthsUntilExpiration: z.number(),
  isInRenewalWindow: z.boolean(),
}).strict();

export type GreenCardRenewalStatus = z.infer<typeof GreenCardRenewalStatusSchema>;

// Selective Service Schemas
export const SelectiveServiceStatusSchema = z.object({
  applies: z.boolean(),
  registrationRequired: z.boolean(),
  registrationDeadline: z.string().nullable(),
  isRegistered: z.boolean(),
  currentStatus: z.enum([
    SELECTIVE_SERVICE_STATUS.NOT_APPLICABLE,
    SELECTIVE_SERVICE_STATUS.MUST_REGISTER,
    SELECTIVE_SERVICE_STATUS.REGISTERED,
    SELECTIVE_SERVICE_STATUS.AGED_OUT,
  ]),
}).strict();

export type SelectiveServiceStatus = z.infer<typeof SelectiveServiceStatusSchema>;

// Tax Reminder Schemas
export const TaxReminderStatusSchema = z.object({
  nextDeadline: z.string(),
  daysUntilDeadline: z.number(),
  isAbroadDuringTaxSeason: z.boolean(),
  reminderDismissed: z.boolean(),
  applicableDeadline: z.enum([
    TAX_DEADLINE_TYPE.STANDARD,
    TAX_DEADLINE_TYPE.ABROAD_EXTENSION,
    TAX_DEADLINE_TYPE.OCTOBER_EXTENSION,
  ]),
  actualDeadline: z.string(), // Adjusted for weekends/holidays
}).strict();

export type TaxReminderStatus = z.infer<typeof TaxReminderStatusSchema>;

// Comprehensive compliance status for all LPR requirements
export const ComprehensiveComplianceStatusSchema = z.object({
  removalOfConditions: RemovalOfConditionsStatusSchema,
  greenCardRenewal: GreenCardRenewalStatusSchema,
  selectiveService: SelectiveServiceStatusSchema,
  taxReminder: TaxReminderStatusSchema,
}).strict();

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
  gender: z.enum([GENDER.MALE, GENDER.FEMALE, GENDER.OTHER]),
  isSelectiveServiceRegistered: z.boolean(),

  // Tax reminders
  taxReminderDismissed: z.boolean(),
  trips: z.array(TripSchema),

  // Optional current date for testing
  currentDate: z.string().optional(),
}).strict();

export type ComplianceCalculationParams = z.infer<typeof ComplianceCalculationParamsSchema>;

// Main Compliance Status Schema
export const ComplianceStatusSchema = z.object({
  removalOfConditions: RemovalOfConditionsStatusSchema.optional(),
  greenCardRenewal: GreenCardRenewalStatusSchema,
  selectiveService: SelectiveServiceStatusSchema.optional(),
  taxReminders: TaxReminderStatusSchema,
  lastUpdated: z.string(),
}).strict();

export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
