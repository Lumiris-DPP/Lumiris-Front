import type { IrisGrade, Passport } from '@lumiris/types';
import type { CurationOverlayStatus } from './curation-store';

export type EffectiveStatus = CurationOverlayStatus;

export interface PassportRow {
    passport: Passport;
    status: EffectiveStatus;
    ageHours: number;
    grade: IrisGrade;
    capApplied: boolean;
    hasMissingRegulatoryField: boolean;
    isAtelierPlus: boolean;
}

export const FLAG_TAGS: readonly string[] = [
    'composition_douteuse',
    'origine_non_prouvee',
    'certif_expire',
    'photo_recyclee',
    'declaration_suspecte',
    'autre',
];
