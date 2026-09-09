import type { Http } from '../core/http';
import type {
    CoverageGapResponse,
    RepairerDirectoryImportReport,
    RepairerDirectoryImportRequest,
    RepairerInviteRequest,
    RepairerProfileResponse,
} from '../types/repairers';
import type { RejectArtisanRequest } from '../types/admin-artisans';

export function adminRepairersApi(http: Http) {
    return {
        listPending(): Promise<RepairerProfileResponse[]> {
            return http.request<RepairerProfileResponse[]>('/api/admin/repairers', { method: 'GET' });
        },
        listAll(): Promise<RepairerProfileResponse[]> {
            return http.request<RepairerProfileResponse[]>('/api/admin/repairers/all', { method: 'GET' });
        },
        // Import annuaire (SIRENE…). Les fiches arrivent en UNCLAIMED.
        importDirectory(req: RepairerDirectoryImportRequest): Promise<RepairerDirectoryImportReport> {
            return http.request<RepairerDirectoryImportReport>('/api/admin/repairers/import', {
                method: 'POST',
                body: req,
            });
        },
        // (Re)génère un jeton de réclamation pour une fiche sans compte.
        issueClaimToken(id: string): Promise<{ claimToken: string }> {
            return http.request<{ claimToken: string }>(`/api/admin/repairers/${id}/claim-token`, { method: 'POST' });
        },
        // Envoie l'e-mail de prospection à une fiche annuaire.
        invite(id: string, req: RepairerInviteRequest): Promise<void> {
            return http.request<void>(`/api/admin/repairers/${id}/invite`, { method: 'POST', body: req });
        },
        // Zones de demande non satisfaite (recherches consommateur à 0 résultat).
        coverageGaps(days = 30): Promise<CoverageGapResponse[]> {
            return http.request<CoverageGapResponse[]>('/api/admin/repairers/coverage-gaps', {
                query: { days },
            });
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
        markOngoing(id: string): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>(`/api/admin/repairers/${id}/kyb-ongoing`, {
                method: 'PATCH',
            });
        },
        markIncomplete(id: string, req?: RejectArtisanRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>(`/api/admin/repairers/${id}/kyb-incomplete`, {
                method: 'PATCH',
                body: req,
            });
        },
    };
}
