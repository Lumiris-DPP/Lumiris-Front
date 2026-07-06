import type { Http } from './http';
import type { ArtisanProfileResponse } from './artisans';

export interface RejectArtisanRequest {
    reason?: string;
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
