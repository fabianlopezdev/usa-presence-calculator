import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

import { I751Status, LPRStatusType, N470Exemption, ReentryPermit } from '@schemas/lpr-status';

import { parseUTCDate } from '@utils/utc-date-helpers';

export function handleConditionalResidentSuggestions(
  suggestions: string[],
  lprType: LPRStatusType,
  i751Status: I751Status,
  lprStartDate: string,
  currentDate: Date,
): void {
  if (lprType === 'conditional') {
    const lprStart = parseUTCDate(lprStartDate);
    const i751WindowStart = addDays(lprStart, 365 * 2 - 90);
    const i751WindowEnd = addDays(lprStart, 365 * 2);

    if (i751Status === 'not_applicable' && isAfter(currentDate, i751WindowEnd)) {
      suggestions.push(
        'URGENT: Your conditional green card may have expired',
        'Consult an immigration attorney about late I-751 filing',
      );
    } else if (
      i751Status === 'not_applicable' &&
      isAfter(currentDate, i751WindowStart) &&
      isBefore(currentDate, i751WindowEnd)
    ) {
      suggestions.push(
        'You are within the I-751 filing window',
        'File Form I-751 to remove conditions on your green card',
      );
    }
  }
}

export function handleN470ExemptionSuggestions(
  suggestions: string[],
  n470Exemption: N470Exemption,
): void {
  if (n470Exemption.status === 'approved') {
    suggestions.push(
      'N-470 exemption protects your continuous residence',
      'Continue to maintain ties to the US and meet physical presence requirements',
    );
  }
}

export function handleAbandonmentRiskSuggestions(
  suggestions: string[],
  currentStatus: string,
  riskFactors: { hasPatternOfNonResidence: boolean },
): void {
  if (currentStatus === 'presumed_abandoned') {
    suggestions.push(
      'Prepare strong evidence to overcome presumption of abandonment',
      'Document all US ties: property, employment, family, taxes',
      'Consider hiring an immigration attorney before your next entry',
    );
  }

  if (riskFactors.hasPatternOfNonResidence) {
    suggestions.push(
      'Your travel pattern suggests non-residence',
      'Spend more continuous time in the US',
      'Maintain stronger US ties and documentation',
    );
  }
}

export function handleReentryPermitSuggestions(
  suggestions: string[],
  reentryPermit: ReentryPermit,
  riskFactors: { totalRiskScore: number },
  currentDate: Date,
): void {
  if (reentryPermit.status === 'none' && riskFactors.totalRiskScore >= 3) {
    suggestions.push('Consider applying for a reentry permit before future long trips');
  }

  if (reentryPermit.status === 'approved' && reentryPermit.expirationDate) {
    const expiryDate = parseUTCDate(reentryPermit.expirationDate);
    const daysUntilExpiry = differenceInDays(expiryDate, currentDate);

    if (daysUntilExpiry <= 180) {
      suggestions.push(
        `Reentry permit expires in ${daysUntilExpiry} days`,
        'Plan to return before expiration or apply for renewal',
      );
    }
  }
}

export function handleGeneralRiskSuggestions(
  suggestions: string[],
  n470Exemption: N470Exemption,
  riskFactors: { currentlyAbroad: boolean; totalRiskScore: number },
  currentStatus: string,
): void {
  if (
    n470Exemption.status === 'none' &&
    (riskFactors.currentlyAbroad ||
      riskFactors.totalRiskScore >= 2 ||
      currentStatus !== 'maintained')
  ) {
    suggestions.push('If employed by qualifying US entity abroad, consider N-470 application');
  }

  if (currentStatus === 'at_risk') {
    suggestions.push(
      'Limit future trips to under 6 months',
      'Maintain strong evidence of US residence',
    );
  }
}
