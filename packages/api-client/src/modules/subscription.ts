import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    catalogDtoSchema,
    checkoutDtoSchema,
    portalDtoSchema,
    setupIntentDtoSchema,
    subscriptionStateDtoSchema,
    type CatalogDto,
    type CheckoutDto,
    type CreateSetupIntentRequest,
    type PortalDto,
    type SetupIntentDto,
    type SubscriptionStateDto,
} from '../types/subscription';

export function subscriptionApi(http: Http) {
    return {
        async getState(): Promise<SubscriptionStateDto> {
            return parseOr(subscriptionStateDtoSchema, await http.request('/api/subscription'));
        },
        async getPlans(): Promise<CatalogDto> {
            return parseOr(catalogDtoSchema, await http.request('/api/subscription/plans'));
        },
        // Step 1: returns a SetupIntent client secret for the chosen plan.
        async createSetupIntent(req: CreateSetupIntentRequest): Promise<SetupIntentDto> {
            return parseOr(
                setupIntentDtoSchema,
                await http.request('/api/subscription/setup-intent', { method: 'POST', body: req }),
            );
        },
        // Step 2: create the subscription from the confirmed setup intent.
        async confirm(setupIntentId: string): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/confirm', {
                    method: 'POST',
                    body: { setupIntentId },
                }),
            );
        },
        async changePlan(req: CreateSetupIntentRequest): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/change', { method: 'POST', body: req }),
            );
        },
        // ATELIER+ add-on : ajoute le 2ᵉ article Stripe à l'abonnement de base actif.
        // 422 s'il n'existe pas d'abonnement de base actif.
        async addAtelierPlus(): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/atelier-plus', { method: 'POST' }),
            );
        },
        // Retire l'option ATELIER+ de l'abonnement de base actif. 422 sans abonnement actif.
        async removeAtelierPlus(): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/atelier-plus', { method: 'DELETE' }),
            );
        },
        async openPortal(): Promise<PortalDto> {
            return parseOr(portalDtoSchema, await http.request('/api/subscription/portal', { method: 'POST' }));
        },
        // Résiliation in-app : actif jusqu'à la fin de la période payée, puis extinction.
        async cancel(): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/cancel', { method: 'POST' }),
            );
        },
        // Reprise in-app : annule une résiliation programmée avant l'échéance.
        async resume(): Promise<SubscriptionStateDto> {
            return parseOr(
                subscriptionStateDtoSchema,
                await http.request('/api/subscription/resume', { method: 'POST' }),
            );
        },
        // Hosted Stripe Checkout Session for a new subscriber (all 5 plans). Returns the URL to redirect to.
        async checkout(req: CreateSetupIntentRequest): Promise<CheckoutDto> {
            return parseOr(
                checkoutDtoSchema,
                await http.request('/api/subscription/checkout', { method: 'POST', body: req }),
            );
        },
    };
}
