import { describe, expect, it } from 'bun:test';
import { confirmationView, type ConfirmationInput } from '@/features/order-confirmation/confirmation-view';

const base: ConfirmationInput = {
    isAuthenticated: true,
    targetPaymentIntentId: 'pi_1',
    noRecentOrder: false,
    group: undefined,
    failureStatus: null,
    timedOut: false,
};

describe('confirmationView — aucune confirmation inventée', () => {
    it('invité : la commande n’est pas lisible, rien n’est annoncé', () => {
        expect(confirmationView({ ...base, isAuthenticated: false })).toBe('signed-out');
    });

    it('PaymentIntent inconnu du serveur : commande introuvable, pas « paiement reçu »', () => {
        expect(confirmationView({ ...base, failureStatus: 404 })).toBe('not-found');
    });

    it('lecture en panne : erreur, pas de confirmation', () => {
        expect(confirmationView({ ...base, failureStatus: 0 })).toBe('error');
    });

    it('commande encore en attente : paiement en cours de confirmation, puis repli après la borne', () => {
        expect(confirmationView({ ...base, group: { status: 'PENDING' } })).toBe('pending');
        expect(confirmationView({ ...base, group: { status: 'PENDING' }, timedOut: true })).toBe('pending-timeout');
    });

    it('seul un état payé relu au serveur autorise « Commande confirmée »', () => {
        expect(confirmationView({ ...base, group: { status: 'PAID' } })).toBe('confirmed');
        expect(confirmationView({ ...base, group: { status: 'SHIPPED' } })).toBe('confirmed');
    });

    it('commande annulée ou remboursée : annulation affichée', () => {
        expect(confirmationView({ ...base, group: { status: 'CANCELLED' } })).toBe('unwound');
        expect(confirmationView({ ...base, group: { status: 'REFUNDED' } })).toBe('unwound');
    });

    it('sans paiement ciblé : attente, puis « aucune commande » quand la lecture n’en trouve pas', () => {
        expect(confirmationView({ ...base, targetPaymentIntentId: null })).toBe('resolving');
        expect(confirmationView({ ...base, targetPaymentIntentId: null, noRecentOrder: true })).toBe('no-order');
    });
});
