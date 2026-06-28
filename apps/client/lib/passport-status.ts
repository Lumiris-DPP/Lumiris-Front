import type { Passport, PassportStatus } from '@lumiris/types';
import type { WizardStep } from './draft-store';

export const PASSPORT_STATUS_LABEL: Record<PassportStatus, string> = {
    Draft: 'Brouillon',
    InCompletion: 'En cours de complétion',
    Published: 'Publié',
};

export const PASSPORT_STATUS_DESCRIPTION: Record<PassportStatus, string> = {
    Draft: 'Édition en cours, non visible par les clients',
    InCompletion: 'Champ ESPR/AGEC manquant — score plafonné à D',
    Published: 'Publié, visible via QR/NFC',
};

export const INCOMPLETION_FULL_LABEL = 'Passeport en cours de complétion';

export function isDraftLike(status: PassportStatus): boolean {
    return status === 'Draft' || status === 'InCompletion';
}

/**
 * Deep-link to resume a draft DPP at the step where the artisan left off
 * ({@link WizardStep}), defaulting to the first step. Published passports link
 * to their detail page.
 */
export function resumeHref(passport: Passport, lastStep?: WizardStep): string {
    if (passport.status === 'Published') return `/passports/${passport.id}`;
    return `/create/${passport.id}/${lastStep ?? 'product'}`;
}
