'use client';

import { StatCard } from '@lumiris/ui/components/stat-card';
import type { AtelierStatsTotals } from '@lumiris/api-client';

interface Props {
    totals: AtelierStatsTotals;
}

export function StatsTotals({ totals }: Props) {
    return (
        <section className="space-y-4">
            <header>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Audience & performance</h2>
                <p className="text-xs text-muted-foreground">Scans, vues, clics et conversions sur la période.</p>
            </header>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Scans" value={totals.scans.toLocaleString('fr-FR')} />
                <StatCard label="Vues de fiche" value={totals.views.toLocaleString('fr-FR')} />
                <StatCard label="Clics suggestion" value={totals.suggestionClicks.toLocaleString('fr-FR')} />
                <StatCard label="Conversions" value={totals.conversions.toLocaleString('fr-FR')} />
            </div>
        </section>
    );
}
