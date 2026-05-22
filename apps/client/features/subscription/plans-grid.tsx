'use client';

import { Check } from 'lucide-react';
import type { ArtisanTier } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import type { BillingCycle } from '@/lib/billing-store';
import { ATELIER_PLANS, TIER_TO_PLAN } from './plans-data';

interface PlansGridProps {
    currentTier: ArtisanTier;
    cycle: BillingCycle;
    onChoose: (tier: ArtisanTier) => void;
}

export function PlansGrid({ currentTier, cycle, onChoose }: PlansGridProps) {
    const isAnnual = cycle === 'annual';
    const currentPlanTier = TIER_TO_PLAN[currentTier];

    return (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ATELIER_PLANS.map((plan) => {
                const isCurrent = plan.tier === currentPlanTier;
                const price = isAnnual ? plan.yearlyEur : plan.monthlyEur;
                const targetTier = (Object.entries(TIER_TO_PLAN) as Array<[ArtisanTier, typeof plan.tier]>).find(
                    ([, pt]) => pt === plan.tier,
                )?.[0];
                return (
                    <Card
                        key={plan.tier}
                        className={cn('flex flex-col', isCurrent && 'border-lumiris-emerald/40 bg-lumiris-emerald/5')}
                    >
                        <CardContent className="flex flex-1 flex-col gap-4 p-6">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-foreground text-lg font-semibold">{plan.label}</p>
                                    <p className="text-muted-foreground mt-1 text-xs">{plan.tagline}</p>
                                </div>
                                {plan.popular && !isCurrent && (
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                        Populaire
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <p className="font-mono text-2xl font-semibold">
                                    {price} €
                                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                                        /{isAnnual ? 'an' : 'mois'}
                                    </span>
                                </p>
                                {isAnnual && <p className="text-lumiris-emerald mt-0.5 text-xs">2 mois offerts</p>}
                            </div>
                            <ul className="text-muted-foreground flex-1 space-y-1.5 text-xs">
                                {plan.features.slice(0, 5).map((feature) => (
                                    <li key={feature} className="flex items-start gap-1.5">
                                        <Check className="text-lumiris-emerald mt-0.5 h-3 w-3 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                size="sm"
                                variant={isCurrent ? 'ghost' : 'outline'}
                                disabled={isCurrent}
                                onClick={() => targetTier && onChoose(targetTier)}
                            >
                                {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
}
