'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DppFormDto } from '@lumiris/api-client';
import { useApiClient, useDppForms } from '@lumiris/api-client/react';
import type { Passport } from '@lumiris/types';
import { useAuthStore } from './auth-store';
import { useDraftStore, draftToPassport } from './draft-store';
import { dppSummaryToPassport, dppToPassport, passportStatusFromDpp } from './passport-adapter';

interface UsePassportsOptions {
    /**
     * Real mode only: also fetch each DPP's full detail so scoring reflects real
     * materials/eco data (used by the dashboard). Left off for count-only consumers
     * (sidebar, notifications) to avoid N extra requests.
     */
    detailed?: boolean;
}

/**
 * Passports for the given artisan: local wizard drafts + live DPPs from
 * GET /api/dpp-forms, optionally enriched with each DPP's full detail for
 * accurate scoring. Without a session only the local drafts remain.
 */
export function usePassports(artisanId: string, options?: UsePassportsOptions): readonly Passport[] {
    const detailed = options?.detailed ?? false;
    const drafts = useDraftStore((s) => s.drafts);
    const isRealMode = useAuthStore((s) => s.token != null);
    const api = useApiClient();
    const { data: summaries } = useDppForms({ enabled: isRealMode });

    const idsKey = useMemo(
        () => (isRealMode && detailed && summaries ? summaries.map((s) => s.id).join('|') : ''),
        [isRealMode, detailed, summaries],
    );

    const [details, setDetails] = useState<Record<string, DppFormDto>>({});

    useEffect(() => {
        const ids = idsKey ? idsKey.split('|') : [];
        if (ids.length === 0) {
            setDetails((prev) => (Object.keys(prev).length === 0 ? prev : {}));
            return;
        }
        let cancelled = false;
        Promise.all(
            ids.map((id) =>
                api.dpp
                    .get(id)
                    .then((dto) => [id, dto] as const)
                    .catch(() => null),
            ),
        ).then((entries) => {
            if (cancelled) return;
            const next: Record<string, DppFormDto> = {};
            for (const entry of entries) if (entry) next[entry[0]] = entry[1];
            setDetails(next);
        });
        return () => {
            cancelled = true;
        };
    }, [idsKey, api]);

    return useMemo(() => {
        const draftPassports = Object.values(drafts)
            .filter((d) => d.artisanId === artisanId)
            .map(draftToPassport);

        const real = (summaries ?? []).map((summary) => {
            const detail = details[summary.id];
            const base = detail ? dppToPassport(detail, artisanId) : dppSummaryToPassport(summary, artisanId);
            // The summary status is the authoritative lifecycle state (VALID/DRAFT/INVALID).
            return { ...base, status: passportStatusFromDpp(summary.status) };
        });

        return [...draftPassports, ...real];
    }, [drafts, artisanId, summaries, details]);
}
