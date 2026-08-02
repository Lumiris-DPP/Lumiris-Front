'use client';

import { useMemo, useState } from 'react';
import { formatDate } from '@lumiris/utils';
import type { BillingCycle, PlanDto } from '@lumiris/api-client';
import {
    useAddAtelierPlus,
    useBillingPortal,
    useCancelSubscription,
    useChangePlan,
    usePlans,
    useRemoveAtelierPlus,
    useResumeSubscription,
} from '@lumiris/api-client/react';
import { toast } from '@lumiris/ui/components/sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';

// Plan sélectionné par un nouveau souscripteur → alimente le CheckoutDialog embarqué.
interface CheckoutSelection {
    plan: PlanDto;
    cycle: BillingCycle;
}

export function useSubscriptionPage() {
    const isRealMode = useAuthStore((s) => s.token != null);
    const { subscription, quota, hasActiveSubscription, atelierPlus, isLoading, isError, refetch } = useSubscription();
    const plansQuery = usePlans({ enabled: isRealMode });
    const portal = useBillingPortal();
    const changePlan = useChangePlan();
    const cancelSub = useCancelSubscription();
    const resumeSub = useResumeSubscription();
    const addAtelierPlus = useAddAtelierPlus();
    const removeAtelierPlus = useRemoveAtelierPlus();

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    // Ouvre l'UI de paiement embarquée Lumiris (Stripe Elements) — plus de redirection Checkout.
    const [checkout, setCheckout] = useState<CheckoutSelection | null>(null);
    // Plan en attente de confirmation (dialogue de proration) avant l'appel changePlan.
    const [pendingPlan, setPendingPlan] = useState<PlanDto | null>(null);

    const plans = useMemo(() => (plansQuery.data?.plans ?? []).filter((p) => p.grantsPassports), [plansQuery.data]);

    function openPortal() {
        portal.mutate(undefined, {
            onSuccess: ({ url }) => {
                window.location.href = url;
            },
            onError: () => toast.error("Le portail client n'est pas accessible pour le moment."),
        });
    }

    // Un changement de plan passe d'abord par une confirmation explicite (ajustement au prorata).
    function onChoose(plan: PlanDto) {
        if (hasActiveSubscription) {
            if (changePlan.isPending) return;
            setPendingPlan(plan);
            return;
        }
        // Nouveau souscripteur → UI de paiement embarquée Lumiris (Stripe Elements, sans quitter le site).
        // La création de l'abonnement est finalisée en synchrone via /subscription/confirm (pas de
        // dépendance au webhook), puis l'état est rafraîchi par useConfirmSubscription.
        setCheckout({ plan, cycle });
    }

    // Confirme le changement de plan sélectionné (déclenché depuis la boîte de dialogue).
    function confirmPlanChange() {
        const plan = pendingPlan;
        if (!plan || changePlan.isPending) return;
        setPendingPlan(null);
        changePlan.mutate(
            { tier: plan.tier, cycle },
            {
                // La mutation renvoie l'état d'abonnement à jour. On ne confirme le succès que si
                // l'abonnement est réellement actif : un ajustement au prorata peut exiger une action
                // de paiement (past_due/incomplete) — dans ce cas on avertit, sans faux succès.
                onSuccess: (state) => {
                    const s = state.subscription;
                    const settled = Boolean(s?.active) && s?.status !== 'past_due' && s?.status !== 'incomplete';
                    if (settled) {
                        toast.success('Plan mis à jour', {
                            description: `Vous êtes maintenant sur ${plan.label} (${cycle === 'annual' ? 'annuel' : 'mensuel'}).`,
                        });
                    } else {
                        toast.warning('Ajustement en attente de paiement', {
                            description:
                                "Changement enregistré mais le paiement de l'ajustement requiert une action — vérifiez votre moyen de paiement / le portail.",
                        });
                    }
                },
                onError: (err) =>
                    toast.error('Le changement de plan a échoué', {
                        description: err instanceof Error ? err.message : undefined,
                    }),
            },
        );
    }

    function cancelPlanChange() {
        setPendingPlan(null);
    }

    // Résiliation in-app : accès conservé jusqu'à la fin de la période, puis extinction.
    function cancelSubscription() {
        if (cancelSub.isPending) return;
        cancelSub.mutate(undefined, {
            onSuccess: () =>
                toast.success('Résiliation programmée', {
                    description: subscription?.currentPeriodEnd
                        ? `Votre abonnement reste actif jusqu'au ${formatDate(subscription.currentPeriodEnd)}.`
                        : "Votre abonnement restera actif jusqu'à la fin de la période en cours.",
                }),
            onError: (err) =>
                toast.error('La résiliation a échoué', {
                    description: err instanceof Error ? err.message : undefined,
                }),
        });
    }

    // Reprise in-app : annule une résiliation programmée.
    function resumeSubscription() {
        if (resumeSub.isPending) return;
        resumeSub.mutate(undefined, {
            onSuccess: () => toast.success('Abonnement repris', { description: 'La résiliation a été annulée.' }),
            onError: (err) =>
                toast.error('La reprise a échoué', {
                    description: err instanceof Error ? err.message : undefined,
                }),
        });
    }

    // Active l'option ATELIER+ (2ᵉ article Stripe) sur l'abonnement de base actif.
    function activateAtelierPlus() {
        if (addAtelierPlus.isPending) return;
        addAtelierPlus.mutate(undefined, {
            onSuccess: () =>
                toast.success('Option ATELIER+ activée', {
                    description: "L'Analytics et les avantages ATELIER+ sont désormais débloqués.",
                }),
            onError: (err) =>
                toast.error("L'activation d'ATELIER+ a échoué", {
                    description: err instanceof Error ? err.message : undefined,
                }),
        });
    }

    // Retire l'option ATELIER+ de l'abonnement de base actif.
    function deactivateAtelierPlus() {
        if (removeAtelierPlus.isPending) return;
        removeAtelierPlus.mutate(undefined, {
            onSuccess: () => toast.success('Option ATELIER+ retirée', { description: 'Elle ne sera plus facturée.' }),
            onError: (err) =>
                toast.error('Le retrait d’ATELIER+ a échoué', {
                    description: err instanceof Error ? err.message : undefined,
                }),
        });
    }

    return {
        isRealMode,
        subscription,
        quota,
        hasActiveSubscription,
        atelierPlus,
        isLoading,
        isError: isError || plansQuery.isError,
        plansLoading: plansQuery.isLoading,
        plans,
        cycle,
        setCycle,
        isAnnual: cycle === 'annual',
        portal,
        changePlan,
        cancelSub,
        resumeSub,
        addAtelierPlus,
        removeAtelierPlus,
        activateAtelierPlus,
        deactivateAtelierPlus,
        checkout,
        closeCheckout: () => setCheckout(null),
        pendingPlan,
        confirmPlanChange,
        cancelPlanChange,
        openPortal,
        onChoose,
        cancelSubscription,
        resumeSubscription,
        retry: () => {
            void refetch();
            void plansQuery.refetch();
        },
    };
}
