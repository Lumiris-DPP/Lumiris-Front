'use client';

import { StatCard } from '@lumiris/ui/components/stat-card';
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
            <StatCard label="Publiés" value={String(published)} hint="Passeports vivants" />
            <StatCard
                label="En complétion"
                value={String(incompletion)}
                hint={PASSPORT_STATUS_DESCRIPTION.InCompletion}
            />
            <StatCard label="Brouillons" value={String(drafts)} hint="En cours de création" />
            <StatCard
                label="Score Iris moyen"
                value={published === 0 ? String(avgScore) : `${avgScore} / 100`}
                hint="Sur les passeports publiés"
            />
        </section>
    );
}
