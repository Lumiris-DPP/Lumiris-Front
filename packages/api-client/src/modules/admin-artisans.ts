import type { Http } from '../core/http';
import type { ArtisanProfileResponse } from '../types/artisans';
import type { RejectArtisanRequest } from '../types/admin-artisans';

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
