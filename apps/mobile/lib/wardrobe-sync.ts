'use client';

import type { LumirisClient, WardrobeItemDto, WardrobeSyncUpsert } from '@lumiris/api-client';
import {
    applyWardrobeSyncResult,
    itemKey,
    readPendingWardrobeChanges,
    readWardrobeForScope,
    toWardrobeSyncUpsert,
} from './wardrobe-storage';

/*
    Bucket anonyme -> Ajout effectué avant connexion de l'utilisateur, synchronisé à la connexion (sans suppression)
 */
export async function syncPendingWardrobe(
    client: LumirisClient,
    userId: string,
): Promise<readonly WardrobeItemDto[] | null> {
    const accountPending = readPendingWardrobeChanges(userId);
    const anonymousItems = readWardrobeForScope(null);
    const upserts = new Map<string, WardrobeSyncUpsert>();

    for (const item of accountPending.upserts) {
        upserts.set(itemKey(item), toWardrobeSyncUpsert(item));
    }

    for (const item of anonymousItems) {
        upserts.set(itemKey(item), toWardrobeSyncUpsert(item));
    }

    const deletedKeys = accountPending.deletedKeys.filter((key) => !upserts.has(key));
    if (upserts.size === 0 && deletedKeys.length === 0) return null;

    const response = await client.wardrobe.sync({ upserts: [...upserts.values()], deletedKeys });

    const pendingUnchanged = JSON.stringify(readPendingWardrobeChanges(userId)) === JSON.stringify(accountPending);
    const anonymousUnchanged = JSON.stringify(readWardrobeForScope(null)) === JSON.stringify(anonymousItems);
    if (pendingUnchanged && anonymousUnchanged) applyWardrobeSyncResult(userId, response);
    return response;
}
