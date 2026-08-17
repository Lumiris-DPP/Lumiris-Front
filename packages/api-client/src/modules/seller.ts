import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { checkoutDtoSchema, type CheckoutDto } from '../types/subscription';
import {
    sellerPayoutScheduleSchema,
    sellerStatsDtoSchema,
    sellerStatusDtoSchema,
    shipFromAddressSchema,
    type SellerPayoutSchedule,
    type SellerStatsDto,
    type SellerStatusDto,
    type ShipFromAddress,
    type ShipFromAddressInput,
} from '../types/seller';

// LUMIRIS-22 · Onboarding vendeur Stripe Connect (Express) + tableau de bord côté ATELIER.
export function sellerApi(http: Http) {
    return {
        // Crée/reprend le compte Express et renvoie l'URL d'onboarding hébergée (redirection Stripe).
        async startOnboarding(): Promise<CheckoutDto> {
            return parseOr(checkoutDtoSchema, await http.request('/api/seller/onboarding', { method: 'POST' }));
        },
        async status(): Promise<SellerStatusDto> {
            return parseOr(sellerStatusDtoSchema, await http.request('/api/seller/status'));
        },
        // Agrégats du tableau de bord vendeur (ventes, CA net, garde-robe, vues).
        async stats(): Promise<SellerStatsDto> {
            return parseOr(sellerStatsDtoSchema, await http.request('/api/seller/stats'));
        },
        // Échéancier daté : quand chaque vente en cours sera versée, et pourquoi pas encore.
        async payouts(): Promise<SellerPayoutSchedule> {
            return parseOr(sellerPayoutScheduleSchema, await http.request('/api/seller/payouts'));
        },
        // Lien vers le tableau de bord Stripe Express (solde + virements encaissés) — à ouvrir.
        async dashboardLink(): Promise<CheckoutDto> {
            return parseOr(checkoutDtoSchema, await http.request('/api/seller/dashboard-link'));
        },
        // Adresse d'enlèvement (expéditeur des bordereaux), hors de la vitrine qui est publique.
        async shipFromAddress(): Promise<ShipFromAddress> {
            return parseOr(shipFromAddressSchema, await http.request('/api/seller/shipping-address'));
        },
        async updateShipFromAddress(input: ShipFromAddressInput): Promise<ShipFromAddress> {
            return parseOr(
                shipFromAddressSchema,
                await http.request('/api/seller/shipping-address', {
                    method: 'PUT',
                    body: input,
                }),
            );
        },
    };
}
