'use client';

import { SearchParamsBoundary } from '@/components/search-params-boundary';
import { OrderConfirmation } from '@/features/order-confirmation';

// L'écran de confirmation lit le GROUPE de commande rattaché au PaymentIntent (toutes les
// lignes + total réellement facturé par Stripe) et poll jusqu'à ce que le webhook le marque
// PAID. `?pi=` porte le paymentIntentId ; la valeur spéciale « latest » (ou un retour de
// redirection Stripe avec ?payment_intent=…) est résolue côté client.
export default function OrderConfirmationPage() {
    return (
        <SearchParamsBoundary>
            {(searchParams) => <OrderConfirmation routeId={searchParams.get('pi') ?? 'latest'} />}
        </SearchParamsBoundary>
    );
}
