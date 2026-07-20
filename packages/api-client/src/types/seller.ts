import { z } from 'zod';

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
