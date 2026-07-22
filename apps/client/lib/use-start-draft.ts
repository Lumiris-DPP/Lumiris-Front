'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentArtisan } from './current-artisan';
import { useDraftStore } from './draft-store';

/**
 * Creates a fresh DPP draft and redirects into the wizard. Drafts are free —
 * no subscription or quota is required to reach the wizard; the billing gate
 * only applies at publication (see the "Publier" action in the last step).
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
