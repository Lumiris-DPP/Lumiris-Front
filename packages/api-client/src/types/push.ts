import { z } from 'zod';

// Forme exacte de PushSubscription.toJSON() côté navigateur.
export const pushSubscriptionPayloadSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});
export type PushSubscriptionPayload = z.infer<typeof pushSubscriptionPayloadSchema>;
