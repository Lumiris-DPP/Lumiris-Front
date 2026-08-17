import type { Passport } from '@lumiris/types';

export type CurationStatus = 'pending' | 'validated' | 'changes_requested' | 'flagged' | 'archived';

/**
 * Statut de curation effectif d'un passeport : la décision prise en console si elle existe,
 * sinon celle portée par la modération du passeport lui-même.
 */
export function deriveCurationStatus(passport: Passport, decided: CurationStatus | undefined): CurationStatus {
    if (decided) return decided;
    if (passport.moderation?.status === 'Approved') return 'validated';
    if (passport.moderation?.status === 'Rejected') return 'flagged';
    return 'pending';
}

/** File de curation : un passeport qui attend encore une décision de curateur. */
export function isAwaitingCuration(status: CurationStatus): boolean {
    return status === 'pending' || status === 'changes_requested';
}
