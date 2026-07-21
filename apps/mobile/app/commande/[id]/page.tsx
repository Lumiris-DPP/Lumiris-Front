import { OrderConfirmation } from '@/features/order-confirmation';

// L'écran de confirmation lit le GROUPE de commande rattaché au PaymentIntent (toutes les
// lignes + total réellement facturé par Stripe) et poll jusqu'à ce que le webhook le marque
// PAID. Le segment [id] est le paymentIntentId ; la valeur spéciale « latest » (ou un retour
// de redirection Stripe avec ?payment_intent=…) est résolue côté client.
export const dynamic = 'force-dynamic';

interface RouteProps {
    params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: RouteProps) {
    const { id } = await params;
    return <OrderConfirmation routeId={id} />;
}
