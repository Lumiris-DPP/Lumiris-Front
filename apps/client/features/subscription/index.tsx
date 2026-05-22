'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from '@lumiris/ui/components/sonner';
import type { ArtisanTier } from '@lumiris/types';
import { ATELIER_PASSPORT_LIMIT_LABEL, usePassportCount } from '@/features/workspace-shell/hooks';
import { ATELIER_PLUS_LABEL, atelierPlusAmount, planAmount, useBilling, useBillingStore } from '@/lib/billing-store';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { BillingHistory } from './billing-history';
import { ChangePlanDialog } from './change-plan-dialog';
import { CurrentPlanCard } from './current-plan-card';
import { ATELIER_PLANS, TIER_TO_PLAN, isDowngrade } from './plans-data';
import { PlansGrid } from './plans-grid';

export function Subscription() {
    const searchParams = useSearchParams();
    const upsell = searchParams?.get('upsell');

    const artisan = useCurrentArtisan();
    const billing = useBilling(artisan.id);
    const setTier = useBillingStore((s) => s.setTier);
    const setBillingCycle = useBillingStore((s) => s.setBillingCycle);
    const setAtelierPlus = useBillingStore((s) => s.setAtelierPlus);

    const passportCount = usePassportCount(artisan.id);
    const limitLabel = ATELIER_PASSPORT_LIMIT_LABEL[billing.tier];
    const currentPlan = ATELIER_PLANS.find((p) => p.tier === TIER_TO_PLAN[billing.tier]);

    const [pendingDowngrade, setPendingDowngrade] = useState<ArtisanTier | null>(null);
    const plusToggleRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (upsell === 'analytics' && plusToggleRef.current) {
            plusToggleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [upsell]);

    const applyTierChange = (targetTier: ArtisanTier) => {
        const amount = planAmount(targetTier, billing.billingCycle);
        setTier(artisan.id, targetTier, { amount, cycle: billing.billingCycle });
        toast.success(`Palier mis à jour : ${targetTier}`, {
            description: `Cycle ${billing.billingCycle === 'annual' ? 'annuel' : 'mensuel'} — ${amount} €`,
        });
    };

    const onChoosePlan = (targetTier: ArtisanTier) => {
        if (isDowngrade(billing.tier, targetTier)) {
            setPendingDowngrade(targetTier);
            return;
        }
        applyTierChange(targetTier);
    };

    const onConfirmDowngrade = () => {
        if (!pendingDowngrade) return;
        applyTierChange(pendingDowngrade);
        setPendingDowngrade(null);
    };

    const onToggleCycle = (annual: boolean) => {
        const next = annual ? 'annual' : 'monthly';
        setBillingCycle(artisan.id, next);
        toast.success(next === 'annual' ? 'Cycle annuel — 2 mois offerts' : 'Cycle mensuel');
    };

    const onTogglePlus = (checked: boolean) => {
        setAtelierPlus(artisan.id, checked);
        if (checked) {
            toast.success('ATELIER+ activé', {
                description: `+${atelierPlusAmount(billing.billingCycle)} € · ${ATELIER_PLUS_LABEL}`,
            });
        } else {
            toast.info('ATELIER+ désactivé');
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-8">
            {upsell === 'analytics' && (
                <div className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30 flex items-start gap-2 rounded-md border p-3 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        Analytics nécessite l’option <strong>ATELIER+</strong>. Activez-la ci-dessous pour accéder au
                        tableau de bord d’analyse.
                    </div>
                </div>
            )}

            <CurrentPlanCard
                ref={plusToggleRef}
                plan={currentPlan}
                tier={billing.tier}
                cycle={billing.billingCycle}
                atelierPlus={billing.atelierPlus}
                passportCount={passportCount}
                limitLabel={limitLabel}
                onToggleCycle={onToggleCycle}
                onTogglePlus={onTogglePlus}
            />

            <PlansGrid currentTier={billing.tier} cycle={billing.billingCycle} onChoose={onChoosePlan} />

            <BillingHistory entries={billing.invoiceHistory} />

            <ChangePlanDialog
                targetTier={pendingDowngrade}
                currentTier={billing.tier}
                cycle={billing.billingCycle}
                onCancel={() => setPendingDowngrade(null)}
                onConfirm={onConfirmDowngrade}
            />
        </div>
    );
}
