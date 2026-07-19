import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { checkoutDtoSchema, type CheckoutDto } from '../types/subscription';
import {
    sellerStatsDtoSchema,
    sellerStatusDtoSchema,
    type SellerStatsDto,
    type SellerStatusDto,
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
        // Lien vers le tableau de bord Stripe Express (solde + virements encaissés) — à ouvrir.
        async dashboardLink(): Promise<CheckoutDto> {
            return parseOr(checkoutDtoSchema, await http.request('/api/seller/dashboard-link'));
        },
    };
}
