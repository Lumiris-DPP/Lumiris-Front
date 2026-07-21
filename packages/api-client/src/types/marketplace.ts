import { z } from 'zod';

// Miroir des DTO backend LUMIRIS-9 (MarketplaceItemResponse, SearchResponse,
// SuggestionResponse, DecisionLogResponse). Statut PUBLISHED/DRAFT/ARCHIVED.

export const marketplaceProductStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type MarketplaceProductStatus = z.infer<typeof marketplaceProductStatusSchema>;

// Grade Iris (A→E). Aligné sur @lumiris/types.
export const marketplaceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'E']);

export const marketplaceItemSchema = z.object({
    id: z.string(),
    artisanProfileId: z.string(),
    artisanName: z.string().nullish(),
    dppFormId: z.string().nullish(),
    name: z.string(),
    description: z.string().nullish(),
    category: z.string().nullish(),
    material: z.string().nullish(),
    originCountry: z.string().nullish(),
    priceCents: z.number(),
    currency: z.string(),
    stock: z.number(),
    externalOrderUrl: z.string().nullish(),
    photoUrl: z.string().nullish(),
    status: marketplaceProductStatusSchema,
    irisTotal: z.number().nullish(),
    irisGrade: z.string().nullish(),
    atelierPlus: z.boolean(),
    inAppSale: z.boolean().nullish(),
    createdAt: z.string().nullish(),
    // Statistiques vendeur (0 sur les chemins publics search/suggest).
    views: z.number().nullish(),
    salesCount: z.number().nullish(),
    // Vente directe (LUMIRIS-22) : frais de port, conditions de retour et garantie de l'offre,
    // affichés à l'acheteur AVANT le paiement. `shippingCents` == 0 ⇒ « Livraison offerte ».
    shippingCents: z.number().nullish(),
    returnPolicy: z.string().nullish(),
    warrantyDescription: z.string().nullish(),
});
export type MarketplaceItem = z.infer<typeof marketplaceItemSchema>;

// Log de décision exposé : rend le tri auditable. commissionConsidered est toujours false.
export const decisionEntrySchema = z.object({
    rank: z.number(),
    productId: z.string().nullish(),
    name: z.string().nullish(),
    irisTotal: z.number().nullish(),
    atelierPlus: z.boolean(),
    reason: z.string().nullish(),
});
export type DecisionEntry = z.infer<typeof decisionEntrySchema>;

export const decisionLogSchema = z.object({
    id: z.string().nullish(),
    context: z.string(),
    sortKey: z.string(),
    commissionConsidered: z.boolean(),
    createdAt: z.string().nullish(),
    ranked: z.array(decisionEntrySchema),
});
export type DecisionLog = z.infer<typeof decisionLogSchema>;

export const searchResultSchema = z.object({
    items: z.array(marketplaceItemSchema),
    decisionLog: decisionLogSchema,
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const suggestionSchema = z.object({
    item: marketplaceItemSchema,
    rank: z.number(),
    reason: z.string().nullish(),
});
export type Suggestion = z.infer<typeof suggestionSchema>;

export const suggestionResultSchema = z.object({
    suggestions: z.array(suggestionSchema),
    decisionLog: decisionLogSchema,
});
export type SuggestionResult = z.infer<typeof suggestionResultSchema>;

// ── Entrées (requêtes) ──────────────────────────────────────────────────────

export interface MarketplaceSearchParams {
    category?: string;
    material?: string;
    origin?: string;
    /** relevance/newest (neutre) | iris | price-asc | price-desc. */
    sort?: string;
    /** Catégories d'affinité de l'utilisateur connecté (reco perso). */
    personalize?: readonly string[];
}

export interface SuggestInput {
    /** Score Iris du DPP scanné — les alternatives auront un score >=. */
    score: number;
    category?: string;
    grade?: string;
    material?: string;
}

export interface AffiliateTrackInput {
    source: string;
    productId?: string;
    targetUrl?: string;
    dppPublicCode?: string;
    referrer?: string;
}

export const convertDppRequestSchema = z.object({
    priceCents: z.number().int().nonnegative(),
    currency: z.string().nullish(),
    description: z.string().nullish(),
    material: z.string().nullish(),
    stock: z.number().int().nonnegative().nullish(),
    // Vente directe (LUMIRIS-22) : frais de port + conditions de retour de l'offre.
    shippingCents: z.number().int().nonnegative().nullish(),
    returnPolicy: z.string().nullish(),
    externalOrderUrl: z.string().nullish(),
    photoUrl: z.string().nullish(),
    status: marketplaceProductStatusSchema.nullish(),
});
export type ConvertDppRequest = z.infer<typeof convertDppRequestSchema>;

// ── Achat direct in-app (LUMIRIS-22) ────────────────────────────────────────
// Panier → PaymentIntent Stripe Connect confirmé via Payment Element EMBARQUÉ
// (pas de redirection). Un seul vendeur par panier (destination charge unique).
export const cartIntentLineSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
});
export type CartIntentLine = z.infer<typeof cartIntentLineSchema>;

