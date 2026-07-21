import { createHttp, type HttpOptions } from './core/http';
import { authApi } from './modules/auth';
import { telemetryApi } from './modules/telemetry';
import { storageApi } from './modules/storage';
import { subscriptionApi } from './modules/subscription';
import { dppApi } from './modules/dpp';
import { artisansApi } from './modules/artisans';
import { adminArtisansApi } from './modules/admin-artisans';
import { adminRepairersApi } from './modules/admin-repairers';
import { marketplaceApi } from './modules/marketplace';
import { trackApi } from './modules/track';
import { sellerApi } from './modules/seller';
import { wardrobeApi } from './modules/wardrobe';
import { irisApi } from './modules/iris';
import { atelierStatsApi, eventsApi } from './modules/atelier-stats';
import { repairersApi, repairRequestsApi } from './modules/repairers';

export type ClientOptions = HttpOptions;

export function createClient(opts: ClientOptions) {
    const http = createHttp(opts);
    return {
        auth: authApi(http),
        telemetry: telemetryApi(http),
        storage: storageApi(http),
        subscription: subscriptionApi(http),
        dpp: dppApi(http),
        artisans: artisansApi(http),
        adminArtisans: adminArtisansApi(http),
        adminRepairers: adminRepairersApi(http),
        marketplace: marketplaceApi(http),
        track: trackApi(http),
        seller: sellerApi(http),
        wardrobe: wardrobeApi(http),
        iris: irisApi(http),
        atelierStats: atelierStatsApi(http),
        events: eventsApi(http),
        repairers: repairersApi(http),
        repairRequests: repairRequestsApi(http),
    };
}

export type LumirisClient = ReturnType<typeof createClient>;
