/**
 * Immutable update helpers for stores shaped as `Record<artisanId, Item[]>`.
 * Intent-revealing wrappers around the spread/filter/map boilerplate that the
 * certificates and invoices stores would otherwise hand-roll.
 */

type ByArtisan<T> = Record<string, T[]>;

/** Adds an item at the front of an artisan's list (most-recent-first). */
export function prependToArtisan<T>(byArtisan: ByArtisan<T>, artisanId: string, item: T): ByArtisan<T> {
    return { ...byArtisan, [artisanId]: [item, ...(byArtisan[artisanId] ?? [])] };
}

/** Adds an item at the end of an artisan's list. */
export function appendToArtisan<T>(byArtisan: ByArtisan<T>, artisanId: string, item: T): ByArtisan<T> {
    return { ...byArtisan, [artisanId]: [...(byArtisan[artisanId] ?? []), item] };
}

/** Removes an item by id from a single artisan's list. */
export function removeFromArtisan<T extends { id: string }>(
    byArtisan: ByArtisan<T>,
    artisanId: string,
    id: string,
): ByArtisan<T> {
    return { ...byArtisan, [artisanId]: (byArtisan[artisanId] ?? []).filter((x) => x.id !== id) };
}

/** Applies a list transform to every artisan's list (for id-only updates/removals across all artisans). */
export function updateAllArtisans<T>(byArtisan: ByArtisan<T>, transform: (list: T[]) => T[]): ByArtisan<T> {
    const next: ByArtisan<T> = {};
    for (const [artisanId, list] of Object.entries(byArtisan)) {
        next[artisanId] = transform(list);
    }
    return next;
}
