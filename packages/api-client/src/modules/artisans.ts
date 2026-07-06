import type { Http } from '../core/http';
import type { ArtisanProfileResponse, ArtisanRegisterRequest } from '../types/artisans';

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
