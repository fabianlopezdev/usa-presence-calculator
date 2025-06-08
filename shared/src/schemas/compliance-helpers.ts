/**
 * Compliance Helper Types
 *
 * Type definitions for compliance tracking helpers and coordinators
 */

import { z } from 'zod';

// Active compliance item requiring user attention
export const ActiveComplianceItemSchema = z.object({
  type: z.enum(['removal_of_conditions', 'green_card_renewal', 'selective_service', 'tax_filing']),
  description: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
});

export type ActiveComplianceItem = z.infer<typeof ActiveComplianceItemSchema>;

// Priority compliance item with deadline
export const PriorityComplianceItemSchema = z.object({
  type: z.enum(['removal_of_conditions', 'green_card_renewal', 'selective_service', 'tax_filing']),
  description: z.string(),
  deadline: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export type PriorityComplianceItem = z.infer<typeof PriorityComplianceItemSchema>;

// Upcoming deadline information
export const UpcomingDeadlineSchema = z.object({
  type: z.enum(['removal_of_conditions', 'green_card_renewal', 'selective_service', 'tax_filing']),
  description: z.string(),
  date: z.string(),
  daysRemaining: z.number(),
});

export type UpcomingDeadline = z.infer<typeof UpcomingDeadlineSchema>;
