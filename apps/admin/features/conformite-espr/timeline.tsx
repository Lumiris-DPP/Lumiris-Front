'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';
import {
    REGULATORY_MILESTONES,
    SECTOR_LABEL,
    SECTOR_TONE,
    TIMELINE_RANGE,
    daysUntil,
    timelinePositionPct,
    type RegulatoryMilestone,
    type RegulatorySector,
} from '@/lib/regulatory-calendar';

const YEAR_TICKS = [2026, 2027, 2028, 2029, 2030] as const;

interface TimelineProps {
    sectorFilter: RegulatorySector | 'all';
    now: Date;
}

export function RegulatoryTimeline({ sectorFilter, now }: TimelineProps) {
    const visible = useMemo(
        () => REGULATORY_MILESTONES.filter((m) => sectorFilter === 'all' || m.sector === sectorFilter),
        [sectorFilter],
    );

    const todayPct = useMemo(() => {
        const span = TIMELINE_RANGE.end.getTime() - TIMELINE_RANGE.start.getTime();
        const pct = ((now.getTime() - TIMELINE_RANGE.start.getTime()) / span) * 100;
        return Math.min(100, Math.max(0, pct));
    }, [now]);

    const [hovered, setHovered] = useState<RegulatoryMilestone | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const milestoneRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const sortedVisible = useMemo(
        () => [...visible].sort((a, b) => timelinePositionPct(a) - timelinePositionPct(b)),
        [visible],
    );

    const handleMilestoneKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const max = sortedVisible.length - 1;
        const next = event.key === 'ArrowRight' ? Math.min(max, index + 1) : Math.max(0, index - 1);
        setFocusedIndex(next);
        const node = milestoneRefs.current[next];
        if (node) {
            node.focus();
            const milestone = sortedVisible[next];
            if (milestone) setHovered(milestone);
        }
    };

    return (
        <section
            aria-label="Calendrier ESPR — utilisez les flèches gauche et droite pour naviguer entre les jalons"
            className="border-border bg-card opal-shadow rounded-xl border p-5"
        >
            <div className="mb-4 flex items-baseline justify-between">
                <div>
                    <h3 className="text-foreground text-sm font-semibold">Calendrier ESPR 2026 → 2030</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Jalons réglementaires positionnés à leur date officielle. Couleur = secteur. Marqueur vertical =
                        aujourd&apos;hui.
                    </p>
                </div>
                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                    {(Object.keys(SECTOR_LABEL) as RegulatorySector[]).map((sector) => (
                        <span
                            key={sector}
                            className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[10px]"
                        >
                            <span className={cn('h-1.5 w-1.5 rounded-full', SECTOR_TONE[sector].dot)} />
                            {SECTOR_LABEL[sector]}
                        </span>
                    ))}
                </div>
            </div>

            <div className="relative h-44 select-none">
                <div className="bg-muted/40 absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" />

                {YEAR_TICKS.map((year) => {
                    const span = TIMELINE_RANGE.end.getTime() - TIMELINE_RANGE.start.getTime();
                    const tickPct =
                        ((new Date(`${year}-01-01T00:00:00Z`).getTime() - TIMELINE_RANGE.start.getTime()) / span) * 100;
                    return (
                        <div
                            key={year}
                            className="absolute top-0 flex h-full flex-col items-center"
                            style={{ left: `${tickPct}%` }}
                        >
                            <div className="bg-border h-full w-px opacity-60" />
                            <span className="text-muted-foreground mt-1 -translate-x-1/2 font-mono text-[10px]">
                                {year}
                            </span>
                        </div>
                    );
                })}

                <div
                    className="bg-lumiris-cyan absolute top-0 z-10 h-full w-px"
                    style={{ left: `${todayPct}%` }}
                    aria-hidden
                >
                    <span className="bg-lumiris-cyan text-primary-foreground absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide">
                        AUJOURD&apos;HUI
                    </span>
                </div>

                {sortedVisible.map((milestone, index) => {
                    const pct = timelinePositionPct(milestone);
                    const tone = SECTOR_TONE[milestone.sector];
                    const isMajor = milestone.major;
                    const isFocused = focusedIndex === index;
                    return (
                        <button
                            key={milestone.id}
                            ref={(node) => {
                                milestoneRefs.current[index] = node;
                            }}
                            type="button"
                            tabIndex={isFocused ? 0 : -1}
                            onMouseEnter={() => setHovered(milestone)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => {
                                setHovered(milestone);
                                setFocusedIndex(index);
                            }}
                            onBlur={() => setHovered(null)}
                            onKeyDown={(event) => handleMilestoneKey(event, index)}
                            className="focus-visible:ring-ring focus-visible:ring-offset-card absolute top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{ left: `${pct}%` }}
                            aria-label={`${milestone.title} (${milestone.date})`}
                        >
                            <span
                                className={cn(
                                    'ring-border/40 ring-offset-card block rounded-full ring-2 ring-offset-2 transition-transform',
                                    tone.dot,
                                    isMajor ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5',
                                    hovered?.id === milestone.id ? 'scale-125' : '',
                                )}
                                aria-hidden
                            />
                        </button>
                    );
                })}
            </div>

            {hovered ? <MilestoneCard milestone={hovered} now={now} /> : <DefaultHint />}
        </section>
    );
}

function DefaultHint() {
    return (
        <p className="text-muted-foreground mt-4 text-center text-[11px]">
            Survolez un jalon pour afficher son texte source, sa référence légale et son countdown.
        </p>
    );
}

function MilestoneCard({ milestone, now }: { milestone: RegulatoryMilestone; now: Date }) {
    const tone = SECTOR_TONE[milestone.sector];
    const days = daysUntil(milestone, now);
    const past = days < 0;
    return (
        <article className="border-border bg-background mt-4 space-y-2 rounded-lg border p-4">
            <header className="flex flex-wrap items-baseline gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                <h4 className="text-foreground text-sm font-semibold">{milestone.title}</h4>
                <Badge variant="outline" className={cn('font-mono text-[10px]', tone.chip)}>
                    {SECTOR_LABEL[milestone.sector]}
                </Badge>
                {milestone.major ? (
                    <Badge variant="outline" className="border-lumiris-rose/40 text-lumiris-rose font-mono text-[10px]">
                        MAJEUR
                    </Badge>
                ) : null}
                <span className="text-muted-foreground ml-auto font-mono text-[10px]">{milestone.date}</span>
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
                        <ExternalLink className="h-3 w-3" /> Texte source
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
    );
}
