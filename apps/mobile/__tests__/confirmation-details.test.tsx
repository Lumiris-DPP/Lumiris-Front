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
    expect(html).not.toContain('Total payé');
    expect(html).not.toContain('Ajouté à ta Garde-Robe');
    expect(html).not.toContain('Un reçu t’a été envoyé');
});

it('une annulation ne prétend pas être payée et un remboursement partiel ne renomme pas le total encaissé', () => {
    expect(confirmationTotalLabel('CANCELLED')).toBe('Total de la commande annulée');
    expect(confirmationTotalLabel('REFUNDED')).toBe('Total payé');
    expect(confirmationTotalLabel('PAID')).toBe('Total payé');
});
