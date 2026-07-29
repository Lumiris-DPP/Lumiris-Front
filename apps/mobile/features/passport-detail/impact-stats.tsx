'use client';

import type { ComponentType, SVGProps } from 'react';
import { Leaf, Droplets, Zap } from 'lucide-react';
import type { Passport } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

interface Stat {
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    value: string;
    delta?: string;
    tone: 'emerald' | 'cyan' | 'amber';
}

export function ImpactStats({ passport }: { passport: Passport }) {
    const stats: Stat[] = [];

    if (typeof passport.carbonKg === 'number') {
        stats.push({
            Icon: Leaf,
            label: 'CO₂',
            value: `${passport.carbonKg.toFixed(1)} kg`,
            delta: deltaVsCategoryAverage(passport.carbonKg, CO2_CATEGORY_AVG),
            tone: 'emerald',
        });
    }
    if (typeof passport.waterLiters === 'number') {
        stats.push({
            Icon: Droplets,
            label: 'Eau',
            value: `${Math.round(passport.waterLiters).toLocaleString('fr-FR')} L`,
            delta: deltaVsCategoryAverage(passport.waterLiters, WATER_CATEGORY_AVG),
            tone: 'cyan',
        });
    }
    if (typeof passport.transportKm === 'number') {
        stats.push({
            Icon: Zap,
            label: 'Transport',
            value: `${Math.round(passport.transportKm).toLocaleString('fr-FR')} km`,
            tone: 'amber',
        });
    }

    if (stats.length === 0) return null;

    return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
                <li key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            stat.tone === 'emerald' && 'bg-lumiris-emerald/15 text-lumiris-emerald',
                            stat.tone === 'cyan' && 'bg-lumiris-cyan/15 text-lumiris-cyan',
                            stat.tone === 'amber' && 'bg-lumiris-amber/15 text-lumiris-amber',
                        )}
                    >
                        <stat.Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {stat.label}
                        </p>
                        <p className="text-base leading-tight font-semibold text-foreground">{stat.value}</p>
                        {stat.delta ? <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.delta}</p> : null}
                    </div>
                </li>
            ))}
        </ul>
    );
}

const CO2_CATEGORY_AVG = 8;
const WATER_CATEGORY_AVG = 2500;

function deltaVsCategoryAverage(value: number, avg: number): string {
    const delta = Math.round(((value - avg) / avg) * 100);
    if (delta === 0) return 'Dans la moyenne catégorie';
    const sign = delta > 0 ? '+' : '';
    return `vs moyenne catégorie ${sign}${delta}%`;
}
