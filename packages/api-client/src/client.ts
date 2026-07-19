import { createHttp, type HttpOptions } from './core/http';
import { authApi } from './modules/auth';
import { telemetryApi } from './modules/telemetry';
import { storageApi } from './modules/storage';
import { subscriptionApi } from './modules/subscription';
import { dppApi } from './modules/dpp';
import { artisansApi } from './modules/artisans';
import { adminArtisansApi } from './modules/admin-artisans';
import { marketplaceApi } from './modules/marketplace';
import { trackApi } from './modules/track';

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
        marketplace: marketplaceApi(http),
        track: trackApi(http),
    };
}

export type LumirisClient = ReturnType<typeof createClient>;
