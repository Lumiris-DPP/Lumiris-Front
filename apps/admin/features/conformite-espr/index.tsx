'use client';

import { memo, useMemo } from 'react';
import { CalendarClock, Users, type LucideIcon } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockPassports, mockRepairers } from '@lumiris/mock-data';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { cn } from '@lumiris/ui/lib/cn';
import {
    computeReadiness,
    daysUntil,
    majorMilestones,
    SECTOR_LABEL,
    type RegulatorySector,
} from '@/lib/regulatory-calendar';
import { GapAnalysis } from './gap-analysis';
import { RegulatoryTimeline } from './timeline';

const SCORING_NOW = new Date('2026-05-17T08:00:00Z');
const ACTIVE_SECTOR: RegulatorySector = 'textile';
const FUTURE_SECTORS: readonly RegulatorySector[] = ['electronics', 'appliances', 'furniture'];

function ConformiteESPRComponent() {
    const scoresByArtisan = useMemo(() => {
        const map = new Map<string, { avg: number; published: number; allCapped: boolean }>();
        for (const artisan of mockArtisans) {
            const artisanPassports = mockPassports.filter(
                (p) => p.artisanId === artisan.id && p.status === 'Published',
            );
            if (artisanPassports.length === 0) {
                map.set(artisan.id, { avg: 0, published: 0, allCapped: false });
                continue;
            }
            const scored = artisanPassports.map((p) =>
                computeScore(p, {
                    certificates: p.materials.flatMap((m) => m.certifications),
                    artisan,
                    retoucheurs: mockRepairers,
                    now: SCORING_NOW,
                }),
            );
            const avg = scored.reduce((s, r) => s + r.total, 0) / scored.length;
            const allCapped = scored.every((s) => s.cap?.applied || s.grade === 'D');
            map.set(artisan.id, { avg, published: artisanPassports.length, allCapped });
        }
        return map;
    }, []);

    const readiness = useMemo(() => computeReadiness(mockArtisans, mockPassports, scoresByArtisan), [scoresByArtisan]);
    const upcomingMajor = useMemo(() => majorMilestones(SCORING_NOW), []);

    return (
        <FeatureLayout title="Conformité ESPR">
            <div className="space-y-8">
                <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <ReadinessTile
                        icon={Users}
                        label="Artisans prêts"
                        value={`${Math.round(readiness.readyRatio * 100)} %`}
                        tone={readiness.readyRatio >= 0.7 ? 'emerald' : readiness.readyRatio >= 0.4 ? 'amber' : 'rose'}
                    />
                    {upcomingMajor.slice(0, 3).map((m) => {
                        const d = daysUntil(m, SCORING_NOW);
                        return (
                            <ReadinessTile
                                key={m.id}
                                icon={CalendarClock}
                                label={m.title}
                                value={d > 0 ? `J-${d}` : `+${Math.abs(d)} j`}
                                tone={d <= 180 ? 'rose' : d <= 730 ? 'amber' : 'cyan'}
                            />
                        );
                    })}
                </section>

                <SectorNav />

                <RegulatoryTimeline sectorFilter={ACTIVE_SECTOR} now={SCORING_NOW} />

                <GapAnalysis gaps={readiness.gaps} totalArtisans={readiness.totalArtisans} />
            </div>
        </FeatureLayout>
    );
}

function SectorNav() {
    return (
        <nav
            aria-label="Vue par secteur"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
        >
            <span className="font-medium text-foreground">{SECTOR_LABEL[ACTIVE_SECTOR]}</span>
            {FUTURE_SECTORS.map((s) => (
                <span key={s} className="text-muted-foreground/50">
                    {SECTOR_LABEL[s]}
                </span>
            ))}
        </nav>
    );
}

const TILE_TONE = {
    emerald: { border: 'border-lumiris-emerald/15', bg: 'bg-lumiris-emerald/8', text: 'text-lumiris-emerald' },
    amber: { border: 'border-lumiris-amber/15', bg: 'bg-lumiris-amber/8', text: 'text-lumiris-amber' },
    rose: { border: 'border-lumiris-rose/15', bg: 'bg-lumiris-rose/8', text: 'text-lumiris-rose' },
    cyan: { border: 'border-lumiris-cyan/15', bg: 'bg-lumiris-cyan/8', text: 'text-lumiris-cyan' },
} as const;

function ReadinessTile({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    tone: keyof typeof TILE_TONE;
}) {
    const t = TILE_TONE[tone];
    return (
        <div className={cn('flex flex-col rounded-xl border bg-card p-5', t.border)}>
            <div className={cn('w-fit rounded-lg p-1.5', t.bg)}>
                <Icon className={cn('h-4 w-4', t.text)} />
            </div>
            <span className={cn('mt-3 font-mono text-2xl font-bold tracking-tight', t.text)}>{value}</span>
            <p className="mt-1 text-[13px] font-medium text-foreground">{label}</p>
        </div>
    );
}

export const ConformiteESPR = memo(ConformiteESPRComponent);
