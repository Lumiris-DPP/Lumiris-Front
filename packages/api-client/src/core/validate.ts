import type { z } from 'zod';

// Never throws: on schema drift it warns and returns the raw data cast to T.
export function parseOr<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    console.warn('[lumiris/api-client] response failed schema validation', result.error.issues);
    return data as T;
}
