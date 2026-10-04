import { expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { OrderGroup } from '@lumiris/api-client';
import { ConfirmationDetails } from '@/features/order-confirmation/components/confirmation-details';
import { confirmationTotalLabel } from '@/features/order-confirmation/models/confirmation-view';

it('le rendu en attente ne prétend ni que le montant est payé ni que la garde-robe est déjà mise à jour', () => {
    const group: OrderGroup = {
        paymentIntentId: 'pi_test',
        status: 'PENDING',
        lines: [],
        itemsTotalCents: 1000,
        shippingCents: 0,
        amountChargedCents: 1000,
    };
    const html = renderToStaticMarkup(
        <ConfirmationDetails group={group} view="pending" targetPi="pi_test" wardrobeCount={0} />,
    );
    expect(html).toContain('Total à confirmer');
    expect(html).toContain('Ta Garde-Robe après validation');
    expect(html).toContain('La préparation commence après confirmation du paiement.');
    expect(html).not.toContain('Total payé');
    expect(html).not.toContain('Ajouté à ta Garde-Robe');
    expect(html).not.toContain('Un reçu t’a été envoyé');
    expect(html).not.toContain('Cette commande est annulée');
    expect(html).not.toContain('Cette commande est clôturée');
});

it('une annulation ne prétend pas être payée et un remboursement partiel ne renomme pas le total encaissé', () => {
    expect(confirmationTotalLabel('CANCELLED')).toBe('Total de la commande annulée');
    expect(confirmationTotalLabel('REFUNDED')).toBe('Total payé');
    expect(confirmationTotalLabel('PAID')).toBe('Total payé');
});

it('affiche les remboursements serveur exacts après annulation, remboursement partiel et groupe mixte', () => {
    for (const refundedCents of [0, 200, 1000]) {
        for (const status of ['CANCELLED', 'REFUNDED'] as const) {
            const line = {
                id: 'a',
                status,
                refundedCents,
                amountTotalCents: 1000,
                commissionCents: 100,
                disputeStatus: 'NONE' as const,
                canConfirmDelivery: false,
                canRequestReturn: false,
                canOpenDispute: false,
            };
            for (const mixed of [false, true]) {
                const group: OrderGroup = {
                    paymentIntentId: 'pi_test',
                    status: mixed ? 'PAID' : status,
                    lines: mixed ? [line, { ...line, id: 'b', status: 'PAID', refundedCents: 0 }] : [line],
                    itemsTotalCents: mixed ? 2000 : 1000,
                    shippingCents: 0,
                    amountChargedCents: mixed ? 2000 : 1000,
                };
                const html = renderToStaticMarkup(
                    <ConfirmationDetails
                        group={group}
                        view={mixed ? 'confirmed' : 'unwound'}
                        targetPi="pi_test"
                        wardrobeCount={0}
                    />,
                );
                expect(html).not.toContain('rien ne t’a été débité');
                expect(html).not.toContain('ateliers préparent ta commande');
                if (refundedCents > 0) {
                    expect(html).toContain('Montant remboursé');
                    expect(html).toContain(refundedCents === 200 ? '2,00' : '10,00');
                    expect(html).toContain(
                        !mixed && refundedCents === 1000 ? 'remboursement total' : 'remboursement partiel',
                    );
                } else expect(html).not.toContain('Montant remboursé');
            }
        }
    }
});
