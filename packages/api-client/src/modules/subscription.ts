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
        async openPortal(): Promise<PortalDto> {
            return parseOr(portalDtoSchema, await http.request('/api/subscription/portal', { method: 'POST' }));
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
