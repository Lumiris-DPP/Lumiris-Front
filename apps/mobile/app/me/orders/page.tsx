import { OrderHistory } from '@/features/order-history';

// Historique des commandes de l'acheteur (GET /api/orders). Chaque entrée ouvre le groupe de
// commande correspondant (/commande?pi=…) avec le détail et le total réel.
export default function MeOrdersPage() {
    return <OrderHistory />;
}
