import type { PassportStatus } from '@lumiris/types';

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
