import { describe, expect, it } from 'bun:test';
import { createIntentCache } from '@/features/checkout/models/intent-cache';

// Compte les requêtes envoyées au serveur pour une suite de contextes.
function requests(keys: readonly string[]): number {
    const cache = createIntentCache<string>();
    let sent = 0;
    for (const key of keys) {
        void cache.get(key, () => {
            sent += 1;
            return Promise.resolve(`intent-${sent}`);
        });
    }
    return sent;
}

describe('createIntentCache — une intention par contexte courant', () => {
    it('dédoublonne le même contexte (remount StrictMode)', () => {
        expect(requests(['A', 'A'])).toBe(1);
    });

    it('un retour A → B → A redemande l’intention au serveur', () => {
        expect(requests(['A', 'B', 'A'])).toBe(3);
    });

    it('n’expose pas la requête d’un autre contexte', () => {
        const cache = createIntentCache<string>();
        void cache.get('A', () => Promise.resolve('a'));
        void cache.get('B', () => Promise.resolve('b'));
        expect(cache.peek('A')).toBeNull();
    });

    it('oublie une requête en échec, mais jamais une requête plus récente', () => {
        const cache = createIntentCache<string>();
        const failed = cache.get('A', () => Promise.resolve('ancienne'));
        cache.forget(failed);
        expect(cache.peek('A')).toBeNull();
        const fresh = cache.get('A', () => Promise.resolve('neuve'));
        cache.forget(failed);
        expect(cache.peek('A')).toBe(fresh);
    });
});
