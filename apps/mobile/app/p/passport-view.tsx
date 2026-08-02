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
