import type { RepairerSpecialty } from '@lumiris/types';

// V1 strictement textile — les spécialités hors-textile restent dans @lumiris/types pour la phase 4 mais ne sont pas surfacées ici.
export type V1Specialty =
    | 'retouche'
    | 'couture'
    | 'broderie'
    | 'cordonnerie'
    | 'maroquinerie'
    | 'tricot-maille'
    | 'teinture-textile';

export const V1_SPECIALTIES: readonly V1Specialty[] = [
    'retouche',
    'couture',
    'broderie',
    'cordonnerie',
    'maroquinerie',
    'tricot-maille',
    'teinture-textile',
] as const;

export const V1_SPECIALTY_LABEL: Record<V1Specialty, string> = {
    retouche: 'Retouche',
    couture: 'Couture',
    broderie: 'Broderie',
    cordonnerie: 'Cordonnerie',
    maroquinerie: 'Maroquinerie',
    'tricot-maille': 'Tricot & Maille',
    'teinture-textile': 'Teinture textile',
};

// Les codes hors-textile renvoient null et sont silencieusement filtrés à l'affichage.
export function toV1Specialty(code: RepairerSpecialty): V1Specialty | null {
    switch (code) {
        case 'alteration':
            return 'retouche';
        case 'embroidery':
            return 'broderie';
        case 'shoe-repair':
            return 'cordonnerie';
        case 'leather':
            return 'maroquinerie';
        case 'lining':
            return 'couture';
        default:
            return null;
    }
}

export const LUMIRIS_LOCAL_PRICE_MONTHLY_EUR = 19;
export const LUMIRIS_LOCAL_PRICE_YEARLY_EUR = 190;
export const LUMIRIS_LOCAL_ARPU_EUR = 230; // 190 € abonnement + ~40 € affiliation

export const COMMISSION_FLAT_MIN_EUR = 4;
export const COMMISSION_FLAT_MAX_EUR = 10;
export const COMMISSION_PCT = 8;

export const COMMISSION_ANONYMIZE_AFTER_DAYS = 90;
export const COMMISSION_WINDOW_DAYS = 90;
export const RESPONSE_DELAY_MIN_BOOKINGS = 5;
export const REVIEW_HIDE_REASON_MIN_CHARS = 20;
