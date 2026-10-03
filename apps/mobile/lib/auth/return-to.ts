// Valide et normalise une destination interne en conservant ses paramètres et son ancre après connexion.
export function sanitizeReturnTo(value: string | null): string | null {
    if (!value?.startsWith('/') || value.startsWith('//')) return null;
    const origin = 'https://lumiris.invalid';
    try {
        const url = new URL(value, origin);
        if (url.origin !== origin) return null;
        return url.pathname + url.search + url.hash;
    } catch {
        return null;
    }
}
