'use client';

import { useMemo } from 'react';
import { computeScore } from '@lumiris/core/scoring';
import { mockArtisanById, mockCertificates, mockPassportById } from '@lumiris/mock-data';
import type { Artisan, Passport, ScoreResult } from '@lumiris/types';
import { draftToPassport, useDraftStore } from './draft-store';

interface PassportSource {
    /** Resolved passport (live draft preferred over the fixed mock), or null when the id is unknown. */
    passport: Passport | null;
    /** Owning artisan, or null when the passport (or its artisan) is unknown. */
    artisan: Artisan | null;
    /** Iris score, computed only when both passport and artisan are resolved. */
    score: ScoreResult | null;
}

/**
 * Resolves a passport from local sources (in-progress draft, then fixed mock)
 * along with its artisan and Iris score. Shared by the preview/print routes so
 * the draft → mock → artisan → score resolution lives in one place.
 *
 * Note: API-backed resolution is intentionally out of scope here — the detail
 * view owns that path because it needs the raw DTO for field-level fallbacks.
 */
export function usePassportSource(id: string): PassportSource {
    const draft = useDraftStore((s) => s.drafts[id]);

    const passport = useMemo<Passport | null>(
        () => (draft ? draftToPassport(draft) : (mockPassportById(id) ?? null)),
        [draft, id],
    );

    const artisan = useMemo<Artisan | null>(
        () => (passport ? (mockArtisanById(passport.artisanId) ?? null) : null),
        [passport],
    );

    const score = useMemo<ScoreResult | null>(
        () =>
            passport && artisan
                ? computeScore(passport, { artisan, certificates: mockCertificates, now: new Date() })
                : null,
        [passport, artisan],
    );

    return { passport, artisan, score };
}
