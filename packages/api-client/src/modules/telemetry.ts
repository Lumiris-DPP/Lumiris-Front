import type { Http } from '../core/http';
import type { WebVitalPayload } from '../types/telemetry';

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
