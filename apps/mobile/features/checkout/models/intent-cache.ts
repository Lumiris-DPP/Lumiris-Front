interface IntentCache<T> {
    get(key: string, create: () => Promise<T>): Promise<T>;

    peek(key: string): Promise<T> | null;

    forget(request: Promise<T>): void;

    clear(): void;
}

// Conserve une seule demande de paiement par contexte courant.
export function createIntentCache<T>(): IntentCache<T> {
    let entry: { key: string; request: Promise<T> } | null = null;
    return {
        // Réutilise la demande du contexte ou en crée une nouvelle.
        get(key, create) {
            if (entry?.key !== key) entry = { key, request: create() };
            return entry.request;
        },

        // Relit la demande seulement si son contexte correspond.
        peek(key) {
            return entry?.key === key ? entry.request : null;
        },

        // Retire la demande seulement si elle est encore courante.
        forget(request) {
            if (entry?.request === request) entry = null;
        },

        // Vide la demande de paiement en cache.
        clear() {
            entry = null;
        },
    };
}
