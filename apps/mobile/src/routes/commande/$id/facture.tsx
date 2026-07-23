import { useParams } from 'react-router-dom';
import { OrderInvoice } from '@/features/order-invoice';
import { NotFound } from '@/components/not-found';

// Facture imprimable d'une commande. Le segment [id] est le paymentIntentId : la facture lit le
// GROUPE de commande rattaché (toutes les lignes + total réellement facturé) via useOrderGroup,
// et s'imprime proprement (window.print → export PDF navigateur) grâce au CSS @media print.
export default function OrderInvoicePage() {
    const { id } = useParams();
    if (!id) return <NotFound />;
    return <OrderInvoice paymentIntentId={id} />;
}
