import { OrderHistory } from '@/features/order-history';

// Historique des commandes de l'acheteur (GET /api/orders). Chaque entrée ouvre le groupe de
// commande correspondant (/commande/{paymentIntentId}) avec le détail et le total réel.
export const dynamic = 'force-dynamic';

export default function MeOrdersPage() {
    return <OrderHistory />;
}
