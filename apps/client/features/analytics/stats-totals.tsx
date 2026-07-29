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
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Audience & performance</h2>
                <p className="text-xs text-muted-foreground">Scans, vues, clics et conversions sur la période.</p>
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
                <p className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</p>
                <p className="text-xl font-semibold tracking-tight text-foreground">{value.toLocaleString('fr-FR')}</p>
            </CardContent>
        </Card>
    );
}
