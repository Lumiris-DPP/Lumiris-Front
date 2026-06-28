'use client';

import { useMemo, useState } from 'react';
import type { BillingCycle, PlanDto } from '@lumiris/api-client';
import { useBillingPortal, usePlans } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { euros } from './utils';

export interface CheckoutTarget {
    tier: string;
    label: string;
    amountLabel: string;
}

/**
 * Aggregates everything the subscription page needs: the subscription/plans/portal
 * queries, billing-cycle and checkout state, derived plans, and the
 * choose/manage handlers. Keeps the page component purely presentational.
 */
export function useSubscriptionPage() {
    const isRealMode = useAuthStore((s) => s.token != null);
    const { subscription, quota, hasActiveSubscription, isLoading, isError, refetch } = useSubscription();
    const plansQuery = usePlans({ enabled: isRealMode });
    const portal = useBillingPortal();

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);

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
            // Plan changes go through the Stripe Customer Portal.
            openPortal();
            return;
        }
        const amount = cycle === 'annual' ? plan.annualAmountCents : plan.monthlyAmountCents;
        setCheckout({
            tier: plan.tier,
            label: plan.label,
            amountLabel: `${euros(amount)} €/${cycle === 'annual' ? 'an' : 'mois'}`,
        });
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
        checkout,
        setCheckout,
        portal,
        openPortal,
        onChoose,
        retry: () => {
            void refetch();
            void plansQuery.refetch();
        },
    };
}
