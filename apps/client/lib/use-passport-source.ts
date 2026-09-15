'use client';

import { useMemo } from 'react';
import { useDppForm } from '@lumiris/api-client/react';
import type { Artisan, Passport } from '@lumiris/types';
import { useAuthStore } from './auth-store';
import { useAuthHydrated } from './use-auth';
import { useCurrentArtisan } from './current-artisan';
import { draftToPassport, useDraftStore } from './draft-store';
import { dppToPassport } from './passport-adapter';

interface PassportSource {
    /** Resolved passport — the local draft when there is one, the backend otherwise. */
    passport: Passport | null;
    /** Owning artisan, or null when the passport is unknown. */
    artisan: Artisan | null;
    /** True tant qu'on ne peut pas conclure — distingue « inconnu » de « pas encore chargé ». */
    isLoading: boolean;
    isDraft: boolean;
}

/**
 * Resolves a passport from the local draft, then the backend, along with its artisan.
 * Shared by the preview/print routes so the resolution lives in one place.
 *
 * Le repli backend n'est pas optionnel : en mode réel les identifiants viennent de
 * `GET /api/dpp-forms`, qu'aucun brouillon local ne connaît — sans lui, l'aperçu et les
 * impressions répondaient « introuvable » sur des passeports pourtant valides.
 */
export function usePassportSource(id: string): PassportSource {
    const draft = useDraftStore((s) => s.drafts[id]);
    const hydrated = useAuthHydrated();
    const isRealMode = useAuthStore((s) => s.token != null);
    const currentArtisan = useCurrentArtisan();

    const localPassport = useMemo<Passport | null>(() => (draft ? draftToPassport(draft) : null), [draft]);

    const remote = useDppForm(id, { enabled: isRealMode && localPassport === null });

    const passport = useMemo<Passport | null>(
        () => localPassport ?? (remote.data ? dppToPassport(remote.data, currentArtisan.id) : null),
        [localPassport, remote.data, currentArtisan.id],
    );

    // Avant hydratation, la session n'est pas connue : conclure « introuvable » à ce moment-là
    // ferait répondre 404 à une page qui s'affichera pourtant.
    return {
        passport,
        artisan: passport ? currentArtisan : null,
        isLoading: localPassport === null && (!hydrated || remote.isLoading),
        isDraft: localPassport !== null,
    };
}
