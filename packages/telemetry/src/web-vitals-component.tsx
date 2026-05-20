'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
import { initWebVitals } from './web-vitals';
import type { AppName } from './types';

export interface WebVitalsProps {
    app: AppName;
    endpoint: string;
    sampleRate?: number;
}

export function WebVitals({ app, endpoint, sampleRate }: WebVitalsProps) {
    const route = usePathname() ?? '/';
    const reporter = initWebVitals({
        endpoint,
        app,
        route,
        ...(sampleRate !== undefined ? { sampleRate } : {}),
    });
    useReportWebVitals(reporter);
    return null;
}
