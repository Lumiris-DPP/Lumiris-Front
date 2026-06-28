import { z } from 'zod';

export const webVitalNameSchema = z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']);
export type WebVitalName = z.infer<typeof webVitalNameSchema>;

export const webVitalRatingSchema = z.enum(['good', 'needs-improvement', 'poor']);
export type WebVitalRating = z.infer<typeof webVitalRatingSchema>;

export const appNameSchema = z.enum(['admin', 'site', 'client', 'mobile']);
export type AppName = z.infer<typeof appNameSchema>;

export const webVitalPayloadSchema = z.object({
    name: webVitalNameSchema,
    value: z.number(),
    rating: webVitalRatingSchema,
    sessionId: z.string(),
    app: appNameSchema,
    route: z.string(),
    navigationType: z.string().optional(),
    timestamp: z.number(),
});
export type WebVitalPayload = z.infer<typeof webVitalPayloadSchema>;
