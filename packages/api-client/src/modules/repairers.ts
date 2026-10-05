import type { Http } from '../core/http';
import type {
    RepairAppointmentRequest,
    RepairDeclineRequest,
    RepairerClaimPreview,
    RepairerClaimRequest,
    RepairerProfileResponse,
    RepairerProfileUpdateRequest,
    RepairerPublicProfileResponse,
    RepairerRegisterRequest,
    RepairerReviewRequest,
    RepairerReviewResponse,
    RepairerSearchQuery,
    RepairerSearchResult,
    RepairMessageRequest,
    RepairMessageResponse,
    RepairQuoteRequest,
    RepairRequestCreateRequest,
    RepairRequestResponse,
    RepairRequestReviewRequest,
    RepairPayRequest,
    RepairPaymentIntentResponse,
    RepairPayoutSchedule,
} from '../types/repairers';
import type { KybDetailsRequest, KybDocumentLabel, KybDocumentUploadOptions } from '../types/kyb';

export function repairersApi(http: Http) {
    return {
        me(): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/me');
        },
        register(req: RepairerRegisterRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/register', { method: 'POST', body: req });
        },
        // Prévisualise une fiche annuaire à réclamer (données pré-remplies pour l'onboarding).
        claimPreview(token: string): Promise<RepairerClaimPreview> {
            return http.request<RepairerClaimPreview>(`/v1/repairers/claim/${token}`);
        },
        // Rattache la fiche annuaire (jeton reçu par e-mail) au compte retoucheur courant.
        claim(req: RepairerClaimRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/claim', { method: 'POST', body: req });
        },
        updateProfile(req: RepairerProfileUpdateRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/me/profile', { method: 'PUT', body: req });
        },
        submitKyb(req: KybDetailsRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/me/kyb', { method: 'PUT', body: req });
        },
        uploadKybDocument(
            label: KybDocumentLabel,
            file: File,
            options?: KybDocumentUploadOptions,
        ): Promise<RepairerProfileResponse> {
            const form = new FormData();
            form.append('file', file);
            return http.request<RepairerProfileResponse>(`/api/repairers/me/kyb/documents/${label}`, {
                method: 'POST',
                body: form,
                query: { expiresAt: options?.expiresAt },
            });
        },
        getPublicById(id: string): Promise<RepairerPublicProfileResponse> {
            return http.request<RepairerPublicProfileResponse>(`/v1/repairers/${id}`);
        },
        search(query: RepairerSearchQuery): Promise<RepairerSearchResult[]> {
            return http.request<RepairerSearchResult[]>('/v1/repairers/search', {
                query: {
                    lat: query.lat,
                    lng: query.lng,
                    specialty: query.specialty,
                    radiusKm: query.radiusKm,
                    sort: query.sort,
                    page: query.page,
                    size: query.size,
                },
            });
        },
        getReviews(repairerId: string): Promise<RepairerReviewResponse[]> {
            return http.request<RepairerReviewResponse[]>(`/v1/repairers/${repairerId}/reviews`);
        },
        addReview(repairerId: string, req: RepairerReviewRequest): Promise<RepairerReviewResponse> {
            return http.request<RepairerReviewResponse>(`/v1/repairers/${repairerId}/reviews`, {
                method: 'POST',
                body: req,
            });
        },

        // Repairer side (authenticated)
        myRequests(): Promise<RepairRequestResponse[]> {
            return http.request<RepairRequestResponse[]>('/api/repairers/me/requests');
        },
        myPayouts(): Promise<RepairPayoutSchedule> {
            return http.request<RepairPayoutSchedule>('/api/repairers/me/payouts');
        },
        submitQuote(requestId: string, req: RepairQuoteRequest): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repairers/me/requests/${requestId}/quote`, {
                method: 'POST',
                body: req,
            });
        },
        declineRequest(requestId: string, req?: RepairDeclineRequest): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repairers/me/requests/${requestId}/decline`, {
                method: 'POST',
                body: req,
            });
        },
        startRepair(requestId: string): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repairers/me/requests/${requestId}/start`, {
                method: 'POST',
            });
        },
        completeRepair(requestId: string): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repairers/me/requests/${requestId}/complete`, {
                method: 'POST',
            });
        },
        repairerMessages(requestId: string): Promise<RepairMessageResponse[]> {
            return http.request<RepairMessageResponse[]>(`/api/repairers/me/requests/${requestId}/messages`);
        },
        sendRepairerMessage(requestId: string, req: RepairMessageRequest): Promise<RepairMessageResponse> {
            return http.request<RepairMessageResponse>(`/api/repairers/me/requests/${requestId}/messages`, {
                method: 'POST',
                body: req,
            });
        },
    };
}

export function repairRequestsApi(http: Http) {
    return {
        // Consumer side (authenticated)
        create(req: RepairRequestCreateRequest): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>('/api/repair-requests', { method: 'POST', body: req });
        },
        mine(): Promise<RepairRequestResponse[]> {
            return http.request<RepairRequestResponse[]>('/api/repair-requests/mine');
        },
        acceptQuote(requestId: string, req: RepairAppointmentRequest): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repair-requests/${requestId}/accept-quote`, {
                method: 'POST',
                body: req,
            });
        },
        // Règle le devis (Payment Element embarqué) — le paiement vaut acceptation.
        payQuote(requestId: string, req?: RepairPayRequest): Promise<RepairPaymentIntentResponse> {
            return http.request<RepairPaymentIntentResponse>(`/api/repair-requests/${requestId}/pay`, {
                method: 'POST',
                body: req ?? {},
            });
        },
        refuseQuote(requestId: string): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repair-requests/${requestId}/refuse-quote`, {
                method: 'POST',
            });
        },
        cancel(requestId: string): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repair-requests/${requestId}/cancel`, {
                method: 'POST',
            });
        },
        // Avis vérifié : uniquement sur une demande TERMINÉE qui vous appartient, un seul par demande.
        submitReview(requestId: string, req: RepairRequestReviewRequest): Promise<RepairerReviewResponse> {
            return http.request<RepairerReviewResponse>(`/api/repair-requests/${requestId}/review`, {
                method: 'POST',
                body: req,
            });
        },
        messages(requestId: string): Promise<RepairMessageResponse[]> {
            return http.request<RepairMessageResponse[]>(`/api/repair-requests/${requestId}/messages`);
        },
        sendMessage(requestId: string, req: RepairMessageRequest): Promise<RepairMessageResponse> {
            return http.request<RepairMessageResponse>(`/api/repair-requests/${requestId}/messages`, {
                method: 'POST',
                body: req,
            });
        },
    };
}
