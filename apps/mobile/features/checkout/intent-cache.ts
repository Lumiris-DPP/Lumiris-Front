// Mémoire d'une seule intention de paiement : celle du contexte courant. Elle dédoublonne les remounts
// StrictMode ; dès que le contexte change, l'ancienne est oubliée, si bien qu'un retour à un contexte
// déjà vu redemande l'intention au serveur (adresse remise à jour, intention neuve si l'ancienne a été
// annulée). Calcul pur, testé avec Bun.

interface IntentCache<T> {
    /** Requête du contexte `key`, créée si le contexte mémorisé est un autre. */
    get(key: string, create: () => Promise<T>): Promise<T>;
    /** Requête mémorisée pour `key`, sans en créer : une réponse d'une autre requête ne s'affiche pas. */
    peek(key: string): Promise<T> | null;
    /** Oublie cette requête si elle est toujours celle mémorisée (échec à ne pas resservir). */
    forget(request: Promise<T>): void;
    /** Oublie tout, après un paiement. */
    clear(): void;
}

/** Cache à une seule entrée : une seconde clé remplace la première. */
export function createIntentCache<T>(): IntentCache<T> {
    let entry: { key: string; request: Promise<T> } | null = null;
    return {
        get(key, create) {
            if (entry?.key !== key) entry = { key, request: create() };
            return entry.request;
        },
        peek(key) {
            return entry?.key === key ? entry.request : null;
        },
        forget(request) {
            if (entry?.request === request) entry = null;
        },
        clear() {
            entry = null;
        },
    };
}
