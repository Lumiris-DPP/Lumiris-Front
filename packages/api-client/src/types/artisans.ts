export type ArtisanStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ArtisanProfileResponse {
    id: string;
    userEmail: string;
    userName: string;
    status: ArtisanStatus;
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
}
