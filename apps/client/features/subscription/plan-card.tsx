'use client';

import { ArrowUpRight, Check } from 'lucide-react';
import type { PlanDto } from '@lumiris/api-client';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { cn } from '@lumiris/ui/lib/cn';
import { euros, quotaLabel } from './utils';

interface PlanCardProps {
    plan: PlanDto;
    isCurrent: boolean;
    isAnnual: boolean;
    hasActiveSubscription: boolean;
    disabled: boolean;
    onChoose: (plan: PlanDto) => void;
}

export function PlanCard({ plan, isCurrent, isAnnual, hasActiveSubscription, disabled, onChoose }: PlanCardProps) {
    const amount = isAnnual ? plan.annualAmountCents : plan.monthlyAmountCents;
    return (
        <Card className={cn('flex flex-col', isCurrent && 'border-lumiris-emerald/40 bg-lumiris-emerald/5')}>
            <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground text-lg font-semibold">{plan.label}</p>
                    {isCurrent && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                            Actuel
                        </Badge>
                    )}
                </div>
                <p className="font-mono text-2xl font-semibold">
                    {euros(amount)} €
                    <span className="text-muted-foreground ml-1 text-sm font-normal">/{isAnnual ? 'an' : 'mois'}</span>
                </p>
                <ul className="text-muted-foreground flex-1 space-y-1.5 text-xs">
                    <li className="flex items-start gap-1.5">
                        <Check className="text-lumiris-emerald mt-0.5 h-3 w-3 shrink-0" />
                        {quotaLabel(plan)}
                    </li>
                    <li className="flex items-start gap-1.5">
                        <Check className="text-lumiris-emerald mt-0.5 h-3 w-3 shrink-0" />
                        Score Iris pré-calculé sur chaque pièce
                    </li>
                    <li className="flex items-start gap-1.5">
                        <Check className="text-lumiris-emerald mt-0.5 h-3 w-3 shrink-0" />
                        Page d’atelier publique + annuaire
                    </li>
                </ul>
                <Button
                    size="sm"
                    variant={isCurrent ? 'ghost' : 'outline'}
                    disabled={isCurrent || disabled}
                    onClick={() => onChoose(plan)}
                >
                    {isCurrent ? (
                        'Plan actuel'
                    ) : hasActiveSubscription ? (
                        <>
                            Changer de plan <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </>
                    ) : (
                        'Choisir ce plan'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
