import type { Http } from '../core/http';
import type { AtelierStatsQuery, AtelierStatsResponse, TrackEventRequest } from '../types/atelier-stats';

export function atelierStatsApi(http: Http) {
    return {
        getStats(query?: AtelierStatsQuery): Promise<AtelierStatsResponse> {
            return http.request<AtelierStatsResponse>('/v1/atelier/stats', {
                query: { from: query?.from, to: query?.to },
            });
        },
    };
}

export function eventsApi(http: Http) {
    return {
        track(req: TrackEventRequest): Promise<void> {
            return http.request<void>('/v1/events', { method: 'POST', body: req, skipJson: true });
        },
    };
}
