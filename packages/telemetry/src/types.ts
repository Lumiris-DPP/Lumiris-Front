import type { LUMIRIS_APP_NAMES, LUMIRIS_SERVICES, WEB_VITAL_NAMES } from './constants';

export type TelemetryEnv = 'development' | 'production' | 'test';
export type AppName = (typeof LUMIRIS_APP_NAMES)[number];
export type ServiceName = (typeof LUMIRIS_SERVICES)[number];
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

export interface WebVitalPayload {
    name: WebVitalName;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    sessionId: string;
    app: AppName;
    route: string;
    navigationType?: string;
    timestamp: number;
}
