'use client';

const KEY = 'lumiris.marketplace.conversion-attribution.v1';

// Relit les origines de suggestions enregistrées.
function read(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
        return {};
    }
}

// Enregistre les origines de suggestions.
function write(map: Record<string, string>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, JSON.stringify(map));
}

// Conserve l’origine de la suggestion pour le produit.
export function recordSuggestionOrigin(productId: string, publicCode: string): void {
    write({ ...read(), [productId]: publicCode });
}

// Relit puis retire les origines des produits achetés.
export function takeConversionOrigins(productIds: readonly string[]): string[] {
    const map = read();
    const found: string[] = [];
    for (const id of productIds) {
        const publicCode = map[id];
        if (publicCode) {
            found.push(publicCode);
            delete map[id];
        }
    }
    write(map);
    return found;
}
