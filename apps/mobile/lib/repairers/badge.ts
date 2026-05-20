// SSOT "LUMIRIS Local" : remplacera `localSubscribed` par `tier`/`isLumirisLocal` côté backend.

import type { Repairer } from '@lumiris/types';

export function isLumirisLocal(repairer: Repairer): boolean {
    return repairer.localSubscribed;
}

export function repairerSlug(repairer: Pick<Repairer, 'id'>): string {
    return repairer.id;
}
