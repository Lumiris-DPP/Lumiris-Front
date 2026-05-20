import type { Http } from './http';

export type WebVitalName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';
export type AppName = 'admin' | 'site' | 'client' | 'mobile';

export interface WebVitalPayload {
    name: WebVitalName;
    value: number;
    rating: WebVitalRating;
    sessionId: string;
    app: AppName;
    route: string;
    navigationType?: string;
    timestamp: number;
}

export function telemetryApi(http: Http) {
    return {
        webVital(payload: WebVitalPayload): Promise<void> {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const url = `${http.baseUrl.replace(/\/$/, '')}/api/telemetry/web-vitals`;
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                if (navigator.sendBeacon(url, blob)) return Promise.resolve();
            }
            return http.request<void>('/api/telemetry/web-vitals', {
                method: 'POST',
                body: payload,
                skipJson: true,
            });
        },
    };
}
