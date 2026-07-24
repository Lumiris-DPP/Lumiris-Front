'use client';

import { useEffect, useRef, useState } from 'react';
import { useApiClient, useTrackEvent } from '@lumiris/api-client/react';
import type { DppEventDto, DppFormPublicDto } from '@lumiris/api-client';
import { PublicPassportDetail } from '@/features/public-passport-detail';

export function PassportView({ code, accessToken }: { code: string; accessToken?: string | null }) {
    const [data, setData] = useState<DppFormPublicDto | null>(null);
    const [events, setEvents] = useState<DppEventDto[]>([]);
    const [notFound, setNotFound] = useState(false);
    const api = useApiClient();
    const trackEvent = useTrackEvent();
    const tracked = useRef(false);

    useEffect(() => {
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
        trackEvent.mutate({ publicCode: code, type: 'VIEW' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, code]);

    if (notFound) {
        return (
            <div className="bg-background flex h-dvh items-center justify-center p-8">
                <div className="space-y-1 text-center">
                    <p className="text-foreground text-sm font-semibold">DPP introuvable</p>
                    <p className="text-muted-foreground text-xs">Code : {code}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-background flex h-dvh items-center justify-center">
                <p className="text-muted-foreground font-mono text-xs">Chargement…</p>
            </div>
        );
    }

    return (
        <div className="bg-background mx-auto flex h-dvh max-w-md flex-col">
            <PublicPassportDetail
                dpp={data.dpp}
                irisScore={data.irisScore}
                events={events}
                artisanSlug={data.artisanSlug}
                accessLevel={data.accessLevel}
            />
        </div>
    );
}
