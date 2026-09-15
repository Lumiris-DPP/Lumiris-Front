'use client';

import { useConsent } from '@lumiris/ui/components/consent-banner';
import { WebVitals as TelemetryWebVitals } from '@lumiris/telemetry/web-vitals-component';
import { env } from '@/env';

export function WebVitals() {
    // Mesure d'audience anonyme : chargée uniquement après consentement (bandeau CNIL).
    const { analytics } = useConsent();
    if (!analytics) return null;

    return (
        <TelemetryWebVitals
            app={env.NEXT_PUBLIC_APP_NAME}
            endpoint={`${env.NEXT_PUBLIC_API_BASE_URL}/api/telemetry/web-vitals`}
            sampleRate={env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE}
        />
    );
}
