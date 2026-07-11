import type { Http } from '../core/http';
import type { ArtisanProfileResponse, ArtisanRegisterRequest, RejectArtisanRequest } from '../types/artisans';

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

export function adminArtisansApi(http: Http) {
    return {
        listPending(): Promise<ArtisanProfileResponse[]> {
            return http.request<ArtisanProfileResponse[]>('/api/admin/artisans', { method: 'GET' });
        },
        verify(id: string): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>(`/api/admin/artisans/${id}/verify`, { method: 'PATCH' });
        },
        reject(id: string, req?: RejectArtisanRequest): Promise<ArtisanProfileResponse> {
            return http.request<ArtisanProfileResponse>(`/api/admin/artisans/${id}/reject`, {
                method: 'PATCH',
                body: req,
            });
        },
    };
}
