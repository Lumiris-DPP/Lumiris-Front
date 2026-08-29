import { z } from 'zod';

// Catégories user-facing, plus grossières que NotificationType côté back — c'est la granularité à
// laquelle un utilisateur se désabonne (email et/ou push) depuis /me/settings.
export const notificationCategorySchema = z.enum([
    'ORDERS',
    'RETURNS_DISPUTES',
    'FAVORITES',
    'WARDROBE',
    'PAYMENTS',
    'PASSPORT',
    'ATELIER',
]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const notificationPreferenceSchema = z.object({
    category: notificationCategorySchema,
    emailEnabled: z.boolean(),
    pushEnabled: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
