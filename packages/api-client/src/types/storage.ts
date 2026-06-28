import { z } from 'zod';

export const storageBucketSchema = z.enum(['uploads', 'assets', 'backups']);
export type StorageBucket = z.infer<typeof storageBucketSchema>;

export const uploadUrlRequestSchema = z.object({
    bucket: storageBucketSchema,
    key: z.string(),
    contentType: z.string().optional(),
});
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

export const uploadUrlResponseSchema = z.object({
    url: z.string(),
    headers: z.record(z.string()),
    expiresInSeconds: z.number(),
});
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;

export const downloadUrlRequestSchema = z.object({
    bucket: storageBucketSchema,
    key: z.string(),
});
export type DownloadUrlRequest = z.infer<typeof downloadUrlRequestSchema>;

export const downloadUrlResponseSchema = z.object({
    url: z.string(),
    expiresInSeconds: z.number(),
});
export type DownloadUrlResponse = z.infer<typeof downloadUrlResponseSchema>;
