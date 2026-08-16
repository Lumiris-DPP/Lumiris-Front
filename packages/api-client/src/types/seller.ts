import { z } from 'zod';

import { orderStatusSchema } from './orders';

// État du compte vendeur Stripe Connect (Express) — pilote l'UI d'onboarding ATELIER.
export const sellerStatusDtoSchema = z.object({
    hasAccount: z.boolean(),
    onboardingCompleted: z.boolean(),
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
});
export type SellerStatusDto = z.infer<typeof sellerStatusDtoSchema>;

// Tableau de bord vendeur (ATELIER) : agrégats des ventes directes. Montants en centimes.
export const sellerStatsDtoSchema = z.object({
    salesCount: z.number(),
    grossCents: z.number(),
    commissionCents: z.number(),
    netCents: z.number(),
    wardrobeCount: z.number(),
    totalViews: z.number(),
    productCount: z.number(),
    publishedCount: z.number(),
});
export type SellerStatsDto = z.infer<typeof sellerStatsDtoSchema>;

// Nature d'une échéance de versement. SCHEDULED porte une date ; IMMINENT signifie que le versement
// est dû et rejoué par le balayage, sans jour promis ; ON_HOLD qu'un litige ou un retour le suspend.
export const payoutExpectationSchema = z.enum(['SCHEDULED', 'IMMINENT', 'ON_HOLD']);
export type PayoutExpectation = z.infer<typeof payoutExpectationSchema>;

export const sellerPayoutEntrySchema = z.object({
    orderId: z.string(),
    productName: z.string().nullish(),
    variantLabel: z.string().nullish(),
    buyerName: z.string().nullish(),
    netCents: z.number(),
    currency: z.string().nullish(),
    expectedAt: z.string().nullish(),
    expectation: payoutExpectationSchema,
    status: orderStatusSchema,
});
export type SellerPayoutEntry = z.infer<typeof sellerPayoutEntrySchema>;

// Les totaux viennent du serveur : les re-sommer côté client ferait diverger l'écran de la
// trésorerie réelle dès qu'un statut de commande change de sens.
export const sellerPayoutScheduleSchema = z.object({
    scheduledCents: z.number(),
    releasedCents: z.number(),
    onHoldCents: z.number(),
    currency: z.string().nullish(),
    entries: z.array(sellerPayoutEntrySchema),
});
export type SellerPayoutSchedule = z.infer<typeof sellerPayoutScheduleSchema>;
