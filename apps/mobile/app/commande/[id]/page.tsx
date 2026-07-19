import { OrderConfirmation } from '@/features/order-confirmation';

// L'écran de confirmation lit la commande réelle de l'acheteur (la plus récente) et poll
// jusqu'à ce que le webhook Stripe la marque PAID. Le segment [id] ('latest' ou l'id du
// PaymentIntent) sert uniquement d'URL de retour — la donnée vient du backend.
export const dynamic = 'force-dynamic';

export default function OrderConfirmationPage() {
    return <OrderConfirmation />;
}
