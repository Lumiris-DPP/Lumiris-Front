import type { PassportStatus } from '@lumiris/types';

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
