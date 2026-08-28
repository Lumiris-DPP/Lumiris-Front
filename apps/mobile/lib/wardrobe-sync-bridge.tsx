'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useApiClient, useApiQueryClient, wardrobeKeys } from '@lumiris/api-client/react';
import { useUser } from './auth/use-user';
import { useOnlineStatus } from './network/use-online-status';
import { hydrateWardrobeFromApi, WARDROBE_CHANGED_EVENT } from './wardrobe-storage';
import { syncPendingWardrobe } from './wardrobe-sync';

export function WardrobeSyncBridge() {
    const { user } = useUser();
    const online = useOnlineStatus();
    const client = useApiClient();
    const queryClient = useApiQueryClient();
    const syncing = useRef(false);
    const rerun = useRef(false);
    const reloadRequested = useRef(false);
    const currentUserId = useRef<string | null>(user?.id ?? null);
    currentUserId.current = user?.id ?? null;

    const synchronize = useCallback(
        async (reloadFromApi = false) => {
            if (!user || !online) return;
            if (reloadFromApi) reloadRequested.current = true;
            if (syncing.current) {
                rerun.current = true;
                return;
            }
            syncing.current = true;
            try {
                do {
                    rerun.current = false;
                    const shouldReload = reloadRequested.current;
                    reloadRequested.current = false;
                    let response = await syncPendingWardrobe(client, user.id);
                    if (!response && shouldReload) {
                        response = await client.wardrobe.list();
                        hydrateWardrobeFromApi(user.id, response);
                    }
                    if (response && currentUserId.current === user.id) {
                        queryClient.setQueryData(wardrobeKeys.list(user.id), response);
                    }
                } while (rerun.current || reloadRequested.current);
            } catch {
                // En cas d'erreur on ne fait rien car le sync se relancera au prochain login / retour de réseaux
            } finally {
                syncing.current = false;
            }
        },
        [client, online, queryClient, user],
    );

    useEffect(() => {
        if (!user) {
            queryClient.removeQueries({ queryKey: wardrobeKeys.all });
            return;
        }
        void synchronize(true);
    }, [queryClient, synchronize, user]);

    useEffect(() => {
        const onChange = () => void synchronize(false);
        window.addEventListener(WARDROBE_CHANGED_EVENT, onChange);
        return () => window.removeEventListener(WARDROBE_CHANGED_EVENT, onChange);
    }, [synchronize]);

    return null;
}
