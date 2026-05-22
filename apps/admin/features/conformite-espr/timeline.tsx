'use client';

import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';
import {
    REGULATORY_MILESTONES,
    SECTOR_LABEL,
    SECTOR_TONE,
    daysUntil,
    type RegulatorySector,
} from '@/lib/regulatory-calendar';

interface TimelineProps {
    sectorFilter: RegulatorySector | 'all';
    now: Date;
}

export function RegulatoryTimeline({ sectorFilter, now }: TimelineProps) {
    const visible = useMemo(
        () =>
            [...REGULATORY_MILESTONES]
                .filter((m) => sectorFilter === 'all' || m.sector === sectorFilter)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [sectorFilter],
    );

    return (
        <section className="border-border bg-card rounded-xl border p-5">
            <header className="mb-4">
                <h3 className="text-foreground text-sm font-semibold">Calendrier ESPR 2026 → 2030</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                    Jalons réglementaires par date · couleur = secteur.
                </p>
            </header>

            <ol className="relative space-y-3 border-l border-dashed pl-5">
                {visible.map((milestone) => {
                    const tone = SECTOR_TONE[milestone.sector];
                    const days = daysUntil(milestone, now);
                    const past = days < 0;
                    return (
                        <li key={milestone.id} className="relative">
                            <span
                                className={cn(
                                    'ring-card absolute -left-[27px] top-1 block rounded-full ring-2',
                                    tone.dot,
                                    milestone.major ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5',
                                )}
                                aria-hidden
                            />
                            <article className="border-border bg-background space-y-1.5 rounded-lg border p-3">
                                <header className="flex flex-wrap items-baseline gap-2">
                                    <h4 className="text-foreground text-sm font-semibold">{milestone.title}</h4>
                                    <Badge variant="outline" className={cn('font-mono text-[10px]', tone.chip)}>
                                        {SECTOR_LABEL[milestone.sector]}
                                    </Badge>
                                    {milestone.major ? (
                                        <Badge
                                            variant="outline"
                                            className="border-lumiris-rose/40 text-lumiris-rose font-mono text-[10px]"
                                        >
                                            MAJEUR
                                        </Badge>
                                    ) : null}
                                    <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                                        {milestone.date}
                                    </span>
                                </header>
                                <p className="text-muted-foreground text-xs leading-relaxed">{milestone.description}</p>
                                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[11px]">
                                    <span className="font-mono">{milestone.legalReference}</span>
                                    {milestone.sourceUrl ? (
                                        <a
                                            href={milestone.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="text-lumiris-cyan inline-flex items-center gap-1 hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" /> Source
                                        </a>
                                    ) : null}
                                    <span
                                        className={cn(
                                            'ml-auto font-mono font-semibold',
                                            past ? 'text-muted-foreground' : 'text-lumiris-emerald',
                                        )}
                                    >
                                        {past ? `Dépassé · -${Math.abs(days)} j` : `J-${days}`}
                                    </span>
                                </div>
                            </article>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
