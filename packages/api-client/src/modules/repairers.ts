import type { Http } from '../core/http';
import type {
    RepairAppointmentRequest,
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
} from '../types/repairers';

export function repairersApi(http: Http) {
    return {
        me(): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/me');
        },
        register(req: RepairerRegisterRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/register', { method: 'POST', body: req });
        },
        updateProfile(req: RepairerProfileUpdateRequest): Promise<RepairerProfileResponse> {
            return http.request<RepairerProfileResponse>('/api/repairers/me/profile', { method: 'PUT', body: req });
        },
        getPublicById(id: string): Promise<RepairerPublicProfileResponse> {
            return http.request<RepairerPublicProfileResponse>(`/v1/repairers/${id}`);
        },
        search(query: RepairerSearchQuery): Promise<RepairerSearchResult[]> {
            return http.request<RepairerSearchResult[]>('/v1/repairers/search', {
                query: { lat: query.lat, lng: query.lng, specialty: query.specialty, radiusKm: query.radiusKm },
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
        submitQuote(requestId: string, req: RepairQuoteRequest): Promise<RepairRequestResponse> {
            return http.request<RepairRequestResponse>(`/api/repairers/me/requests/${requestId}/quote`, {
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
