type SubscriptionSaleState = 'loading' | 'error' | 'active' | 'inactive';

interface SubscriptionRead {
    isError: boolean;
    isSuccess: boolean;
    data?: { hasActiveSubscription: boolean };
}

// Distingue l’accès connu de la vérification actuelle de l’abonnement.
export function subscriptionAccess(read: SubscriptionRead): {
    hasActiveSubscription: boolean;
    saleState: SubscriptionSaleState;
} {
    const active = read.data?.hasActiveSubscription ?? false;
    const saleState = read.isError ? 'error' : !read.isSuccess ? 'loading' : active ? 'active' : 'inactive';
    return { hasActiveSubscription: active, saleState };
}
