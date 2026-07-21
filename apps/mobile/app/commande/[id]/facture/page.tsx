import { OrderInvoice } from '@/features/order-invoice';

// Facture imprimable d'une commande. Le segment [id] est le paymentIntentId : la facture lit le
// GROUPE de commande rattaché (toutes les lignes + total réellement facturé) via useOrderGroup,
// et s'imprime proprement (window.print → export PDF navigateur) grâce au CSS @media print.
export const dynamic = 'force-dynamic';

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function OrderInvoicePage({ params }: RouteProps) {
    const { id } = await params;
    return <OrderInvoice paymentIntentId={id} />;
}
