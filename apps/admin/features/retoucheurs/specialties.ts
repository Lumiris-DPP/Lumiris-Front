import type { RepairerSpecialty } from '@lumiris/types';

// LUMIRIS Local V1 — strict textile-only. Les spécialités hors-textile (électronique,
// mobilier, électroménager…) restent côté @lumiris/types pour la phase 4 mais ne
// sont pas surfacées dans l'admin V1.
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

// Mapping codes @lumiris/types → libellés V1. Les codes hors-textile renvoient null
// et sont silencieusement filtrés à l'affichage.
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

// LUMIRIS Local — abonnement B2B2C. Source unique pour le JSX.
export const LUMIRIS_LOCAL_PRICE_MONTHLY_EUR = 19;
export const LUMIRIS_LOCAL_PRICE_YEARLY_EUR = 190;
export const LUMIRIS_LOCAL_ARPU_EUR = 230; // 190 € abonnement + ~40 € affiliation

// Commission affiliation retouche : forfait 4–10 € OU 8 % du devis accepté.
export const COMMISSION_FLAT_MIN_EUR = 4;
export const COMMISSION_FLAT_MAX_EUR = 10;
export const COMMISSION_PCT = 8;

// Délai d'anonymisation côté admin pour les mises en relation (RGPD).
export const COMMISSION_ANONYMIZE_AFTER_DAYS = 90;
// Fenêtre par défaut pour la liste des mises en relation.
export const COMMISSION_WINDOW_DAYS = 90;
// Seuil minimum d'événements pour qu'un délai de réponse soit affiché.
export const RESPONSE_DELAY_MIN_BOOKINGS = 5;
// Longueur minimale d'une raison de masquage d'avis.
export const REVIEW_HIDE_REASON_MIN_CHARS = 20;
