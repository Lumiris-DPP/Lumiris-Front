'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { ATELIER_PLANS } from '@lumiris/mock-data';
import { ARTISAN_PASSPORT_LIMIT } from '@lumiris/types';
import type { ArtisanTier, AtelierPlan, AtelierPlanTier } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { cn } from '@lumiris/ui/lib/cn';
import { nextTier } from '@/lib/quota';

const TIER_TO_PLAN: Record<ArtisanTier, AtelierPlanTier> = {
    Solo: 'solo',
    Studio: 'studio',
    Maison: 'maison',
};

interface QuotaUpsellDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTier: ArtisanTier;
    used: number;
}

export function QuotaUpsellDialog({ open, onOpenChange, currentTier, used }: QuotaUpsellDialogProps) {
    const router = useRouter();
    const upgradeTier = nextTier(currentTier);

    useEffect(() => {
        if (!open || !upgradeTier) return;
        console.info(`[upsell] ${currentTier.toLowerCase()}→${upgradeTier.toLowerCase()} quota_reached`);
    }, [open, currentTier, upgradeTier]);

    if (!upgradeTier) return null;

    const currentPlan = ATELIER_PLANS.find((p) => p.tier === TIER_TO_PLAN[currentTier]);
    const upgradePlan = ATELIER_PLANS.find((p) => p.tier === TIER_TO_PLAN[upgradeTier]);
    if (!currentPlan || !upgradePlan) return null;

    const handleUpgrade = () => {
        onOpenChange(false);
        router.push('/subscription');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Quota {currentPlan.label} atteint</DialogTitle>
                    <DialogDescription>
                        {used} / {ARTISAN_PASSPORT_LIMIT[currentTier]} passeports actifs. Pour publier au-delà, passez à{' '}
                        {upgradePlan.label} ou supprimez des passeports inactifs.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <PlanCard plan={currentPlan} variant="current" />
                    <PlanCard plan={upgradePlan} variant="upgrade" />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Plus tard
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white"
                    >
                        Passer {upgradePlan.label}
                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PlanCard({ plan, variant }: { plan: AtelierPlan; variant: 'current' | 'upgrade' }) {
    const passportLabel = plan.maxPassports == null ? 'Illimités' : `${plan.maxPassports} passeports`;
    const seatLabel =
        plan.maxSeats == null ? 'Sièges illimités' : `${plan.maxSeats} siège${plan.maxSeats > 1 ? 's' : ''}`;
    return (
        <div
            className={cn(
                'rounded-xl border p-4',
                variant === 'upgrade' ? 'border-lumiris-emerald/40 bg-lumiris-emerald/5' : 'border-border bg-muted/30',
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-semibold">{plan.label}</p>
                <span
                    className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                        variant === 'upgrade'
                            ? 'bg-lumiris-emerald/15 text-lumiris-emerald'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    {variant === 'upgrade' ? 'Recommandé' : 'Actuel'}
                </span>
            </div>
            <p className="text-foreground mt-2 font-mono text-xl font-semibold tabular-nums">
                {plan.monthlyEur}
                <span className="text-muted-foreground/70 ml-0.5 text-xs font-normal"> €/mois</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
                <Bullet>{passportLabel}</Bullet>
                <Bullet>{seatLabel}</Bullet>
                {plan.features.slice(0, 2).map((f) => (
                    <Bullet key={f}>{f}</Bullet>
                ))}
            </ul>
        </div>
    );
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <li className="text-foreground/80 flex items-start gap-1.5">
            <Check className="text-lumiris-emerald mt-0.5 h-3 w-3 shrink-0" />
            <span>{children}</span>
        </li>
    );
}
