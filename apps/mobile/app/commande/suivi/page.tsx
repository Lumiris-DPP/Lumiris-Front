import { OrderTracking } from '@/features/order-tracking';

// Suivi d'une commande passée : état en temps réel, suivi transporteur, demande de retour et
// litige. `?id=` porte l'identifiant de la LIGNE de commande (chaque pièce se suit séparément,
// puisque chaque atelier expédie son propre colis).
export default function OrderTrackingPage() {
    return <OrderTracking />;
}
