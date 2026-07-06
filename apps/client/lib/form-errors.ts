import type { ZodError } from 'zod';

/**
 * Flattens a {@link ZodError} into a `{ field: firstMessage }` map suitable for
 * inline form error display. Replaces hand-written `error.flatten().fieldErrors`
 * pickers across forms.
 */
export function zodFieldErrors<T>(error: ZodError): Partial<Record<keyof T, string>> {
    const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const result: Partial<Record<keyof T, string>> = {};
    for (const key in fieldErrors) {
        const message = fieldErrors[key]?.[0];
        if (message) result[key as keyof T] = message;
    }
    return result;
}
