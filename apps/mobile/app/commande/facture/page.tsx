'use client';

import { useSearchParams } from 'next/navigation';
import { NotFound } from '@/components/not-found';
import { OrderInvoice } from '@/features/order-invoice';

// Facture imprimable d'une commande. `?pi=` porte le paymentIntentId : la facture lit le GROUPE
// de commande rattaché (toutes les lignes + total réellement facturé) via useOrderGroup, et
// s'imprime proprement (window.print → export PDF navigateur) grâce au CSS @media print.
export default function OrderInvoicePage() {
    const paymentIntentId = useSearchParams().get('pi');

    if (!paymentIntentId) {
        return <NotFound />;
    }

    return <OrderInvoice paymentIntentId={paymentIntentId} />;
}
