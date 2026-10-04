type SubscriptionSaleState = 'loading' | 'error' | 'active' | 'inactive';

// Autorise la vente uniquement après une vérification réussie.
export function subscriptionSaleState(isError: boolean, isSuccess: boolean, active: boolean): SubscriptionSaleState {
    return isError ? 'error' : !isSuccess ? 'loading' : active ? 'active' : 'inactive';
}
