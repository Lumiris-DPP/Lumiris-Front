import type { Http } from './http';

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

export function artisansApi(http: Http) {
    return {
        me(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/me');
        },
        register(req: ArtisanRegisterRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/register', { method: 'POST', body: req });
        },
        signDeclaration(): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>('/api/artisans/sign-declaration', { method: 'POST' });
        },
    };
}
