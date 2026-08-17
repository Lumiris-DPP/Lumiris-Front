import { z } from 'zod';

// Notification in-app, servie aux deux surfaces (ATELIER et VISION) par les mêmes routes.
// `href` est un chemin relatif à la surface du destinataire — le front l'utilise tel quel.
export const notificationTypeSchema = z.enum([
    'ORDER_PAID',
    'ORDER_TO_SHIP',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_COMPLETED',
    'ORDER_CANCELLED',
    'ORDER_MESSAGE',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REFUSED',
    'RETURN_RECEIVED',
    'ORDER_REFUNDED',
    'DISPUTE_OPENED',
    'DISPUTE_RESOLVED',
    'DISPUTE_REJECTED',
    'FUNDS_RELEASED',
    'FAVORITE_LOW_STOCK',
    'FAVORITE_PRICE_DROP',
    // Garde-Robe active : les seuls rappels envoyés APRÈS la livraison, sans rien vendre.
    'WARDROBE_CARE',
    'WARDROBE_WARRANTY_ENDING',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
    id: z.string(),
    type: notificationTypeSchema,
    title: z.string(),
    body: z.string(),
    href: z.string().nullish(),
    orderId: z.string().nullish(),
    read: z.boolean(),
    createdAt: z.string().nullish(),
});
export type Notification = z.infer<typeof notificationSchema>;
