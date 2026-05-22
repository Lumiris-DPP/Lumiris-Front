import { describe, expect, it } from 'bun:test';

interface MinimalUser {
    email?: string;
}

function deleteReady(_user: MinimalUser, _reason: string, confirmed: boolean): boolean {
    return confirmed;
}

describe('RGPD delete — checkbox de confirmation (post-refonte)', () => {
    const USER = { email: 'juliette.brunel@gmail.com' };
    const FREE_REASON = 'Demande explicite via support, ticket #4827.';

    it('checkbox cochée → confirm activé (peu importe le motif)', () => {
        expect(deleteReady(USER, FREE_REASON, true)).toBe(true);
    });

    it('checkbox décochée → confirm bloqué même avec motif fourni', () => {
        expect(deleteReady(USER, FREE_REASON, false)).toBe(false);
    });

    it('checkbox décochée + motif vide → bloqué', () => {
        expect(deleteReady(USER, '', false)).toBe(false);
    });

    it('checkbox cochée + motif vide → autorisé (motif optionnel, plus de min-length)', () => {
        expect(deleteReady(USER, '', true)).toBe(true);
    });

    it("user sans email reste géré par l'UI (action désactivée en amont)", () => {
        expect(deleteReady({}, FREE_REASON, true)).toBe(true);
    });
});
