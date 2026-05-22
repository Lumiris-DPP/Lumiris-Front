import type { EffectiveStatus } from './types';

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
    pending: 'En attente',
    validated: 'Validé',
    changes_requested: 'Changements demandés',
    flagged: 'Rejeté',
    archived: 'Archivé',
};

export const STATUS_TONE: Record<EffectiveStatus, string> = {
    pending: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    validated: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    changes_requested: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    flagged: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    archived: 'border-muted-foreground/40 bg-muted text-muted-foreground',
};

export type StatusFilterValue = 'all' | 'pending' | 'validated' | 'flagged';

export const STATUS_FILTER_OPTIONS: ReadonlyArray<{ label: string; value: StatusFilterValue }> = [
    { label: 'Tous statuts', value: 'all' },
    { label: 'En attente', value: 'pending' },
    { label: 'Validés', value: 'validated' },
    { label: 'Rejetés', value: 'flagged' },
];

export function matchesStatusFilter(rowStatus: EffectiveStatus, filter: StatusFilterValue): boolean {
    if (filter === 'all') return true;
    if (filter === 'pending') return rowStatus === 'pending' || rowStatus === 'changes_requested';
    return rowStatus === filter;
}
