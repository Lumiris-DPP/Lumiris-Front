type SubscriptionSaleState = 'loading' | 'error' | 'active' | 'inactive';

interface SubscriptionRead {
    isError: boolean;
    isSuccess: boolean;
    data?: { hasActiveSubscription: boolean };
}

// Garde la dernière donnée connue pour l'atelier et n'autorise la vente qu'après une vérification réussie.
export function subscriptionAccess(read: SubscriptionRead): {
    hasActiveSubscription: boolean;
    saleState: SubscriptionSaleState;
} {
    const active = read.data?.hasActiveSubscription ?? false;
    const saleState = read.isError ? 'error' : !read.isSuccess ? 'loading' : active ? 'active' : 'inactive';
    return { hasActiveSubscription: active, saleState };
}
