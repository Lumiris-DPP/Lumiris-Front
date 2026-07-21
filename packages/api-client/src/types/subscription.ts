import { z } from 'zod';

export const billingCycleSchema = z.enum(['monthly', 'annual']);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const subscriptionDtoSchema = z.object({
    tier: z.string(),
    tierLabel: z.string(),
    billingCycle: billingCycleSchema.nullable(),
    status: z.string(),
    active: z.boolean(),
    grantsPassports: z.boolean(),
    currentPeriodEnd: z.string().nullable(),
    cancelAtPeriodEnd: z.boolean(),
    priceId: z.string().nullable(),
});
export type SubscriptionDto = z.infer<typeof subscriptionDtoSchema>;

export const quotaDtoSchema = z.object({
    hasActiveSubscription: z.boolean(),
    tier: z.string().nullable(),
    used: z.number(),
    // null when unlimited (Maison).
    limit: z.number().nullable(),
    remaining: z.number().nullable(),
    unlimited: z.boolean(),
    canCreate: z.boolean(),
    // SUBSCRIPTION_REQUIRED | QUOTA_EXCEEDED | null.
    reason: z.string().nullable(),
});
export type QuotaDto = z.infer<typeof quotaDtoSchema>;

export const subscriptionStateDtoSchema = z.object({
    subscription: subscriptionDtoSchema.nullable(),
    quota: quotaDtoSchema,
    hasActiveSubscription: z.boolean(),
    // ATELIER+ add-on (2nd Stripe item) active on top of the active base subscription.
    atelierPlus: z.boolean(),
    publishableKey: z.string().nullable(),
});
export type SubscriptionStateDto = z.infer<typeof subscriptionStateDtoSchema>;

export const planDtoSchema = z.object({
    tier: z.string(),
    label: z.string(),
    productId: z.string(),
    monthlyPriceId: z.string().nullable(),
    annualPriceId: z.string().nullable(),
    monthlyAmountCents: z.number(),
    annualAmountCents: z.number(),
    grantsPassports: z.boolean(),
    // null when unlimited.
    passportQuota: z.number().nullable(),
    unlimited: z.boolean(),
});
export type PlanDto = z.infer<typeof planDtoSchema>;

export const catalogDtoSchema = z.object({
    publishableKey: z.string().nullable(),
    plans: z.array(planDtoSchema),
});
export type CatalogDto = z.infer<typeof catalogDtoSchema>;

export const setupIntentDtoSchema = z.object({
    clientSecret: z.string(),
    publishableKey: z.string().nullable(),
    tier: z.string(),
    cycle: billingCycleSchema,
    priceId: z.string(),
    amountCents: z.number(),
});
export type SetupIntentDto = z.infer<typeof setupIntentDtoSchema>;

export const createSetupIntentRequestSchema = z.object({
    tier: z.string(),
    cycle: billingCycleSchema,
});
export type CreateSetupIntentRequest = z.infer<typeof createSetupIntentRequestSchema>;

export const portalDtoSchema = z.object({
    url: z.string(),
});
export type PortalDto = z.infer<typeof portalDtoSchema>;

// Hosted Stripe Checkout Session URL (mode=subscription) — the front redirects to it.
export const checkoutDtoSchema = z.object({
    url: z.string(),
});
export type CheckoutDto = z.infer<typeof checkoutDtoSchema>;
