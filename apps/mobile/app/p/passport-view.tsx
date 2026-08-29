'use client';

import { useEffect, useRef, useState } from 'react';
import { useApiClient, useTrackEvent } from '@lumiris/api-client/react';
import type { DppEventDto, DppFormPublicDto } from '@lumiris/api-client';
import { MobileScreen } from '@/components/mobile-screen';
import { PublicPassportDetail } from '@/features/public-passport-detail';

export function PassportView({ code, accessToken }: { code: string; accessToken?: string | null }) {
    const [data, setData] = useState<DppFormPublicDto | null>(null);
    const [events, setEvents] = useState<DppEventDto[]>([]);
    const [notFound, setNotFound] = useState(false);
    const api = useApiClient();
    const { mutate: trackEvent } = useTrackEvent();
    const tracked = useRef(false);
    // Limite le fetch à un par instance de composant (re-renders) — pas une garantie absolue
    // (StrictMode remonte, un lien peut être ouvert deux fois), donc la déduplication qui compte
    // pour la notification au propriétaire vit côté back (voir DppForm.lastScanNotifiedAt).
    const fetchedFor = useRef<string | null>(null);

    useEffect(() => {
        const key = `${code}:${accessToken ?? ''}`;
        if (fetchedFor.current === key) return;
        fetchedFor.current = key;

        api.dpp
            .getPublic(code, accessToken)
            .then(setData)
            .catch(() => setNotFound(true));
        api.dpp
            .listPublicEvents(code)
            .then(setEvents)
            .catch(() => setEvents([]));
    }, [code, accessToken, api]);

    useEffect(() => {
        if (!data || tracked.current) return;
        tracked.current = true;
        trackEvent({ publicCode: code, type: 'VIEW' });
    }, [data, code, trackEvent]);

    if (notFound) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background p-8">
                <div className="space-y-1 text-center">
                    <p className="text-sm font-semibold text-foreground">DPP introuvable</p>
                    <p className="text-xs text-muted-foreground">Code : {code}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-dvh items-center justify-center bg-background">
                <p className="font-mono text-xs text-muted-foreground">Chargement…</p>
            </div>
        );
    }

    return (
        <MobileScreen>
            <PublicPassportDetail
                dpp={data.dpp}
                irisScore={data.irisScore}
                events={events}
                artisanSlug={data.artisanSlug}
                accessLevel={data.accessLevel}
            />
        </MobileScreen>
    );
}
