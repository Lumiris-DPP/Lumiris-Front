'use client';

import { useEffect, useRef } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { initWebVitals } from './web-vitals';
import type { AppName } from './types';

export interface WebVitalsProps {
    app: AppName;
    endpoint: string;
    sampleRate?: number;
    /**
     * Route associée aux métriques. Optionnel — les frameworks sans router
     * (Vite) ou avant que le routing ne soit câblé peuvent l'omettre ('/').
     */
    pathname?: string;
}

export function WebVitals({ app, endpoint, sampleRate, pathname }: WebVitalsProps) {
    const registered = useRef(false);

    useEffect(() => {
        // web-vitals enregistre chaque métrique une seule fois par page load ;
        // on garde un garde-fou contre le double-mount (StrictMode, HMR).
        if (registered.current) return;
        registered.current = true;

        const reporter = initWebVitals({
            endpoint,
            app,
            route: pathname ?? '/',
            ...(sampleRate !== undefined ? { sampleRate } : {}),
        });

        onCLS(reporter);
        onFCP(reporter);
        onINP(reporter);
        onLCP(reporter);
        onTTFB(reporter);
    }, [app, endpoint, sampleRate, pathname]);

    return null;
}
