'use client';

import { useMemo, useState } from 'react';
import type { BillingCycle, PlanDto } from '@lumiris/api-client';
import { useBillingPortal, useChangePlan, useCheckoutSession, usePlans } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';

export function useSubscriptionPage() {
    const isRealMode = useAuthStore((s) => s.token != null);
    const { subscription, quota, hasActiveSubscription, isLoading, isError, refetch } = useSubscription();
    const plansQuery = usePlans({ enabled: isRealMode });
    const portal = useBillingPortal();
    const changePlan = useChangePlan();
    const checkoutSession = useCheckoutSession();

    const [cycle, setCycle] = useState<BillingCycle>('monthly');

    const plans = useMemo(() => (plansQuery.data?.plans ?? []).filter((p) => p.grantsPassports), [plansQuery.data]);

    function openPortal() {
        portal.mutate(undefined, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
            onError: () => toast.error("Le portail client n'est pas accessible pour le moment."),
        });
    }

    function onChoose(plan: PlanDto) {
        if (hasActiveSubscription) {
            if (changePlan.isPending) return;
            changePlan.mutate(
                { tier: plan.tier, cycle },
                {
                    onSuccess: () =>
                        toast.success('Plan mis à jour', {
                            description: `Vous êtes maintenant sur ${plan.label} (${cycle === 'annual' ? 'annuel' : 'mensuel'}).`,
                        }),
                    onError: (err) =>
                        toast.error('Le changement de plan a échoué', {
                            description: err instanceof Error ? err.message : undefined,
                        }),
                },
            );
            return;
        }
        // Nouveau souscripteur → Stripe Checkout Session hébergée (redirection). La complétion est
        // synchronisée via le webhook (customer.subscription.created / checkout.session.completed).
        if (checkoutSession.isPending) return;
        checkoutSession.mutate(
            { tier: plan.tier, cycle },
            {
                onSuccess: ({ url }) => {
                    window.location.href = url;
                },
                onError: (err) =>
                    toast.error("Impossible d'ouvrir le paiement Stripe", {
                        description: err instanceof Error ? err.message : undefined,
                    }),
            },
        );
    }

    return {
        isRealMode,
        subscription,
        quota,
        hasActiveSubscription,
        isLoading,
        isError: isError || plansQuery.isError,
        plansLoading: plansQuery.isLoading,
        plans,
        cycle,
        setCycle,
        isAnnual: cycle === 'annual',
        portal,
        changePlan,
        checkoutSession,
        openPortal,
        onChoose,
        retry: () => {
            void refetch();
            void plansQuery.refetch();
        },
    };
}