export const cartIntentRequestSchema = z.object({
    items: z.array(cartIntentLineSchema).min(1),
});
export type CartIntentRequest = z.infer<typeof cartIntentRequestSchema>;

// Secret client du PaymentIntent + clé publiable (pour Stripe.js). Montant = articles + port.
export const paymentIntentResponseSchema = z.object({
    clientSecret: z.string(),
    publishableKey: z.string(),
    amountTotalCents: z.number(),
    commissionCents: z.number(),
});
export type PaymentIntentResponse = z.infer<typeof paymentIntentResponseSchema>;

// ── Commandes d'achat direct (LUMIRIS-22) ───────────────────────────────────
// Miroir de OrderResponse (backend), enrichi de `shippingCents` + `paymentIntentId`.
// Un paiement (un PaymentIntent) peut couvrir PLUSIEURS lignes → chaque ligne partage
// le même `paymentIntentId`. status : PENDING | PAID | FULFILLED | CANCELLED | REFUNDED.
// (Défini ici plutôt que dans types/wardrobe car rattaché au flux d'achat marketplace.)
export const orderResponseSchema = z.object({
    id: z.string(),
    productName: z.string().nullish(),
    amountTotalCents: z.number(),
    commissionCents: z.number(),
    shippingCents: z.number().nullish(),
    paymentIntentId: z.string().nullish(),
    currency: z.string().nullish(),
    status: z.string(),
    invoiceNumber: z.string().nullish(),
    createdAt: z.string().nullish(),
});
export type OrderResponse = z.infer<typeof orderResponseSchema>;

// GET /api/orders/group/{paymentIntentId} — regroupe toutes les lignes d'un même paiement
// et expose le total RÉELLEMENT facturé par Stripe (`amountChargedCents` = articles + port),
// seule source de vérité correcte pour l'écran de confirmation.
export const orderGroupSchema = z.object({
    paymentIntentId: z.string(),
    lines: z.array(orderResponseSchema),
    itemsTotalCents: z.number(),
    shippingCents: z.number(),
    amountChargedCents: z.number(),
    currency: z.string().nullish(),
    status: z.string(),
    invoiceNumber: z.string().nullish(),
    createdAt: z.string().nullish(),
});
export type OrderGroup = z.infer<typeof orderGroupSchema>;

// Payload CRUD produit (POST/PUT /api/marketplace/products).
export const productPayloadSchema = z.object({
    name: z.string(),
    description: z.string().nullish(),
    category: z.string().nullish(),
    material: z.string().nullish(),
    originCountry: z.string().nullish(),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().nullish(),
    stock: z.number().int().nonnegative(),
    externalOrderUrl: z.string().nullish(),
    photoUrl: z.string().nullish(),
    dppFormId: z.string().nullish(),
    status: marketplaceProductStatusSchema.nullish(),
});
export type ProductPayload = z.infer<typeof productPayloadSchema>;
