import { describe, expect, it } from 'bun:test';

const MIN_REASON_LENGTH = 30;

interface MinimalUser {
    email?: string;
}

function deleteReady(user: MinimalUser, deleteReason: string, deleteTypedEmail: string): boolean {
    return deleteReason.trim().length >= MIN_REASON_LENGTH && !!user.email && deleteTypedEmail.trim() === user.email;
}

describe('RGPD delete — typed-name (email) + reason >= 30 chars', () => {
    const USER = { email: 'juliette.brunel@gmail.com' };
    const VALID_REASON = 'Demande explicite via support, ticket #4827 — confirmation orale.';

    it('typed email correct + reason 30+ → confirm activé', () => {
        expect(deleteReady(USER, VALID_REASON, USER.email)).toBe(true);
    });

    it('typed email INCORRECT (typo) → confirm bloqué (anti-mistake)', () => {
        expect(deleteReady(USER, VALID_REASON, 'juliette.brunel@gmial.com')).toBe(false);
    });

    it('typed email vide → confirm bloqué', () => {
        expect(deleteReady(USER, VALID_REASON, '')).toBe(false);
    });

    it('reason < 30 chars → confirm bloqué même si email correct', () => {
        expect(deleteReady(USER, 'demande user', USER.email)).toBe(false);
    });

    it('reason 29 chars exactement → bloqué (borne stricte)', () => {
        expect(deleteReady(USER, 'a'.repeat(29), USER.email)).toBe(false);
    });

    it('reason 30 chars exactement → autorisé', () => {
        expect(deleteReady(USER, 'a'.repeat(30), USER.email)).toBe(true);
    });

    it('user sans email → toujours bloqué (cas anon → ne devrait pas atteindre la dialog)', () => {
        expect(deleteReady({}, VALID_REASON, '')).toBe(false);
    });

    it('typed email avec espaces autour → trim et accepter', () => {
        expect(deleteReady(USER, VALID_REASON, `  ${USER.email}  `)).toBe(true);
    });

    it('typed email casse différente → REJETÉ (comparaison stricte)', () => {
        expect(deleteReady(USER, VALID_REASON, USER.email.toUpperCase())).toBe(false);
    });

    it('MIN_REASON_LENGTH verrouillé à 30 (cohérent avec affiliation + governance)', () => {
        expect(MIN_REASON_LENGTH).toBe(30);
    });
});
