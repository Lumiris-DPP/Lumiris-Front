'use client';

import { Card, CardContent } from '@lumiris/ui/components/card';
import type { AtelierStatsTotals } from '@lumiris/api-client';

interface Props {
    totals: AtelierStatsTotals;
}

export function StatsTotals({ totals }: Props) {
    return (
        <section className="space-y-4">
            <header>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">Audience & performance</h2>
                <p className="text-muted-foreground text-xs">Scans, vues, clics et conversions sur la période.</p>
            </header>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiCard label="Scans" value={totals.scans} />
                <KpiCard label="Vues de fiche" value={totals.views} />
                <KpiCard label="Clics suggestion" value={totals.suggestionClicks} />
                <KpiCard label="Conversions" value={totals.conversions} />
            </div>
        </section>
    );
}

function KpiCard({ label, value }: { label: string; value: number }) {
    return (
        <Card>
            <CardContent className="space-y-1 p-4">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</p>
                <p className="text-foreground text-xl font-semibold tracking-tight">{value.toLocaleString('fr-FR')}</p>
            </CardContent>
        </Card>
    );
}
