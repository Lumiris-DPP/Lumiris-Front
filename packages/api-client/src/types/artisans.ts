import type { KybDetailsResponse } from './kyb';

export type ArtisanStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNCLAIMED';
export type ArtisanSource = 'SELF' | 'SIRENE' | 'MANUAL';

export interface ArtisanProfileResponse {
    id: string;
    /** Absent pour une fiche annuaire (UNCLAIMED) : aucun compte rattaché. */
    userEmail?: string;
    userName?: string;
    status: ArtisanStatus;
    source?: ArtisanSource;
    /** Omitted by the backend (@JsonInclude NON_NULL) until step 1 of onboarding sets it. */
    siret?: string;
    companyName?: string;
    nafCode?: string;
    declarationSigned: boolean;
    signatureTimestamp?: string;
    rejectionReason?: string;
    createdAt: string;

    slug?: string;
    published: boolean;
    /** Date de retour de l'atelier, absente quand il n'est pas en congés. */
    pausedUntil?: string;
    atelierName?: string;
    story?: string;
    method?: string;
    journey?: string;
    specialties?: string[];
    city?: string;
    region?: string;
    websiteUrl?: string;
    links?: Record<string, string>;
    photos: ArtisanPhotoResponse[];
    kyb?: KybDetailsResponse;
}

// Mise en congés de l'atelier : les pièces restent achetables, le délai d'expédition annoncé est
// allongé jusqu'à cette date.
export interface ArtisanPauseRequest {
    until: string;
}

export interface ArtisanRegisterRequest {
    siret: string;
}

export interface ArtisanVitrineUpdateRequest {
    atelierName?: string;
    story?: string;
    method?: string;
    journey?: string;
    specialties?: string[];
    city?: string;
    region?: string;
    websiteUrl?: string;
    links?: Record<string, string>;
}

export interface ArtisanPhotoResponse {
    id: string;
    url: string;
}

// --- Import annuaire (admin) ---

export interface ArtisanDirectoryImportRequest {
    source: ArtisanSource;
    departments?: string[];
    nafCodes?: string[];
    maxPages?: number;
}

export interface ArtisanDirectoryImportReport {
    source: ArtisanSource;
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
}

export interface ArtisanPublicProfileResponse {
    slug: string;
    displayName?: string;
    atelierName?: string;
    story?: string;
    method?: string;
    journey?: string;
    specialties?: string[];
    city?: string;
    region?: string;
    websiteUrl?: string;
    links?: Record<string, string>;
    photoUrls: string[];
    epvLabeled: boolean;
    ofgLabeled: boolean;
    gotsLabeled: boolean;
    oekoTexLabeled: boolean;
    /** Date de retour de l'atelier, absente quand il n'est pas en congés. */
    pausedUntil?: string;
    /** false = fiche annuaire sans compte (import SIRENE) : bandeau "pas encore dans le réseau". */
    claimed: boolean;
    interestCount: number;
    /** Ateliers SELF (pas d'adresse structurée) : absents, invisibles sur la carte. */
    lat?: number;
    lng?: number;
}
