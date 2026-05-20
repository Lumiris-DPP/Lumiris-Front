export type WebVitalsName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
export type WebVitalsRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalsMetric {
    name: WebVitalsName;
    value: number;
    rating: WebVitalsRating;
    id: string;
    delta: number;
    navigationType?: string;
}

export type WebVitalsHandler = (metric: WebVitalsMetric) => void;

export interface WebVitalsReporterOptions {
    sampleRate?: number;
    tags?: Record<string, string>;
}

export function createWebVitalsReporter(
    handler: WebVitalsHandler,
    options: WebVitalsReporterOptions = {},
): WebVitalsHandler {
    const { sampleRate = 1, tags } = options;
    const rate = clamp01(sampleRate);

    return (metric) => {
        if (rate < 1 && Math.random() > rate) return;
        if (tags) {
            handler({ ...metric, ...tagMetric(metric, tags) });
            return;
        }
        handler(metric);
    };
}

export const noopWebVitalsHandler: WebVitalsHandler = () => {};

function clamp01(n: number): number {
    if (!Number.isFinite(n)) return 1;
    return Math.max(0, Math.min(1, n));
}

function tagMetric(metric: WebVitalsMetric, tags: Record<string, string>): Partial<WebVitalsMetric> {
    return {
        id: tags['app'] ? `${tags['app']}:${metric.id}` : metric.id,
    };
}
