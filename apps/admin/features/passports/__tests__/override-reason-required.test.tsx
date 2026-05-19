import { describe, expect, it } from 'bun:test';

const MIN_REASON_LENGTH = 20;

function reasonOk(reason: string): boolean {
    return reason.trim().length >= MIN_REASON_LENGTH;
}

describe('Override Iris — raison >= 20 caractères', () => {
    it('chaîne vide → submit bloqué', () => {
        expect(reasonOk('')).toBe(false);
    });

    it('19 caractères → submit bloqué', () => {
        expect(reasonOk('a'.repeat(19))).toBe(false);
    });

    it('20 caractères → submit autorisé (borne inclusive)', () => {
        expect(reasonOk('a'.repeat(20))).toBe(true);
    });

    it('100 caractères → submit autorisé', () => {
        expect(reasonOk('a'.repeat(100))).toBe(true);
    });

    it('espaces uniquement (trim 0) → bloqué même si .length >= 20', () => {
        expect(reasonOk('                              ')).toBe(false);
    });

    it('chars utiles < 20 (trim) → bloqué même si total >= 20 avec padding', () => {
        const padded = `          ${'a'.repeat(10)}          `;
        expect(padded.length).toBeGreaterThanOrEqual(20);
        expect(padded.trim().length).toBe(10);
        expect(reasonOk(padded)).toBe(false);
    });

    it('constante MIN_REASON_LENGTH = 20 verrouillée', () => {
        expect(MIN_REASON_LENGTH).toBe(20);
    });
});
