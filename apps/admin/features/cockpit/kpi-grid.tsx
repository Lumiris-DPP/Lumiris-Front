'use client';

import Link from 'next/link';
import { Coins, FileText, Sparkles, Store, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import type { buildArtisanKpi, buildCurationKpi, buildIrisKpi, buildMrrKpi } from '@/lib/cockpit-metrics';

interface KpiGridProps {
    artisanKpi: ReturnType<typeof buildArtisanKpi>;
    curationKpi: ReturnType<typeof buildCurationKpi>;
    irisKpi: ReturnType<typeof buildIrisKpi>;
    mrrKpi: ReturnType<typeof buildMrrKpi>;
}

interface KpiTrend {
    readonly value: string;
    readonly up: boolean;
}

interface KpiTile {
    key: string;
    label: string;
    icon: LucideIcon;
    value: string;
    accentClass: string;
    bgClass: string;
    borderClass: string;
    ariaLabel: string;
    href: string;
    trend?: KpiTrend;
}

const eurCompact = (value: number): string => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`;
    if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} k€`;
    return `${Math.round(value)} €`;
};

export function KpiGrid({ artisanKpi, curationKpi, irisKpi, mrrKpi }: KpiGridProps) {
    const irisTrend: KpiTrend | undefined =
        irisKpi.sampleSize === 0
            ? undefined
            : {
                  value: `${irisKpi.deltaVsTarget >= 0 ? '+' : '−'}${Math.abs(irisKpi.deltaVsTarget).toFixed(2)}`,
                  up: irisKpi.deltaVsTarget >= 0,
              };

    const tiles: readonly KpiTile[] = [
        {
            key: 'artisans',
            label: 'Artisans actifs',
            icon: Store,
            value: `${artisanKpi.total}`,
            accentClass: 'text-lumiris-emerald',
            bgClass: 'bg-lumiris-emerald/8',
            borderClass: 'border-lumiris-emerald/15',
            ariaLabel: `Artisans actifs : ${artisanKpi.total}.`,
            href: '/artisans',
            ...(artisanKpi.churn30d > 0 ? { trend: { value: `−${artisanKpi.churn30d}`, up: false } } : {}),
        },
        {
            key: 'curation',
            label: 'File curation',
            icon: FileText,
            value: `${curationKpi.pendingCount}`,
            accentClass: 'text-lumiris-amber',
            bgClass: 'bg-lumiris-amber/8',
            borderClass: 'border-lumiris-amber/15',
            ariaLabel: `File curation : ${curationKpi.pendingCount} en attente.`,
            href: '/passeports',
        },
        {
            key: 'iris',
            label: 'Iris moyen',
            icon: Sparkles,
            value: irisKpi.sampleSize === 0 ? '—' : irisKpi.avgOnFive.toFixed(2),
            accentClass: 'text-lumiris-cyan',
            bgClass: 'bg-lumiris-cyan/8',
            borderClass: 'border-lumiris-cyan/15',
            ariaLabel:
                irisKpi.sampleSize === 0
                    ? 'Iris moyen indisponible.'
                    : `Iris moyen : ${irisKpi.avgOnFive.toFixed(2)} sur 5.`,
            href: '/passeports',
            ...(irisTrend ? { trend: irisTrend } : {}),
        },
        {
            key: 'mrr',
            label: 'MRR',
            icon: Coins,
            value: eurCompact(mrrKpi.mrrTotal),
            accentClass: 'text-lumiris-amber',
            bgClass: 'bg-lumiris-amber/8',
            borderClass: 'border-lumiris-amber/15',
            ariaLabel: `MRR : ${eurCompact(mrrKpi.mrrTotal)}.`,
            href: '/revenus',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {tiles.map((tile) => {
                const TrendIcon = tile.trend?.up ? TrendingUp : TrendingDown;
                return (
                    <Link
                        key={tile.key}
                        href={tile.href}
                        aria-label={tile.ariaLabel}
                        className={cn(
                            'bg-card hover:bg-muted/40 focus-visible:ring-ring flex flex-col rounded-xl border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2',
                            tile.borderClass,
                        )}
                    >
                        <div className={cn('w-fit rounded-lg p-2', tile.bgClass)}>
                            <tile.icon className={cn('h-4.5 w-4.5', tile.accentClass)} aria-hidden />
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className={cn('font-mono text-3xl font-bold tracking-tight', tile.accentClass)}>
                                {tile.value}
                            </span>
                            {tile.trend ? (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 text-xs tabular-nums',
                                        tile.trend.up ? 'text-lumiris-emerald' : 'text-lumiris-rose',
                                    )}
                                >
                                    <TrendIcon className="h-3 w-3" aria-hidden />
                                    {tile.trend.value}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-foreground mt-auto pt-3 text-[13px] font-medium">{tile.label}</p>
                    </Link>
                );
            })}
        </div>
    );
}
