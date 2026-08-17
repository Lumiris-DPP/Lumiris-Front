'use client';

import { useMemo } from 'react';
import { computeScore } from '@lumiris/core/scoring';
import { useDppForm } from '@lumiris/api-client/react';
import { mockArtisanById, mockCertificates, mockPassportById } from '@lumiris/mock-data';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { useAuthStore } from './auth-store';
import { useAuthHydrated } from './use-auth';
import { useCurrentArtisan } from './current-artisan';
import { draftToPassport, useDraftStore } from './draft-store';
import { dppToPassport } from './passport-adapter';

interface PassportSource {
    /** Resolved passport (live draft preferred over the fixed mock), or null when the id is unknown. */
    passport: Passport | null;
    /** Owning artisan, or null when the passport (or its artisan) is unknown. */
    artisan: Artisan | null;
    /** Iris score, computed only when both passport and artisan are resolved. */
    score: ScoreResult | null;
    /** True tant qu'on ne peut pas conclure — distingue « inconnu » de « pas encore chargé ». */
    isLoading: boolean;
}

/**
 * Resolves a passport from the local draft, then the backend, then the fixed mocks,
 * along with its artisan and Iris score. Shared by the preview/print routes so the
 * resolution lives in one place.
 *
 * Le repli backend n'est pas optionnel : en mode réel les identifiants viennent de
 * `GET /api/dpp-forms`, qu'aucune fixture ne connaît — sans lui, l'aperçu et les
 * impressions répondaient « introuvable » sur des passeports pourtant valides.
 */
export function usePassportSource(id: string): PassportSource {
    const draft = useDraftStore((s) => s.drafts[id]);
    const hydrated = useAuthHydrated();
    const isRealMode = useAuthStore((s) => s.token != null);
    const currentArtisan = useCurrentArtisan();

    const localPassport = useMemo<Passport | null>(
        () => (draft ? draftToPassport(draft) : (mockPassportById(id) ?? null)),
        [draft, id],
    );

    const remote = useDppForm(id, { enabled: isRealMode && localPassport === null });

    const passport = useMemo<Passport | null>(
        () => localPassport ?? (remote.data ? dppToPassport(remote.data, currentArtisan.id) : null),
        [localPassport, remote.data, currentArtisan.id],
    );

    const artisan = useMemo<Artisan | null>(
        () => (passport ? (mockArtisanById(passport.artisanId) ?? currentArtisan) : null),
        [passport, currentArtisan],
    );

    const score = useMemo<ScoreResult | null>(
        () =>
            passport && artisan
                ? computeScore(passport, { artisan, certificates: mockCertificates, now: new Date() })
                : null,
        [passport, artisan],
    );

    // Avant hydratation, la session n'est pas connue : conclure « introuvable » à ce moment-là
    // ferait répondre 404 à une page qui s'affichera pourtant.
    return { passport, artisan, score, isLoading: localPassport === null && (!hydrated || remote.isLoading) };
}
