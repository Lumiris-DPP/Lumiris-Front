'use client';

import type { HTMLAttributes } from 'react';
import { Clock, MapPin, Star } from 'lucide-react';
import type { Coordinates, Repairer, RepairerSpecialty } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';

export interface RepairersNearbyProps extends HTMLAttributes<HTMLUListElement> {
    repairers: readonly Repairer[];
    userCoordinates?: Coordinates;
    limit?: number;
    ctaLabel?: string;
    onRepairerSelect?: (repairer: Repairer) => void;
}

const SPECIALITY_LABEL: Record<RepairerSpecialty, string> = {
    alteration: 'Retouche',
    embroidery: 'Broderie',
    'shoe-repair': 'Cordonnerie',
    leather: 'Cuir',
    lining: 'Doublure',
    'electronics-repair': 'Électronique',
    'phone-repair': 'Téléphonie',
    'computer-repair': 'Informatique',
    cabinetmaking: 'Ébénisterie',
    upholstery: 'Tapisserie',
    'appliance-repair': 'Électroménager',
};

const PRICE_LABEL: Record<'low' | 'mid' | 'high', string> = {
    low: '€',
    mid: '€€',
    high: '€€€',
};

export function RepairersNearby({
    repairers,
    userCoordinates,
    limit = 10,
    ctaLabel = 'Réserver',
    onRepairerSelect,
    className,
    ...rest
}: RepairersNearbyProps) {
    const ordered = userCoordinates
        ? [...repairers].sort((a, b) => {
              const da = distanceKm(userCoordinates, a.coordinates);
              const db = distanceKm(userCoordinates, b.coordinates);
              return (da ?? Number.POSITIVE_INFINITY) - (db ?? Number.POSITIVE_INFINITY);
          })
        : repairers;

    const visible = ordered.slice(0, limit);

    if (visible.length === 0) {
        return (
            <ul className={cn('text-sm text-muted-foreground', className)} {...rest}>
                <li className="italic">Aucun retoucheur référencé dans la zone.</li>
            </ul>
        );
    }

    return (
        <ul className={cn('flex flex-col gap-3', className)} {...rest}>
            {visible.map((r) => {
                const distance = distanceKm(userCoordinates, r.coordinates) ?? r.distanceKm;
                const tier = priceTier(r.priceRange.min, r.priceRange.max);
                return (
                    <li key={r.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{r.displayName}</p>
                                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {r.city}
                                    {typeof distance === 'number' ? (
                                        <span className="font-mono text-muted-foreground">
                                            · {distance.toFixed(1)} km
                                        </span>
                                    ) : null}
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                                <Star className="h-3.5 w-3.5 fill-current text-lumiris-amber" />
                                {r.avgRating.toFixed(1)}
                                <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                                    ({r.reviewCount})
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {r.specialities.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px]">
                                    {SPECIALITY_LABEL[s] ?? s}
                                </Badge>
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" /> ~{r.avgDelayDays} j
                            </span>
                            <span className="font-mono">{PRICE_LABEL[tier]}</span>
                            {onRepairerSelect ? (
                                <button
                                    type="button"
                                    onClick={() => onRepairerSelect(r)}
                                    className="rounded-full border border-lumiris-emerald/30 bg-lumiris-emerald/10 px-3 py-1 text-[11px] font-medium text-lumiris-emerald transition hover:bg-lumiris-emerald/20"
                                >
                                    {ctaLabel}
                                </button>
                            ) : null}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function distanceKm(from: Coordinates | undefined, to: Coordinates | undefined): number | undefined {
    if (!from || !to) return undefined;
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function priceTier(min: number, max: number): 'low' | 'mid' | 'high' {
    const mid = (min + max) / 2;
    if (mid <= 25) return 'low';
    if (mid <= 80) return 'mid';
    return 'high';
}
