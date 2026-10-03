import { describe, expect, test } from 'bun:test';
import { sanitizeReturnTo } from '../lib/auth/return-to';

describe('retour après connexion', () => {
    test('conserve le retoucheur, la pièce et l’ancre pendant le détour par la connexion', () => {
        const destination = '/retoucheurs/request/?slug=atelier%20test&for=piece-1#message';
        const login = new URL(`/auth/sign-in?returnTo=${encodeURIComponent(destination)}`, 'https://lumiris.invalid');
        expect(sanitizeReturnTo(login.searchParams.get('returnTo'))).toBe(destination);
    });

    test('normalise les segments internes', () => {
        expect(sanitizeReturnTo('/me/../help/?section=1#faq')).toBe('/help/?section=1#faq');
        expect(sanitizeReturnTo('/')).toBe('/');
    });

    test('refuse une destination externe, même déguisée avec antislash ou caractères ignorés par URL', () => {
        for (const value of [
            null,
            '',
            'help',
            'https://evil.test',
            'javascript:alert(1)',
            '//evil.test',
            '//lumiris.invalid/help',
            '/\\evil.test',
            '/\n/evil.test',
            '/\t/evil.test',
        ]) {
            expect(sanitizeReturnTo(value)).toBeNull();
        }
    });
});
