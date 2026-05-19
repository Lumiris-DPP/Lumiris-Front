'use client';

import { memo, useMemo, useState } from 'react';
import { CalendarClock, Users, type LucideIcon } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockPassports, mockRepairers } from '@lumiris/mock-data';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';
import {
    computeReadiness,
    daysUntil,
    majorMilestones,
    SECTOR_LABEL,
    SECTOR_TONE,
    type RegulatorySector,
} from '@/lib/regulatory-calendar';
import { RegulatoryTimeline } from './timeline';
import { GapAnalysis } from './gap-analysis';
import type { SectorView } from './types';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';

const SCORING_NOW = new Date('2026-05-17T08:00:00Z');

const SECTOR_VIEWS: readonly SectorView[] = [
    { sector: 'textile', label: SECTOR_LABEL.textile, enabled: true },
    {
        sector: 'electronics',
        label: SECTOR_LABEL.electronics,
        enabled: false,
        placeholderHint: 'À venir · acte délégué 2027-2028',
    },
    {
        sector: 'appliances',
        label: SECTOR_LABEL.appliances,
        enabled: false,
        placeholderHint: 'À venir · acte délégué 2028-2029',
    },
    {
        sector: 'furniture',
        label: SECTOR_LABEL.furniture,
        enabled: false,
        placeholderHint: 'À venir · acte délégué 2029-2030',
    },
];

function ConformiteESPRComponent() {
    return <ConformiteESPRBody />;
}

function ConformiteESPRBody() {
    const [sector, setSector] = useState<RegulatorySector>('textile');

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

    const sectorActive = SECTOR_VIEWS.find((v) => v.sector === sector) ?? SECTOR_VIEWS[0];

    return (
        <div className="space-y-5">
            <header>
                <h2 className="text-foreground text-xl font-semibold">Conformité ESPR</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Calendrier réglementaire UE 2026-2030 · état de préparation de la base artisans · campagne
                    d&apos;activation.
                </p>
            </header>

            <NonNegotiableBanner rule="Calendrier réglementaire — source : Commission Européenne ESPR, AGEC France. Les dates affichées sont celles des textes officiels, jamais modifiables côté plateforme." />

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ReadinessTile
                    icon={Users}
                    label="Artisans prêts"
                    value={`${Math.round(readiness.readyRatio * 100)} %`}
                    helper={`${readiness.readyCount} / ${readiness.totalArtisans} ateliers · ≥ 1 DPP publié · score ≥ B`}
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
                            helper={`${m.date} · ${SECTOR_LABEL[m.sector]}`}
                            tone={d <= 180 ? 'rose' : d <= 730 ? 'amber' : 'cyan'}
                        />
                    );
                })}
            </section>

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <span className="text-muted-foreground mr-2 text-xs">Vue par secteur :</span>
                {SECTOR_VIEWS.map((view) => {
                    const isActive = view.sector === sector;
                    const tone = SECTOR_TONE[view.sector];
                    return (
                        <button
                            key={view.sector}
                            type="button"
                            onClick={() => view.enabled && setSector(view.sector)}
                            disabled={!view.enabled}
                            className={cn(
                                'rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition',
                                isActive && view.enabled
                                    ? tone.chip
                                    : view.enabled
                                      ? 'border-border text-muted-foreground hover:text-foreground'
                                      : 'border-border/40 text-muted-foreground/50 cursor-not-allowed',
                            )}
                        >
                            {view.label}
                            {!view.enabled && view.placeholderHint ? (
                                <span className="ml-2 normal-case opacity-70">· {view.placeholderHint}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <RegulatoryTimeline sectorFilter={sector} now={SCORING_NOW} />

            {sectorActive?.enabled ? (
                <GapAnalysis gaps={readiness.gaps} totalArtisans={readiness.totalArtisans} />
            ) : (
                <section className="border-border bg-card rounded-xl border p-8 text-center">
                    <Badge variant="outline" className="font-mono text-[10px]">
                        {sectorActive?.placeholderHint ?? 'À venir'}
                    </Badge>
                    <p className="text-muted-foreground mt-3 text-sm">
                        Le gap analysis pour le secteur <strong>{sectorActive?.label}</strong> sera disponible avec son
                        acte délégué.
                    </p>
                </section>
            )}
        </div>
    );
}

const TILE_TONE = {
    emerald: {
        bg: 'bg-lumiris-emerald/8',
        icon: 'text-lumiris-emerald',
        value: 'text-lumiris-emerald',
        border: 'border-lumiris-emerald/15',
    },
    amber: {
        bg: 'bg-lumiris-amber/8',
        icon: 'text-lumiris-amber',
        value: 'text-lumiris-amber',
        border: 'border-lumiris-amber/15',
    },
    rose: {
        bg: 'bg-lumiris-rose/8',
        icon: 'text-lumiris-rose',
        value: 'text-lumiris-rose',
        border: 'border-lumiris-rose/15',
    },
    cyan: {
        bg: 'bg-lumiris-cyan/8',
        icon: 'text-lumiris-cyan',
        value: 'text-lumiris-cyan',
        border: 'border-lumiris-cyan/15',
    },
} as const;

function ReadinessTile({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    helper: string;
    tone: keyof typeof TILE_TONE;
}) {
    const t = TILE_TONE[tone];
    return (
        <div className={cn('bg-card opal-shadow flex flex-col rounded-xl border p-4', t.border)}>
            <div className={cn('w-fit rounded-lg p-1.5', t.bg)}>
                <Icon className={cn('h-4 w-4', t.icon)} />
            </div>
            <span className={cn('mt-3 font-mono text-2xl font-bold tracking-tight', t.value)}>{value}</span>
            <p className="text-foreground mt-1 text-[13px] font-medium">{label}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">{helper}</p>
        </div>
    );
}

export const ConformiteESPR = memo(ConformiteESPRComponent);
