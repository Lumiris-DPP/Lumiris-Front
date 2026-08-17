import type { IrisGrade, Passport } from '@lumiris/types';
import type { CurationStatus } from '@/lib/curation-status';

export type EffectiveStatus = CurationStatus;

export interface PassportRow {
    passport: Passport;
    status: EffectiveStatus;
    ageHours: number;
    grade: IrisGrade;
    capApplied: boolean;
    hasMissingRegulatoryField: boolean;
    isAtelierPlus: boolean;
    /** Date de la décision de curation — nulle tant que le passeport n'a pas été tranché. */
    decidedAt: string | null;
}

export const FLAG_TAGS: readonly string[] = [
    'composition_douteuse',
    'origine_non_prouvee',
    'certif_expire',
    'photo_recyclee',
    'declaration_suspecte',
    'autre',
];
