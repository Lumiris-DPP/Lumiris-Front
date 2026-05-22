'use client';

import { forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { ATELIER_ADD_ONS } from '@lumiris/mock-data';
import type { ArtisanTier, AtelierPlan } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Switch } from '@lumiris/ui/components/switch';
import { cn } from '@lumiris/ui/lib/cn';
import { ATELIER_PLUS_LABEL, ATELIER_PLUS_MONTHLY_EUR, type BillingCycle } from '@/lib/billing-store';

interface CurrentPlanCardProps {
    plan: AtelierPlan | undefined;
    tier: ArtisanTier;
    cycle: BillingCycle;
    atelierPlus: boolean;
    passportCount: number;
    limitLabel: string;
    onToggleCycle: (annual: boolean) => void;
    onTogglePlus: (checked: boolean) => void;
}

export const CurrentPlanCard = forwardRef<HTMLDivElement, CurrentPlanCardProps>(
    ({ plan, tier, cycle, atelierPlus, passportCount, limitLabel, onToggleCycle, onTogglePlus }, ref) => {
        const addon = ATELIER_ADD_ONS[0];
        const isAnnual = cycle === 'annual';
        const price = plan ? (isAnnual ? plan.yearlyEur : plan.monthlyEur) : 0;

        return (
            <Card ref={ref}>
                <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Palier actuel : {plan?.label ?? tier}
                            {atelierPlus && (
                                <Badge className="bg-lumiris-amber/10 text-lumiris-amber border-lumiris-amber/30">
                                    {ATELIER_PLUS_LABEL}
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1 text-sm">{plan?.tagline}</p>
                    </div>
                    <div className="text-muted-foreground bg-muted inline-flex items-center gap-1 rounded-md p-0.5">
                        <CycleButton active={!isAnnual} onClick={() => onToggleCycle(false)}>
                            Mensuel
                        </CycleButton>
                        <CycleButton active={isAnnual} onClick={() => onToggleCycle(true)}>
                            Annuel <span className="text-lumiris-emerald ml-1 font-mono text-[10px]">−17%</span>
                        </CycleButton>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Field
                        label={isAnnual ? 'Tarif annuel' : 'Tarif mensuel'}
                        value={`${price} €/${isAnnual ? 'an' : 'mois'}`}
                    />
                    <Field label="Passeports actifs" value={`${passportCount} / ${limitLabel}`} emphasize />
                    {addon && (
                        <div className="border-border space-y-1 rounded-md border p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="text-lumiris-amber h-3.5 w-3.5" />
                                    <p className="text-foreground text-sm font-medium">{addon.label}</p>
                                </div>
                                <Switch
                                    checked={atelierPlus}
                                    onCheckedChange={onTogglePlus}
                                    aria-label="Activer ATELIER+"
                                />
                            </div>
                            <p className="text-muted-foreground text-xs">{addon.description}</p>
                            <p className="text-muted-foreground font-mono text-[11px]">
                                +{ATELIER_PLUS_MONTHLY_EUR} € / mois
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    },
);
CurrentPlanCard.displayName = 'CurrentPlanCard';

function CycleButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-sm px-3 py-1 text-xs font-medium',
                active && 'bg-background text-foreground shadow-sm',
            )}
        >
            {children}
        </button>
    );
}

function Field({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
    return (
        <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</p>
            <p
                className={cn(
                    'font-mono',
                    emphasize ? 'text-foreground text-2xl font-semibold' : 'text-foreground text-sm',
                )}
            >
                {value}
            </p>
        </div>
    );
}
