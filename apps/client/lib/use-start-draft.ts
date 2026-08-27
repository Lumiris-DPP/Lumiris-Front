'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentArtisan } from './current-artisan';
import { useDraftStore } from './draft-store';

/**
 * Creates a fresh DPP draft and redirects into the wizard. Reaching the wizard at all
 * requires an active ATELIER subscription — that gate lives in the `/create` layout
 * (RequireSubscription), so this hook only runs once the gate has let the route through.
 * The quota gate stays at publication (see the "Publier" action in the last step).
 * Runs once; the caller only renders a loader while this resolves.
 */
export function useStartDraft(): void {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const createDraft = useDraftStore((s) => s.createDraft);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const id = createDraft(artisan.id);
        router.replace(`/create/${id}/product`);
    }, [artisan.id, createDraft, router]);
}
