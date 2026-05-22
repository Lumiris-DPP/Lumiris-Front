import type { Passport, PassportStatus } from '@lumiris/types';

export const STATUS_OPTIONS: ReadonlyArray<{ label: string; value: PassportStatus | 'all' }> = [
    { label: 'Tous statuts', value: 'all' },
    { label: 'Brouillon', value: 'Draft' },
    { label: 'En complétion', value: 'InCompletion' },
    { label: 'Publié', value: 'Published' },
];

export const GRADE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Tous grades', value: 'all' },
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'C', value: 'C' },
    { label: 'D', value: 'D' },
    { label: 'E', value: 'E' },
];

export function isDraftLike(status: PassportStatus): boolean {
    return status === 'Draft' || status === 'InCompletion';
}

export function resumeHref(passport: Passport): string {
    if (passport.status === 'Published') return `/passports/${passport.id}`;
    if (passport.materials.length === 0) return `/create/${passport.id}/identification`;
    if (passport.steps.length === 0) return `/create/${passport.id}/composition`;
    if (passport.warranty.durationMonths === 0) return `/create/${passport.id}/manufacturing`;
    return `/create/${passport.id}/publish`;
}
