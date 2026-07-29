'use client';

import { Recycle, Leaf } from 'lucide-react';
import type { Material } from '@lumiris/types';
import { FIBER_LABEL } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';

const COUNTRY_FLAG: Record<string, string> = {
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    BE: '🇧🇪',
    PT: '🇵🇹',
    DE: '🇩🇪',
    UK: '🇬🇧',
    GB: '🇬🇧',
    MA: '🇲🇦',
    TN: '🇹🇳',
};

export function CompositionRow({ material }: { material: Material }) {
    const isRecycled = material.fiber === 'recycled-polyester';
    const Icon = isRecycled ? Recycle : Leaf;
    const pct = Math.max(0, Math.min(100, material.percentage));

    return (
        <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        isRecycled
                            ? 'bg-lumiris-cyan/15 text-lumiris-cyan'
                            : 'bg-lumiris-emerald/15 text-lumiris-emerald',
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{FIBER_LABEL[material.fiber]}</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{pct}%</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="mr-1">{COUNTRY_FLAG[material.originCountry] ?? '🏳️'}</span>
                        {material.originCountry}
                    </p>
                </div>
            </div>
            <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${FIBER_LABEL[material.fiber]} - ${pct}%`}
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        isRecycled ? 'bg-lumiris-cyan' : 'bg-lumiris-emerald',
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
