interface IntentCache<T> {
    get(key: string, create: () => Promise<T>): Promise<T>;

    peek(key: string): Promise<T> | null;

    forget(request: Promise<T>): void;

    clear(): void;
}

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
