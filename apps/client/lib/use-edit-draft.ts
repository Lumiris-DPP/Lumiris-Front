'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiClient } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useCurrentArtisan } from './current-artisan';
import { useDraftStore } from './draft-store';
import { dppToDraftFields } from './passport-adapter';

/**
 * Loads a backend DRAFT into a fresh local wizard draft (tagged with its backendId)
 * and routes into the wizard. The final step then PUTs/publishes instead of creating.
 */
export function useEditDraft() {
    const router = useRouter();
    const client = useApiClient();
    const artisan = useCurrentArtisan();
    const createDraft = useDraftStore((s) => s.createDraft);
    const setDraft = useDraftStore((s) => s.setDraft);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const editDraft = async (dppId: string) => {
        setLoadingId(dppId);
        try {
            const dpp = await client.dpp.get(dppId);
            const localId = createDraft(artisan.id);
            setDraft(localId, { backendId: dppId, ...dppToDraftFields(dpp) });
            router.push(`/create/${localId}/product`);
        } catch {
            toast.error('Impossible de charger ce brouillon.');
            setLoadingId(null);
        }
    };

    return { editDraft, loadingId };
}
