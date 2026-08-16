import { z } from 'zod';

// Miroir des DTO backend LUMIRIS-24 (cycle de vie d'une commande marketplace : expédition,
// retours, litiges, remboursements). Une commande = une LIGNE d'article ; un paiement
// (paymentIntentId) peut couvrir plusieurs lignes, éventuellement de plusieurs ateliers.

// Rail logistique. RETURN_* est la branche retour ; le litige vit dans `disputeStatus`,
// orthogonal (une commande expédiée peut être en litige sans quitter son état).
export const orderStatusSchema = z.enum([
    'PENDING',
    'PAID',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REFUSED',
    'RETURN_RECEIVED',
    'REFUNDED',
    'CANCELLED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const disputeStatusSchema = z.enum(['NONE', 'OPEN', 'RESOLVED', 'REJECTED']);
export type DisputeStatus = z.infer<typeof disputeStatusSchema>;

export const orderEventTypeSchema = z.enum([
    'ORDER_PLACED',
    'PAYMENT_CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REFUSED',
    'RETURN_RECEIVED',
    'REFUNDED',
    'DISPUTE_OPENED',
    'DISPUTE_RESOLVED',
    'DISPUTE_REJECTED',
    'CANCELLED',
    'FUNDS_RELEASED',
    'MESSAGE',
]);
export type OrderEventType = z.infer<typeof orderEventTypeSchema>;

// Preuve jointe à un évènement. `url` est présignée et expire — à afficher, pas à conserver.
export const orderAttachmentSchema = z.object({
    id: z.string(),
    filename: z.string().nullish(),
    contentType: z.string().nullish(),
    url: z.string(),
});
export type OrderAttachment = z.infer<typeof orderAttachmentSchema>;

export const orderEventSchema = z.object({
    id: z.string(),
    type: orderEventTypeSchema,
    actorType: z.enum(['BUYER', 'SELLER', 'PLATFORM', 'SYSTEM']),
    message: z.string().nullish(),
    attachments: z.array(orderAttachmentSchema).nullish(),
    createdAt: z.string().nullish(),
});
export type OrderEvent = z.infer<typeof orderEventSchema>;

export const shippingAddressSchema = z.object({
    fullName: z.string().nullish(),
    line1: z.string().nullish(),
    line2: z.string().nullish(),
    postalCode: z.string().nullish(),
    city: z.string().nullish(),
    country: z.string().nullish(),
    phone: z.string().nullish(),
});
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Vue acheteur d'une ligne. Les drapeaux `can*` viennent du serveur : l'UI n'a pas à
// réimplémenter la machine à états pour savoir quelles actions proposer.
export const orderResponseSchema = z.object({
    id: z.string(),
    productName: z.string().nullish(),
    variantLabel: z.string().nullish(),
    productPhotoUrl: z.string().nullish(),
    sellerName: z.string().nullish(),
    quantity: z.number().nullish(),
    amountTotalCents: z.number(),
    shippingCents: z.number().nullish(),
    commissionCents: z.number(),
    refundedCents: z.number().nullish(),
    currency: z.string().nullish(),
    status: orderStatusSchema,
    disputeStatus: disputeStatusSchema,
    invoiceNumber: z.string().nullish(),
    paymentIntentId: z.string().nullish(),
    carrier: z.string().nullish(),
    trackingNumber: z.string().nullish(),
    trackingUrl: z.string().nullish(),
    shipDueAt: z.string().nullish(),
    shippedAt: z.string().nullish(),
    deliveredAt: z.string().nullish(),
    returnDeadline: z.string().nullish(),
    createdAt: z.string().nullish(),
    canConfirmDelivery: z.boolean().nullish(),
    canRequestReturn: z.boolean().nullish(),
    canOpenDispute: z.boolean().nullish(),
    canCancel: z.boolean().nullish(),
});
export type OrderResponse = z.infer<typeof orderResponseSchema>;

// GET /api/orders/{id} — suivi complet : la ligne, son adresse, sa timeline, son dossier de litige.
export const orderDetailSchema = z.object({
    order: orderResponseSchema,
    shipTo: shippingAddressSchema.nullish(),
    returnReason: z.string().nullish(),
    returnDecisionNote: z.string().nullish(),
    disputeReason: z.string().nullish(),
    disputeResolution: z.string().nullish(),
    timeline: z.array(orderEventSchema),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

// GET /api/orders/group/{paymentIntentId} — toutes les lignes d'un même paiement et le total
// RÉELLEMENT facturé par Stripe (`amountChargedCents` = articles + port de chaque atelier).
export const orderGroupSchema = z.object({
    paymentIntentId: z.string(),
    lines: z.array(orderResponseSchema),
    itemsTotalCents: z.number(),
    shippingCents: z.number(),
    amountChargedCents: z.number(),
    currency: z.string().nullish(),
    status: orderStatusSchema,
    invoiceNumber: z.string().nullish(),
    createdAt: z.string().nullish(),
});
export type OrderGroup = z.infer<typeof orderGroupSchema>;

// Onglet du tableau de bord vendeur auquel la commande appartient (calculé côté serveur).
export const sellerOrderTabSchema = z.enum(['TO_SHIP', 'SHIPPED', 'RETURNS', 'DISPUTES', 'CLOSED']);
export type SellerOrderTab = z.infer<typeof sellerOrderTabSchema>;

export const sellerOrderSchema = z.object({
    id: z.string(),
    productName: z.string().nullish(),
    variantLabel: z.string().nullish(),
    productPhotoUrl: z.string().nullish(),
    buyerName: z.string().nullish(),
    quantity: z.number().nullish(),
    amountTotalCents: z.number(),
    shippingCents: z.number().nullish(),
    commissionCents: z.number(),
    netCents: z.number(),
    refundedCents: z.number().nullish(),
    currency: z.string().nullish(),
    status: orderStatusSchema,
    disputeStatus: disputeStatusSchema,
    invoiceNumber: z.string().nullish(),
    carrier: z.string().nullish(),
    trackingNumber: z.string().nullish(),
    trackingUrl: z.string().nullish(),
    shipTo: shippingAddressSchema.nullish(),
    returnReason: z.string().nullish(),
    disputeReason: z.string().nullish(),
    released: z.boolean(),
    releasedAt: z.string().nullish(),
    shipDueAt: z.string().nullish(),
    shippedAt: z.string().nullish(),
    deliveredAt: z.string().nullish(),
    returnRequestedAt: z.string().nullish(),
    createdAt: z.string().nullish(),
    canShip: z.boolean(),
    canDecideReturn: z.boolean(),
    canMarkReturnReceived: z.boolean(),
    canRefund: z.boolean(),
    canCancel: z.boolean(),
    timeline: z.array(orderEventSchema),
});
export type SellerOrder = z.infer<typeof sellerOrderSchema>;

// ── Entrées ─────────────────────────────────────────────────────────────────

export interface ShipOrderInput {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
}

export interface ReturnDecisionInput {
    accepted: boolean;
    note?: string;
    /** Identifiants de fichiers déjà téléversés (étiquette de retour, photo de l'emballage). */
    fileIds?: string[];
}

/** `amountCents` absent ⇒ remboursement du solde intégral. */
export interface RefundInput {
    amountCents?: number;
    reason?: string;
}

export interface ReasonInput {
    reason: string;
    /** Identifiants de fichiers déjà téléversés — une photo vaut mieux qu'un paragraphe. */
    fileIds?: string[];
}
