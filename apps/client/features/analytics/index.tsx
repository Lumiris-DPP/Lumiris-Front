'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { useAtelierStats } from '@lumiris/api-client/react';
import { EmptyState } from '@/features/empty-state';
import { StatsTotals } from './stats-totals';
import { StatsByPassport } from './stats-by-passport';

const PERIODS = [
    { label: '7 jours', days: 7 },
    { label: '30 jours', days: 30 },
    { label: '90 jours', days: 90 },
] as const;

export function Analytics() {
    const [days, setDays] = useState<number>(30);

    const { from, to } = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return { from: start.toISOString(), to: now.toISOString() };
    }, [days]);

    const { data, isLoading, isError } = useAtelierStats({ from, to });

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <EmptyState
                    icon={Sparkles}
                    tone="amber"
                    title="Statistiques indisponibles"
                    description="Un abonnement ATELIER actif est requis pour consulter vos statistiques d'audience et de vente."
                    cta={{ label: "Voir les offres d'abonnement", href: '/subscription' }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
                {PERIODS.map((p) => (
                    <Button
                        key={p.days}
                        type="button"
                        variant={days === p.days ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDays(p.days)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {isLoading || !data ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
                <>
                    <StatsTotals totals={data.totals} />
                    <StatsByPassport rows={data.byPassport} locked={data.advancedLocked} />
                </>
            )}
        </div>
    );
}
