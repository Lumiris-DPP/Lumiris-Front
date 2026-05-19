import type { Passport } from '@lumiris/types';
import type { CurationOverlayStatus } from './curation-store';

export type EffectiveStatus = CurationOverlayStatus;

export interface PassportRow {
    passport: Passport;
    /** Statut effectif après application de l'overlay local. */
    status: EffectiveStatus;
    /** Délai en heures depuis la soumission (createdAt) - utilisé pour le tri FIFO. */
    ageHours: number;
    /** Vrai si le score a été plafonné par checkCaps - alimente le filtre dédié. */
    capApplied: boolean;
    /** Vrai si au moins un champ ESPR ou AGEC manque. */
    hasMissingRegulatoryField: boolean;
    /** Vrai si l'artisan a le flag ATELIER+ - alimente la vue audit d'équité. */
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
