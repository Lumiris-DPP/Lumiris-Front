'use client';

// Attribution passeport → conversion marketplace. Un clic sur la suggestion d'achat depuis un
// passeport public connaît (productId, publicCode) ; le paiement, lui, ne connaît que le panier
// (productId). Ce pont en localStorage relie les deux pour que le CONVERSION des stats ATELIER+
// reste rattaché au bon passeport, même si l'achat a lieu plus tard / après connexion.

const KEY = 'lumiris.marketplace.conversion-attribution.v1';

function read(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
        return {};
    }
}

function write(map: Record<string, string>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY, JSON.stringify(map));
}

/** À appeler quand l'acheteur clique la suggestion d'achat d'un passeport. */
export function recordSuggestionOrigin(productId: string, publicCode: string): void {
    write({ ...read(), [productId]: publicCode });
}

/**
 * À appeler juste après un paiement réussi : renvoie le publicCode d'origine des produits achetés
 * qui viennent d'une suggestion passeport, et consomme ces entrées (one-shot, pas de double-compte
 * sur un futur achat du même produit sans nouveau clic).
 */
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
