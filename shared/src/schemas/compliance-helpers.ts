/**
 * Compliance Helper Types
 *
 * Type definitions for compliance tracking helpers and coordinators
 */

import { z } from 'zod';
import { COMPLIANCE_ITEM_TYPE } from '@constants/compliance';
import { PRIORITY_LEVEL } from '@constants/priority-urgency';

// Active compliance item requiring user attention
export const ActiveComplianceItemSchema = z.object({
  type: z.enum([
    COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    COMPLIANCE_ITEM_TYPE.TAX_FILING,
  ]),
  description: z.string(),
  urgency: z.enum([
    PRIORITY_LEVEL.LOW,
    PRIORITY_LEVEL.MEDIUM,
    PRIORITY_LEVEL.HIGH,
    PRIORITY_LEVEL.CRITICAL,
  ]),
}).strict();

export type ActiveComplianceItem = z.infer<typeof ActiveComplianceItemSchema>;

// Priority compliance item with deadline
export const PriorityComplianceItemSchema = z.object({
  type: z.enum([
    COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    COMPLIANCE_ITEM_TYPE.TAX_FILING,
  ]),
  description: z.string(),
  deadline: z.string(),
  priority: z.enum([
    PRIORITY_LEVEL.LOW,
    PRIORITY_LEVEL.MEDIUM,
    PRIORITY_LEVEL.HIGH,
    PRIORITY_LEVEL.CRITICAL,
  ]),
}).strict();

export type PriorityComplianceItem = z.infer<typeof PriorityComplianceItemSchema>;

// Upcoming deadline information
export const UpcomingDeadlineSchema = z.object({
  type: z.enum([
    COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    COMPLIANCE_ITEM_TYPE.TAX_FILING,
  ]),
  description: z.string(),
  date: z.string(),
  daysRemaining: z.number(),
}).strict();

export type UpcomingDeadline = z.infer<typeof UpcomingDeadlineSchema>;
