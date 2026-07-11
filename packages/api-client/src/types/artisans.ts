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
}

export interface ArtisanRegisterRequest {
    siret: string;
}

export interface RejectArtisanRequest {
    reason?: string;
}
