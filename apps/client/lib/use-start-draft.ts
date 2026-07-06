'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@lumiris/ui/components/sonner';
import { useCurrentArtisan } from './current-artisan';
import { useDraftStore } from './draft-store';
import { useSubscription } from './use-subscription';

/**
 * Creates a fresh DPP draft and redirects into the wizard — unless the artisan's
 * quota blocks creation, in which case it routes to the subscription page. Runs
 * once; the caller only renders a loader while this resolves.
 */
export function useStartDraft(): void {
    const router = useRouter();
    const artisan = useCurrentArtisan();
    const createDraft = useDraftStore((s) => s.createDraft);
    const { quota, isRealMode, isLoading } = useSubscription();
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        // In real mode, wait for the quota to resolve before deciding.
        if (isRealMode && isLoading) return;
        started.current = true;

        if (isRealMode && !quota?.canCreate) {
            toast.error(
                quota?.reason === 'QUOTA_EXCEEDED' ? 'Quota de passeports atteint' : 'Abonnement ATELIER requis',
                { description: 'Gérez votre abonnement pour créer des passeports.' },
            );
            router.replace('/subscription');
            return;
        }

        const id = createDraft(artisan.id);
        router.replace(`/create/${id}/product`);
    }, [isRealMode, isLoading, quota, artisan.id, createDraft, router]);
}
