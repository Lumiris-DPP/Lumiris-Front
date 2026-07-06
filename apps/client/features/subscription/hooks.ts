'use client';

import { useMemo, useState } from 'react';
import type { BillingCycle, PlanDto } from '@lumiris/api-client';
import { useBillingPortal, useChangePlan, usePlans } from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { euros } from './utils';

export interface CheckoutTarget {
    tier: string;
    label: string;
    amountLabel: string;
}

export function useSubscriptionPage() {
    const isRealMode = useAuthStore((s) => s.token != null);
    const { subscription, quota, hasActiveSubscription, isLoading, isError, refetch } = useSubscription();
    const plansQuery = usePlans({ enabled: isRealMode });
    const portal = useBillingPortal();
    const changePlan = useChangePlan();

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
        changePlan,
        openPortal,
        onChoose,
        retry: () => {
            void refetch();
            void plansQuery.refetch();
        },
    };
}
