import type { Http } from '../core/http';
import type { RepairerProfileResponse } from '../types/repairers';
import type { RejectArtisanRequest } from '../types/admin-artisans';

export function adminRepairersApi(http: Http) {
    return {
        listPending(): Promise<RepairerProfileResponse[]> {
            return http.request<RepairerProfileResponse[]>('/api/admin/repairers', { method: 'GET' });
        },
        verify(id: string): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>(`/api/admin/repairers/${id}/verify`, { method: 'PATCH' });
        },
        reject(id: string, req?: RejectArtisanRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>(`/api/admin/repairers/${id}/reject`, {
                method: 'PATCH',
                body: req,
            });
        },
    };
}
