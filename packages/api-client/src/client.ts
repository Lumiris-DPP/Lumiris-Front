import { createHttp, type HttpOptions } from './core/http';
import { authApi } from './modules/auth';
import { telemetryApi } from './modules/telemetry';
import { storageApi } from './modules/storage';
import { subscriptionApi } from './modules/subscription';
import { dppApi } from './modules/dpp';
import { artisansApi } from './modules/artisans';
import { adminArtisansApi } from './modules/admin-artisans';
import { favoritesApi } from './modules/favorites';
import { marketplaceApi } from './modules/marketplace';
import { trackApi } from './modules/track';
import { sellerApi } from './modules/seller';
import { wardrobeApi } from './modules/wardrobe';
import { ordersApi, sellerOrdersApi } from './modules/orders';
import { notificationsApi } from './modules/notifications';
import { disputesApi } from './modules/disputes';
import { irisApi } from './modules/iris';
import { atelierStatsApi, eventsApi } from './modules/atelier-stats';

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
        favorites: favoritesApi(http),
        track: trackApi(http),
        seller: sellerApi(http),
        wardrobe: wardrobeApi(http),
        orders: ordersApi(http),
        sellerOrders: sellerOrdersApi(http),
        notifications: notificationsApi(http),
        disputes: disputesApi(http),
        iris: irisApi(http),
        atelierStats: atelierStatsApi(http),
        events: eventsApi(http),
    };
}

export type LumirisClient = ReturnType<typeof createClient>;
