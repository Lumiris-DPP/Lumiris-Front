'use client';

import { Card, CardContent } from '@lumiris/ui/components/card';
import { PASSPORT_STATUS_DESCRIPTION } from '@/lib/passport-status';

interface KpiTilesProps {
    published: number;
    incompletion: number;
    drafts: number;
    avgScore: number;
}

export function KpiTiles({ published, incompletion, drafts, avgScore }: KpiTilesProps) {
    return (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Publiés" value={published} hint="Passeports vivants" />
            <KpiCard label="En complétion" value={incompletion} hint={PASSPORT_STATUS_DESCRIPTION.InCompletion} />
            <KpiCard label="Brouillons" value={drafts} hint="En cours de création" />
            <KpiCard
                label="Score Iris moyen"
                value={avgScore}
                hint="Sur les passeports publiés"
                suffix={published === 0 ? '' : ' / 100'}
            />
        </section>
    );
}

interface KpiCardProps {
    label: string;
    value: number;
    hint: string;
    suffix?: string;
}

function KpiCard({ label, value, hint, suffix = '' }: KpiCardProps) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-foreground tabular-nums">
                    {value}
                    {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground/70">{suffix}</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}
