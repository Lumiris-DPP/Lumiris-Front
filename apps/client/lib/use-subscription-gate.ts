'use client';

import { toast } from '@lumiris/ui/components/sonner';

import { useSubscription } from './use-subscription';

export const SUBSCRIPTION_REQUIRED_MESSAGE = 'Cette action requiert un abonnement actif';

interface SubscriptionGate {
    blocked: boolean;
    isLoading: boolean;
    notifyBlocked: () => void;
}

export function useSubscriptionGate(): SubscriptionGate {
    const { hasActiveSubscription, isLoading } = useSubscription();

    return {
        blocked: !isLoading && !hasActiveSubscription,
        isLoading,
        notifyBlocked: () =>
            toast.error(SUBSCRIPTION_REQUIRED_MESSAGE, {
                description: 'Souscrivez un palier ATELIER pour créer vos passeports.',
            }),
    };
}
