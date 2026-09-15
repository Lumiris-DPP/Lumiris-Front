'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { useConsent } from '@lumiris/ui/components/consent-banner';

// Vercel Analytics ne se charge qu'en production ET après consentement à la mesure d'audience.
export function Analytics() {
    const { analytics } = useConsent();

    if (process.env.NODE_ENV !== 'production' || !analytics) return null;

    return <VercelAnalytics />;
}
