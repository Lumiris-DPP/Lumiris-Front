import type { PlanDto } from '@lumiris/api-client';

/** Formats a cents amount as a localized euro number (no symbol). */
export function euros(cents: number): string {
    return (cents / 100).toLocaleString('fr-FR');
}

/** Human label for a plan's passport quota. */
export function quotaLabel(plan: PlanDto): string {
    return plan.unlimited ? 'Passeports illimités' : `${plan.passportQuota} passeports actifs`;
}
