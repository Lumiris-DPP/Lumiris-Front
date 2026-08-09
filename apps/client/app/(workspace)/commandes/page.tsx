import { WorkspaceHeader } from '@/features/workspace-header';
import { OrdersDashboard } from '@/features/orders-dashboard';

export default function OrdersPage() {
    return (
        <>
            <WorkspaceHeader
                title="Commandes"
                description="Vos ventes après paiement : expéditions, retours, litiges et versements."
            />
            <OrdersDashboard />
        </>
    );
}
